import type { Metadata } from 'next'
import { Bebas_Neue, Space_Mono, Syne } from 'next/font/google'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Toaster } from 'sonner'
import './globals.css'

const bebasNeue = Bebas_Neue({
  weight: '400',
  variable: '--font-bebas',
  subsets: ['latin'],
  display: 'swap',
})

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  variable: '--font-space',
  subsets: ['latin'],
  display: 'swap',
})

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'TypeRacer — Race to the Top',
  description: 'Multiplayer real-time typing competition',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`dark ${bebasNeue.variable} ${spaceMono.variable} ${syne.variable}`}
    >
      <body className="antialiased">
        <NuqsAdapter>
          {children}
          <Toaster
            position="bottom-right"
            richColors
            toastOptions={{
              style: {
                background: '#0E0F17',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#E2E4F0',
                fontFamily: 'var(--font-syne)',
              },
            }}
          />
        </NuqsAdapter>
      </body>
    </html>
  )
}
