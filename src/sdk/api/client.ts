import type {
  ApiOrder,
  ApiOrdersQuery,
  ApiToken,
  ApiCollection,
  ApiActivity,
  ApiActivitiesQuery,
  ApiSearchResult,
  ApiIntent,
  ApiIntentCreated,
  ApiMetadataSignedUrl,
  ApiMetadataUpload,
  ApiPortalMe,
  ApiPortalKey,
  ApiPortalKeyCreated,
  ApiUsageDay,
  ApiWebhookEndpoint,
  ApiWebhookCreated,
  CreateWebhookParams,
  CreateListingIntentParams,
  MakeOfferIntentParams,
  FulfillOrderIntentParams,
  CancelOrderIntentParams,
  CreateMintIntentParams,
  CreateCollectionIntentParams,
  ApiResponse,
} from "../types/api";

export class MedialaneApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "MedialaneApiError";
  }
}

export class ApiClient {
  private readonly baseHeaders: Record<string, string>;

  constructor(
    private readonly baseUrl: string,
    apiKey?: string
  ) {
    this.baseHeaders = apiKey ? { "x-api-key": apiKey } : {};
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${this.baseUrl.replace(/\/$/, "")}${path}`;
    const headers: Record<string, string> = { ...this.baseHeaders };
    if (!(init?.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    const res = await fetch(url, {
      ...init,
      headers: { ...headers, ...(init?.headers as Record<string, string> | undefined) },
    });
    if (!res.ok) {
      let message = res.statusText;
      try {
        const body = (await res.json()) as { error?: string };
        if (body.error) message = body.error;
      } catch {
        // use statusText
      }
      throw new MedialaneApiError(res.status, message);
    }
    return res.json() as Promise<T>;
  }

  private get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "GET" });
  }

  private post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: "POST", body: JSON.stringify(body) });
  }

  private patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
  }

  private del<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "DELETE" });
  }

  // ─── Orders ────────────────────────────────────────────────────────────────

  getOrders(query: ApiOrdersQuery = {}): Promise<ApiResponse<ApiOrder[]>> {
    const params = new URLSearchParams();
    if (query.status) params.set("status", query.status);
    if (query.collection) params.set("collection", query.collection);
    if (query.currency) params.set("currency", query.currency);
    if (query.sort) params.set("sort", query.sort);
    if (query.page !== undefined) params.set("page", String(query.page));
    if (query.limit !== undefined) params.set("limit", String(query.limit));
    if (query.offerer) params.set("offerer", query.offerer);
    const qs = params.toString();
    return this.get<ApiResponse<ApiOrder[]>>(`/v1/orders${qs ? `?${qs}` : ""}`);
  }

  getOrder(orderHash: string): Promise<ApiResponse<ApiOrder>> {
    return this.get<ApiResponse<ApiOrder>>(`/v1/orders/${orderHash}`);
  }

  getActiveOrdersForToken(contract: string, tokenId: string): Promise<ApiResponse<ApiOrder[]>> {
    return this.get<ApiResponse<ApiOrder[]>>(`/v1/orders/token/${contract}/${tokenId}`);
  }

  getOrdersByUser(address: string, page = 1, limit = 20): Promise<ApiResponse<ApiOrder[]>> {
    return this.get<ApiResponse<ApiOrder[]>>(
      `/v1/orders/user/${address}?page=${page}&limit=${limit}`
    );
  }

  // ─── Tokens ────────────────────────────────────────────────────────────────

  getToken(contract: string, tokenId: string, wait = false): Promise<ApiResponse<ApiToken>> {
    return this.get<ApiResponse<ApiToken>>(
      `/v1/tokens/${contract}/${tokenId}${wait ? "?wait=true" : ""}`
    );
  }

  getTokensByOwner(address: string, page = 1, limit = 20): Promise<ApiResponse<ApiToken[]>> {
    return this.get<ApiResponse<ApiToken[]>>(
      `/v1/tokens/owned/${address}?page=${page}&limit=${limit}`
    );
  }

  getTokenHistory(
    contract: string,
    tokenId: string,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<ApiActivity[]>> {
    return this.get<ApiResponse<ApiActivity[]>>(
      `/v1/tokens/${contract}/${tokenId}/history?page=${page}&limit=${limit}`
    );
  }

  // ─── Collections ───────────────────────────────────────────────────────────

  getCollections(page = 1, limit = 20): Promise<ApiResponse<ApiCollection[]>> {
    return this.get<ApiResponse<ApiCollection[]>>(`/v1/collections?page=${page}&limit=${limit}`);
  }

  getCollection(contract: string): Promise<ApiResponse<ApiCollection>> {
    return this.get<ApiResponse<ApiCollection>>(`/v1/collections/${contract}`);
  }

  getCollectionTokens(
    contract: string,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<ApiToken[]>> {
    return this.get<ApiResponse<ApiToken[]>>(
      `/v1/collections/${contract}/tokens?page=${page}&limit=${limit}`
    );
  }

  // ─── Activities ────────────────────────────────────────────────────────────

  getActivities(query: ApiActivitiesQuery = {}): Promise<ApiResponse<ApiActivity[]>> {
    const params = new URLSearchParams();
    if (query.type) params.set("type", query.type);
    if (query.page !== undefined) params.set("page", String(query.page));
    if (query.limit !== undefined) params.set("limit", String(query.limit));
    const qs = params.toString();
    return this.get<ApiResponse<ApiActivity[]>>(`/v1/activities${qs ? `?${qs}` : ""}`);
  }

  getActivitiesByAddress(
    address: string,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<ApiActivity[]>> {
    return this.get<ApiResponse<ApiActivity[]>>(
      `/v1/activities/${address}?page=${page}&limit=${limit}`
    );
  }

  // ─── Search ────────────────────────────────────────────────────────────────

  search(q: string, limit = 10): Promise<ApiResponse<ApiSearchResult> & { query: string }> {
    const params = new URLSearchParams({ q, limit: String(limit) });
    return this.get<ApiResponse<ApiSearchResult> & { query: string }>(
      `/v1/search?${params.toString()}`
    );
  }

  // ─── Intents ───────────────────────────────────────────────────────────────

  createListingIntent(
    params: CreateListingIntentParams
  ): Promise<ApiResponse<ApiIntentCreated>> {
    return this.post<ApiResponse<ApiIntentCreated>>("/v1/intents/listing", params);
  }

  createOfferIntent(
    params: MakeOfferIntentParams
  ): Promise<ApiResponse<ApiIntentCreated>> {
    return this.post<ApiResponse<ApiIntentCreated>>("/v1/intents/offer", params);
  }

  createFulfillIntent(
    params: FulfillOrderIntentParams
  ): Promise<ApiResponse<ApiIntentCreated>> {
    return this.post<ApiResponse<ApiIntentCreated>>("/v1/intents/fulfill", params);
  }

  createCancelIntent(
    params: CancelOrderIntentParams
  ): Promise<ApiResponse<ApiIntentCreated>> {
    return this.post<ApiResponse<ApiIntentCreated>>("/v1/intents/cancel", params);
  }

  getIntent(id: string): Promise<ApiResponse<ApiIntent>> {
    return this.get<ApiResponse<ApiIntent>>(`/v1/intents/${id}`);
  }

  submitIntentSignature(id: string, signature: string[]): Promise<ApiResponse<ApiIntent>> {
    return this.patch<ApiResponse<ApiIntent>>(`/v1/intents/${id}/signature`, { signature });
  }

  createMintIntent(params: CreateMintIntentParams): Promise<ApiResponse<ApiIntentCreated>> {
    return this.post<ApiResponse<ApiIntentCreated>>("/v1/intents/mint", params);
  }

  createCollectionIntent(params: CreateCollectionIntentParams): Promise<ApiResponse<ApiIntentCreated>> {
    return this.post<ApiResponse<ApiIntentCreated>>("/v1/intents/create-collection", params);
  }

  // ─── Metadata ──────────────────────────────────────────────────────────────

  getMetadataSignedUrl(): Promise<ApiResponse<ApiMetadataSignedUrl>> {
    return this.get<ApiResponse<ApiMetadataSignedUrl>>("/v1/metadata/signed-url");
  }

  uploadMetadata(metadata: Record<string, unknown>): Promise<ApiResponse<ApiMetadataUpload>> {
    return this.post<ApiResponse<ApiMetadataUpload>>("/v1/metadata/upload", metadata);
  }

  resolveMetadata(uri: string): Promise<ApiResponse<unknown>> {
    const params = new URLSearchParams({ uri });
    return this.get<ApiResponse<unknown>>(`/v1/metadata/resolve?${params.toString()}`);
  }

  uploadFile(file: File): Promise<ApiResponse<ApiMetadataUpload>> {
    const formData = new FormData();
    formData.append("file", file);
    // Content-Type is intentionally omitted — request() detects FormData and
    // lets the runtime set multipart/form-data with the correct boundary.
    return this.request<ApiResponse<ApiMetadataUpload>>("/v1/metadata/upload-file", {
      method: "POST",
      body: formData,
    });
  }

  // ─── Portal (tenant self-service) ──────────────────────────────────────────

  getMe(): Promise<ApiResponse<ApiPortalMe>> {
    return this.get<ApiResponse<ApiPortalMe>>("/v1/portal/me");
  }

  getApiKeys(): Promise<ApiResponse<ApiPortalKey[]>> {
    return this.get<ApiResponse<ApiPortalKey[]>>("/v1/portal/keys");
  }

  createApiKey(label?: string): Promise<ApiResponse<ApiPortalKeyCreated>> {
    return this.post<ApiResponse<ApiPortalKeyCreated>>("/v1/portal/keys", label ? { label } : {});
  }

  deleteApiKey(id: string): Promise<ApiResponse<{ id: string; status: string }>> {
    return this.del<ApiResponse<{ id: string; status: string }>>(`/v1/portal/keys/${id}`);
  }

  getUsage(): Promise<ApiResponse<ApiUsageDay[]>> {
    return this.get<ApiResponse<ApiUsageDay[]>>("/v1/portal/usage");
  }

  getWebhooks(): Promise<ApiResponse<ApiWebhookEndpoint[]>> {
    return this.get<ApiResponse<ApiWebhookEndpoint[]>>("/v1/portal/webhooks");
  }

  createWebhook(params: CreateWebhookParams): Promise<ApiResponse<ApiWebhookCreated>> {
    return this.post<ApiResponse<ApiWebhookCreated>>("/v1/portal/webhooks", params);
  }

  deleteWebhook(id: string): Promise<ApiResponse<{ id: string; status: string }>> {
    return this.del<ApiResponse<{ id: string; status: string }>>(
      `/v1/portal/webhooks/${id}`
    );
  }
}
