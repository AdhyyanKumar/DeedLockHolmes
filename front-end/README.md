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

Create `front-end/.env` if you need a non-default backend URL:

```bash
VITE_API_BASE_URL=http://localhost:5000/api
```

## Build

```bash
npm run build
npm run preview
```

## Quick Walkthrough

1. Go to `/` to view the landing page.
2. Use `/login` or `/signup` to start Google OAuth.
3. After login, access `/register`, enter the property address and owner name, and upload a PDF deed (max 10MB).
4. Click **Validate & Register** to run the backend verification and registration flow.
5. If approved, see the verification summary with confidence score, fraud risk, timestamp, and on-chain account.
6. Use **View on Explorer** to open the Solana explorer transaction.
7. Visit `/dashboard` to browse properties loaded from the backend.
8. Use search, fraud risk filter, and sorting controls.
9. Copied account addresses show a **Copied** toast.

## API / Persistence

- Auth uses Google OAuth through the backend.
- `registerProperty(file, propertyAddress, ownerName)` uploads the deed to the backend.
- `getAllProperties()` reads persisted property analytics from the backend.
- The backend stores auth users, auth events, and property analytics in Snowflake.

Backend env vars are documented in [`.env.example`](/Users/anshmathur/Deedlock Holmes/DeedLockHolmes/backend/.env.example).

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
