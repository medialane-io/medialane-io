import type { Config } from "tailwindcss";
import medialanePreset from "@medialane/ui/preset";
import tailwindcssAnimate from "tailwindcss-animate";

const config = {
  presets: [medialanePreset],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./node_modules/@medialane/ui/dist/**/*.js",
  ],
  plugins: [tailwindcssAnimate],
} satisfies Config;

export default config;
