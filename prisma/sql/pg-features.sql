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
