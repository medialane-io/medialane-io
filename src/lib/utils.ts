import { createImageResolver, PINATA_PUBLIC_GATEWAY } from "@medialane/ui";
import { IPFS_GATEWAY } from "./constants";

export const resolveImage = createImageResolver({ gateway: IPFS_GATEWAY ?? PINATA_PUBLIC_GATEWAY, proxyPath: "/api/img" });
