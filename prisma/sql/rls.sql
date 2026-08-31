-- =============================================================================
-- ROW LEVEL SECURITY — plantilla (NO aplicada todavía)
-- =============================================================================
-- Cómo añadirla después:
--   1. pnpm db:dev:migrate -- --create-only --name rls
--   2. Copiar este archivo en la migration.sql generada
--   3. pnpm db:dev:migrate
--
-- CUIDADO: `prisma db push` y el shadow DB de `migrate dev` pueden emitir
-- DROP POLICY si las políticas no están en una migración previa. Tras aplicar
-- RLS, crea migraciones nuevas con --create-only y borra cualquier DROP POLICY.
--
-- Identidad: app_current_user_id() lee current_setting('app.current_user_id').
-- Neon Data API / PostgREST suele usar el JWT (auth.uid()). Cuando conectemos
-- RLS a Auth, hay que alinear esta función con el claim real.
--
-- FORCE ROW LEVEL SECURITY: el owner de las tablas (rol de Prisma / migraciones)
-- ignora RLS salvo que se fuerce. La app en runtime usa Data API (rol
-- authenticator), donde RLS sí aplica. FORCE solo si Prisma Client consulta
-- datos en nombre de un usuario.
-- =============================================================================

-- Helper (ya se crea en la migración inicial; se deja aquí por contexto)
-- CREATE OR REPLACE FUNCTION app_current_user_id()
-- RETURNS uuid LANGUAGE sql STABLE AS $$
--   SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid
-- $$;

-- ----- accounts --------------------------------------------------------------
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY accounts_select ON accounts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM account_members m
      WHERE m.account_id = accounts.id
        AND m.user_id = app_current_user_id()
    )
  );

-- CREATE POLICY accounts_insert ON accounts FOR INSERT ...
-- CREATE POLICY accounts_update ON accounts FOR UPDATE ...
-- CREATE POLICY accounts_delete ON accounts FOR DELETE ...

-- ----- users -----------------------------------------------------------------
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY users_select ON users FOR SELECT USING (...);

-- ----- user_secrets ----------------------------------------------------------
-- Nunca exponer por Data API. Si se habilita RLS: solo el propio usuario.
-- ALTER TABLE user_secrets ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY user_secrets_own ON user_secrets
--   USING (user_id = app_current_user_id());

-- ----- account_members -------------------------------------------------------
-- ALTER TABLE account_members ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY account_members_select ON account_members FOR SELECT USING (...);

-- ----- transactions ----------------------------------------------------------
-- ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY transactions_select ON transactions FOR SELECT USING (...);

-- ----- transaction_entries ---------------------------------------------------
-- ALTER TABLE transaction_entries ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY transaction_entries_select ON transaction_entries FOR SELECT USING (...);

-- ----- account_balances ------------------------------------------------------
-- ALTER TABLE account_balances ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY account_balances_select ON account_balances FOR SELECT USING (...);
