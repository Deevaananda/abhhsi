'use client'

import { useState, useEffect } from 'react'
import {
  Droplets,
  FlaskConical,
  Gauge,
  ShieldAlert,
  UserRound,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { apiService } from '@/lib/api-service'

const BIOSYNC_USER_ID_KEY = 'biosyncUserId'

interface DashboardData {
  profileName: string
  currentStep: number
  bloodFreshness: {
    isFresh: boolean
    daysOld: number
  } | null
  hydrationTargetMl: number | null
  longevityScore: number | null
  longevityPillars:
    | {
        fuel: number
        recovery: number
        resilience: number
        output: number
      }
    | null
  cycleSummary: {
    bloodData: string
    routine: string
    activity: string
    weeklyInsights: string
    longevity: string
    nextActions: string[]
  } | null
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)
        const storedUserId = localStorage.getItem(BIOSYNC_USER_ID_KEY)
        setUserId(storedUserId)

        if (!storedUserId) {
          setLoading(false)
          return
        }

        const [user, freshness, reminders, longevity, cycle] = await Promise.all([
          apiService.getBioSyncUser(storedUserId),
          apiService.getBloodReportFreshness(storedUserId),
          apiService.getDynamicReminders(storedUserId),
          apiService.getLongevityScore(storedUserId),
          apiService.getContinuousCycleSummary(storedUserId),
        ])

        if (!user.success || !user.data) {
          throw new Error(user.error ?? 'Unable to load BioSync profile.')
        }

        setDashboardData({
          profileName: user.data.profile?.name ?? 'User',
          currentStep: user.data.currentStep ?? 1,
          bloodFreshness: freshness.success
            ? {
                isFresh: freshness.data?.freshness?.isFresh ?? false,
                daysOld: freshness.data?.freshness?.daysOld ?? 0,
              }
            : null,
          hydrationTargetMl: reminders.success
            ? reminders.data?.reminders?.hydration?.targetMl ?? null
            : null,
          longevityScore: longevity.success ? longevity.data?.longevity?.score ?? null : null,
          longevityPillars: longevity.success
            ? longevity.data?.longevity?.pillars ?? null
            : null,
          cycleSummary: cycle.success
            ? {
                bloodData: cycle.data?.cycleSummary?.cycle?.bloodData ?? 'Unavailable',
                routine: cycle.data?.cycleSummary?.cycle?.routine ?? 'Unavailable',
                activity: cycle.data?.cycleSummary?.cycle?.activity ?? 'Unavailable',
                weeklyInsights:
                  cycle.data?.cycleSummary?.cycle?.weeklyInsights ?? 'Unavailable',
                longevity: cycle.data?.cycleSummary?.cycle?.longevity ?? 'Unavailable',
                nextActions: cycle.data?.cycleSummary?.nextActions ?? [],
              }
            : null,
        })
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load dashboard data.'
        )
      } finally {
        setLoading(false)
      }
    }

    void loadDashboard()
  }, [])

  const metrics = [
    {
      label: 'Current BioSync Step',
      value: dashboardData ? `Step ${dashboardData.currentStep}/17` : 'Not started',
      icon: Gauge,
    },
    {
      label: 'Blood Report Freshness',
      value: dashboardData?.bloodFreshness
        ? dashboardData.bloodFreshness.isFresh
          ? `Fresh (${dashboardData.bloodFreshness.daysOld} days old)`
          : `Stale (${dashboardData.bloodFreshness.daysOld} days old)`
        : 'No report uploaded',
      icon: FlaskConical,
    },
    {
      label: 'Hydration Target',
      value: dashboardData?.hydrationTargetMl
        ? `${dashboardData.hydrationTargetMl} ml/day`
        : 'Needs wearable + mood data',
      icon: Droplets,
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {dashboardData ? `Welcome Back, ${dashboardData.profileName}` : 'BioSync Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            Real-time status of your Biological Foundation and personalization pipeline.
          </p>
        </div>

        {!userId && !loading && (
          <Card className="p-6 mb-8 border-dashed">
            <h2 className="text-xl font-bold mb-2">No BioSync Profile Found</h2>
            <p className="text-muted-foreground mb-4">
              Complete Step 1 baseline registration to activate your dashboard.
            </p>
            <Link href="/register">
              <Button>
                Start BioSync Registration <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </Card>
        )}

        {error && (
          <Card className="p-4 mb-8 border-destructive/30 bg-destructive/10">
            <p className="text-sm text-destructive">{error}</p>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link href="/register">
            <Button className="w-full justify-start" size="lg">
              <UserRound className="h-5 w-5 mr-2" />
              Update Baseline
            </Button>
          </Link>
          <Link href="/records">
            <Button variant="outline" className="w-full justify-start" size="lg">
              <FlaskConical className="h-5 w-5 mr-2" />
              Upload Blood Report
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="outline" className="w-full justify-start text-destructive" size="lg">
              <ShieldAlert className="h-5 w-5 mr-2" />
              Review Alerts
            </Button>
          </Link>
        </div>

        {/* Core Metrics */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <Card key={index} className="p-6">
              {loading ? (
                <>
                  <Skeleton className="h-5 w-24 mb-2" />
                  <Skeleton className="h-8 w-32" />
                </>
              ) : (
                <>
                  <metric.icon className="h-5 w-5 text-primary mb-3" />
                  <p className="text-sm text-muted-foreground mb-2">{metric.label}</p>
                  <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                </>
              )}
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Longevity */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Longevity Score</h2>
              <Link href="/notifications">
                <Button variant="ghost" size="sm" className="gap-1">
                  Open Insights <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-60" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData?.longevityScore !== null ? (
                  <>
                    <div className="border border-border rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-2">Overall Score</p>
                      <p className="text-3xl font-bold text-foreground">
                        {dashboardData?.longevityScore}/100
                      </p>
                    </div>

                    {dashboardData?.longevityPillars && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="border border-border rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Fuel</p>
                          <p className="font-semibold">{dashboardData.longevityPillars.fuel}</p>
                        </div>
                        <div className="border border-border rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Recovery</p>
                          <p className="font-semibold">{dashboardData.longevityPillars.recovery}</p>
                        </div>
                        <div className="border border-border rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Resilience</p>
                          <p className="font-semibold">{dashboardData.longevityPillars.resilience}</p>
                        </div>
                        <div className="border border-border rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Output</p>
                          <p className="font-semibold">{dashboardData.longevityPillars.output}</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Longevity score will unlock after completing prerequisite BioSync steps.
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* Continuous Monitoring */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Continuous Monitoring Cycle</h2>
              <Link href="/settings">
                <Button variant="ghost" size="sm" className="gap-1">
                  Manage <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-60" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData?.cycleSummary ? (
                  <>
                    <div className="border border-border rounded-lg p-4">
                      <p className="font-medium text-foreground mb-2">Cycle Status</p>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>{dashboardData.cycleSummary.bloodData}</p>
                        <p>{dashboardData.cycleSummary.routine}</p>
                        <p>{dashboardData.cycleSummary.activity}</p>
                        <p>{dashboardData.cycleSummary.weeklyInsights}</p>
                        <p>{dashboardData.cycleSummary.longevity}</p>
                      </div>
                    </div>

                    <div className="border border-border rounded-lg p-4">
                      <p className="font-medium text-foreground mb-2">Next Actions</p>
                      {dashboardData.cycleSummary.nextActions.length > 0 ? (
                        <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                          {dashboardData.cycleSummary.nextActions.map((action) => (
                            <li key={action}>{action}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No blockers. Your BioSync cycle is progressing.
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Cycle summary unlocks after completing full prerequisite steps.
                  </p>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
