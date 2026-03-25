import useSWR from "swr";

const adminHeaders = { "Content-Type": "application/json" };
type ClaimsResponse = { claims?: any[]; total?: number };
type CollectionsResponse = { collections?: any[]; total?: number };

async function parseAdminResponse<T>(res: Response, context: string): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${context} (${res.status}): ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export function useAdminClaims(status?: string, page = 1) {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (status) params.set("status", status);
  const { data, error, isLoading, mutate } = useSWR<ClaimsResponse>(
    `admin-claims-${status}-${page}`,
    async () => {
      const res = await fetch(`/api/admin/admin/claims?${params}`, { headers: adminHeaders });
      return parseAdminResponse(res, "Failed to fetch claims");
    },
    { revalidateOnFocus: false }
  );
  return { claims: (data?.claims ?? []) as any[], total: data?.total ?? 0, isLoading, error, mutate };
}

export function useAdminUsernameClaims(status?: string, page = 1) {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (status) params.set("status", status);
  const { data, error, isLoading, mutate } = useSWR<ClaimsResponse>(
    `admin-username-claims-${status}-${page}`,
    async () => {
      const res = await fetch(`/api/admin/admin/username-claims?${params}`, { headers: adminHeaders });
      return parseAdminResponse(res, "Failed to fetch username claims");
    },
    { revalidateOnFocus: false }
  );
  return { claims: (data?.claims ?? []) as any[], total: data?.total ?? 0, isLoading, error, mutate };
}

export function useAdminCreators(status?: string, page = 1) {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (status) params.set("status", status);
  const { data, error, isLoading, mutate } = useSWR<ClaimsResponse>(
    `admin-username-claims-all-${status}-${page}`,
    async () => {
      const res = await fetch(`/api/admin/admin/username-claims?${params}`, { headers: adminHeaders });
      return parseAdminResponse(res, "Failed to fetch creators");
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
  const { data, error, isLoading, mutate } = useSWR<CollectionsResponse>(
    `admin-collections-${JSON.stringify(filters)}`,
    async () => {
      const res = await fetch(`/api/admin/admin/collections?${params}`, { headers: adminHeaders });
      return parseAdminResponse(res, "Failed to fetch collections");
    },
    { revalidateOnFocus: false }
  );
  return { collections: (data?.collections ?? []) as any[], total: data?.total ?? 0, isLoading, error, mutate };
}
