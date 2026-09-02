import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '*.momentum.test',
    'momentum.test',
    'admin.momentum.test',
    'moh.momentum.test',
    'mof.momentum.test',
    'moi.momentum.test',
    'moe.momentum.test',
  ],
  async rewrites() {
    return [
      {
        source: '/sanctum/:path*',
        destination: 'http://api.momentum.test/sanctum/:path*',
      },
      {
        source: '/v1/:path*',
        destination: 'http://api.momentum.test/v1/:path*',
      },
    ];
  },
};

export default withNextIntl(nextConfig);
