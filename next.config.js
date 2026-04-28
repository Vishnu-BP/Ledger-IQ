/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @react-pdf/renderer ships ESM only — Next 14 webpack needs it whitelisted.
  transpilePackages: ["@react-pdf/renderer"],
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "date-fns", "@radix-ui/react-icons"],
  },
};

module.exports = nextConfig;
