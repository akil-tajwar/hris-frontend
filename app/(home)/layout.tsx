'use client'

import { Toaster } from '@/components/ui/toaster'
import '.././globals.css'
import { Inter } from 'next/font/google'
import { ReactQueryProvider } from '@/provider/ReactQueryProvider'
import HomeNavbar from '@/components/shared/home-navbar'
import { usePathname } from 'next/navigation'

const inter = Inter({ subsets: ['latin'] })

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isHomePage = pathname === '/'

  return (
    <>
      {!isHomePage && <HomeNavbar />}
      <main className={!isHomePage ? 'p-6 pt-20' : ''}>{children}</main>
      <Toaster />
    </>
  )
}
