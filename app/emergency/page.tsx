'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  Phone,
  MapPin,
  Clock,
  Send,
  AlertCircle,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { apiService } from '@/lib/api-service'

export default function EmergencyPage() {
  const [showDialog, setShowDialog] = useState(false)
  const [severity, setSeverity] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')

  const emergencyContacts: Array<{
    type: string
    number: string
    availability: string
  }> = []

  const recentAlerts: Array<{
    id: string
    severity: string
    description: string
    date: string
    status: string
    respondedBy: string
  }> = []

  const handleEmergencyAlert = async () => {
    if (severity && description) {
      await apiService.createEmergencyAlert({
        severity,
        description,
        location,
        timestamp: new Date().toISOString(),
      })
      setShowDialog(false)
      setSeverity('')
      setDescription('')
      setLocation('')
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Alert Banner */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-bold text-destructive mb-2">Emergency Services</h2>
              <p className="text-sm text-destructive/80">
                If you are experiencing a life-threatening emergency, call 100 or your local emergency services immediately. This system is for non-emergency alerts.
              </p>
            </div>
          </div>
        </div>

        {/* Emergency Alert Button */}
        <Card className="p-8 mb-8 bg-gradient-to-br from-red-50 to-red-100/30 border-red-200">
          <div className="text-center">
            <Button
              size="lg"
              className="bg-destructive hover:bg-destructive/90 text-white gap-2"
              onClick={() => setShowDialog(true)}
            >
              <AlertCircle className="h-5 w-5" />
              Report Medical Emergency
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Alert your emergency contacts and medical team immediately
            </p>
          </div>
        </Card>

        {/* Emergency Contacts */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Important Contacts</h2>
          {emergencyContacts.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {emergencyContacts.map((contact, index) => (
                <Card key={index} className="p-6">
                  <p className="text-lg font-semibold text-foreground mb-2">{contact.type}</p>
                  <div className="flex items-center gap-3 mb-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <a
                      href={`tel:${contact.number}`}
                      className="text-xl font-bold text-primary hover:underline"
                    >
                      {contact.number}
                    </a>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Available: {contact.availability}
                  </p>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">
                No local emergency contacts are configured. Use your region&apos;s emergency number.
              </p>
            </Card>
          )}
        </div>

        {/* Recent Emergency Alerts */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Your Emergency History</h2>
          <div className="space-y-4">
            {recentAlerts.length > 0 ? (
              recentAlerts.map((alert) => (
                <Card key={alert.id} className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-3 h-3 rounded-full mt-1.5 ${
                          alert.severity === 'high'
                            ? 'bg-red-500'
                            : 'bg-yellow-500'
                        }`}
                      />
                      <div>
                        <p className="font-semibold text-foreground">
                          {alert.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {alert.date}
                          </div>
                          <div>Responded by: {alert.respondedBy}</div>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full">
                      Resolved
                    </span>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No emergency alerts on record</p>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Emergency Alert Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Report Medical Emergency</DialogTitle>
            <DialogDescription>
              Provide details about your emergency. Emergency responders will be notified.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Severity Level
              </label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Minor injury or illness</SelectItem>
                  <SelectItem value="medium">Medium - Moderate symptoms</SelectItem>
                  <SelectItem value="high">High - Severe symptoms</SelectItem>
                  <SelectItem value="critical">
                    Critical - Life-threatening (Call 911)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Description
              </label>
              <Textarea
                placeholder="Describe your symptoms or emergency situation..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-24"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Current Location
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter your location or address"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
                <Button variant="outline" size="icon">
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-xs text-destructive">
                ⚠️ For immediate life-threatening emergencies, call 911 or your local emergency number directly.
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button
                className="gap-2 bg-destructive hover:bg-destructive/90"
                onClick={handleEmergencyAlert}
                disabled={!severity || !description}
              >
                <Send className="h-4 w-4" />
                Send Emergency Alert
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
