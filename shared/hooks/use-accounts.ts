import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useAccounts() {
  return useSWR("/api/accounts", fetcher);
}
