import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  // The floating dev-tools badge sits over the HUD's weapon slots on phone
  // viewports and swallows taps in e2e runs.
  devIndicators: false,
  reactStrictMode: true,
  transpilePackages: ['@randroids-dojo/vibekit'],
  turbopack: {
    root: process.cwd()
  }
}

export default nextConfig
