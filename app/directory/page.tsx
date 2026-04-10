'use client'

import { useState } from 'react'
import {
  Search,
  Filter,
  MapPin,
  Star,
  Phone,
  Mail,
  Calendar,
  Award,
} from 'lucide-react'
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

interface Doctor {
  id: string
  name: string
  specialty: string
  location: string
  rating: number
  reviews: number
  experience: number
  phone: string
  email: string
  availability: string
  isAvailable: boolean
}

const specialties = [
  'Cardiologist',
  'General Practitioner',
  'Dermatologist',
  'Orthopedic Surgeon',
  'Neurologist',
  'Pediatrician',
]

export default function DirectoryPage() {
  const [doctors] = useState<Doctor[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSpecialties, setFilterSpecialties] = useState<string[]>(specialties)
  const [filterAvailable, setFilterAvailable] = useState(false)

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch =
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSpecialty = filterSpecialties.includes(doctor.specialty)
    const matchesAvailability = !filterAvailable || doctor.isAvailable
    return matchesSearch && matchesSpecialty && matchesAvailability
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Find a Doctor</h1>
          <p className="text-muted-foreground">
            Browse our network of experienced healthcare providers
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by doctor name or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Specialty
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <div className="p-2">
                  <p className="text-sm font-semibold mb-2">Specialties</p>
                  {specialties.map((specialty) => (
                    <DropdownMenuCheckboxItem
                      key={specialty}
                      checked={filterSpecialties.includes(specialty)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFilterSpecialties([...filterSpecialties, specialty])
                        } else {
                          setFilterSpecialties(
                            filterSpecialties.filter((s) => s !== specialty)
                          )
                        }
                      }}
                    >
                      {specialty}
                    </DropdownMenuCheckboxItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Availability
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <div className="p-2">
                  <DropdownMenuCheckboxItem
                    checked={filterAvailable}
                    onCheckedChange={setFilterAvailable}
                  >
                    Available Now
                  </DropdownMenuCheckboxItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Results Count */}
        <p className="text-sm text-muted-foreground mb-6">
          Showing {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''}
        </p>

        {/* Doctors Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.length > 0 ? (
            filteredDoctors.map((doctor) => (
              <Card key={doctor.id} className="p-6 hover:shadow-lg transition">
                <div className="mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-lg mb-3">
                    {doctor.name.charAt(0)}
                  </div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-foreground">{doctor.name}</h3>
                      <p className="text-sm text-primary font-medium">{doctor.specialty}</p>
                    </div>
                    {doctor.isAvailable && (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        Available
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(doctor.rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  <span className="text-sm font-medium text-foreground ml-1">
                    {doctor.rating}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({doctor.reviews} reviews)
                  </span>
                </div>

                {/* Info */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Award className="h-4 w-4" />
                    <span>{doctor.experience} years experience</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{doctor.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs">{doctor.availability}</span>
                  </div>
                </div>

                {/* Contact */}
                <div className="flex gap-2 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    asChild
                  >
                    <a href={`tel:${doctor.phone}`}>
                      <Phone className="h-4 w-4" />
                      <span className="hidden sm:inline">Call</span>
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    asChild
                  >
                    <a href={`mailto:${doctor.email}`}>
                      <Mail className="h-4 w-4" />
                      <span className="hidden sm:inline">Email</span>
                    </a>
                  </Button>
                </div>

                <Button className="w-full">Book Appointment</Button>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No doctors found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
