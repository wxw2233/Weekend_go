import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async redirects() {
    return [
      // 双休go 板块迁移到 /sx 前缀；旧链接 301 保 SEO。
      { source: "/companies", destination: "/sx", permanent: true },
      { source: "/companies/:id", destination: "/sx/companies/:id", permanent: true },
      { source: "/claim", destination: "/sx/claim", permanent: true },
      { source: "/submit", destination: "/sx/submit", permanent: true },
    ];
  },
};

export default nextConfig;
