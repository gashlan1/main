import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every portal page is session-gated and reads the database, so the classic
  // request-time rendering model fits better than Cache Components here.
  serverExternalPackages: ["@react-pdf/renderer", "@libsql/client", "nodemailer"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
