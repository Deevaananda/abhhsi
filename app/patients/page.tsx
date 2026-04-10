'use client'

import { useState } from 'react'
import {
  Users,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Calendar,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Patient {
  id: string
  name: string
  email: string
  phone: string
  age: number
  gender: string
  conditions: string[]
  lastVisit: string
  nextAppointment?: string
  status: 'active' | 'inactive' | 'pending'
}

const statusConfig = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
}

export default function PatientsPage() {
  const [patients] = useState<Patient[]>([])
  const [filterStatus, setFilterStatus] = useState<string[]>(['active', 'inactive', 'pending'])
  const [searchTerm, setSearchTerm] = useState('')

  const filteredPatients = patients.filter((patient) => {
    const matchesStatus = filterStatus.includes(patient.status)
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Patients</h1>
            <p className="text-muted-foreground">Manage and view all your patients</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Patient
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Patients</p>
                <p className="text-3xl font-bold text-foreground">{patients.length}</p>
              </div>
              <Users className="h-10 w-10 text-primary opacity-20" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-3xl font-bold text-foreground">
                  {patients.filter((p) => p.status === 'active').length}
                </p>
              </div>
              <Users className="h-10 w-10 text-secondary opacity-20" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inactive</p>
                <p className="text-3xl font-bold text-foreground">
                  {patients.filter((p) => p.status === 'inactive').length}
                </p>
              </div>
              <Users className="h-10 w-10 text-muted opacity-20" />
            </div>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
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
                {Object.keys(statusConfig).map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={filterStatus.includes(status)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFilterStatus([...filterStatus, status])
                      } else {
                        setFilterStatus(filterStatus.filter((s) => s !== status))
                      }
                    }}
                  >
                    <span className="capitalize">{status}</span>
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Patients List */}
        <div className="space-y-4">
          {filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => (
              <Card
                key={patient.id}
                className="p-6 hover:shadow-md transition cursor-pointer"
              >
                <Link href={`/patients/${patient.id}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Patient Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                          {patient.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{patient.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {patient.age} years • {patient.gender}
                          </p>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 mb-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">{patient.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">{patient.phone}</span>
                        </div>
                      </div>

                      {/* Conditions */}
                      {patient.conditions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {patient.conditions.map((condition, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {condition}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Visit Info */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Last visit: {patient.lastVisit}
                          </span>
                        </div>
                        {patient.nextAppointment && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span className="text-primary font-medium">
                              Next: {patient.nextAppointment}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status and Action */}
                    <div className="flex items-center gap-3">
                      <Badge
                        className={`${statusConfig[patient.status as keyof typeof statusConfig]} text-xs`}
                      >
                        {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                      </Badge>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No patients found</h3>
              <p className="text-muted-foreground mb-4">
                No patients match your search criteria.
              </p>
              <Button>Add Your First Patient</Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
