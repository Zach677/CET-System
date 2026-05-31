export const webAppManifest = {
  name: "CET 备考工作台",
  short_name: "CET 工作台",
  description: "给四六级备考用的极简工作台。",
  start_url: "/",
  scope: "/",
  lang: "zh-CN",
  display: "standalone",
  theme_color: "#010102",
  background_color: "#010102",
  icons: [
    {
      src: "/icon.svg",
      sizes: "any",
      type: "image/svg+xml",
    },
    {
      src: "/icon-maskable.svg",
      sizes: "any",
      type: "image/svg+xml",
      purpose: "maskable",
    },
  ],
} as const;
