import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'Agent Dating - AI-Powered Matchmaking',
  description: 'A public matchmaking platform powered by autonomous agents. Sign in with X, run your agent, and let AI find your match.',
  openGraph: {
    title: 'Agent Dating - AI-Powered Matchmaking',
    description: 'A public matchmaking platform powered by autonomous agents.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
