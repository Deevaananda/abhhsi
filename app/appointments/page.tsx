'use client'

import { useState } from 'react'
import {
  Calendar,
  Clock,
  User,
  MapPin,
  X,
  Plus,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

interface Appointment {
  id: string
  doctorName: string
  specialty: string
  date: string
  time: string
  duration: number
  type: 'consultation' | 'checkup' | 'surgery' | 'followup'
  status: 'scheduled' | 'completed' | 'cancelled'
  location: string
}

const statusConfig = {
  scheduled: { color: 'bg-blue-100 text-blue-800', label: 'Scheduled' },
  completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
  cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
}

const typeConfig = {
  consultation: 'Consultation',
  checkup: 'Checkup',
  surgery: 'Surgery',
  followup: 'Follow-up',
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filterStatus, setFilterStatus] = useState<string[]>(['scheduled', 'completed'])
  const [searchTerm, setSearchTerm] = useState('')

  const filteredAppointments = appointments.filter((apt) => {
    const matchesStatus = filterStatus.includes(apt.status)
    const matchesSearch =
      apt.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.specialty.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const cancelAppointment = (id: string) => {
    setAppointments(
      appointments.map((apt) =>
        apt.id === id ? { ...apt, status: 'cancelled' } : apt
      )
    )
  }

  const upcomingCount = filteredAppointments.filter((apt) => apt.status === 'scheduled').length
  const completedCount = filteredAppointments.filter((apt) => apt.status === 'completed').length

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Appointments</h1>
          <p className="text-muted-foreground">Manage your medical appointments and consultations</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-3xl font-bold text-foreground">{upcomingCount}</p>
              </div>
              <Calendar className="h-10 w-10 text-primary opacity-20" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold text-foreground">{completedCount}</p>
              </div>
              <Calendar className="h-10 w-10 text-secondary opacity-20" />
            </div>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search by doctor name or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Book Appointment
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="p-2">
                <p className="text-sm font-semibold mb-2">Status</p>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={filterStatus.includes(key)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFilterStatus([...filterStatus, key])
                      } else {
                        setFilterStatus(filterStatus.filter((s) => s !== key))
                      }
                    }}
                  >
                    {config.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((appointment) => (
              <Card key={appointment.id} className="p-6 hover:shadow-md transition">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {appointment.doctorName}
                      </h3>
                      <Badge
                        className={`${statusConfig[appointment.status as keyof typeof statusConfig].color}`}
                      >
                        {statusConfig[appointment.status as keyof typeof statusConfig].label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{appointment.specialty}</p>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-foreground">{appointment.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="text-foreground">
                          {appointment.time} ({appointment.duration} min)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="text-foreground">{appointment.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-primary" />
                        <span className="text-foreground">{typeConfig[appointment.type]}</span>
                      </div>
                    </div>
                  </div>

                  {appointment.status === 'scheduled' && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Reschedule
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => cancelAppointment(appointment.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No appointments</h3>
              <p className="text-muted-foreground mb-4">
                You don&apos;t have any appointments matching the current filters.
              </p>
              <Button>Book Your First Appointment</Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
