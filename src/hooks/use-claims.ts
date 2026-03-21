import useSWR from "swr";

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDIALANE_BACKEND_URL!;
// Admin endpoints (/admin/claims, /admin/collections) require the API_SECRET_KEY, not the tenant key.
// NEXT_PUBLIC_ADMIN_API_KEY must be set in .env.local and Railway env vars.
const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY!;
const adminHeaders = {
  "x-api-key": ADMIN_KEY,
  "Content-Type": "application/json",
};

export function useAdminClaims(status?: string, page = 1) {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (status) params.set("status", status);
  const { data, error, isLoading, mutate } = useSWR(
    `admin-claims-${status}-${page}`,
    async () => {
      const res = await fetch(`${BACKEND_URL}/admin/claims?${params}`, { headers: adminHeaders });
      return res.json();
    },
    { revalidateOnFocus: false }
  );
  return { claims: (data?.claims ?? []) as any[], total: data?.total ?? 0, isLoading, error, mutate };
}

export function useAdminUsernameClaims(status?: string, page = 1) {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (status) params.set("status", status);
  const { data, error, isLoading, mutate } = useSWR(
    `admin-username-claims-${status}-${page}`,
    async () => {
      const res = await fetch(`${BACKEND_URL}/admin/username-claims?${params}`, { headers: adminHeaders });
      return res.json();
    },
    { revalidateOnFocus: false }
  );
  return { claims: (data?.claims ?? []) as any[], total: data?.total ?? 0, isLoading, error, mutate };
}

export function useAdminCreators(status?: string, page = 1) {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (status) params.set("status", status);
  const { data, error, isLoading, mutate } = useSWR(
    `admin-username-claims-all-${status}-${page}`,
    async () => {
      const res = await fetch(`${BACKEND_URL}/admin/username-claims?${params}`, { headers: adminHeaders });
      return res.json();
    },
    { revalidateOnFocus: false }
  );
  return { creators: (data?.claims ?? []) as any[], total: data?.total ?? 0, isLoading, error, mutate };
}

export function useAdminCollections(filters: { source?: string; metadataStatus?: string; search?: string; page?: number } = {}) {
  const params = new URLSearchParams({ page: String(filters.page ?? 1), limit: "20" });
  if (filters.source) params.set("source", filters.source);
  if (filters.metadataStatus) params.set("metadataStatus", filters.metadataStatus);
  if (filters.search) params.set("search", filters.search);
  const { data, error, isLoading, mutate } = useSWR(
    `admin-collections-${JSON.stringify(filters)}`,
    async () => {
      const res = await fetch(`${BACKEND_URL}/admin/collections?${params}`, { headers: adminHeaders });
      return res.json();
    },
    { revalidateOnFocus: false }
  );
  return { collections: (data?.collections ?? []) as any[], total: data?.total ?? 0, isLoading, error, mutate };
}
