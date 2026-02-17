import { withSentryConfig } from '@sentry/nextjs';
/** @type {import('next').NextConfig} */
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const nextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mozpjfbozubrpjpkirwv.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Fix cross-origin warnings in development
  allowedDevOrigins: ["192.168.1.197"],
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  // Optimize webpack configuration to prevent chunk loading issues and improve performance
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
        compression: false, // Disable compression to avoid the error
        maxAge: 0, // Clear cache more frequently in dev
      };
      
      // Add chunk timeout settings to prevent loading failures
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300,
      };
    }

    // Optimize chunk splitting for better performance
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Separate vendor chunks
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            // Separate large libraries like Sandpack
            sandpack: {
              test: /[\\/]node_modules[\\/]@codesandbox[\\/]sandpack-react[\\/]/,
              name: 'sandpack',
              chunks: 'all',
              priority: 20,
              enforce: true,
            },
            // Separate UI libraries
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
              name: 'ui',
              chunks: 'all',
              priority: 15,
            },
            // Separate large syntax highlighter
            syntax: {
              test: /[\\/]node_modules[\\/]react-syntax-highlighter[\\/]/,
              name: 'syntax',
              chunks: 'all',
              priority: 15,
            },
            // Separate monaco editor
            monaco: {
              test: /[\\/]node_modules[\\/]@monaco-editor[\\/]/,
              name: 'monaco',
              chunks: 'all',
              priority: 15,
            },
          },
        },
      };
    }

    return config;
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "jfsb-solutions",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
