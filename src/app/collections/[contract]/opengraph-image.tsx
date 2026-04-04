import { ImageResponse } from "next/og";
import { fetchCollectionMeta, ipfsToHttpServer } from "@/lib/api-server";

export const runtime = "edge";
export const alt = "Medialane Collection";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ contract: string }>;
}) {
  const { contract } = await params;
  const col = await fetchCollectionMeta(contract);

  const name = col?.name ?? "Collection";
  const description = col?.description ?? "";
  const supply = col?.totalSupply ?? 0;
  const imageUrl = ipfsToHttpServer(col?.image ?? "");

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "1200px",
          height: "630px",
          background: "linear-gradient(135deg, #0a0a14 0%, #0e1128 60%, #0a0d1a 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Left content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            padding: "52px 48px",
          }}
        >
          {/* Brand pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(96, 160, 255, 0.12)",
              border: "1px solid rgba(96, 160, 255, 0.25)",
              borderRadius: "100px",
              padding: "6px 16px",
              width: "fit-content",
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#60a0ff" }} />
            <span style={{ color: "#a6c8ff", fontSize: 14, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>
              Collection · Medialane
            </span>
          </div>

          {/* Title + meta */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                color: "white",
                fontSize: name.length > 28 ? 46 : 58,
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-1px",
              }}
            >
              {name.length > 46 ? `${name.slice(0, 46)}…` : name}
            </div>
            {description && (
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 20, lineHeight: 1.5 }}>
                {description.length > 110 ? `${description.slice(0, 110)}…` : description}
              </div>
            )}
            {supply > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#60a0ff",
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#60a0ff" }} />
                {supply.toLocaleString()} items
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#60a0ff" }} />
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 16 }}>medialane.io</span>
          </div>
        </div>

        {/* Right image */}
        {imageUrl ? (
          <div
            style={{
              display: "flex",
              width: "420px",
              height: "630px",
              position: "relative",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={name}
              width={420}
              height={630}
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to right, #0a0a14 0%, transparent 35%)",
              }}
            />
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              width: "420px",
              height: "630px",
              background: "linear-gradient(135deg, rgba(96,160,255,0.08) 0%, rgba(155,114,255,0.08) 100%)",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <div style={{ color: "rgba(96,160,255,0.2)", fontSize: 80, fontWeight: 900 }}>ML</div>
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
