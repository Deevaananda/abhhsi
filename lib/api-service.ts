// API service for handling all backend calls
// This file provides the base structure for API calls and will be connected to actual backend endpoints

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class ApiService {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = this.normalizeBaseUrl(baseUrl)
  }

  private normalizeBaseUrl(baseUrl: string): string {
    const trimmed = baseUrl.trim()
    const normalized = trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed
    return normalized || '/api'
  }

  private biosyncUserPath(userId: string): string {
    return `/biosync/users/${encodeURIComponent(userId)}`
  }

  private buildUrl(endpoint: string, baseUrl = this.baseUrl): string {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`

    if (/^https?:\/\//i.test(baseUrl)) {
      return `${baseUrl}${normalizedEndpoint}`
    }

    const normalizedBase = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`
    return `${normalizedBase}${normalizedEndpoint}`
  }

  private shouldRetryWithSameOrigin(error: unknown): boolean {
    if (!(error instanceof TypeError) || typeof window === 'undefined') {
      return false
    }

    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/api$/i.test(this.baseUrl)
  }

  private async executeRequest<T>(
    url: string,
    options: RequestInit
  ): Promise<ApiResponse<T>> {
    const response = await fetch(url, options)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.error || `API error: ${response.status} ${response.statusText}`
      )
    }

    const payload = await response.json()

    if (payload && typeof payload === 'object' && 'success' in payload) {
      if (!payload.success) {
        return {
          success: false,
          error:
            typeof payload.error === 'string'
              ? payload.error
              : 'API returned an unsuccessful response.',
        }
      }

      return {
        success: true,
        data: payload.data as T,
      }
    }

    return { success: true, data: payload as T }
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers = new Headers(options.headers ?? {})

    // Let the browser set multipart boundaries for FormData.
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    const requestOptions: RequestInit = {
      ...options,
      headers,
    }

    const primaryUrl = this.buildUrl(endpoint)

    try {
      return await this.executeRequest<T>(primaryUrl, requestOptions)
    } catch (error) {
      if (this.shouldRetryWithSameOrigin(error)) {
        const fallbackUrl = this.buildUrl(endpoint, '/api')

        try {
          return await this.executeRequest<T>(fallbackUrl, requestOptions)
        } catch (retryError) {
          console.error('[API Error]', endpoint, retryError)
          return {
            success: false,
            error:
              retryError instanceof Error
                ? retryError.message
                : 'Unknown error occurred',
          }
        }
      }

      console.error('[API Error]', endpoint, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  // User endpoints
  async loginUser(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async registerUser(userData: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async getCurrentUser() {
    return this.request('/users/me', {
      method: 'GET',
    })
  }

  async updateUserProfile(userId: string, data: any) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Patient endpoints
  async getPatientDashboard(patientId: string) {
    return this.request(`/patients/${patientId}/dashboard`, {
      method: 'GET',
    })
  }

  async getPatientAppointments(patientId: string) {
    return this.request(`/patients/${patientId}/appointments`, {
      method: 'GET',
    })
  }

  // Doctor endpoints
  async getDoctorDashboard(doctorId: string) {
    return this.request(`/doctors/${doctorId}/dashboard`, {
      method: 'GET',
    })
  }

  async getDoctorPatients(doctorId: string) {
    return this.request(`/doctors/${doctorId}/patients`, {
      method: 'GET',
    })
  }

  // Appointment endpoints
  async getAppointments(filters?: any) {
    const queryString = filters ? `?${new URLSearchParams(filters)}` : ''
    return this.request(`/appointments${queryString}`, {
      method: 'GET',
    })
  }

  async createAppointment(data: any) {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateAppointment(appointmentId: string, data: any) {
    return this.request(`/appointments/${appointmentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async cancelAppointment(appointmentId: string) {
    return this.request(`/appointments/${appointmentId}`, {
      method: 'DELETE',
    })
  }

  // Medical records endpoints
  async getMedicalRecords(patientId: string) {
    return this.request(`/patients/${patientId}/records`, {
      method: 'GET',
    })
  }

  async createMedicalRecord(data: any) {
    return this.request('/records', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getMedicalRecord(recordId: string) {
    return this.request(`/records/${recordId}`, {
      method: 'GET',
    })
  }

  // Notifications
  async getNotifications(userId: string) {
    return this.request(`/users/${userId}/notifications`, {
      method: 'GET',
    })
  }

  async markNotificationRead(notificationId: string) {
    return this.request(`/notifications/${notificationId}`, {
      method: 'PUT',
      body: JSON.stringify({ read: true }),
    })
  }

  // Emergency
  async createEmergencyAlert(data: any) {
    return this.request('/emergency', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // BioSync - Step 1
  async registerBioSyncUser(data: {
    name: string
    age: number
    gender: 'male' | 'female' | 'other'
    heightCm: number
    weightKg: number
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete'
  }) {
    return this.request('/biosync/users/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getBioSyncUser(userId: string) {
    return this.request(`${this.biosyncUserPath(userId)}`, {
      method: 'GET',
    })
  }

  // BioSync - Steps 2 to 4, 15
  async uploadBloodReport(
    userId: string,
    data: {
      source: 'manual' | 'pdf'
      reportDate: string
      markers?: {
        iron: number
        vitaminD: number
        vitaminB12: number
        magnesium: number
        bloodSugar: number
        cholesterol: number
      }
      pdfFileName?: string
      pdfUrl?: string
    }
  ) {
    return this.request(`${this.biosyncUserPath(userId)}/blood-reports`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async uploadBloodReportPdf(userId: string, file: File, reportDate: string) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('reportDate', reportDate)

    return this.request(`${this.biosyncUserPath(userId)}/blood-reports/upload`, {
      method: 'POST',
      body: formData,
    })
  }

  async getBloodReports(userId: string) {
    return this.request(`${this.biosyncUserPath(userId)}/blood-reports`, {
      method: 'GET',
    })
  }

  async getBloodReportAnalysis(userId: string, reportId?: string) {
    const query = reportId ? `?reportId=${encodeURIComponent(reportId)}` : ''
    return this.request(
      `${this.biosyncUserPath(userId)}/blood-reports/analysis${query}`,
      {
        method: 'GET',
      }
    )
  }

  async getBloodReportFreshness(userId: string) {
    return this.request(`${this.biosyncUserPath(userId)}/blood-reports/freshness`, {
      method: 'GET',
    })
  }

  async getBloodReportReminders(userId: string) {
    return this.request(`${this.biosyncUserPath(userId)}/blood-reports/reminders`, {
      method: 'GET',
    })
  }

  // BioSync - Steps 5 to 9
  async updateLifestyleProfile(
    userId: string,
    data: { diet: 'veg' | 'vegan' | 'eggetarian' | 'non-veg'; allergies: string[] }
  ) {
    return this.request(`${this.biosyncUserPath(userId)}/lifestyle`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async getLifestyleProfile(userId: string) {
    return this.request(`${this.biosyncUserPath(userId)}/lifestyle`, {
      method: 'GET',
    })
  }

  async syncWearableData(
    userId: string,
    data: {
      date: string
      steps: number
      restingHeartRate: number
      hrv: number
      sleepHours: number
      workoutMinutes: number
      caloriesBurned?: number
      waterIntakeMl?: number
    }
  ) {
    return this.request(`${this.biosyncUserPath(userId)}/wearables`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getWearableData(userId: string, limit?: number) {
    const query = typeof limit === 'number' ? `?limit=${limit}` : ''
    return this.request(`${this.biosyncUserPath(userId)}/wearables${query}`, {
      method: 'GET',
    })
  }

  async logMood(
    userId: string,
    data: {
      date: string
      mood: 'happy' | 'calm' | 'neutral' | 'anxious' | 'stressed' | 'overwhelmed'
      note?: string
    }
  ) {
    return this.request(`${this.biosyncUserPath(userId)}/mood-logs`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getMoodLogs(userId: string, limit?: number) {
    const query = typeof limit === 'number' ? `?limit=${limit}` : ''
    return this.request(`${this.biosyncUserPath(userId)}/mood-logs${query}`, {
      method: 'GET',
    })
  }

  async getDynamicReminders(userId: string) {
    return this.request(`${this.biosyncUserPath(userId)}/dynamic-reminders`, {
      method: 'GET',
    })
  }

  async updateBioRoutineSettings(
    userId: string,
    data: { enabled: boolean; wakeTime?: string }
  ) {
    return this.request(`${this.biosyncUserPath(userId)}/bio-routine`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async getBioRoutine(userId: string) {
    return this.request(`${this.biosyncUserPath(userId)}/bio-routine`, {
      method: 'GET',
    })
  }

  // BioSync - Steps 10 to 17
  async getNutritionPlan(userId: string) {
    return this.request(`${this.biosyncUserPath(userId)}/nutrition`, {
      method: 'GET',
    })
  }

  async getThrottleDecision(userId: string) {
    return this.request(`${this.biosyncUserPath(userId)}/throttle`, {
      method: 'GET',
    })
  }

  async getLongevityScore(userId: string) {
    return this.request(`${this.biosyncUserPath(userId)}/longevity`, {
      method: 'GET',
    })
  }

  async getWeeklyHealthDelta(userId: string) {
    return this.request(`${this.biosyncUserPath(userId)}/weekly-health-delta`, {
      method: 'GET',
    })
  }

  async getBiomarkerTrends(userId: string) {
    return this.request(`${this.biosyncUserPath(userId)}/biomarker-trends`, {
      method: 'GET',
    })
  }

  async getLabPrompt(userId: string) {
    return this.request(`${this.biosyncUserPath(userId)}/lab-prompt`, {
      method: 'GET',
    })
  }

  async requestLabBooking(
    userId: string,
    data: {
      preferredDate: string
      labName?: string
    }
  ) {
    return this.request(`${this.biosyncUserPath(userId)}/lab-bookings`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getLabBookings(userId: string) {
    return this.request(`${this.biosyncUserPath(userId)}/lab-bookings`, {
      method: 'GET',
    })
  }

  async getContinuousCycleSummary(userId: string) {
    return this.request(`${this.biosyncUserPath(userId)}/cycle`, {
      method: 'GET',
    })
  }
}

export const apiService = new ApiService()
