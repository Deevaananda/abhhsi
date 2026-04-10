// User roles in the medical system
export type UserRole = 'patient' | 'doctor' | 'nurse' | 'admin'

// User type
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  phone?: string
  avatar?: string
  specialization?: string // for doctors
  licenseNumber?: string // for healthcare professionals
  createdAt: string
  updatedAt: string
}

// Patient type
export interface Patient extends User {
  dateOfBirth: string
  gender: 'male' | 'female' | 'other'
  bloodType?: string
  height?: number // cm
  weight?: number // kg
  medicalHistory?: string[]
  allergies?: string[]
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
}

// Doctor type
export interface Doctor extends User {
  role: 'doctor'
  specialization: string
  licenseNumber: string
  department: string
  yearsOfExperience: number
  rating?: number
  numberOfPatients?: number
}

// Appointment type
export interface Appointment {
  id: string
  patientId: string
  doctorId: string
  dateTime: string
  duration: number // minutes
  type: 'consultation' | 'checkup' | 'surgery' | 'followup'
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
  notes?: string
  createdAt: string
  updatedAt: string
}

// Medical record type
export interface MedicalRecord {
  id: string
  patientId: string
  doctorId: string
  appointmentId?: string
  type: 'diagnosis' | 'prescription' | 'lab-result' | 'test-report' | 'note'
  title: string
  description: string
  date: string
  attachments?: string[]
  createdAt: string
  updatedAt: string
}

// Prescription type
export interface Prescription {
  id: string
  patientId: string
  doctorId: string
  medication: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
  isActive: boolean
  createdAt: string
  expiresAt: string
}

// Notification type
export interface Notification {
  id: string
  userId: string
  type: 'appointment' | 'message' | 'update' | 'alert'
  title: string
  message: string
  read: boolean
  link?: string
  createdAt: string
}

// Emergency contact type
export interface EmergencyAlert {
  id: string
  patientId: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  location?: string
  responded: boolean
  respondedBy?: string
  createdAt: string
  updatedAt: string
}
