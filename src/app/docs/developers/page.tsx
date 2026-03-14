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
    <div className="space-y-10 max-w-3xl">
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
            provides a typed client for all public API endpoints.
          </p>
          <Code>{`npm install @medialane/sdk`}</Code>
          <Code>{`import { MedialaneClient } from "@medialane/sdk";

const client = new MedialaneClient({
  baseUrl: "https://medialane-backend-production.up.railway.app/v1",
  apiKey: "ml_live_your_api_key_here",
});

// Fetch collections
const { data } = await client.getCollections({ limit: 20 });

// Fetch tokens owned by an address
const tokens = await client.getTokensByOwner("0x...");`}</Code>
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
            Public endpoints are rate-limited to <strong className="text-foreground">60 requests per minute</strong> per
            IP address. Authenticated API keys receive higher limits based on the plan.
            Rate limit headers are included in every response:
          </p>
          <Code>{`X-RateLimit-Limit: 60
X-RateLimit-Remaining: 58
X-RateLimit-Reset: 1710000000`}</Code>
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
