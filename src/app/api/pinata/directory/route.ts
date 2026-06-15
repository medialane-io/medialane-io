import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { buildAssetMetadata, type BuildAssetMetadataInput } from "@/lib/asset-metadata";

export const runtime = "nodejs";
export const maxDuration = 60;

// One item's authoring fields (license/IP fields mirror the single-asset /api/pinata route).
// `creator` and `registrationDate` are injected server-side, never trusted from the client.
type DropItemFields = Omit<BuildAssetMetadataInput, "creator" | "registrationDate">;

// Pins an ordered array of per-token metadata as a single IPFS directory:
// items[0] → file "1", items[1] → file "2", … so callers set
//   base_uri = ipfs://<folderCID>/   →   token_uri(N) = ipfs://<folderCID>/N
// Each item is encoded with buildAssetMetadata — byte-identical to a normal IP asset
// (OpenSea + Berne license attributes), so every drop token is a first-class asset.
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    items?: DropItemFields[];
    collection?: { name?: string; description?: string; image?: string | null };
  } | null;
  const items = body?.items;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "items[] required" }, { status: 400 });
  }
  if (body?.collection?.image && !body.collection.image.startsWith("ipfs://")) {
    return NextResponse.json({ error: "collection.image must be an ipfs:// URI" }, { status: 400 });
  }
  if (items.length > 2000) {
    return NextResponse.json({ error: "Max 2000 items per drop" }, { status: 400 });
  }
  for (const it of items) {
    if (!it?.name?.trim()) return NextResponse.json({ error: "Every item needs a name" }, { status: 400 });
    if (it.imageUri && !it.imageUri.startsWith("ipfs://")) {
      return NextResponse.json({ error: "imageUri must be an ipfs:// URI" }, { status: 400 });
    }
  }

  const jwt = process.env.PINATA_JWT;
  if (!jwt) return NextResponse.json({ error: "Pinata not configured" }, { status: 500 });

  // Derive creator wallet server-side from Clerk — never trust a client value.
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  const creator = (clerkUser.publicMetadata?.publicKey as string | undefined) ?? null;
  const registrationDate = new Date().toISOString().split("T")[0]; // one stamp for the whole set

  // Build one metadata JSON per item and append it at the directory root as its 1-indexed tokenId.
  const form = new FormData();
  items.forEach((fields, i) => {
    const tokenId = i + 1; // contract mints sequentially from token id 1
    const metadata = buildAssetMetadata({ ...fields, creator, registrationDate });
    const blob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
    form.append("file", blob, String(tokenId));
  });

  // Collection-level metadata (card image/name/description) lives alongside the token files
  // as `collection.json`. The backend resolves the drop card from <baseUri>collection.json.
  // It never collides with the integer tokenId files.
  const collection = {
    name: body?.collection?.name ?? "",
    description: body?.collection?.description ?? "",
    image: body?.collection?.image ?? null,
  };
  form.append("file", new Blob([JSON.stringify(collection)], { type: "application/json" }), "collection.json");

  form.append("pinataOptions", JSON.stringify({ wrapWithDirectory: true }));
  form.append("pinataMetadata", JSON.stringify({ name: `drop-metadata-${Date.now()}` }));

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: `Pinata error: ${text}` }, { status: 502 });
  }
  const json = (await res.json()) as { IpfsHash: string };
  return NextResponse.json({ cid: json.IpfsHash, baseUri: `ipfs://${json.IpfsHash}/` });
}
