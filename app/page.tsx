'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Activity,
  Calendar,
  FileText,
  Shield,
  Stethoscope,
  Users,
  ArrowRight,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg">
              M
            </div>
            <span className="font-bold text-xl">MedicalHacks</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance">
            Healthcare Management Reimagined
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 text-balance">
            Connect patients, doctors, and medical professionals on a unified platform. Streamline appointments, manage medical records, and improve healthcare delivery.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto gap-2">
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Explore Features
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">Powerful Features</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Everything you need to manage healthcare efficiently and effectively.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Calendar,
                title: 'Smart Scheduling',
                description: 'Effortless appointment booking with real-time availability.',
              },
              {
                icon: FileText,
                title: 'Digital Records',
                description: 'Secure, organized medical records accessible anytime.',
              },
              {
                icon: Users,
                title: 'Patient Management',
                description: 'Comprehensive patient data and history in one place.',
              },
              {
                icon: Stethoscope,
                title: 'Doctor Directory',
                description: 'Find specialists and healthcare providers easily.',
              },
              {
                icon: Activity,
                title: 'Health Monitoring',
                description: 'Track health metrics and vital information.',
              },
              {
                icon: Shield,
                title: 'Secure & HIPAA Compliant',
                description: 'Enterprise-grade security for sensitive health data.',
              },
            ].map((feature, index) => (
              <div key={index} className="bg-background rounded-lg p-6 border border-border">
                <feature.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Healthcare?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join hospitals, clinics, and healthcare professionals using MedicalHacks to deliver better care.
          </p>
          <Link href="/register">
            <Button size="lg" className="gap-2">
              Create Your Account <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
                  M
                </div>
                <span className="font-bold">MedicalHacks</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Empowering healthcare through technology.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Features</Link></li>
                <li><Link href="#" className="hover:text-foreground">Pricing</Link></li>
                <li><Link href="#" className="hover:text-foreground">Security</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">About</Link></li>
                <li><Link href="#" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Privacy</Link></li>
                <li><Link href="#" className="hover:text-foreground">Terms</Link></li>
                <li><Link href="#" className="hover:text-foreground">Compliance</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 MedicalHacks. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
