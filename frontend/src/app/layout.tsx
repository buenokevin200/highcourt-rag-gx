import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'HighCourt RAG - Plataforma de Consulta Jurídica',
  description: 'Sistema de consulta inteligente de jurisprudencia basado en RAG',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  )
}
