'use client'

import { useState } from 'react'
import {
  Bell,
  Check,
  Trash2,
  Archive,
  Filter,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Notification {
  id: string
  type: 'appointment' | 'message' | 'update' | 'alert'
  title: string
  message: string
  read: boolean
  timestamp: string
  icon: LucideIcon
}

const typeConfig = {
  appointment: { color: 'bg-blue-100 text-blue-800', label: 'Appointment' },
  message: { color: 'bg-purple-100 text-purple-800', label: 'Message' },
  update: { color: 'bg-green-100 text-green-800', label: 'Update' },
  alert: { color: 'bg-yellow-100 text-yellow-800', label: 'Alert' },
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all')
  const [filterTypes, setFilterTypes] = useState<string[]>(Object.keys(typeConfig))

  const filteredNotifications = notifications.filter((notif) => {
    const matchesRead =
      filterRead === 'all' ||
      (filterRead === 'unread' && !notif.read) ||
      (filterRead === 'read' && notif.read)
    const matchesType = filterTypes.includes(notif.type)
    return matchesRead && matchesType
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id))
  }

  const archiveNotification = (id: string) => {
    // In a real app, this would move to archived notifications
    deleteNotification(id)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with your appointments and messages
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="w-full sm:w-auto"
            >
              <Check className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Stats */}
        <Card className="p-4 mb-6 bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Unread Notifications</p>
              <p className="text-2xl font-bold text-foreground">{unreadCount}</p>
            </div>
            <Bell className="h-10 w-10 text-primary opacity-20" />
          </div>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuCheckboxItem
                checked={filterRead === 'all'}
                onCheckedChange={() => setFilterRead('all')}
              >
                All
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filterRead === 'unread'}
                onCheckedChange={() => setFilterRead('unread')}
              >
                Unread
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filterRead === 'read'}
                onCheckedChange={() => setFilterRead('read')}
              >
                Read
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Type
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {Object.entries(typeConfig).map(([key, config]) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={filterTypes.includes(key)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFilterTypes([...filterTypes, key])
                    } else {
                      setFilterTypes(filterTypes.filter((t) => t !== key))
                    }
                  }}
                >
                  {config.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => {
              const config = typeConfig[notification.type as keyof typeof typeConfig]
              const Icon = notification.icon
              return (
                <Card
                  key={notification.id}
                  className={`p-6 transition ${
                    !notification.read ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <Icon className="h-6 w-6 text-muted-foreground mt-0.5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={config.color} variant="secondary">
                            {config.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {notification.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 flex-shrink-0">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => archiveNotification(notification.id)}
                        title="Archive"
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                        title="Delete"
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })
          ) : (
            <Card className="p-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No notifications
              </h3>
              <p className="text-muted-foreground">
                You&apos;re all caught up! Come back later for updates.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
