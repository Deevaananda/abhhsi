'use client'

import { useState } from 'react'
import {
  Save,
  Lock,
  Bell,
  Shield,
  Eye,
  EyeOff,
  LogOut,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { apiService } from '@/lib/api-service'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'other',
    bloodType: '',
    bio: '',
  })

  const [notifications, setNotifications] = useState({
    appointmentReminders: true,
    messageNotifications: true,
    healthUpdates: true,
    weeklyReport: false,
    emailNotifications: true,
    smsNotifications: false,
  })

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
  })

  const handleProfileChange = (field: string, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const handleNotificationChange = (field: string, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)

    try {
      const userId = localStorage.getItem('biosyncUserId')
      if (userId) {
        await apiService.updateUserProfile(userId, profile)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-border">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6">Personal Information</h2>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName" className="text-foreground">
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      value={profile.fullName}
                      onChange={(e) =>
                        handleProfileChange('fullName', e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-foreground">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        handleProfileChange('email', e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone" className="text-foreground">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) =>
                        handleProfileChange('phone', e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dob" className="text-foreground">
                      Date of Birth
                    </Label>
                    <Input
                      id="dob"
                      type="date"
                      value={profile.dateOfBirth}
                      onChange={(e) =>
                        handleProfileChange('dateOfBirth', e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gender" className="text-foreground">
                      Gender
                    </Label>
                    <Select value={profile.gender}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="bloodType" className="text-foreground">
                      Blood Type
                    </Label>
                    <Select value={profile.bloodType}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio" className="text-foreground">
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) =>
                      handleProfileChange('bio', e.target.value)
                    }
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <Button
                  className="gap-2"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6">Notification Preferences</h2>
              <div className="space-y-4">
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        Appointment Reminders
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Get reminded about upcoming appointments
                      </p>
                    </div>
                    <Checkbox
                      checked={notifications.appointmentReminders}
                      onCheckedChange={(checked) =>
                        handleNotificationChange(
                          'appointmentReminders',
                          checked as boolean
                        )
                      }
                    />
                  </div>
                </div>

                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        Message Notifications
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Get notified when doctors send you messages
                      </p>
                    </div>
                    <Checkbox
                      checked={notifications.messageNotifications}
                      onCheckedChange={(checked) =>
                        handleNotificationChange(
                          'messageNotifications',
                          checked as boolean
                        )
                      }
                    />
                  </div>
                </div>

                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        Health Updates
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Get health tips and wellness advice
                      </p>
                    </div>
                    <Checkbox
                      checked={notifications.healthUpdates}
                      onCheckedChange={(checked) =>
                        handleNotificationChange(
                          'healthUpdates',
                          checked as boolean
                        )
                      }
                    />
                  </div>
                </div>

                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        Weekly Health Report
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Receive a weekly summary of your health
                      </p>
                    </div>
                    <Checkbox
                      checked={notifications.weeklyReport}
                      onCheckedChange={(checked) =>
                        handleNotificationChange(
                          'weeklyReport',
                          checked as boolean
                        )
                      }
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="font-medium text-foreground mb-4">
                    Notification Channels
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-foreground">Email</label>
                      <Checkbox
                        checked={notifications.emailNotifications}
                        onCheckedChange={(checked) =>
                          handleNotificationChange(
                            'emailNotifications',
                            checked as boolean
                          )
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-foreground">SMS</label>
                      <Checkbox
                        checked={notifications.smsNotifications}
                        onCheckedChange={(checked) =>
                          handleNotificationChange(
                            'smsNotifications',
                            checked as boolean
                          )
                        }
                      />
                    </div>
                  </div>
                </div>

                <Button className="gap-2 mt-4">
                  <Save className="h-4 w-4" />
                  Save Preferences
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Password & Security
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword" className="text-foreground">
                    Current Password
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="currentPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={security.currentPassword}
                      onChange={(e) =>
                        setSecurity((prev) => ({
                          ...prev,
                          currentPassword: e.target.value,
                        }))
                      }
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="newPassword" className="text-foreground">
                    New Password
                  </Label>
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={security.newPassword}
                    onChange={(e) =>
                      setSecurity((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-foreground">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={security.confirmPassword}
                    onChange={(e) =>
                      setSecurity((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    className="mt-1"
                  />
                </div>

                <Button className="gap-2">
                  <Lock className="h-4 w-4" />
                  Update Password
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Two-Factor Authentication
                </h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Add an extra layer of security to your account. After enabling, you&apos;ll be
                required to enter a verification code in addition to your password.
              </p>
              <Button variant="outline" className="gap-2">
                {security.twoFactorEnabled
                  ? 'Disable Two-Factor Authentication'
                  : 'Enable Two-Factor Authentication'}
              </Button>
            </Card>

            <Card className="p-6 border-red-200 bg-red-50">
              <h2 className="text-xl font-bold text-destructive mb-4">Danger Zone</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button variant="destructive" className="gap-2">
                <LogOut className="h-4 w-4" />
                Delete Account
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
