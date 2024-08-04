import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import MainMenu from "./main-nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  manifest: "/manifest.json",
  title: "Totally",
  description: "Totally Card Scoreboard",
};

export const viewport: Viewport = {
  themeColor: "#1E293B",
  initialScale: 1,
  width: "device-width",
  height: "device-height",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <head />
        <body
          className={`min-h-screen flex flex-col ${inter.className} bg-slate-800`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange>
            <header className=" bg-slate-800 py-4">
              <MainMenu />
            </header>
            <main className="mx-auto w-full flex-grow bg-slate-700 p-6 space-y-6 sm:max-w-[350px] lg:max-w-[700px] xl:max-w-[1000px] ">
              {children}
            </main>
            <footer className="text-center bg-slate-800 text-gray-100 text-xs p-1">
              <p>Totally</p>
            </footer>
          </ThemeProvider>
        </body>
      </html>
    </>
  );
}
