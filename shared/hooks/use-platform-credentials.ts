import useSWR from "swr";
import { fetchJson } from "@/shared/lib/fetcher";
import type { PlatformCredentialStatus } from "@/shared/types/api";

export function usePlatformCredentials() {
  return useSWR<PlatformCredentialStatus[]>("/api/platform-credentials", fetchJson);
}
