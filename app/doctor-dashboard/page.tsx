'use client'

import { useState } from 'react'
import {
  Users,
  Calendar,
  CheckCircle2,
  TrendingUp,
  MessageSquare,
  ArrowRight,
  Plus,
  FileText,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

export default function DoctorDashboardPage() {
  const [loading] = useState(false)

  const todayAppointments: Array<{
    id: string
    patientName: string
    time: string
    type: string
    duration: number
  }> = []

  const recentPatients: Array<{
    id: string
    name: string
    age: number
    lastVisit: string
    condition: string
  }> = []

  const stats = [
    {
      label: 'Total Patients',
      value: String(recentPatients.length),
      icon: Users,
      trend: 'Loaded from connected data',
    },
    {
      label: 'Today\'s Appointments',
      value: String(todayAppointments.length),
      icon: Calendar,
      trend: 'Loaded from connected data',
    },
    {
      label: 'Pending Records',
      value: '0',
      icon: FileText,
      trend: 'Loaded from connected data',
    },
    {
      label: 'Avg. Rating',
      value: 'N/A',
      icon: TrendingUp,
      trend: 'No ratings available',
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back, Doctor</h1>
          <p className="text-muted-foreground">Manage your patients and appointments efficiently</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Button className="w-full justify-start gap-2 h-auto py-3" size="lg">
            <Plus className="h-5 w-5" />
            Add Patient
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3" size="lg">
            <Calendar className="h-5 w-5" />
            View Schedule
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3" size="lg">
            <MessageSquare className="h-5 w-5" />
            Messages
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3" size="lg">
            <CheckCircle2 className="h-5 w-5" />
            Records
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="p-6">
                {loading ? (
                  <>
                    <Skeleton className="h-5 w-20 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <Icon className="h-5 w-5 text-primary opacity-50" />
                    </div>
                    <p className="text-2xl font-bold text-foreground mb-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.trend}</p>
                  </>
                )}
              </Card>
            )
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Today's Appointments */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Today's Appointments</h2>
              <Link href="/appointments">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-60" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {todayAppointments.length > 0 ? (
                  todayAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="border border-border rounded-lg p-4 hover:bg-muted/50 transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-foreground">{apt.patientName}</p>
                          <p className="text-sm text-muted-foreground">{apt.type}</p>
                        </div>
                        <Badge variant="outline">{apt.time}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Duration: {apt.duration} min</p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No appointments scheduled today
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* Recent Patients */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Recent Patients</h2>
              <Link href="/patients">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-60" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {recentPatients.length > 0 ? (
                  recentPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className="border border-border rounded-lg p-4 hover:bg-muted/50 transition cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-foreground">{patient.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Age: {patient.age} • {patient.condition}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Last visit: {patient.lastVisit}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No recent patients
                  </p>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
