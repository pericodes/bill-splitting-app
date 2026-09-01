import { getAccountData } from "@/actions/app";
import { putAccountCacheFromServer } from "./accountCache";

const MAX_CONCURRENT = 2;
const queue: string[] = [];
const inflight = new Set<string>();

export function enqueueAccountPrefetch(ids: string[]) {
  for (const id of ids) {
    if (!id || inflight.has(id) || queue.includes(id)) continue;
    queue.push(id);
  }
  pump();
}

function pump() {
  while (inflight.size < MAX_CONCURRENT && queue.length > 0) {
    const id = queue.shift();
    if (!id) break;
    void prefetchOne(id);
  }
}

async function prefetchOne(id: string) {
  inflight.add(id);
  const started = Date.now();
  try {
    const res = await getAccountData(id);
    if (res.success && res.account) {
      putAccountCacheFromServer(id, {
        account: res.account,
        users: res.users || [],
        members: res.members || [],
        balances: res.balances || [],
        transactions: res.transactions || [],
        entries: res.entries || [],
      }, started);
    }
  } catch (err) {
    console.error(err);
  } finally {
    inflight.delete(id);
    pump();
  }
}
