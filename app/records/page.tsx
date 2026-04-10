'use client'

import { useState } from 'react'
import {
  FileText,
  Download,
  Share2,
  Pill,
  Microscope,
  Stethoscope,
  Plus,
  Search,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'

interface MedicalRecord {
  id: string
  title: string
  type: 'diagnosis' | 'prescription' | 'lab-result' | 'test-report' | 'note'
  doctor: string
  date: string
  description: string
  attachments?: string[]
}

const typeConfig = {
  diagnosis: {
    icon: Stethoscope,
    label: 'Diagnosis',
    color: 'bg-red-100 text-red-800',
  },
  prescription: {
    icon: Pill,
    label: 'Prescription',
    color: 'bg-blue-100 text-blue-800',
  },
  'lab-result': {
    icon: Microscope,
    label: 'Lab Result',
    color: 'bg-purple-100 text-purple-800',
  },
  'test-report': {
    icon: FileText,
    label: 'Test Report',
    color: 'bg-green-100 text-green-800',
  },
  note: {
    icon: FileText,
    label: 'Note',
    color: 'bg-gray-100 text-gray-800',
  },
}

export default function RecordsPage() {
  const [records] = useState<MedicalRecord[]>([])
  const [filterTypes, setFilterTypes] = useState<string[]>(Object.keys(typeConfig))
  const [searchTerm, setSearchTerm] = useState('')

  const filteredRecords = records.filter((record) => {
    const matchesType = filterTypes.includes(record.type)
    const matchesSearch =
      record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.doctor.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesType && matchesSearch
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Medical Records</h1>
          <p className="text-muted-foreground">
            Access and manage your complete medical history and documents
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          {Object.entries(typeConfig).map(([key, config]) => {
            const Icon = config.icon
            const count = records.filter((r) => r.type === key).length
            return (
              <Card key={key} className="p-4">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{config.label}</p>
                    <p className="text-2xl font-bold text-foreground">{count}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search records by title or doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Upload Record
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
                <p className="text-sm font-semibold mb-2">Record Type</p>
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
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Records List */}
        <div className="space-y-4">
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record) => {
              const config = typeConfig[record.type as keyof typeof typeConfig]
              const Icon = config.icon
              return (
                <Card key={record.id} className="p-6 hover:shadow-md transition">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Icon and Content */}
                    <div className="flex gap-4 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        <Icon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-foreground">{record.title}</h3>
                          <Badge className={config.color}>{config.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          By {record.doctor} • {record.date}
                        </p>
                        <p className="text-sm text-foreground mb-3">{record.description}</p>

                        {/* Attachments */}
                        {record.attachments && record.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {record.attachments.map((attachment, index) => (
                              <div
                                key={index}
                                className="text-xs bg-muted px-3 py-1 rounded-full text-muted-foreground"
                              >
                                📎 {attachment}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Download</span>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Share with Doctor</DropdownMenuItem>
                          <DropdownMenuItem>Share via Link</DropdownMenuItem>
                          <DropdownMenuItem>Print</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Card>
              )
            })
          ) : (
            <Card className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No records found</h3>
              <p className="text-muted-foreground">
                No medical records match your search criteria.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
