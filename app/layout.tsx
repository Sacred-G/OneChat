import type { Metadata } from "next";
import localFont from "next/font/local";
import "xterm/css/xterm.css";
import "./globals.css";
import SandpackStyleInjector from "@/components/sandpack-style-injector";
import SessionProvider from "@/components/session-provider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "OneChatAI",
  description: "Starter app for the OpenAI Responses API",
  icons: {
    icon: "/openai_logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <SessionProvider>
          <SandpackStyleInjector />
          <main className="min-h-screen">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
