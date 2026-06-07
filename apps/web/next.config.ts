import path from "path"
import type { NextConfig } from "next"

// Strip protocol so "https://taskscore.ai" → "taskscore.ai"
const siteHost = process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, "")

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: ["@taskscore/ui"],
  serverExternalPackages: ["@prisma/client", "@taskscore/database"],
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", siteHost].filter(Boolean) as string[],
    },
    outputFileTracingIncludes: {
      "/**": ["../../packages/database/generated/client/**/*.node"],
    },
  },
}

export default nextConfig
