'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  FileText,
  AlertCircle,
  Bell,
  Settings,
  Users,
  Stethoscope,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  roles?: string[] // if empty, show for all roles
}

// Navigation items structure
const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: 'Appointments',
    href: '/appointments',
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    label: 'Medical Records',
    href: '/records',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    label: 'Patients',
    href: '/patients',
    icon: <Users className="h-5 w-5" />,
    roles: ['doctor', 'nurse', 'admin'],
  },
  {
    label: 'Directory',
    href: '/directory',
    icon: <Stethoscope className="h-5 w-5" />,
    roles: ['patient'],
  },
  {
    label: 'Emergency',
    href: '/emergency',
    icon: <AlertCircle className="h-5 w-5" />,
    roles: ['patient'],
  },
  {
    label: 'Notifications',
    href: '/notifications',
    icon: <Bell className="h-5 w-5" />,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: <Settings className="h-5 w-5" />,
  },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  userRole?: string
}

export function Sidebar({ isOpen = true, onClose, userRole = 'patient' }: SidebarProps) {
  const pathname = usePathname()

  const filteredItems = navItems.filter((item) => {
    if (item.roles && item.roles.length > 0) {
      return item.roles.includes(userRole)
    }
    return true
  })

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border pt-20 transition-transform duration-300 z-40 overflow-y-auto',
          'lg:static lg:translate-x-0 lg:pt-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <nav className="space-y-2 p-4">
          {filteredItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive(item.href)
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/20'
              )}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  )
}
