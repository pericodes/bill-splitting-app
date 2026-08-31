-- =====================================================================
-- ESQUEMA DE BASE DE DATOS NEON · App tipo Splitwise
-- =====================================================================
-- Diseño optimizado con RLS, UUIDs, e integridad referencial.
-- Adaptado para soportar usuarios fantasma (sin cuenta registrada)
-- y sistema de doble entrada (ledger) para cálculo de saldos O(1).
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper para la identidad de la sesión
CREATE OR REPLACE FUNCTION app_current_user_id()
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid
$$;

-- 1. USUARIOS
CREATE TABLE users (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name      text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 60),
  auth_user_id      text UNIQUE, -- FK a Auth de Neon. NULL = fantasma.
  is_ghost          boolean GENERATED ALWAYS AS (auth_user_id IS NULL) STORED,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Secreto de sesión separado (para no filtrarlo por RLS)
CREATE TABLE user_secrets (
  user_id        uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  session_secret uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- 2. CUENTAS
CREATE TABLE accounts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  icon_key      text NOT NULL,
  currency      text NOT NULL DEFAULT 'EUR' CHECK (char_length(currency) = 3),
  invite_token  uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_by    uuid NOT NULL REFERENCES users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  archived_at   timestamptz
);
CREATE INDEX idx_accounts_invite_token ON accounts (invite_token);

-- 3. MIEMBROS
CREATE TABLE account_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES users(id),
  role       text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','member')),
  joined_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, user_id)
);
CREATE INDEX idx_account_members_user ON account_members (user_id);

-- 4. LIBRO MAYOR (LEDGER)
CREATE TABLE transactions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  type         text NOT NULL CHECK (type IN ('expense','transfer')),
  description  text NOT NULL CHECK (char_length(description) BETWEEN 1 AND 140),
  total_amount numeric(12,2) NOT NULL CHECK (total_amount > 0),
  currency     text NOT NULL,
  occurred_on  date NOT NULL DEFAULT current_date,
  created_by   uuid NOT NULL REFERENCES users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);
CREATE INDEX idx_transactions_account_date ON transactions (account_id, occurred_on DESC) WHERE deleted_at IS NULL;

CREATE TABLE transaction_entries (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  account_id     uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, -- Denormalizado para performance
  user_id        uuid NOT NULL REFERENCES users(id),
  paid_amount    numeric(12,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  owed_amount    numeric(12,2) NOT NULL DEFAULT 0 CHECK (owed_amount >= 0),
  net_amount     numeric(12,2) GENERATED ALWAYS AS (paid_amount - owed_amount) STORED,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (transaction_id, user_id)
);
CREATE INDEX idx_entries_account_user ON transaction_entries (account_id, user_id);

-- 5. SALDOS PRECALCULADOS
CREATE TABLE account_balances (
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES users(id),
  balance    numeric(12,2) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, user_id)
);

-- =====================================================================
-- ROW LEVEL SECURITY (Ejemplos clave)
-- =====================================================================
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY accounts_select ON accounts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM account_members m
    WHERE m.account_id = accounts.id AND m.user_id = app_current_user_id()
  ));
