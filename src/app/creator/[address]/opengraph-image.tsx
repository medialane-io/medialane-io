import { ImageResponse } from "next/og";
import { fetchCreatorProfile, ipfsToHttpServer } from "@/lib/api-server";

export const runtime = "edge";
export const alt = "Medialane Creator";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;

  // Only fetch profile for username slugs — wallet addresses redirect to /account
  const isWallet = address.startsWith("0x") || address.startsWith("0X");
  const profile = isWallet ? null : await fetchCreatorProfile(address);

  const displayName = profile?.displayName ?? profile?.username ?? `@${address}`;
  const bio = profile?.bio ?? "";
  const avatarUrl = ipfsToHttpServer(profile?.avatarImage ?? "");
  const bannerUrl = ipfsToHttpServer(profile?.bannerImage ?? "");
  const bgUrl = bannerUrl || avatarUrl;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "1200px",
          height: "630px",
          background: "linear-gradient(135deg, #0d0a1a 0%, #14102a 60%, #0a0d1a 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Background banner (blurred) */}
        {bgUrl && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bgUrl}
              alt=""
              width={1200}
              height={630}
              style={{ objectFit: "cover", width: "100%", height: "100%", opacity: 0.15 }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(135deg, rgba(13,10,26,0.95) 0%, rgba(13,10,26,0.7) 100%)",
              }}
            />
          </div>
        )}

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            padding: "52px 48px",
            position: "relative",
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
              Creator · Medialane
            </span>
          </div>

          {/* Avatar + name row */}
          <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            {avatarUrl ? (
              <div
                style={{
                  display: "flex",
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "3px solid rgba(155,114,255,0.4)",
                  flexShrink: 0,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarUrl}
                  alt={displayName}
                  width={120}
                  height={120}
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                />
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #9b72ff 0%, #60a0ff 100%)",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span style={{ color: "white", fontSize: 44, fontWeight: 800 }}>
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div
                style={{
                  color: "white",
                  fontSize: displayName.length > 24 ? 44 : 56,
                  fontWeight: 800,
                  lineHeight: 1.1,
                  letterSpacing: "-0.5px",
                }}
              >
                {displayName.length > 32 ? `${displayName.slice(0, 32)}…` : displayName}
              </div>
              {bio && (
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 20, lineHeight: 1.4 }}>
                  {bio.length > 100 ? `${bio.slice(0, 100)}…` : bio}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#9b72ff" }} />
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 16 }}>medialane.io</span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
