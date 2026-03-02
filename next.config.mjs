/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === 'development';

const nextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wtehqbptexuonyseoqsp.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'apipie.ai',
        port: '',
        pathname: '/temp/**',
      },
      {
        protocol: 'https',
        hostname: '*.blob.core.windows.net',
      },
      {
        protocol: 'https',
        hostname: '*.openai.com',
      },
    ],
  },
  // Fix cross-origin warnings in development
  allowedDevOrigins: ["192.168.1.197"],
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
};

// Only wrap with Sentry in production builds.
// @sentry/nextjs MUST NOT be imported in dev — it injects webpack hooks
// that are incompatible with Turbopack and break middleware resolution.
let exportedConfig = nextConfig;

if (!isDev) {
  const { withSentryConfig } = await import('@sentry/nextjs');
  exportedConfig = withSentryConfig(nextConfig, {
    org: "jfsb-solutions",
    project: "javascript-nextjs",
    silent: !process.env.CI,
    widenClientFileUpload: true,
    tunnelRoute: "/monitoring",
    webpack: {
      automaticVercelMonitors: true,
      treeshake: {
        removeDebugLogging: true,
      },
    },
  });
}

export default exportedConfig;
