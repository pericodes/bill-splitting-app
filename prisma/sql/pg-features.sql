-- =============================================================================
-- Features de PostgreSQL que Prisma 6 no modela (CHECKs, helper, índice parcial).
-- Convierte is_ghost / net_amount a GENERATED ALWAYS (la init las crea como columnas normales
-- para que `migrate dev` no intente ALTER ... DROP DEFAULT sobre columnas generadas).
-- RLS: prisma/sql/rls.sql (todavía no se aplica).
--
-- Idempotente. Se ejecuta DESPUÉS de las migraciones Prisma:
--   pnpm db:dev:features
--
-- Vive fuera de prisma/migrations para que `migrate dev` no genere DROP
-- de CHECKs / columnas generadas / políticas.
-- =============================================================================

CREATE OR REPLACE FUNCTION app_current_user_id()
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid
$$;

-- ----- columnas generadas (STORED), como en schema.sql -----------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'users'
      AND a.attname = 'is_ghost'
      AND NOT a.attisdropped
      AND a.attgenerated = ''
  ) THEN
    ALTER TABLE users DROP COLUMN is_ghost;
    ALTER TABLE users ADD COLUMN is_ghost boolean GENERATED ALWAYS AS (auth_user_id IS NULL) STORED;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'transaction_entries'
      AND a.attname = 'net_amount'
      AND NOT a.attisdropped
      AND a.attgenerated = ''
  ) THEN
    ALTER TABLE transaction_entries DROP COLUMN net_amount;
    ALTER TABLE transaction_entries ADD COLUMN net_amount numeric(12,2) GENERATED ALWAYS AS (paid_amount - owed_amount) STORED;
  END IF;
END $$;

-- ----- CHECK constraints (nombres fijos para poder reejecutar) ---------------

DO $$ BEGIN
  ALTER TABLE users ADD CONSTRAINT users_display_name_len
    CHECK (char_length(display_name) BETWEEN 1 AND 60);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE accounts ADD CONSTRAINT accounts_name_len
    CHECK (char_length(name) BETWEEN 1 AND 80);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE accounts ADD CONSTRAINT accounts_currency_len
    CHECK (char_length(currency) = 3);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE account_members ADD CONSTRAINT account_members_role_allowed
    CHECK (role IN ('owner', 'member'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE transactions ADD CONSTRAINT transactions_type_allowed
    CHECK (type IN ('expense', 'transfer'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE transactions ADD CONSTRAINT transactions_description_len
    CHECK (char_length(description) BETWEEN 1 AND 140);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE transactions ADD CONSTRAINT transactions_total_amount_positive
    CHECK (total_amount > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE transaction_entries ADD CONSTRAINT transaction_entries_paid_nonneg
    CHECK (paid_amount >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE transaction_entries ADD CONSTRAINT transaction_entries_owed_nonneg
    CHECK (owed_amount >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Índice parcial del SQL original (el de Prisma no tiene WHERE deleted_at).
CREATE INDEX IF NOT EXISTS idx_transactions_account_date_active
  ON transactions (account_id, occurred_on DESC)
  WHERE deleted_at IS NULL;

-- Reloj de actividad de la cuenta (caché / skip de refetch en el cliente).
CREATE OR REPLACE FUNCTION touch_account_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  acc_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    acc_id := OLD.account_id;
  ELSE
    acc_id := NEW.account_id;
  END IF;

  UPDATE accounts SET updated_at = now() WHERE id = acc_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_account_on_transactions ON transactions;
CREATE TRIGGER trg_touch_account_on_transactions
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE PROCEDURE touch_account_updated_at();

DROP TRIGGER IF EXISTS trg_touch_account_on_entries ON transaction_entries;
CREATE TRIGGER trg_touch_account_on_entries
  AFTER INSERT OR UPDATE OR DELETE ON transaction_entries
  FOR EACH ROW EXECUTE PROCEDURE touch_account_updated_at();

DROP TRIGGER IF EXISTS trg_touch_account_on_members ON account_members;
CREATE TRIGGER trg_touch_account_on_members
  AFTER INSERT OR UPDATE OR DELETE ON account_members
  FOR EACH ROW EXECUTE PROCEDURE touch_account_updated_at();

DROP TRIGGER IF EXISTS trg_touch_account_on_balances ON account_balances;
CREATE TRIGGER trg_touch_account_on_balances
  AFTER INSERT OR UPDATE OR DELETE ON account_balances
  FOR EACH ROW EXECUTE PROCEDURE touch_account_updated_at();

-- Fusiona un usuario fantasma en uno registrado y borra el fantasma.
-- Atómico: Data API no puede transaccionar varias tablas a la vez.
CREATE OR REPLACE FUNCTION merge_ghost_into_user(p_ghost_id uuid, p_target_id uuid)
RETURNS json
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_ghost_id = p_target_id THEN
    RETURN json_build_object('success', true, 'target_id', p_target_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM users WHERE id = p_ghost_id AND is_ghost IS TRUE
  ) THEN
    RAISE EXCEPTION 'El usuario origen no es un invitado';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_target_id) THEN
    RAISE EXCEPTION 'El usuario destino no existe';
  END IF;

  UPDATE accounts SET created_by = p_target_id WHERE created_by = p_ghost_id;
  UPDATE transactions SET created_by = p_target_id WHERE created_by = p_ghost_id;

  UPDATE transaction_entries AS t
  SET
    paid_amount = t.paid_amount + g.paid_amount,
    owed_amount = t.owed_amount + g.owed_amount
  FROM transaction_entries AS g
  WHERE g.user_id = p_ghost_id
    AND t.user_id = p_target_id
    AND t.transaction_id = g.transaction_id;

  DELETE FROM transaction_entries AS g
  WHERE g.user_id = p_ghost_id
    AND EXISTS (
      SELECT 1 FROM transaction_entries AS t
      WHERE t.user_id = p_target_id AND t.transaction_id = g.transaction_id
    );

  UPDATE transaction_entries SET user_id = p_target_id WHERE user_id = p_ghost_id;

  UPDATE account_balances AS t
  SET
    balance = t.balance + g.balance,
    updated_at = now()
  FROM account_balances AS g
  WHERE g.user_id = p_ghost_id
    AND t.user_id = p_target_id
    AND t.account_id = g.account_id;

  DELETE FROM account_balances AS g
  WHERE g.user_id = p_ghost_id
    AND EXISTS (
      SELECT 1 FROM account_balances AS t
      WHERE t.user_id = p_target_id AND t.account_id = g.account_id
    );

  UPDATE account_balances SET user_id = p_target_id WHERE user_id = p_ghost_id;

  UPDATE account_members AS t
  SET role = 'owner'
  FROM account_members AS g
  WHERE g.user_id = p_ghost_id
    AND t.user_id = p_target_id
    AND t.account_id = g.account_id
    AND g.role = 'owner';

  DELETE FROM account_members AS g
  WHERE g.user_id = p_ghost_id
    AND EXISTS (
      SELECT 1 FROM account_members AS t
      WHERE t.user_id = p_target_id AND t.account_id = g.account_id
    );

  UPDATE account_members SET user_id = p_target_id WHERE user_id = p_ghost_id;

  DELETE FROM users WHERE id = p_ghost_id;

  RETURN json_build_object('success', true, 'target_id', p_target_id);
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anonymous') THEN
    GRANT EXECUTE ON FUNCTION merge_ghost_into_user(uuid, uuid) TO anonymous;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    GRANT EXECUTE ON FUNCTION merge_ghost_into_user(uuid, uuid) TO authenticated;
  END IF;
END $$;

-- Reclama un invitado en UNA cuenta: reasigna membresía, saldo y gastos de
-- esa cuenta al destino. Borra al invitado solo si no le quedan membresías.
-- Atómico: Data API no puede transaccionar varias tablas a la vez.
CREATE OR REPLACE FUNCTION claim_participant_in_account(
  p_account_id uuid,
  p_source_id uuid,
  p_target_id uuid
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  v_balance numeric;
  v_target_is_member boolean;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM accounts WHERE id = p_account_id) THEN
    RAISE EXCEPTION 'Cuenta no encontrada';
  END IF;

  PERFORM 1 FROM users WHERE id = p_source_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Este participante ya fue reclamado';
  END IF;

  IF p_source_id = p_target_id THEN
    SELECT EXISTS (
      SELECT 1 FROM account_members
      WHERE account_id = p_account_id AND user_id = p_target_id
    ) INTO v_target_is_member;
    IF NOT v_target_is_member THEN
      RAISE EXCEPTION 'El participante no está en esta cuenta';
    END IF;
    SELECT balance INTO v_balance
    FROM account_balances
    WHERE account_id = p_account_id AND user_id = p_target_id;
    RETURN json_build_object(
      'success', true,
      'target_id', p_target_id,
      'noop', true,
      'balance', COALESCE(v_balance, 0)
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM users WHERE id = p_source_id AND is_ghost IS TRUE
  ) THEN
    RAISE EXCEPTION 'El usuario origen no es un invitado';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_target_id) THEN
    RAISE EXCEPTION 'El usuario destino no existe';
  END IF;

  PERFORM 1 FROM account_members
  WHERE account_id = p_account_id AND user_id = p_source_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Este participante ya fue reclamado';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM account_members
    WHERE account_id = p_account_id AND user_id = p_target_id
  ) INTO v_target_is_member;

  IF v_target_is_member THEN
    SELECT balance INTO v_balance
    FROM account_balances
    WHERE account_id = p_account_id AND user_id = p_target_id;
    RETURN json_build_object(
      'success', true,
      'target_id', p_target_id,
      'noop', true,
      'balance', COALESCE(v_balance, 0)
    );
  END IF;

  UPDATE accounts
  SET created_by = p_target_id
  WHERE id = p_account_id AND created_by = p_source_id;

  UPDATE transactions
  SET created_by = p_target_id
  WHERE account_id = p_account_id AND created_by = p_source_id;

  UPDATE transaction_entries AS t
  SET
    paid_amount = t.paid_amount + g.paid_amount,
    owed_amount = t.owed_amount + g.owed_amount
  FROM transaction_entries AS g
  WHERE g.user_id = p_source_id
    AND g.account_id = p_account_id
    AND t.user_id = p_target_id
    AND t.transaction_id = g.transaction_id;

  DELETE FROM transaction_entries AS g
  WHERE g.user_id = p_source_id
    AND g.account_id = p_account_id
    AND EXISTS (
      SELECT 1 FROM transaction_entries AS t
      WHERE t.user_id = p_target_id AND t.transaction_id = g.transaction_id
    );

  UPDATE transaction_entries
  SET user_id = p_target_id
  WHERE user_id = p_source_id AND account_id = p_account_id;

  UPDATE account_balances AS t
  SET
    balance = t.balance + g.balance,
    updated_at = now()
  FROM account_balances AS g
  WHERE g.user_id = p_source_id
    AND g.account_id = p_account_id
    AND t.user_id = p_target_id
    AND t.account_id = p_account_id;

  DELETE FROM account_balances AS g
  WHERE g.user_id = p_source_id
    AND g.account_id = p_account_id
    AND EXISTS (
      SELECT 1 FROM account_balances AS t
      WHERE t.user_id = p_target_id AND t.account_id = g.account_id
    );

  UPDATE account_balances
  SET user_id = p_target_id
  WHERE user_id = p_source_id AND account_id = p_account_id;

  UPDATE account_members
  SET user_id = p_target_id
  WHERE account_id = p_account_id AND user_id = p_source_id;

  IF EXISTS (SELECT 1 FROM users WHERE id = p_source_id AND is_ghost IS TRUE)
     AND NOT EXISTS (SELECT 1 FROM account_members WHERE user_id = p_source_id)
  THEN
    BEGIN
      DELETE FROM users WHERE id = p_source_id;
    EXCEPTION WHEN foreign_key_violation THEN
      NULL;
    END;
  END IF;

  SELECT balance INTO v_balance
  FROM account_balances
  WHERE account_id = p_account_id AND user_id = p_target_id;

  RETURN json_build_object(
    'success', true,
    'target_id', p_target_id,
    'noop', false,
    'balance', COALESCE(v_balance, 0)
  );
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anonymous') THEN
    GRANT EXECUTE ON FUNCTION claim_participant_in_account(uuid, uuid, uuid) TO anonymous;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    GRANT EXECUTE ON FUNCTION claim_participant_in_account(uuid, uuid, uuid) TO authenticated;
  END IF;
END $$;
