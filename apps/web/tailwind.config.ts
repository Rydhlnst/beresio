import type { Config } from "tailwindcss";
import sharedConfig from "../../packages/ui/tailwind.preset.mjs";

export default {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    presets: [sharedConfig],
} satisfies Config;
