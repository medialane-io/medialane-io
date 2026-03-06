import { type MedialaneConfig, resolveConfig, type ResolvedConfig } from "./config";
import { MarketplaceModule } from "./marketplace/index";
import { ApiClient } from "./api/client";

export class MedialaneClient {
  /** On-chain marketplace interactions (create listing, fulfill order, etc.) */
  readonly marketplace: MarketplaceModule;

  /**
   * Off-chain API client — covers all /v1/* backend endpoints.
   * Requires `backendUrl` in config; pass `apiKey` for authenticated routes.
   */
  readonly api: ApiClient;

  private readonly config: ResolvedConfig;

  constructor(rawConfig: MedialaneConfig = {}) {
    this.config = resolveConfig(rawConfig);

    this.marketplace = new MarketplaceModule(this.config);

    if (!this.config.backendUrl) {
      this.api = new Proxy({} as ApiClient, {
        get(_target, prop) {
          return () => {
            throw new Error(
              `backendUrl not configured. Pass backendUrl to MedialaneClient to use .api.${String(prop)}()`
            );
          };
        },
      });
    } else {
      this.api = new ApiClient(this.config.backendUrl, this.config.apiKey);
    }
  }

  get network() {
    return this.config.network;
  }

  get rpcUrl() {
    return this.config.rpcUrl;
  }

  get marketplaceContract() {
    return this.config.marketplaceContract;
  }
}
