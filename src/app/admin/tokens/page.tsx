"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, RefreshCw, ExternalLink } from "lucide-react";
import { ipfsToHttp } from "@/lib/utils";
import Image from "next/image";

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDIALANE_BACKEND_URL!;
const ADMIN_KEY   = process.env.NEXT_PUBLIC_ADMIN_API_KEY!;
const TENANT_KEY  = process.env.NEXT_PUBLIC_MEDIALANE_API_KEY!;
const EXPLORER    = "https://voyager.online";

const STATUS_STYLE: Record<string, string> = {
  DONE:     "bg-green-500/20 text-green-400",
  PENDING:  "bg-yellow-500/20 text-yellow-400",
  FAILED:   "bg-red-500/20 text-red-400",
  FETCHING: "bg-blue-500/20 text-blue-400",
};

export default function AdminTokensPage() {
  const [contract, setContract]     = useState("");
  const [tokenId, setTokenId]       = useState("");
  const [loading, setLoading]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [token, setToken]           = useState<any>(null);

  async function handleLookup() {
    if (!contract.trim() || !tokenId.trim()) return;
    setLoading(true);
    setToken(null);
    try {
      const res = await fetch(
        `${BACKEND_URL}/v1/tokens/${contract.trim()}/${tokenId.trim()}`,
        { headers: { "x-api-key": TENANT_KEY } }
      );
      if (!res.ok) { toast.error("Token not found"); return; }
      const data = await res.json();
      setToken(data.data ?? data);
    } catch { toast.error("Lookup failed"); }
    finally { setLoading(false); }
  }

  async function handleRefresh() {
    if (!contract.trim() || !tokenId.trim()) return;
    setRefreshing(true);
    try {
      const res = await fetch(
        `${BACKEND_URL}/admin/tokens/${contract.trim()}/${tokenId.trim()}/refresh`,
        { method: "POST", headers: { "x-api-key": ADMIN_KEY } }
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(`Refresh complete — status: ${data.metadataStatus ?? "updated"}`);
      await handleLookup();
    } catch { toast.error("Refresh failed"); }
    finally { setRefreshing(false); }
  }

  const imgUrl = token?.metadata?.image ? ipfsToHttp(token.metadata.image) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Token Lookup</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Find any token by contract + ID and force-refresh its metadata.
        </p>
      </div>

      {/* Lookup form */}
      <div className="glass rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Contract address</Label>
            <Input
              placeholder="0x…"
              value={contract}
              onChange={e => setContract(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLookup()}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Token ID</Label>
            <Input
              placeholder="1"
              value={tokenId}
              onChange={e => setTokenId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLookup()}
            />
          </div>
        </div>
        <Button onClick={handleLookup} disabled={loading || !contract.trim() || !tokenId.trim()}>
          <Search className="h-4 w-4 mr-2" />
          {loading ? "Looking up…" : "Lookup"}
        </Button>
      </div>

      {/* Result */}
      {token && (
        <div className="glass rounded-xl p-5 space-y-4">
          <div className="flex items-start gap-4">
            {/* Thumbnail */}
            <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted shrink-0">
              {imgUrl
                ? <Image src={imgUrl} alt="" fill className="object-cover" unoptimized />
                : <div className="h-full w-full bg-gradient-to-br from-muted to-muted-foreground/20" />
              }
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0 space-y-1">
              <p className="font-semibold truncate">{token.metadata?.name ?? token.name ?? `#${tokenId}`}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={STATUS_STYLE[token.metadataStatus] ?? ""}>
                  {token.metadataStatus}
                </Badge>
                {token.metadata?.ipType && <Badge variant="outline">{token.metadata.ipType}</Badge>}
              </div>
              <p className="text-xs text-muted-foreground font-mono break-all">{token.tokenUri}</p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing…" : "Force Refresh"}
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <a
                href={`${EXPLORER}/nft/${contract}/${tokenId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Voyager
              </a>
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <a href={`/asset/${contract}/${tokenId}`} target="_blank" rel="noopener noreferrer">
                View on Medialane
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
