import { Toaster } from '@/components/ui/toaster'
import '.././globals.css'
import { Inter } from 'next/font/google'
import { ReactQueryProvider } from '@/provider/ReactQueryProvider'
import HomeNavbar from '@/components/shared/home-navbar'

const inter = Inter({ subsets: ['latin'] })

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReactQueryProvider>
          <HomeNavbar />
          <main className="p-6 pt-20">{children}</main>
          <Toaster />
        </ReactQueryProvider>
      </body>
    </html>
  )
}
