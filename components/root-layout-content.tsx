'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'

export function RootLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  
  // Hide header and sidebar on landing/auth pages
  const isAuthPage = pathname === '/' || pathname?.startsWith('/login') || pathname?.startsWith('/register')
  
  return (
    <div className="flex h-screen overflow-hidden">
      {!isAuthPage && (
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          userRole="patient"
        />
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!isAuthPage && <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />}
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  )
}
