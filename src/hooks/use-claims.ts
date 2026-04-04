import useSWR from "swr";
import type {
  AdminCollectionClaimRecord,
  AdminUsernameClaimRecord,
  AdminCreatorRecord,
  AdminCollectionRecord,
} from "@/types/admin";

// All admin calls go through /api/admin/[...path] which adds the secret server-side.
// No API key is needed here — the proxy handles auth via Clerk admin role check.
const adminFetch = (url: string, options?: RequestInit) =>
  fetch(url, { ...options, headers: { "Content-Type": "application/json", ...(options?.headers as Record<string, string>) } });

export function useAdminClaims(status?: string, page = 1) {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (status) params.set("status", status);
  const { data, error, isLoading, mutate } = useSWR(
    `admin-claims-${status}-${page}`,
    async () => {
      const res = await adminFetch(`/api/admin/claims?${params}`);
      return res.json();
    },
    { revalidateOnFocus: false }
  );
  return { claims: (data?.claims ?? []) as AdminCollectionClaimRecord[], total: data?.total ?? 0, isLoading, error, mutate };
}

export function useAdminUsernameClaims(status?: string, page = 1) {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (status) params.set("status", status);
  const { data, error, isLoading, mutate } = useSWR(
    `admin-username-claims-${status}-${page}`,
    async () => {
      const res = await adminFetch(`/api/admin/username-claims?${params}`);
      return res.json();
    },
    { revalidateOnFocus: false }
  );
  return { claims: (data?.claims ?? []) as AdminUsernameClaimRecord[], total: data?.total ?? 0, isLoading, error, mutate };
}

export function useAdminCreators(status?: string, page = 1) {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (status) params.set("status", status);
  const { data, error, isLoading, mutate } = useSWR(
    `admin-username-claims-all-${status}-${page}`,
    async () => {
      const res = await adminFetch(`/api/admin/username-claims?${params}`);
      return res.json();
    },
    { revalidateOnFocus: false }
  );
  return { creators: (data?.claims ?? []) as AdminCreatorRecord[], total: data?.total ?? 0, isLoading, error, mutate };
}

export function useAdminCollections(filters: { source?: string; metadataStatus?: string; search?: string; page?: number } = {}) {
  const params = new URLSearchParams({ page: String(filters.page ?? 1), limit: "20" });
  if (filters.source) params.set("source", filters.source);
  if (filters.metadataStatus) params.set("metadataStatus", filters.metadataStatus);
  if (filters.search) params.set("search", filters.search);
  const { data, error, isLoading, mutate } = useSWR(
    `admin-collections-${JSON.stringify(filters)}`,
    async () => {
      const res = await adminFetch(`/api/admin/collections?${params}`);
      return res.json();
    },
    { revalidateOnFocus: false }
  );
  return { collections: (data?.collections ?? []) as AdminCollectionRecord[], total: data?.total ?? 0, isLoading, error, mutate };
}
