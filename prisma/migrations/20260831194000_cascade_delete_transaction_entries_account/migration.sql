-- transaction_entries.account_id is denormalized from transactions.account_id.
-- ON DELETE RESTRICT blocked deleting an account that had expenses, even though
-- transactions already cascade-delete. Align with the rest of the account graph.

ALTER TABLE "transaction_entries" DROP CONSTRAINT "transaction_entries_account_id_fkey";

ALTER TABLE "transaction_entries" ADD CONSTRAINT "transaction_entries_account_id_fkey"
  FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
