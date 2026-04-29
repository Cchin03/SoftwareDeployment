// src/app/layout.tsx
import type { Metadata } from 'next'
import { Geist_Mono } from 'next/font/google'
import './globals.css' // ← add this!

export const metadata: Metadata = { title: 'ShopFlow' }

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen w-full" style={{ margin: 0 }}>
        {children}
      </body>
    </html>
  )
}