import { redirect, notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CollectionSlugPage({ params }: Props) {
  const { slug } = await params;

  // RSC — runs server-side; use the server-only API key (no NEXT_PUBLIC_).
  const backendUrl = process.env.NEXT_PUBLIC_MEDIALANE_BACKEND_URL ?? "http://localhost:3001";
  const apiKey = process.env.MEDIALANE_API_KEY ?? "";

  let res: Response;
  try {
    res = await fetch(
      `${backendUrl}/v1/collections/by-slug/${encodeURIComponent(slug.toLowerCase().trim())}`,
      { headers: { "x-api-key": apiKey }, cache: "no-store" }
    );
  } catch {
    notFound();
  }

  if (!res.ok) notFound();

  const body = await res.json();
  const contractAddress = body?.data?.contractAddress;
  if (!contractAddress) notFound();

  redirect(`/collections/${contractAddress}`);
}
