import { z } from 'zod'

export const activityLevelSchema = z.enum([
  'sedentary',
  'light',
  'moderate',
  'active',
  'athlete',
])

export const registrationSchema = z.object({
  name: z.string().trim().min(2),
  age: z.number().int().min(13).max(120),
  gender: z.enum(['male', 'female', 'other']),
  heightCm: z.number().min(80).max(260),
  weightKg: z.number().min(20).max(400),
  activityLevel: activityLevelSchema,
})

export const biomarkerSchema = z.object({
  iron: z.number().min(0).max(400),
  vitaminD: z.number().min(0).max(200),
  vitaminB12: z.number().min(0).max(3000),
  magnesium: z.number().min(0).max(5),
  bloodSugar: z.number().min(20).max(600),
  cholesterol: z.number().min(50).max(500),
})

export const bloodReportSchema = z
  .object({
    source: z.enum(['manual', 'pdf']),
    reportDate: z.string().min(10),
    markers: biomarkerSchema.optional(),
    pdfFileName: z.string().trim().min(1).optional(),
    pdfUrl: z.string().trim().url().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.source === 'manual' && !data.markers) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Manual entry requires biomarker values.',
        path: ['markers'],
      })
    }

    if (data.source === 'pdf' && !data.markers && !data.pdfFileName && !data.pdfUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'PDF upload requires file metadata or parsed biomarker values.',
        path: ['pdfFileName'],
      })
    }
  })

export const lifestyleSchema = z.object({
  diet: z.enum(['veg', 'vegan', 'eggetarian', 'non-veg']),
  allergies: z.array(z.string().trim().min(1)).default([]),
})

export const wearableSchema = z.object({
  date: z.string().min(10),
  steps: z.number().int().min(0).max(100000),
  restingHeartRate: z.number().min(20).max(240),
  hrv: z.number().min(1).max(200),
  sleepHours: z.number().min(0).max(24),
  workoutMinutes: z.number().min(0).max(500),
  caloriesBurned: z.number().min(0).max(10000).optional(),
  waterIntakeMl: z.number().min(0).max(10000).optional(),
})

export const moodSchema = z.object({
  date: z.string().min(10),
  mood: z.enum(['happy', 'calm', 'neutral', 'anxious', 'stressed', 'overwhelmed']),
  note: z.string().max(500).optional(),
})

export const bioRoutineSettingsSchema = z.object({
  enabled: z.boolean(),
  wakeTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .optional(),
})

export const labBookingSchema = z.object({
  preferredDate: z.string().min(10),
  labName: z.string().trim().min(2).optional(),
})
