import { ImageResponse } from "next/og";
import { fetchTokenMeta, ipfsToHttpServer } from "@/lib/api-server";

export const runtime = "edge";
export const alt = "Medialane IP Asset";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ contract: string; tokenId: string }>;
}) {
  const { contract, tokenId } = await params;
  const token = await fetchTokenMeta(contract, tokenId);

  const name = token?.metadata?.name ?? token?.name ?? `Token #${tokenId}`;
  const description = token?.metadata?.description ?? token?.description ?? "";
  const imageUrl = ipfsToHttpServer(token?.metadata?.image ?? token?.image ?? "");

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "1200px",
          height: "630px",
          background: "linear-gradient(135deg, #0a0a14 0%, #110e2a 60%, #0d0a1a 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Left content panel */}
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
              background: "rgba(155, 114, 255, 0.12)",
              border: "1px solid rgba(155, 114, 255, 0.25)",
              borderRadius: "100px",
              padding: "6px 16px",
              width: "fit-content",
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#9b72ff" }} />
            <span style={{ color: "#c4a6ff", fontSize: 14, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>
              IP Asset · Medialane
            </span>
          </div>

          {/* Title + description */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                color: "white",
                fontSize: name.length > 30 ? 44 : 56,
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-1px",
              }}
            >
              {name.length > 48 ? `${name.slice(0, 48)}…` : name}
            </div>
            {description && (
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 20, lineHeight: 1.5 }}>
                {description.length > 110 ? `${description.slice(0, 110)}…` : description}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#9b72ff" }} />
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 16, letterSpacing: "0.5px" }}>
              medialane.io
            </span>
          </div>
        </div>

        {/* Right image panel */}
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
            {/* Left fade into background */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to right, #0a0a14 0%, transparent 35%)",
              }}
            />
          </div>
        ) : (
          /* Placeholder pattern when no image */
          <div
            style={{
              display: "flex",
              width: "420px",
              height: "630px",
              background: "linear-gradient(135deg, rgba(155,114,255,0.08) 0%, rgba(96,160,255,0.08) 100%)",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <div style={{ color: "rgba(155,114,255,0.2)", fontSize: 80, fontWeight: 900 }}>ML</div>
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
