# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server (Vite on port 8080)
- `npm run build` - Production build
- `npm run build:dev` - Development mode build
- `npm run lint` - ESLint code linting
- `npm run preview` - Preview production build

### Testing
No test commands configured - this is a demo application.

## Project Architecture

### Overview
Video KYC (Know Your Customer) demo application built with React + TypeScript + Vite. Single Page Application with sophisticated mock KYC engine that simulates real-time video analysis workflows.

### Core Technologies
- **Frontend**: React 18.3.1 + TypeScript + Vite
- **UI**: shadcn/ui components + Tailwind CSS
- **State**: @tanstack/react-query for server state
- **Routing**: React Router DOM
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts for real-time visualization

### Key Architectural Components

#### Mock KYC Engine (`src/utils/mockEngine.ts`)
- **Core business logic** (415 lines) - simulates real KYC verification
- **7 security check types**: Active Liveness, Passive Forensics, Head Pose, Blur Detection, etc.
- **5 demo scenarios**: Genuine Pass, Deepfake Suspicion, Replay Attack, etc.
- **Real-time score progression** with realistic volatility simulation
- **Session management** with event logging and SHA-256 integrity hashing

#### Route Structure
- `/` - Home page with KYC method selection
- `/upload` - Video file upload with drag-and-drop
- `/live` - Live camera KYC session
- `/dashboard/:id` - Real-time analysis results dashboard

#### Component Organization
```
src/components/
├── ui/              # shadcn/ui components (40+ reusable components)
├── ControlPanel.tsx # Demo control panel
├── PromptCard.tsx   # KYC prompt display
└── ScoreChart.tsx   # Real-time score visualization
```

### Design System
- **Theme**: Yellow/White/Orange professional fintech theme
- **Path aliases**: `@/` maps to `src/`
- **Custom CSS variables**: Comprehensive design tokens in `src/index.css`
- **WCAG compliant**: Accessible color contrasts

### Data Flow
1. **No backend/database** - localStorage for session persistence
2. **Mock engine** drives all KYC simulation logic
3. **React Query** manages client-side state for real-time updates
4. **Session-based** workflow with unique IDs and event logging

### Development Notes
- Uses **React SWC** plugin for fast compilation
- **ESLint** with React-specific rules
- **TypeScript** strict mode enabled
- **Hot Module Replacement** via Vite
- Standard Vite build for static hosting

### Component Patterns
- Follow existing **shadcn/ui** component patterns
- Use **React Hook Form + Zod** for form validation
- Implement **mobile-responsive** design with `use-mobile` hook
- Use **Sonner** for toast notifications via `use-toast` hook