import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    distDir: "out",
    reactStrictMode: true,
    images: {
        dangerouslyAllowSVG: true,
        domains: ["api.dicebear.com"],
        remotePatterns: [
            {
                protocol: "https",
                hostname: "api.dicebear.com",
                port: "",
                pathname: "/**"
            }
        ]
    },
    experimental: {
        reactCompiler: true
    }
}

export default nextConfig
