# DeedLock Holmes Frontend

Premium, verification-first frontend for a property registration MVP.

## Stack

- React + Vite + TypeScript
- Tailwind CSS
- React Router
- Framer Motion
- lucide-react

## Setup

```bash
npm install
npm run dev
```

Open the local URL shown by Vite (usually `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## Quick Walkthrough

1. Go to `/` to view the landing page.
2. Use `/login` or `/signup` for mock authentication.
3. After login, access `/register` to upload a PDF deed (max 10MB).
4. Click **Validate & Register** to run a 3-step animated registry flow.
5. If approved, see the verification summary with confidence score, fraud risk, timestamp, and on-chain account.
6. Use **View on Explorer** to open a placeholder explorer URL.
7. Visit `/dashboard` to browse registered properties.
8. Use search, fraud risk filter, and sorting controls.
9. Copied account addresses show a **Copied** toast.

## Mock API / Persistence

- Mock API lives in `src/api/propertyApi.ts`.
- `registerProperty(file)` simulates validation and either:
  - stores a successful property in `localStorage`, or
  - returns a rejection reason.
- `getAllProperties()` returns persisted records from `localStorage`.

Storage key: `deedlock_holmes_properties_v1`

## Structure

- `src/components/Navbar.tsx`
- `src/components/UploadCard.tsx`
- `src/components/ProgressSteps.tsx`
- `src/components/VerificationSummary.tsx`
- `src/components/PropertyCard.tsx`
- `src/pages/Register.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/Login.tsx`
- `src/pages/Signup.tsx`
- `src/api/propertyApi.ts`
- `src/api/authApi.ts`
- `src/types/property.ts`
- `src/utils/format.ts`
- `src/utils/clipboard.ts`
- `src/utils/toast.ts`
