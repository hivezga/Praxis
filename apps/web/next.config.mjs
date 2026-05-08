/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config) {
    // Serve .wasm files as static assets (URL), not parsed WebAssembly modules.
    // The wasm-pack web target fetches the WASM at runtime via the resolved URL.
    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });
    return config;
  },
};

export default nextConfig;
