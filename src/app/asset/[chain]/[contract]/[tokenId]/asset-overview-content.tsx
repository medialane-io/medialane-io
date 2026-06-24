// Use io's local copy (string-safe attribute rendering) instead of the shared
// @medialane/ui one, which crashes on numeric attribute values (`v.trim()`).
// The edition (ERC-1155) page renders through this shim; the standard page
// already imports the local copy directly.
export { AssetOverviewContent } from "@/components/asset/asset-overview-content";
