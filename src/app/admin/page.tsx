const BACKEND_URL = process.env.MEDIALANE_BACKEND_URL || "";
const ADMIN_KEY = process.env.ADMIN_API_KEY || "";
const TENANT_KEY = process.env.MEDIALANE_API_KEY || "";

async function safeJson<T>(url: string, init: RequestInit, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

async function getStats() {
  const h = { "x-api-key": ADMIN_KEY };
  type HealthResponse = {
    indexer?: { lastBlock?: number | string; lagBlocks?: number | null };
    database?: string;
  };
  const [p, c, f, uc, cr, health] = await Promise.all([
    safeJson(`${BACKEND_URL}/admin/claims?status=PENDING&limit=1`, { headers: h, cache: "no-store" }, { total: 0 }),
    safeJson(`${BACKEND_URL}/admin/collections?limit=1`, { headers: h, cache: "no-store" }, { total: 0 }),
    safeJson(`${BACKEND_URL}/admin/collections?metadataStatus=FAILED&limit=1`, { headers: h, cache: "no-store" }, { total: 0 }),
    safeJson(`${BACKEND_URL}/admin/username-claims?status=PENDING&limit=1`, { headers: h, cache: "no-store" }, { total: 0 }),
    safeJson(`${BACKEND_URL}/v1/creators?limit=1`, { headers: { "x-api-key": TENANT_KEY }, cache: "no-store" }, { total: 0 }),
    safeJson<HealthResponse>(`${BACKEND_URL}/health`, { cache: "no-store" }, { indexer: {}, database: "—" }),
  ]);
  return {
    pendingClaims: p.total ?? 0,
    totalCollections: c.total ?? 0,
    failedMetadata: f.total ?? 0,
    pendingUsernameClaims: uc.total ?? 0,
    totalCreators: cr.total ?? 0,
    indexer: {
      lastBlock: health.indexer?.lastBlock ?? "—",
      lagBlocks: typeof health.indexer?.lagBlocks === "number" ? health.indexer.lagBlocks : null,
      database: health.database ?? "—",
    },
  };
}

export default async function AdminDashboardPage() {
  if (!BACKEND_URL || !ADMIN_KEY || !TENANT_KEY) {
    return (
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Admin configuration missing</h2>
        <p className="text-sm text-muted-foreground">
          Set `MEDIALANE_BACKEND_URL`, `ADMIN_API_KEY`, and `MEDIALANE_API_KEY` on the server.
        </p>
      </div>
    );
  }

  const stats = await getStats();
  const lag = stats.indexer.lagBlocks;
  const lagNumeric = typeof lag === "number" && Number.isFinite(lag);
  const lagColorClass = !lagNumeric
    ? "text-muted-foreground"
    : lag > 50
      ? "text-destructive"
      : lag > 20
        ? "text-yellow-500"
        : "text-green-500";

  const cards = [
    { label: "Pending Claims",    value: stats.pendingClaims,         href: "/admin/claims" },
    { label: "Total Collections", value: stats.totalCollections,      href: "/admin/collections" },
    { label: "Failed Metadata",   value: stats.failedMetadata,        href: "/admin/collections?metadataStatus=FAILED" },
    { label: "Pending Usernames", value: stats.pendingUsernameClaims, href: "/admin/claims" },
    { label: "Total Creators",    value: stats.totalCreators,         href: "/admin/creators" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {cards.map((card) => (
          <a key={card.label} href={card.href} className="glass rounded-xl p-6 hover:bg-white/5 transition-colors">
            <p className="text-3xl font-bold">{card.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
          </a>
        ))}
      </div>

      {/* Indexer health row */}
      <div className="glass rounded-xl p-4 flex flex-wrap gap-6 text-sm">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">Indexer</p>
          <p className="font-mono font-semibold">Block {stats.indexer.lastBlock}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">Lag</p>
          <p className={`font-semibold ${lagColorClass}`}>
            {lagNumeric ? `${lag} blocks` : "—"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">Database</p>
          <p className={`font-semibold ${stats.indexer.database === "ok" ? "text-green-500" : "text-destructive"}`}>
            {stats.indexer.database}
          </p>
        </div>
      </div>
    </div>
  );
}
