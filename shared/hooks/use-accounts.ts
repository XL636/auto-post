import useSWR from "swr";
import { fetchJson } from "@/shared/lib/fetcher";
import type { AccountListItem } from "@/shared/types/api";

export function useAccounts() {
  return useSWR<AccountListItem[]>("/api/accounts", fetchJson);
}
