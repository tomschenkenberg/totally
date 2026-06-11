import type { NextConfig } from "next"
import withSerwistInit from "@serwist/next"

const withSerwist = withSerwistInit({
    swSrc: "src/sw.ts",
    swDest: "public/sw.js",
    disable: process.env.NODE_ENV === "development"
})

const nextConfig: NextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    reactCompiler: true,
    images: {
        dangerouslyAllowSVG: true,
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
        inlineCss: true
    },
    skipTrailingSlashRedirect: true,
    async redirects() {
        return [
            {
                source: "/boerenbridge/round/:n/bid",
                destination: "/boerenbridge?step=bid",
                permanent: false
            },
            {
                source: "/boerenbridge/round/:n/tricks",
                destination: "/boerenbridge?step=tricks",
                permanent: false
            },
            {
                source: "/boerenbridge/round/:n",
                destination: "/boerenbridge",
                permanent: false
            }
        ]
    },
    async headers() {
        const cspDirectives = [
            "default-src 'self'",
            "base-uri 'none'",
            "media-src * blob:",
            "object-src 'none'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.posthog.com https://js.hcaptcha.com https://vercel.live https://va.vercel-scripts.com https://challenges.cloudflare.com",
            "img-src 'self' data: blob: *",
            "frame-src 'self' https://newassets.hcaptcha.com https://www.youtube-nocookie.com https://challenges.cloudflare.com",
            "style-src 'self' 'unsafe-inline' https://*.posthog.com",
            "font-src 'self'",
            "connect-src 'self' https://*.posthog.com https://vercel.live https://s3.eu-central-1.amazonaws.com",
            "form-action 'self'",
            "frame-ancestors 'self'",
            "manifest-src 'self'",
            "worker-src 'self' blob:"
        ].join("; ")

        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "Server",
                        value: "Apache"
                    },
                    {
                        key: "X-Frame-Options",
                        value: "DENY"
                    },
                    {
                        key: "Content-Security-Policy",
                        value: cspDirectives
                    },
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff"
                    },
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), browsing-topics=()"
                    },
                    {
                        key: "Referrer-Policy",
                        value: "no-referrer, strict-origin-when-cross-origin"
                    },
                    {
                        key: "x-xss-protection",
                        value: "1; mode=block"
                    },
                    {
                        key: "Access-Control-Allow-Origin",
                        value: "https://totally.schenkenberg.nl"
                    },
                    {
                        key: "Access-Control-Allow-Methods",
                        value: "GET, POST, PUT, DELETE, OPTIONS"
                    },
                    {
                        key: "Access-Control-Allow-Headers",
                        value: "Content-Type, Authorization"
                    }
                ]
            }
        ]
    }
}

export default withSerwist(nextConfig)
