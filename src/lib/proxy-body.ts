/**
 * Read an upstream `fetch` Response body into memory with a hard byte cap.
 *
 * `arrayBuffer()` buffers the whole body before any limit applies, so a public
 * proxy route (image, IPFS) can be made to pin server memory by pointing it at
 * a large file. This streams the body and aborts once `maxBytes` is crossed.
 * A `Content-Length` larger than the cap short-circuits before a byte is read
 * (advisory — some origins omit or lie, so the streaming guard is the real
 * limit). Shared by `/api/img` and `/api/ipfs` so the cap can't drift between
 * the two routes.
 */
export type CappedBody =
  | { ok: true; body: Uint8Array<ArrayBuffer> }
  | { ok: false; status: 413 | 502; error: string };

export async function readBodyWithCap(upstream: Response, maxBytes: number): Promise<CappedBody> {
  const declaredLength = upstream.headers.get("content-length");
  if (declaredLength) {
    const n = Number.parseInt(declaredLength, 10);
    if (Number.isFinite(n) && n > maxBytes) {
      return { ok: false, status: 413, error: `Response exceeds size cap (${maxBytes} bytes)` };
    }
  }

  if (!upstream.body) {
    return { ok: false, status: 502, error: "Upstream returned no body" };
  }

  const reader = upstream.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return { ok: false, status: 413, error: `Response exceeds size cap (${maxBytes} bytes)` };
    }
    chunks.push(value);
  }

  const body = new Uint8Array(total) as Uint8Array<ArrayBuffer>;
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, body };
}
