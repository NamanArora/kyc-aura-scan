# KYC Aura Scan

![demo](https://github.com/user-attachments/assets/59e93509-1805-4dcc-85ed-c2cc982d288c)


AI-Powered Video KYC with Multi-Modal Deepfake Detection

## Problem Context

Digital identity verification is under threat from AI-generated deepfakes and replay attacks. Existing Video KYC solutions often rely on single-layer liveness checks (e.g., blink detection), which can be bypassed. Hybrid ecosystems (cloud + on-prem) require continuous identity assurance that is both secure and scalable.

## Core Innovation

Our solution introduces a multi-modal, parallelized deepfake-resistant verification pipeline that combines:

- **Behavioral cues** (prompted liveness actions, micro-dynamics)
- **Visual forensics** (GAN artifact detection, 3D consistency checks)
- **Temporal integrity** (loop/replay detection)
- **Cross-modal validation** (lip–audio sync for prompted phrases)
- **ID binding** (face-to-ID photo verification)

The innovation lies in running all checks independently and in parallel, then fusing results into a probability matrix that feeds a fusion engine for final decision-making.

## Key Features

### Parallelized Multi-Check Engine
Ensures no single-point failure; deepfakes fail across multiple dimensions.

### Active + Passive Defenses
- **Active**: random prompts (blink, head turn, read digits)
- **Passive**: forensic CNN spotting GAN fingerprints

### Cross-Modal Fusion
Lip movements aligned with audio speech to defeat dubbed/fake audio overlays.

### Temporal Security Layer
Replay detection using frame hashing and fps anomaly detection.

### Realtime Probability Matrix Dashboard
Judges and auditors can see in real time how each check scores.

### Signed Audit Trail
Each session produces a JSON report with SHA256 integrity hash for compliance.

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd kyc-aura-scan
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **State Management**: TanStack Query
- **Form Handling**: React Hook Form + Zod
- **Charts**: Recharts
- **Icons**: Lucide React

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── ui/            # shadcn/ui components
│   ├── ControlPanel.tsx
│   ├── PromptCard.tsx
│   └── ScoreChart.tsx
├── pages/             # Route components
│   ├── Home.tsx       # Landing page
│   ├── Upload.tsx     # Video upload
│   ├── Live.tsx       # Live camera KYC
│   └── Dashboard.tsx  # Analysis dashboard
├── hooks/             # Custom React hooks
├── lib/               # Utility libraries
└── utils/             # Business logic
    └── mockEngine.ts  # KYC simulation engine
```

## Architecture

The application simulates a comprehensive Video KYC system with:

- **Multi-modal verification checks** running in parallel
- **Real-time scoring dashboard** with live probability updates
- **Session management** with unique IDs and audit trails
- **Responsive design** optimized for both desktop and mobile
- **Mock simulation engine** demonstrating production-level KYC workflows

## License

This project is licensed under the MIT License.
