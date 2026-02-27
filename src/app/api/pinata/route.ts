import { NextRequest, NextResponse } from "next/server";
import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud",
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const ipType = formData.get("ipType") as string | null;
    const licenseType = formData.get("licenseType") as string | null;
    const edition = formData.get("edition") as string | null;
    const externalUrl = (formData.get("external_url") as string | null) ?? "https://medialane.io";
    const imageFile = formData.get("file") as File | null;

    let imageUri: string | null = null;

    // Upload image if provided
    if (imageFile) {
      const imageUpload = await pinata.upload.public.file(imageFile);
      imageUri = `ipfs://${imageUpload.cid}`;
    }

    // Build and upload metadata JSON (ERC-721 / OpenSea standard)
    const metadata = {
      name,
      description: description || "",
      image: imageUri,
      external_url: externalUrl,
      attributes: [
        { trait_type: "Platform", value: "Medialane" },
        { trait_type: "Network", value: "Starknet Mainnet" },
        ...(ipType ? [{ trait_type: "IP Type", value: ipType }] : []),
        ...(licenseType ? [{ trait_type: "License", value: licenseType }] : []),
        ...(edition ? [{ trait_type: "Edition", value: edition }] : []),
      ],
    };

    const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
    const metadataFile = new File([metadataBlob], "metadata.json", { type: "application/json" });
    const metadataUpload = await pinata.upload.public.file(metadataFile);

    return NextResponse.json({
      uri: `ipfs://${metadataUpload.cid}`,
      imageUri,
      cid: metadataUpload.cid,
    });
  } catch (err: any) {
    console.error("[/api/pinata]", err);
    return NextResponse.json({ error: err?.message || "Upload failed" }, { status: 500 });
  }
}
