import { NextRequest, NextResponse } from "next/server";
import { buildAssetMetadata, type BuildAssetMetadataInput } from "@/lib/asset-metadata";
import { getSiwsWallet } from "@/lib/siws-server";
import { limiterFor } from "@/lib/rate-limit-policy";
import { uploadDirectoryToBackend } from "@/lib/backend-metadata";

export const runtime = "nodejs";
export const maxDuration = 60;

type DropItemFields = Omit<BuildAssetMetadataInput, "creator" | "registrationDate">;

export async function POST(req: NextRequest) {
  const creator = getSiwsWallet(req.headers.get("authorization"));
  if (!creator) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!limiterFor("metadata:upload-directory")(creator)) {
    return NextResponse.json({ error: "Too many uploads" }, { status: 429 });
  }

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

  const registrationDate = new Date().toISOString().split("T")[0];

  const files: { name: string; content: unknown }[] = items.map((fields, i) => ({
    name: String(i + 1),
    content: buildAssetMetadata({ ...fields, creator, registrationDate }),
  }));

  files.push({
    name: "collection.json",
    content: {
      name: body?.collection?.name ?? "",
      description: body?.collection?.description ?? "",
      image: body?.collection?.image ?? null,
    },
  });

  try {
    const { cid, baseUri } = await uploadDirectoryToBackend(files);
    return NextResponse.json({ cid, baseUri });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Directory pin failed";
    console.error("[/api/pinata/directory]", err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
