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
