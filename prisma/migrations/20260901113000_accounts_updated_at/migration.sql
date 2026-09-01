-- Last-activity clock for conditional client refresh. Child-row triggers keep it
-- current so JS actions and RPCs (claim / merge) cannot forget to bump it.

ALTER TABLE "accounts"
  ADD COLUMN "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

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
