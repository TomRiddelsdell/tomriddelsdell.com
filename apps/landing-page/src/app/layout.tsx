import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tom Riddelsdell - Portfolio Platform',
  description: 'Personal portfolio and project showcase platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}