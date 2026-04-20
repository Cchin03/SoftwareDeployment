// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css' // ← add this!

export const metadata: Metadata = { title: 'ShopFlow' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
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