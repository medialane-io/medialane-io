import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developers | Docs | Medialane",
  description: "API reference, SDK usage, authentication, and integration guides for building on Medialane.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="bento-cell p-4 text-xs font-mono overflow-x-auto text-foreground/80 leading-relaxed">
      {children}
    </pre>
  );
}

export default function DocsDevsPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Developer Documentation</h2>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Build applications on top of Medialane using the REST API or the official
          TypeScript SDK. All endpoints are public and read-only unless authenticated
          with an API key.
        </p>
      </div>

      <div className="space-y-8">
        <Section title="Base URL">
          <Code>https://medialane-backend-production.up.railway.app/v1</Code>
          <p>All API requests are served over HTTPS. HTTP requests are not supported.</p>
        </Section>

        <Section title="Authentication">
          <p>
            Public endpoints (collections, tokens, orders, activities) require no
            authentication. To access rate-limited or write endpoints, include your
            API key in the request header:
          </p>
          <Code>{`x-api-key: ml_live_your_api_key_here`}</Code>
          <p>
            API keys are issued per tenant. Contact us at{" "}
            <a href="mailto:dev@medialane.io" className="text-primary hover:underline">
              dev@medialane.io
            </a>{" "}
            to request a key for your integration.
          </p>
        </Section>

        <Section title="TypeScript SDK">
          <p>
            The official <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">@medialane/sdk</code> package
            provides a fully-typed client for all API endpoints, on-chain operations, and ERC-1155 ownership checks.
          </p>
          <Code>{`npm install @medialane/sdk starknet`}</Code>
          <Code>{`import { MedialaneClient } from "@medialane/sdk";

const client = new MedialaneClient({
  network: "mainnet",
  backendUrl: "https://medialane-backend-production.up.railway.app",
  apiKey: "ml_live_your_api_key_here",
});

// Fetch collections (newest first by default)
const { data: collections } = await client.api.getCollections(1, 20);

// Fetch tokens owned by a wallet
const { data: tokens } = await client.api.getTokensByOwner("0x...");

// Single token — includes balances for ERC-1155 multi-holder ownership
const { data: token } = await client.api.getToken("0x...", "1");
console.log(token.balances);      // [{ owner: "0x...", amount: "1" }, ...]
console.log(token.activeOrders);  // active listings / offers`}</Code>
          <p>
            For ERC-1155 tokens, <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">token.balances</code> lists
            every current holder with their quantity. For ERC-721,{" "}
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">token.balances</code> contains
            a single entry with <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">amount: &quot;1&quot;</code>.
            The legacy <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">token.owner</code> field
            is deprecated and always <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">null</code>.
          </p>
        </Section>

        <Section title="Key Endpoints">
          <div className="space-y-2 text-sm">
            {[
              ["GET", "/collections", "List all collections"],
              ["GET", "/collections/:contract", "Get a single collection"],
              ["GET", "/collections/:contract/tokens", "Tokens in a collection"],
              ["GET", "/tokens/owned/:address", "Tokens owned by a wallet"],
              ["GET", "/tokens/:contract/:tokenId", "Single token with metadata"],
              ["GET", "/orders", "List marketplace orders"],
              ["GET", "/orders/user/:address", "Orders for a wallet"],
              ["GET", "/activities", "Global activity feed"],
              ["GET", "/activities/:address", "Activity for a wallet"],
            ].map(([method, path, desc]) => (
              <div key={path} className="bento-cell px-3 py-2.5 flex items-center gap-3">
                <span className="font-mono text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded shrink-0">{method}</span>
                <span className="font-mono text-xs text-foreground/80 shrink-0">{path}</span>
                <span className="text-muted-foreground text-xs ml-auto">{desc}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Pagination">
          <p>
            List endpoints support <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">page</code> and{" "}
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">limit</code> query parameters.
            Responses include a <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">meta</code> object:
          </p>
          <Code>{`{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 142
  }
}`}</Code>
        </Section>

        <Section title="Rate Limits">
          <p>
            Limits are applied per API key. Every response includes rate limit headers:
          </p>
          <div className="space-y-2 text-sm">
            {[
              ["FREE", "50 requests / calendar month"],
              ["PREMIUM", "3,000 requests / minute"],
            ].map(([plan, limit]) => (
              <div key={plan} className="bento-cell px-4 py-2.5 flex items-center gap-4">
                <span className="font-mono text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded shrink-0">{plan}</span>
                <span className="text-xs text-muted-foreground">{limit}</span>
              </div>
            ))}
          </div>
          <Code>{`X-RateLimit-Limit: 50
X-RateLimit-Remaining: 48
X-RateLimit-Reset: 1714521600`}</Code>
          <p>
            Portal endpoints (<code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">/v1/portal/*</code>) are
            excluded from the monthly quota count.
          </p>
        </Section>

        <Section title="IPFS & Media">
          <p>
            Token images and metadata are stored on IPFS. URLs in API responses use the
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono mx-1">ipfs://</code>
            scheme. Convert to HTTP using any public IPFS gateway:
          </p>
          <Code>{`// ipfs://bafybeifoo... → https://gateway.pinata.cloud/ipfs/bafybeifoo...
const httpUrl = ipfsUri.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");`}</Code>
        </Section>
      </div>
    </div>
  );
}
