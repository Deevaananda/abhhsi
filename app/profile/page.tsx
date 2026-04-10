'use client'

import { useState } from 'react'
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Pill,
  AlertCircle,
  Edit2,
  Save,
  X,
  Heart,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function ProfilePage() {
  const [editDialog, setEditDialog] = useState(false)

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    age: 0,
    gender: '',
    bloodType: '',
    height: '',
    weight: '',
    location: '',
  })

  const [tempProfile, setTempProfile] = useState(profile)

  const medicalInfo: {
    allergies: string[]
    conditions: string[]
    medications: Array<{ name: string; dosage: string; frequency: string }>
    emergencyContact: {
      name: string
      relationship: string
      phone: string
    }
  } = {
    allergies: [],
    conditions: [],
    medications: [],
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
    },
  }

  const recentAppointments: Array<{ date: string; doctor: string; type: string }> = []

  const handleSaveProfile = () => {
    setProfile(tempProfile)
    setEditDialog(false)
  }

  const handleCancel = () => {
    setTempProfile(profile)
    setEditDialog(false)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">My Profile</h1>
            <p className="text-muted-foreground">View and manage your personal health information</p>
          </div>
          <Button
            className="gap-2"
            onClick={() => {
              setTempProfile(profile)
              setEditDialog(true)
            }}
          >
            <Edit2 className="h-4 w-4" />
            Edit Profile
          </Button>
        </div>

        {/* Profile Header Card */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
              {profile.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground mb-1">
                {profile.name || 'Unnamed User'}
              </h2>
              <p className="text-muted-foreground mb-4">
                {profile.age > 0 || profile.gender
                  ? `${profile.age > 0 ? `${profile.age} years old` : ''}${
                      profile.age > 0 && profile.gender ? ' • ' : ''
                    }${profile.gender}`
                  : 'Age and gender not set'}
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="text-sm">{profile.email || 'No email set'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="text-sm">{profile.phone || 'No phone set'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-sm">{profile.location || 'No location set'}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Health Metrics */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Height</p>
            <p className="text-2xl font-bold text-foreground">{profile.height || 'N/A'}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Weight</p>
            <p className="text-2xl font-bold text-foreground">{profile.weight || 'N/A'}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Blood Type</p>
            <p className="text-2xl font-bold text-foreground">{profile.bloodType || 'N/A'}</p>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Medical Information */}
          <div className="space-y-6">
            {/* Allergies */}
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Allergies
              </h3>
              {medicalInfo.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {medicalInfo.allergies.map((allergy, index) => (
                    <Badge key={index} variant="destructive">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No allergies recorded</p>
              )}
            </Card>

            {/* Medical Conditions */}
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Medical Conditions
              </h3>
              {medicalInfo.conditions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {medicalInfo.conditions.map((condition, index) => (
                    <Badge key={index} variant="secondary">
                      {condition}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No conditions recorded</p>
              )}
            </Card>

            {/* Emergency Contact */}
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Emergency Contact</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium text-foreground">
                    {medicalInfo.emergencyContact.name || 'Not provided'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Relationship</p>
                  <p className="font-medium text-foreground">
                    {medicalInfo.emergencyContact.relationship || 'Not provided'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium text-foreground">
                    {medicalInfo.emergencyContact.phone || 'Not provided'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Current Medications & Recent Visits */}
          <div className="space-y-6">
            {/* Current Medications */}
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Pill className="h-5 w-5 text-primary" />
                Current Medications
              </h3>
              {medicalInfo.medications.length > 0 ? (
                <div className="space-y-3">
                  {medicalInfo.medications.map((med, index) => (
                    <div key={index} className="border border-border rounded-lg p-3">
                      <p className="font-medium text-foreground">{med.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {med.dosage} • {med.frequency}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No medications recorded</p>
              )}
            </Card>

            {/* Recent Visits */}
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Recent Visits
              </h3>
              {recentAppointments.length > 0 ? (
                <div className="space-y-3">
                  {recentAppointments.map((apt, index) => (
                    <div key={index} className="border border-border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{apt.doctor}</p>
                          <p className="text-sm text-muted-foreground">{apt.type}</p>
                        </div>
                        <span className="text-sm text-muted-foreground">{apt.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No recent visits</p>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your personal information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Full Name
              </label>
              <Input
                value={tempProfile.name}
                onChange={(e) =>
                  setTempProfile({ ...tempProfile, name: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Email
              </label>
              <Input
                type="email"
                value={tempProfile.email}
                onChange={(e) =>
                  setTempProfile({ ...tempProfile, email: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Phone
              </label>
              <Input
                value={tempProfile.phone}
                onChange={(e) =>
                  setTempProfile({ ...tempProfile, phone: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Location
              </label>
              <Input
                value={tempProfile.location}
                onChange={(e) =>
                  setTempProfile({ ...tempProfile, location: e.target.value })
                }
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveProfile}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
