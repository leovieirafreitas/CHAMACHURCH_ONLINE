import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })
const wondra = localFont({
  src: '../font/Wondra.otf',
  variable: '--font-wondra',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Contribuição Chama Church',
  description: 'Plataforma de doações e dízimos da Chama Church.',
}

import SplashScreen from './components/SplashScreen'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <script src="https://sdk.mercadopago.com/js/v2" async></script>
      </head>
      <body className={`${inter.variable} ${outfit.variable} ${wondra.variable}`}>
        <SplashScreen />
        {children}
      </body>
    </html>
  )
}
