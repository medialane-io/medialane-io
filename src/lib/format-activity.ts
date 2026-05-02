import type { ApiActivity, ApiOrder } from "@medialane/sdk";
import { formatDisplayPrice, ipfsToHttp } from "./utils";

export interface FormattedEvent {
  title: string;
  description: string;
  image: string | null;
  href: string;
}

function short(addr: string): string {
  return addr.length > 10 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

function price(p?: { formatted?: string | null; currency?: string | null } | null): string | null {
  if (!p?.formatted) return null;
  return `${formatDisplayPrice(p.formatted)} ${p.currency}`;
}

export function formatActivity(event: ApiActivity): FormattedEvent {
  const contract = event.nftContract ?? event.contractAddress ?? "";
  const tokenId  = event.nftTokenId ?? event.tokenId ?? "";
  const href     = contract && tokenId ? `/asset/${contract}/${tokenId}` : "/activities";
  const raw      = event.token?.image ?? null;
  const image    = raw ? ipfsToHttp(raw) : null;
  const name     = event.token?.name ?? (tokenId ? `#${tokenId}` : "token");
  const p        = price(event.price);

  const actor =
    event.offerer ??
    event.fulfiller ??
    (event.type === "mint" ? event.to : event.from) ??
    null;
  const actorShort = actor ? short(actor) : null;

  switch (event.type) {
    case "sale":
      return {
        title: `${name} sold`,
        description: p
          ? `${p}${event.to ? ` to ${short(event.to)}` : ""}`
          : "Sale confirmed",
        image, href,
      };
    case "listing":
      return {
        title: `${name} listed`,
        description: p ? `Listed for ${p}` : "New listing",
        image, href,
      };
    case "offer":
      return {
        title: `Offer on ${name}`,
        description: p && actorShort ? `${p} from ${actorShort}` : p ?? "New offer",
        image, href,
      };
    case "mint":
      return {
        title: `${name} minted`,
        description: actorShort ? `By ${actorShort}` : "New mint",
        image, href,
      };
    case "transfer":
      return {
        title: `${name} transferred`,
        description:
          actorShort && event.to
            ? `${actorShort} → ${short(event.to)}`
            : "Token transferred",
        image, href,
      };
    case "cancelled":
      return {
        title: "Listing cancelled",
        description: name,
        image, href,
      };
    default:
      return { title: event.type ?? "Activity", description: name, image, href };
  }
}

export function formatOrderNotification(order: ApiOrder): FormattedEvent {
  const name   = order.token?.name ?? `#${order.consideration.identifier}`;
  const raw    = order.token?.image ?? null;
  const image  = raw ? ipfsToHttp(raw) : null;
  const href   = `/asset/${order.consideration.token}/${order.consideration.identifier}`;
  const p      = price(order.price);
  const from   = short(order.offerer);

  return {
    title: `Offer on ${name}`,
    description: p ? `${p} from ${from}` : `From ${from}`,
    image,
    href,
  };
}
