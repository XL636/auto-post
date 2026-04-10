import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function usePosts(status?: string) {
  const params = status ? `?status=${status}` : "";
  return useSWR(`/api/posts${params}`, fetcher);
}

export function usePost(id: string) {
  return useSWR(`/api/posts/${id}`, fetcher);
}

export function useDrafts() {
  return useSWR("/api/posts?status=DRAFT", fetcher);
}
