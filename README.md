# MedicalHacks - Healthcare Management Platform

A comprehensive, full-stack healthcare management system built with Next.js 16, React, TypeScript, and Tailwind CSS. Designed for patients, doctors, nurses, and healthcare administrators to streamline medical care delivery.

## Features

### Patient Features
- **Personal Dashboard**: Overview of health status, upcoming appointments, and recent medical records
- **Appointment Management**: Book, reschedule, and cancel appointments with doctors
- **Medical Records**: Secure access to complete medical history, prescriptions, and test results
- **Find Doctors**: Browse and search healthcare providers by specialty, location, and rating
- **Emergency Alerts**: Quick access to emergency contacts and emergency alert system
- **Health Profile**: Manage personal health information, allergies, and medical conditions
- **Notifications**: Stay updated with appointment reminders and health updates

### Doctor/Healthcare Provider Features
- **Doctor Dashboard**: Overview of patient schedules and daily appointments
- **Patient Management**: Access to complete patient profiles and medical histories
- **Appointments**: View and manage patient appointments
- **Medical Records**: Add and update patient medical records and prescriptions

### General Features
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark Mode Support**: Professional dark theme with accent colors
- **Secure Authentication**: Login/registration system with form validation
- **Settings & Preferences**: Customize notification preferences and account settings
- **Professional UI**: Medical-grade design following healthcare industry standards
- **Real-time Navigation**: Organized sidebar navigation with role-based access

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS with custom design tokens
- **Components**: shadcn/ui component library
- **Icons**: Lucide React icons
- **Form Handling**: Client-side validation with custom hooks
- **State Management**: React hooks (useState, useEffect)
- **UI Patterns**: Card-based layouts, modal dialogs, dropdown menus

## Project Structure

```
/vercel/share/v0-project/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # Login page with validation
│   │   └── register/page.tsx       # Registration page
│   ├── appointments/page.tsx       # Appointment management
│   ├── dashboard/page.tsx          # Patient dashboard
│   ├── doctor-dashboard/page.tsx   # Doctor dashboard
│   ├── directory/page.tsx          # Doctor directory with search/filter
│   ├── emergency/page.tsx          # Emergency alerts system
│   ├── notifications/page.tsx      # Notification center
│   ├── patients/page.tsx           # Patient list (for doctors)
│   ├── profile/page.tsx            # User profile management
│   ├── records/page.tsx            # Medical records viewer
│   ├── settings/page.tsx           # Account settings
│   ├── layout.tsx                  # Root layout with navigation
│   ├── page.tsx                    # Landing page
│   └── globals.css                 # Global styles & theme tokens
├── components/
│   ├── header.tsx                  # Top navigation bar
│   ├── sidebar.tsx                 # Main navigation sidebar
│   └── ui/                         # shadcn/ui components
├── lib/
│   ├── types.ts                    # TypeScript type definitions
│   ├── api-service.ts              # API client service
│   └── utils.ts                    # Utility functions
└── public/                         # Static assets
```

## Color Scheme

The app uses a professional medical-grade color palette:
- **Primary**: Medical Blue (#0066CC) - Trust and professionalism
- **Secondary**: Teal (#17A2B8) - Healthcare accent
- **Neutrals**: Gray scale for backgrounds and text
- **Destructive**: Red (#DC2626) - Alerts and warnings

## Pages & Routes

| Route | Description | User Role |
|-------|-------------|-----------|
| `/` | Landing page | All |
| `/login` | Login page | All |
| `/register` | Registration page | All |
| `/dashboard` | Patient dashboard | Patient |
| `/doctor-dashboard` | Doctor dashboard | Doctor |
| `/appointments` | Appointment management | Patient, Doctor |
| `/records` | Medical records | Patient, Doctor |
| `/patients` | Patient list | Doctor |
| `/directory` | Find doctors | Patient |
| `/emergency` | Emergency alerts | Patient |
| `/notifications` | Notification center | All |
| `/profile` | User profile | All |
| `/settings` | Account settings | All |

## Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (or npm/yarn)

### Installation

1. Clone or open the project.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Configure environment variables:
   Create `.env.local` based on `.env.example`.
   Required values:
   - `DATABASE_URL`: PostgreSQL connection string for BioSync persistence.
   - `NEXT_PUBLIC_API_BASE_URL`: frontend API base URL.
   Optional value:
   - `BLOB_READ_WRITE_TOKEN`: enables Vercel Blob storage for blood report PDFs.
4. Generate Prisma client:
   ```bash
   pnpm prisma:generate
   ```
5. Apply database schema:
   ```bash
   pnpm prisma:migrate
   ```
6. Run the development server:
   ```bash
   pnpm dev
   ```
7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## BioSync Backend

The project now includes a strict 17-step BioSync backend under App Router APIs:

- `app/api/biosync/users/register`
- `app/api/biosync/users/[userId]/*` (blood reports, wearables, mood logs, reminders, scoring, trends, lab booking, and cycle summary)

### Persistence

- Prisma schema: `prisma/schema.prisma`
- Initial SQL migration: `prisma/migrations/0001_biosync_init/migration.sql`
- Prisma lock file: `prisma/migrations/migration_lock.toml`

### Blood Report Upload Storage

- If `BLOB_READ_WRITE_TOKEN` is present, uploaded PDFs are stored in Vercel Blob.
- If omitted, files are stored locally under `public/uploads/blood-reports/<userId>/`.

## Form Validation

The app includes client-side validation for:
- Email format validation
- Password strength requirements (8+ chars, uppercase, lowercase, numbers)
- Password confirmation matching
- Required field validation
- Age and health metric validation

## Features Implementation

### Responsive Design
- Mobile-first approach with Tailwind CSS
- Flexible grid layouts (md:, lg: breakpoints)
- Touch-friendly button sizes and spacing
- Optimized navigation for small screens

### Dark Mode
- CSS custom properties for theme tokens
- Automatic dark mode detection
- Persistent theme preference support
- All components include dark mode styles

### Role-Based Access
- Patient dashboard with health-focused features
- Doctor dashboard with patient management
- Role-based navigation filtering
- Secure data display based on user role

### Data Persistence Ready
The app includes an `api-service.ts` file with:
- Base API client configuration
- Methods for all major features
- Error handling and response parsing
- Ready for backend integration

## Integration Points

The app is structured to easily integrate with:
- **Authentication**: Supabase, Auth.js, or custom backend
- **Database**: PostgreSQL, MongoDB, or any REST API
- **File Storage**: Vercel Blob, AWS S3, or similar
- **Real-time Updates**: Socket.io or WebSocket integration

## Styling & Theme

All styles use Tailwind CSS with semantic design tokens:
- Custom color palette in `globals.css`
- Consistent spacing using Tailwind scale
- Professional typography with Google Fonts
- Shadow and rounded corner presets

## Future Enhancements

- Real backend API integration
- User authentication implementation
- Database schema and migrations
- Video consultation features
- AI-powered health insights
- Prescription management system
- Insurance integration
- HIPAA compliance features
- Advanced analytics dashboard

## Best Practices Implemented

- Type-safe TypeScript throughout
- Semantic HTML and ARIA labels
- Keyboard navigation support
- Mobile-responsive layouts
- Error boundary components
- Loading states and skeletons
- Empty state messaging
- Input validation and feedback
- Accessible color contrasts
- Clean component architecture

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

This project is part of the v0 starter template and follows standard open-source licensing.

## Support

For issues, questions, or feature requests, please refer to the [v0 documentation](https://v0.dev) or create an issue in your repository.
