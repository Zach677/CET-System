export function loader() {
  return Response.json(
    {
      name: "CET 备考工作台",
      short_name: "CET 工作台",
      description: "给四六级备考用的极简工作台。",
      theme_color: "#f5f5f2",
      background_color: "#f5f5f2",
      display: "standalone",
      start_url: "/",
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
    },
    {
      headers: {
        "Content-Type": "application/manifest+json",
      },
    },
  );
}
