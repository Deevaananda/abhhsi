'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Activity, Ruler, User, Weight } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { apiService } from '@/lib/api-service'

const BIOSYNC_USER_ID_KEY = 'biosyncUserId'

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'other',
    heightCm: '',
    weightKg: '',
    activityLevel: 'moderate',
  })

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    const age = Number(formData.age)
    if (!Number.isFinite(age) || age < 13 || age > 120) {
      newErrors.age = 'Age must be between 13 and 120'
    }

    const heightCm = Number(formData.heightCm)
    if (!Number.isFinite(heightCm) || heightCm < 80 || heightCm > 260) {
      newErrors.heightCm = 'Height must be between 80 and 260 cm'
    }

    const weightKg = Number(formData.weightKg)
    if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 400) {
      newErrors.weightKg = 'Weight must be between 20 and 400 kg'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      const result = await apiService.registerBioSyncUser({
        name: formData.name.trim(),
        age: Number(formData.age),
        gender: formData.gender as 'male' | 'female' | 'other',
        heightCm: Number(formData.heightCm),
        weightKg: Number(formData.weightKg),
        activityLevel: formData.activityLevel as
          | 'sedentary'
          | 'light'
          | 'moderate'
          | 'active'
          | 'athlete',
      })

      if (!result.success || !result.data?.userId) {
        throw new Error(result.error ?? 'Registration failed. Please try again.')
      }

      localStorage.setItem(BIOSYNC_USER_ID_KEY, result.data.userId)
      router.push('/dashboard')
    } catch (error) {
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : 'Registration failed. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg">
              M
            </div>
            <span className="font-bold text-xl">BioSync</span>
          </Link>
          <Link href="/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Step 1: Baseline Setup</h1>
            <p className="text-muted-foreground">
              Enter your biological baseline to start BioSync personalization.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Name */}
            <div>
              <Label htmlFor="name" className="text-foreground">
                Name
              </Label>
              <div className="relative mt-2">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`pl-10 ${errors.name ? 'border-destructive' : ''}`}
                  disabled={isLoading}
                />
              </div>
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name}</p>
              )}
            </div>

            {/* Age */}
            <div>
              <Label htmlFor="age" className="text-foreground">
                Age
              </Label>
              <Input
                id="age"
                name="age"
                type="number"
                placeholder="Enter age"
                value={formData.age}
                onChange={handleChange}
                className={`mt-2 ${errors.age ? 'border-destructive' : ''}`}
                disabled={isLoading}
              />
              {errors.age && (
                <p className="text-sm text-destructive mt-1">{errors.age}</p>
              )}
            </div>

            {/* Gender */}
            <div>
              <Label htmlFor="gender" className="text-foreground">
                Gender
              </Label>
              <Select
                value={formData.gender}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, gender: value }))
                }
                disabled={isLoading}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Height */}
            <div>
              <Label htmlFor="heightCm" className="text-foreground">
                Height (cm)
              </Label>
              <div className="relative mt-2">
                <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="heightCm"
                  name="heightCm"
                  type="number"
                  placeholder="170"
                  value={formData.heightCm}
                  onChange={handleChange}
                  className={`pl-10 ${errors.heightCm ? 'border-destructive' : ''}`}
                  disabled={isLoading}
                />
              </div>
              {errors.heightCm && (
                <p className="text-sm text-destructive mt-1">{errors.heightCm}</p>
              )}
            </div>

            {/* Weight */}
            <div>
              <Label htmlFor="weightKg" className="text-foreground">
                Weight (kg)
              </Label>
              <div className="relative mt-2">
                <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="weightKg"
                  name="weightKg"
                  type="number"
                  placeholder="70"
                  value={formData.weightKg}
                  onChange={handleChange}
                  className={`pl-10 ${errors.weightKg ? 'border-destructive' : ''}`}
                  disabled={isLoading}
                />
              </div>
              {errors.weightKg && (
                <p className="text-sm text-destructive mt-1">{errors.weightKg}</p>
              )}
            </div>

            {/* Activity Level */}
            <div>
              <Label htmlFor="activityLevel" className="text-foreground">
                Activity Level
              </Label>
              <div className="relative mt-2">
                <Activity className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                <Select
                  value={formData.activityLevel}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, activityLevel: value }))
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger className="pl-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary</SelectItem>
                    <SelectItem value="light">Lightly Active</SelectItem>
                    <SelectItem value="moderate">Moderately Active</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="athlete">Athlete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <p className="text-sm text-destructive">{errors.submit}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? 'Saving Baseline...' : 'Save Baseline'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              BioSync requires this baseline to personalize hydration, recovery, nutrition, and longevity scoring.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
