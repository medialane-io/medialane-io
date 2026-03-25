"use client";

import { useState, useEffect, useCallback } from "react";
import { ExternalLink, Flag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDIALANE_BACKEND_URL!;
const API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY!;

type ReportStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "HIDDEN"
  | "DISMISSED"
  | "RESTORED";

interface Report {
  id: string;
  targetType: "COLLECTION" | "TOKEN" | "CREATOR";
  targetKey: string;
  targetContract: string | null;
  targetTokenId: string | null;
  targetAddress: string | null;
  reporterUserId: string;
  categories: string[];
  description: string | null;
  status: ReportStatus;
  adminNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  targetName: string | null;
  targetImage: string | null;
}

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Under Review", value: "UNDER_REVIEW" },
  { label: "Hidden", value: "HIDDEN" },
  { label: "Dismissed", value: "DISMISSED" },
  { label: "All", value: "" },
];

const CATEGORY_LABELS: Record<string, string> = {
  COPYRIGHT_PIRACY: "Copyright / Piracy",
  VIOLENCE_GRAPHIC: "Violence / Graphic",
  HATE_SPEECH: "Hate Speech",
  SCAM_FRAUD: "Scam / Fraud",
  SPAM: "Spam",
  NSFW: "NSFW",
  OTHER: "Other",
};

const HIGH_SEVERITY = new Set(["HATE_SPEECH", "VIOLENCE_GRAPHIC"]);

function targetPageUrl(report: Report): string {
  if (report.targetType === "TOKEN" && report.targetContract && report.targetTokenId) {
    return `/asset/${report.targetContract}/${report.targetTokenId}`;
  }
  if (report.targetType === "COLLECTION" && report.targetContract) {
    return `/collection/${report.targetContract}`;
  }
  if (report.targetType === "CREATOR" && report.targetAddress) {
    return `/creator/${report.targetAddress}`;
  }
  return "#";
}

export default function ReportsPage() {
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [acting, setActing] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`${BACKEND_URL}/admin/reports?${params}`, {
        headers: { "x-api-key": API_KEY },
      });
      const data = await res.json();
      setReports(data.reports ?? []);
      setTotal(data.total ?? 0);
    } catch {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleAction = async (newStatus: ReportStatus) => {
    if (!selected) return;
    if (
      (newStatus === "HIDDEN" || newStatus === "DISMISSED") &&
      !adminNotes.trim()
    ) {
      toast.error("Admin notes are required for this action");
      return;
    }
    setActing(true);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/reports/${selected.id}`, {
        method: "PATCH",
        headers: {
          "x-api-key": API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: adminNotes.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Report marked as ${newStatus.toLowerCase().replace("_", " ")}`);
      setSelected(null);
      setAdminNotes("");
      fetchReports();
    } catch {
      toast.error("Action failed. Please try again.");
    } finally {
      setActing(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Flag className="w-5 h-5" />
        <h1 className="text-xl font-semibold">Community Reports</h1>
        <span className="text-sm text-muted-foreground ml-auto">{total} total</span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 border-b border-border pb-3">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`text-sm px-3 py-1 rounded-md transition-colors ${
              statusFilter === tab.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reports list */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : reports.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reports found.</p>
      ) : (
        <div className="space-y-2">
          {reports.map((report) => (
            <div
              key={report.id}
              className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
              onClick={() => {
                setSelected(report);
                setAdminNotes(report.adminNotes ?? "");
              }}
            >
              {report.targetImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={report.targetImage}
                  alt=""
                  className="w-10 h-10 rounded object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {report.targetName ?? report.targetKey}
                </p>
                <p className="text-xs text-muted-foreground">
                  {report.targetType} ·{" "}
                  {new Date(report.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                {report.categories.map((cat) => (
                  <Badge
                    key={cat}
                    variant={HIGH_SEVERITY.has(cat) ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {CATEGORY_LABELS[cat] ?? cat}
                  </Badge>
                ))}
              </div>
              <Badge variant="outline" className="shrink-0 text-xs">
                {report.status}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Review dialog */}
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            setAdminNotes("");
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Review Report
              {selected && (
                <a
                  href={targetPageUrl(selected)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </a>
              )}
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              {/* Target preview */}
              <div className="flex items-center gap-3">
                {selected.targetImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selected.targetImage}
                    alt=""
                    className="w-12 h-12 rounded object-cover"
                  />
                )}
                <div>
                  <p className="font-medium text-sm">
                    {selected.targetName ?? selected.targetKey}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selected.targetType}
                  </p>
                </div>
              </div>

              {/* Categories */}
              <div className="flex flex-wrap gap-1">
                {selected.categories.map((cat) => (
                  <Badge
                    key={cat}
                    variant={HIGH_SEVERITY.has(cat) ? "destructive" : "secondary"}
                  >
                    {CATEGORY_LABELS[cat] ?? cat}
                  </Badge>
                ))}
              </div>

              {/* Reporter description */}
              {selected.description && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Reporter note
                  </Label>
                  <p className="text-sm bg-muted rounded p-3">
                    {selected.description}
                  </p>
                </div>
              )}

              {/* Admin notes */}
              <div className="space-y-1">
                <Label htmlFor="admin-notes" className="text-sm font-medium">
                  Admin notes{" "}
                  <span className="text-muted-foreground font-normal">
                    (required for Hide / Dismiss)
                  </span>
                </Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal note about this decision..."
                  className="resize-none h-20"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Current status: <strong>{selected.status}</strong>
              </p>
            </div>
          )}

          <DialogFooter className="flex-wrap gap-2">
            {selected?.status !== "UNDER_REVIEW" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction("UNDER_REVIEW")}
                disabled={acting}
              >
                Mark Under Review
              </Button>
            )}
            {selected?.status !== "DISMISSED" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAction("DISMISSED")}
                disabled={acting}
              >
                Dismiss
              </Button>
            )}
            {selected?.status === "HIDDEN" ? (
              <Button
                variant="outline"
                size="sm"
                className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                onClick={() => handleAction("RESTORED")}
                disabled={acting}
              >
                Restore Visibility
              </Button>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleAction("HIDDEN")}
                disabled={acting}
              >
                Hide from Platform
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
