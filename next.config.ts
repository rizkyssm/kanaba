import type { NextConfig } from 'next';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

const csp = [
  "default-src 'self'",
  `connect-src 'self' ${SUPABASE_URL} wss://*.supabase.co https://*.supabase.co`,
  `img-src 'self' data: blob: ${SUPABASE_URL}`,
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",   // Next.js dev/prod butuh eval untuk runtime; tighten bertahap
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
        ],
      },
    ];
  },
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;