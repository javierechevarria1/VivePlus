const nextConfig = {
  reactStrictMode: false,
  env: {
    LOCAL_DEMO: process.env.LOCAL_DEMO ?? "true",
    NEXT_PUBLIC_LOCAL_DEMO: process.env.NEXT_PUBLIC_LOCAL_DEMO ?? "true",
  },
  images: {
    // Un SVG remoto se sirve como documento y puede llevar <script>: el
    // optimizador lo rechaza y las imagenes de usuario son PNG/JPG/WebP.
    contentDispositionType: "attachment",
    contentSecurityPolicy: "script-src 'none'; frame-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: "https" as const, hostname: "**" },
    ],
  },
};

export default nextConfig;