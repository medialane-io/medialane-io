import { LaunchMint } from "@/components/launch-mint";
import { DiscoverPage } from "@/components/discover";

// Flip to DiscoverPage automatically on launch date
const LAUNCH_DATE = new Date("2026-03-14T00:00:00Z");
const isLaunched = new Date() >= LAUNCH_DATE;

export default function HomePage() {
  return isLaunched ? <DiscoverPage /> : <LaunchMint />;
}
