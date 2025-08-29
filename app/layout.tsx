import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Theory of Steam Users\' Handshakes',
  description: 'Discover the shortest connection path between Steam users through friend networks.',
  keywords: ['Steam', 'friends', 'network', 'handshakes', 'gaming', 'connections'],
  authors: [{ name: 'Steam Handshakes Team' }],
  openGraph: {
    title: 'Theory of Steam Users\' Handshakes',
    description: 'Discover the shortest connection path between Steam users through friend networks.',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Steam Handshakes - Find Your Connection',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Theory of Steam Users\' Handshakes',
    description: 'Discover the shortest connection path between Steam users through friend networks.',
    images: ['/og-image.jpg'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
