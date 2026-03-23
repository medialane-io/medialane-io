"use client";

import { useState } from "react";
import { useAdminCollections } from "@/hooks/use-claims";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ExternalLink, RefreshCw, Plus, Download, EyeOff, Eye, Trash2 } from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDIALANE_BACKEND_URL!;
// Must match API_SECRET_KEY on the backend — set NEXT_PUBLIC_ADMIN_API_KEY in .env.local and Railway
const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY!;

const SOURCE_STYLE: Record<string, string> = {
  MEDIALANE_REGISTRY: "bg-blue-500/20 text-blue-400",
  EXTERNAL: "bg-gray-500/20 text-gray-400",
  PARTNERSHIP: "bg-purple-500/20 text-purple-400",
  GAME: "bg-green-500/20 text-green-400",
  IP_TICKET: "bg-orange-500/20 text-orange-400",
  IP_CLUB: "bg-pink-500/20 text-pink-400",
};
const STATUS_STYLE: Record<string, string> = {
  FETCHED: "bg-green-500/20 text-green-400",
  PENDING: "bg-yellow-500/20 text-yellow-400",
  FETCHING: "bg-blue-500/20 text-blue-400",
  FAILED: "bg-red-500/20 text-red-400",
};
const SOURCES = ["EXTERNAL", "PARTNERSHIP", "GAME", "IP_TICKET", "IP_CLUB", "MEDIALANE_REGISTRY"];

export default function AdminCollectionsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { collections, total, isLoading, mutate } = useAdminCollections({ search: debouncedSearch });
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerContract, setRegisterContract] = useState("");
  const [registerSource, setRegisterSource] = useState("EXTERNAL");
  const [registerStartBlock, setRegisterStartBlock] = useState("");
  const [registering, setRegistering] = useState(false);

  const [backfillOpen, setBackfillOpen] = useState(false);
  const [backfillContract, setBackfillContract] = useState("");
  const [backfillFromBlock, setBackfillFromBlock] = useState("");
  const [backfilling, setBackfilling] = useState(false);

  function onSearch(val: string) {
    setSearch(val);
    clearTimeout((globalThis as any)._searchTimer);
    (globalThis as any)._searchTimer = setTimeout(() => setDebouncedSearch(val), 400);
  }

  async function adminFetch(path: string, opts: RequestInit = {}) {
    return fetch(`${BACKEND_URL}${path}`, {
      ...opts,
      headers: { "x-api-key": ADMIN_KEY, "Content-Type": "application/json", ...opts.headers },
    });
  }

  async function handleRefresh(contractAddress: string) {
    try {
      await adminFetch(`/admin/collections/${contractAddress}/refresh`, { method: "POST" });
      toast.success("Metadata refresh queued");
    } catch { toast.error("Refresh failed"); }
  }

  async function handleIsKnown(contractAddress: string, current: boolean) {
    try {
      await adminFetch(`/admin/collections/${contractAddress}`, { method: "PATCH", body: JSON.stringify({ isKnown: !current }) });
      await mutate();
    } catch { toast.error("Failed to update"); }
  }

  async function handleIsHidden(contractAddress: string, current: boolean) {
    try {
      await adminFetch(`/admin/collections/${contractAddress}`, { method: "PATCH", body: JSON.stringify({ isHidden: !current }) });
      toast.success(!current ? "Collection hidden from platform" : "Collection visible on platform");
      await mutate();
    } catch { toast.error("Failed to update"); }
  }

  async function handleDelete(contractAddress: string, name: string) {
    if (!confirm(`Permanently delete "${name}" and all its tokens and transfers? This cannot be undone.`)) return;
    try {
      const res = await adminFetch(`/admin/collections/${contractAddress}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as any).error ?? "Failed");
      const { transfers, tokens } = (json as any).data?.deleted ?? {};
      toast.success(`Deleted — ${tokens?.count ?? 0} tokens, ${transfers?.count ?? 0} transfers removed`);
      await mutate();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function handleRegister() {
    if (!registerContract.trim()) return;
    setRegistering(true);
    try {
      const body: Record<string, unknown> = { contractAddress: registerContract.trim(), source: registerSource };
      if (registerStartBlock.trim()) body.startBlock = parseInt(registerStartBlock.trim(), 10);
      const res = await adminFetch("/admin/collections", { method: "POST", body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
      toast.success("Collection registered");
      setRegisterOpen(false);
      setRegisterContract("");
      setRegisterStartBlock("");
      await mutate();
    } catch { toast.error("Registration failed"); }
    finally { setRegistering(false); }
  }

  function openBackfill(contractAddress: string) {
    setBackfillContract(contractAddress);
    setBackfillFromBlock("");
    setBackfillOpen(true);
  }

  async function handleBackfillTransfers() {
    if (!backfillContract) return;
    setBackfilling(true);
    try {
      const body: Record<string, unknown> = {};
      if (backfillFromBlock.trim()) body.fromBlock = parseInt(backfillFromBlock.trim(), 10);
      const res = await adminFetch(`/admin/collections/${backfillContract}/backfill-transfers`, { method: "POST", body: JSON.stringify(body) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as any).error ?? "Failed");
      const { inserted, skipped, metadataJobsEnqueued } = (json as any).data ?? {};
      toast.success(`Backfill complete — ${inserted} inserted, ${skipped} skipped, ${metadataJobsEnqueued} metadata jobs queued`);
      setBackfillOpen(false);
      await mutate();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Backfill failed");
    } finally { setBackfilling(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 justify-between">
        <Input className="max-w-sm" placeholder="Search by name or address&hellip;" value={search} onChange={(e) => onSearch(e.target.value)} />
        <Button onClick={() => setRegisterOpen(true)}><Plus className="mr-2 h-4 w-4" />Register</Button>
      </div>

      <p className="text-sm text-muted-foreground">{total} collections</p>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading&hellip;</p> : (
        <div className="space-y-2">
          {collections.map((col: any) => (
            <div key={col.id} className={`glass rounded-lg p-4 flex items-center gap-4 ${col.isHidden ? "opacity-50" : ""}`}>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold truncate">{col.name ?? "Unnamed"}</span>
                  <Badge variant="outline" className={SOURCE_STYLE[col.source]}>{col.source}</Badge>
                  <Badge variant="outline" className={STATUS_STYLE[col.metadataStatus]}>{col.metadataStatus}</Badge>
                  {col.isHidden && <Badge variant="outline" className="bg-destructive/20 text-destructive">Hidden</Badge>}
                </div>
                <p className="text-xs text-muted-foreground font-mono truncate">{col.contractAddress}</p>
                {col.claimedBy && <p className="text-xs text-muted-foreground">Claimed: {col.claimedBy.slice(0, 14)}&hellip;</p>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5">
                  <Switch checked={col.isKnown} onCheckedChange={() => handleIsKnown(col.contractAddress, col.isKnown)} id={`k-${col.id}`} />
                  <Label htmlFor={`k-${col.id}`} className="text-xs cursor-pointer">Featured</Label>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleIsHidden(col.contractAddress, col.isHidden)}
                  title={col.isHidden ? "Show on platform" : "Hide from platform"}
                  className={col.isHidden ? "text-destructive hover:text-destructive" : ""}
                >
                  {col.isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="ghost" onClick={() => openBackfill(col.contractAddress)} title="Backfill transfers"><Download className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => handleRefresh(col.contractAddress)} title="Refresh metadata"><RefreshCw className="h-4 w-4" /></Button>
                <a href={`https://voyager.online/contract/${col.contractAddress}`} target="_blank" rel="noopener noreferrer">
                  <Button size="icon" variant="ghost"><ExternalLink className="h-4 w-4" /></Button>
                </a>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(col.contractAddress, col.name ?? "Unnamed")} title="Delete collection" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Register Collection</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Contract Address</Label>
              <Input placeholder="0x&hellip;" value={registerContract} onChange={(e) => setRegisterContract(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={registerSource} onValueChange={setRegisterSource}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Block <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                type="number"
                placeholder="e.g. 7488087"
                value={registerStartBlock}
                onChange={(e) => setRegisterStartBlock(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Block where this collection was deployed. Required if the collection was minted before registration — used by the indexer to find past Transfer events.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button disabled={registering} onClick={handleRegister}>{registering ? "Registering\u2026" : "Register"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={backfillOpen} onOpenChange={setBackfillOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Backfill Transfers</DialogTitle>
            <DialogDescription className="font-mono text-xs break-all">{backfillContract}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Scans historical Transfer events onchain and creates Token records for any tokens missed by the indexer. Use when a collection was registered after its mints already happened.
            </p>
            <div className="space-y-2">
              <Label>From Block <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                type="number"
                placeholder="e.g. 7488087 (defaults to block 0)"
                value={backfillFromBlock}
                onChange={(e) => setBackfillFromBlock(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Start scanning from this block. Set to the collection deployment block to avoid scanning the entire chain.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBackfillOpen(false)}>Cancel</Button>
            <Button disabled={backfilling} onClick={handleBackfillTransfers}>
              {backfilling ? "Backfilling\u2026" : "Backfill Transfers"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
