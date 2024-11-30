import type { NextConfig } from "next"

const nextConfig: NextConfig = {
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
        reactCompiler: false
    }
}

export default nextConfig
