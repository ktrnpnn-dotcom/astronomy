import type { NextConfig } from "next";

/**
 * GitHub Pages project sites live at /<repo>.
 * A user site named *.github.io stays at the domain root.
 */
function pagesBasePath(): string {
  if (process.env.BASE_PATH) return process.env.BASE_PATH;
  if (process.env.GITHUB_ACTIONS !== "true") return "";
  const repo = process.env.GITHUB_REPOSITORY?.split("/")[1];
  if (!repo || repo.endsWith(".github.io")) return "";
  return `/${repo}`;
}

const basePath = pagesBasePath();

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: basePath || undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
