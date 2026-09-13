import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F1A14",
        paper: "#F3F0E8",
        rest: "#1F6B4A",
        "rest-deep": "#145239",
        "rest-soft": "#CFE6DA",
        caution: "#A85C12",
        "caution-soft": "#F6E4C4",
        danger: "#C0392B",
        "danger-soft": "#F8D7D4",
        haze: "#5F6A64",
        line: "#CFC8B8",
        surface: "#FFFFFF",
        unknown: "#5C6560",
        panel: "#E8E2D6",
      },
      fontFamily: {
        display: [
          "Georgia",
          "Times New Roman",
          "STSong",
          "SimSun",
          "serif",
        ],
        body: [
          "Segoe UI",
          "Microsoft YaHei",
          "PingFang SC",
          "system-ui",
          "sans-serif",
        ],
        mono: ["Cascadia Code", "Consolas", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 0 rgba(15,26,20,0.04), 0 8px 24px rgba(15,26,20,0.08)",
        lift: "0 2px 0 rgba(15,26,20,0.06), 0 16px 40px rgba(15,26,20,0.12)",
        rest: "0 0 0 1px #1F6B4A33, 0 8px 24px #1F6B4A14",
      },
      borderRadius: {
        panel: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
