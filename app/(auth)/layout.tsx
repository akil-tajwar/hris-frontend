import { Toaster } from '@/components/ui/toaster'
// import '.././globals.css'
import '../globals.css'
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-center min-h-max">
      <div className="p-8 bg-white rounded">{children}</div>
      <Toaster />
    </div>
  )
}
