import useSWR from "swr";
import { fetchJson } from "@/shared/lib/fetcher";
import type { PostListItem } from "@/shared/types/api";

export function usePosts(status?: string) {
  const params = status ? `?status=${status}` : "";
  return useSWR<PostListItem[]>(`/api/posts${params}`, fetchJson);
}

export function usePost(id: string) {
  return useSWR<PostListItem>(`/api/posts/${id}`, fetchJson);
}

export function useDrafts() {
  return useSWR<PostListItem[]>("/api/posts?status=DRAFT", fetchJson);
}
