-- =============================================================================
-- Permisos para Neon Data API (roles authenticated / anonymous).
--
-- Prisma migrate reset recrea schema public como neondb_owner y deja a estos
-- roles sin USAGE → "permission denied for schema public".
--
-- Idempotente. Tras migrar: pnpm db:dev:grants  (también va en db:dev:setup).
-- RLS (prisma/sql/rls.sql) restringirá filas más adelante; esto solo abre el schema.
-- =============================================================================

DO $$
DECLARE
  r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['authenticated', 'anonymous']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('GRANT USAGE ON SCHEMA public TO %I', r);
      EXECUTE format(
        'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO %I',
        r
      );
      EXECUTE format(
        'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO %I',
        r
      );
      EXECUTE format(
        'GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO %I',
        r
      );
      EXECUTE format(
        'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO %I',
        r
      );
      EXECUTE format(
        'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO %I',
        r
      );
      EXECUTE format(
        'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO %I',
        r
      );
    END IF;
  END LOOP;
END $$;
