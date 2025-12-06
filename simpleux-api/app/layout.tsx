import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SimpleUX API",
  description: "SimpleUX API Service",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
      </body>
    </html>
  );
}
