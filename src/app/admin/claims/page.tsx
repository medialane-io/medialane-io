"use client";

import { useState } from "react";
import { useAdminClaims } from "@/hooks/use-claims";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDIALANE_BACKEND_URL!;
// Must match API_SECRET_KEY on the backend — set NEXT_PUBLIC_ADMIN_API_KEY in .env.local and Railway
const API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY!;

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  AUTO_APPROVED: "bg-green-500/20 text-green-400 border-green-500/30",
  APPROVED: "bg-green-500/20 text-green-400 border-green-500/30",
  REJECTED: "bg-red-500/20 text-red-400 border-red-500/30",
};
const METHOD_STYLE: Record<string, string> = {
  ONCHAIN: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  SIGNATURE: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  MANUAL: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};
const SOURCES = ["EXTERNAL", "PARTNERSHIP", "GAME", "IP_TICKET", "IP_CLUB", "MEDIALANE_REGISTRY"];

export default function AdminClaimsPage() {
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const { claims, total, isLoading, mutate } = useAdminClaims(statusFilter || undefined);
  const [selected, setSelected] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [source, setSource] = useState("EXTERNAL");
  const [processing, setProcessing] = useState(false);

  async function handleAction(status: "APPROVED" | "REJECTED") {
    setProcessing(true);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/claims/${selected.id}`, {
        method: "PATCH",
        headers: { "x-api-key": API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes, ...(status === "APPROVED" ? { source } : {}) }),
      });
      if (!res.ok) throw new Error();
      toast.success(status === "APPROVED" ? "Claim approved" : "Claim rejected");
      setSelected(null);
      await mutate();
    } catch { toast.error("Action failed"); }
    finally { setProcessing(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Claims ({total})</h2>
        <div className="flex gap-2">
          {["", "PENDING", "APPROVED", "REJECTED"].map((s) => (
            <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)}>
              {s || "All"}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? <p className="text-muted-foreground text-sm">Loading&hellip;</p> : (
        <div className="space-y-2">
          {claims.map((claim: any) => (
            <div key={claim.id} className="glass rounded-lg p-4 flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm truncate max-w-xs">{claim.contractAddress}</span>
                  <Badge variant="outline" className={STATUS_STYLE[claim.status]}>{claim.status}</Badge>
                  <Badge variant="outline" className={METHOD_STYLE[claim.verificationMethod]}>{claim.verificationMethod}</Badge>
                </div>
                {claim.claimantAddress && <p className="text-xs text-muted-foreground font-mono">{claim.claimantAddress.slice(0, 16)}&hellip;</p>}
                {claim.claimantEmail && <p className="text-xs text-muted-foreground">{claim.claimantEmail}</p>}
                {claim.notes && <p className="text-xs text-foreground/60 italic">&ldquo;{claim.notes}&rdquo;</p>}
                <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(claim.createdAt), { addSuffix: true })}</p>
              </div>
              {claim.status === "PENDING" && (
                <Button size="sm" variant="outline" onClick={() => { setSelected(claim); setAdminNotes(""); setSource("EXTERNAL"); }}>Review</Button>
              )}
            </div>
          ))}
          {claims.length === 0 && <p className="text-sm text-muted-foreground">No claims found.</p>}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Review Claim</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <p className="font-mono break-all">{selected?.contractAddress}</p>
            {selected?.claimantEmail && <p className="text-muted-foreground">{selected.claimantEmail}</p>}
            {selected?.notes && <p className="italic text-foreground/70">&ldquo;{selected.notes}&rdquo;</p>}
            <div className="space-y-1">
              <p className="font-medium text-xs uppercase text-muted-foreground">Source (on approve)</p>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Textarea placeholder="Admin notes (optional)&hellip;" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={2} />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="destructive" disabled={processing} onClick={() => handleAction("REJECTED")}>Reject</Button>
            <Button disabled={processing} onClick={() => handleAction("APPROVED")}>Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
