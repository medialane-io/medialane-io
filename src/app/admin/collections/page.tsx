"use client";

import { useState } from "react";
import { useAdminCollections } from "@/hooks/use-claims";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ExternalLink, RefreshCw, Plus } from "lucide-react";

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
  const [registering, setRegistering] = useState(false);

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

  async function handleRegister() {
    if (!registerContract.trim()) return;
    setRegistering(true);
    try {
      const res = await adminFetch("/admin/collections", { method: "POST", body: JSON.stringify({ contractAddress: registerContract.trim(), source: registerSource }) });
      if (!res.ok) throw new Error();
      toast.success("Collection registered");
      setRegisterOpen(false);
      setRegisterContract("");
      await mutate();
    } catch { toast.error("Registration failed"); }
    finally { setRegistering(false); }
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
            <div key={col.id} className="glass rounded-lg p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold truncate">{col.name ?? "Unnamed"}</span>
                  <Badge variant="outline" className={SOURCE_STYLE[col.source]}>{col.source}</Badge>
                  <Badge variant="outline" className={STATUS_STYLE[col.metadataStatus]}>{col.metadataStatus}</Badge>
                </div>
                <p className="text-xs text-muted-foreground font-mono truncate">{col.contractAddress}</p>
                {col.claimedBy && <p className="text-xs text-muted-foreground">Claimed: {col.claimedBy.slice(0, 14)}&hellip;</p>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5">
                  <Switch checked={col.isKnown} onCheckedChange={() => handleIsKnown(col.contractAddress, col.isKnown)} id={`k-${col.id}`} />
                  <Label htmlFor={`k-${col.id}`} className="text-xs cursor-pointer">Featured</Label>
                </div>
                <Button size="icon" variant="ghost" onClick={() => handleRefresh(col.contractAddress)} title="Refresh metadata"><RefreshCw className="h-4 w-4" /></Button>
                <a href={`https://starkscan.co/contract/${col.contractAddress}`} target="_blank" rel="noopener noreferrer">
                  <Button size="icon" variant="ghost"><ExternalLink className="h-4 w-4" /></Button>
                </a>
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
          </div>
          <DialogFooter>
            <Button disabled={registering} onClick={handleRegister}>{registering ? "Registering\u2026" : "Register"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
