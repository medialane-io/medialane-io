import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "API Docs | Docs | Medialane",
  description: "Full REST API reference for the Medialane backend: endpoints, authentication, request shapes, and response types.",
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

type Method = "GET" | "POST" | "PATCH" | "DELETE";

const METHOD_COLORS: Record<Method, string> = {
  GET:    "bg-blue-500/10 text-blue-400",
  POST:   "bg-emerald-500/10 text-emerald-400",
  PATCH:  "bg-amber-500/10 text-amber-400",
  DELETE: "bg-destructive/10 text-destructive",
};

function EndpointRow({ method, path, desc }: { method: Method; path: string; desc: string }) {
  return (
    <div className="bento-cell px-3 py-2.5 flex items-center gap-3 flex-wrap">
      <span className={`font-mono text-[10px] px-2 py-0.5 rounded shrink-0 ${METHOD_COLORS[method]}`}>{method}</span>
      <span className="font-mono text-xs text-foreground/80">{path}</span>
      <span className="text-muted-foreground text-xs ml-auto">{desc}</span>
    </div>
  );
}

export default function DocsAPIPage() {
  return (
    <div className="space-y-10 max-w-3xl">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">API Reference</h2>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Full REST API reference for the Medialane backend. For SDK usage and
          integration guides, see the{" "}
          <Link href="/docs/developers" className="text-primary hover:underline">Developers</Link> section.
        </p>
      </div>

      <div className="space-y-8">
        <Section title="Base URL & Versioning">
          <Code>https://medialane-backend-production.up.railway.app/v1</Code>
          <p>All endpoints are prefixed with <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">/v1</code>.
          Breaking changes will be introduced under a new version prefix.</p>
        </Section>

        <Section title="Collections">
          <div className="space-y-2">
            <EndpointRow method="GET" path="/collections" desc="List all collections (paginated, sortable)" />
            <EndpointRow method="GET" path="/collections/:contract" desc="Get a single collection by contract address" />
            <EndpointRow method="GET" path="/collections/:contract/tokens" desc="Tokens in a collection (paginated)" />
          </div>
          <p>Query params for <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">/collections</code>:
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono mx-1">page</code>,
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono mx-1">limit</code>,
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono mx-1">sort</code> (createdAt|totalSupply|floorPrice|totalVolume),
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono mx-1">owner</code>,
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono mx-1">isKnown</code>.</p>
        </Section>

        <Section title="Tokens">
          <div className="space-y-2">
            <EndpointRow method="GET" path="/tokens/:contract/:tokenId" desc="Get a single token with metadata" />
            <EndpointRow method="GET" path="/tokens/owned/:address" desc="All tokens owned by a wallet address" />
            <EndpointRow method="GET" path="/tokens/:contract/:tokenId/history" desc="Transfer and order history for a token" />
          </div>
        </Section>

        <Section title="Orders">
          <div className="space-y-2">
            <EndpointRow method="GET" path="/orders" desc="List orders (filter by status, sort, currency, collection)" />
            <EndpointRow method="GET" path="/orders/:orderHash" desc="Get a single order" />
            <EndpointRow method="GET" path="/orders/user/:address" desc="All orders for a wallet (buy + sell)" />
            <EndpointRow method="GET" path="/orders/token/:contract/:tokenId" desc="Active orders for a specific token" />
            <EndpointRow method="POST" path="/orders/intent/listing" desc="Create a listing intent (returns typed data to sign)" />
            <EndpointRow method="POST" path="/orders/intent/offer" desc="Create an offer intent (returns typed data to sign)" />
            <EndpointRow method="POST" path="/orders/intent/fulfill" desc="Create a fulfill intent" />
            <EndpointRow method="POST" path="/orders/intent/cancel" desc="Create a cancel intent" />
            <EndpointRow method="POST" path="/orders/signature" desc="Submit signed intent" />
          </div>
        </Section>

        <Section title="Activities">
          <div className="space-y-2">
            <EndpointRow method="GET" path="/activities" desc="Global activity feed (all event types)" />
            <EndpointRow method="GET" path="/activities/:address" desc="Activity for a specific wallet address" />
          </div>
          <p>Event types: <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">mint</code>, <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">listing</code>, <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">sale</code>, <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">offer</code>, <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">transfer</code>, <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">cancelled</code>.</p>
        </Section>

        <Section title="Response Format">
          <Code>{`// List response
{
  "data": [...],
  "meta": { "page": 1, "limit": 20, "total": 142 }
}

// Single item response
{ "id": "...", "chain": "STARKNET", ... }

// Error response
{ "error": "Not found" }`}</Code>
        </Section>

        <Section title="Address Format">
          <p>
            All Starknet addresses in requests and responses are normalised to
            64-character zero-padded hex with <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">0x</code> prefix.
            The SDK handles normalisation automatically; if calling the API directly,
            ensure addresses are padded correctly.
          </p>
        </Section>
      </div>
    </div>
  );
}
