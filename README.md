# DeedLock Holmes

> AI-powered property deed registry on Solana — built at HenHacks 2025

DeedLock Holmes makes property deed registration trustworthy by combining AI-based fraud screening, Google-authenticated user actions, and immutable blockchain-backed records. Every deed is analyzed by Gemini AI before it ever touches the blockchain.

---

## Team

| Name | Role |
|---|---|
| Adhyyan Kumar | Blockchain & Backend |
| Ansh Mathur | Backend & Database |
| Yashovardhan Saraswat | Frontend & Integration |

---

## The Problem

Property deed fraud is a multi-billion dollar problem. Forged documents, duplicate registrations, and fraudulent transfers happen because traditional registries have no automated verification layer — a human signs off, a document gets filed, and bad actors exploit the gap. There is no immutable source of truth.

---

## The Solution

DeedLock Holmes gives every deed three layers of protection before it is accepted:

1. **AI Fraud Screening** — Gemini AI reads the uploaded PDF, extracts key data, and assigns a fraud risk score (Low / Medium / High) with a confidence percentage and written analysis.
2. **Duplicate Prevention** — If the property address already exists in the system, registration is blocked immediately with a clear message.
3. **Blockchain Recording** — Deeds that pass AI screening are recorded on Solana devnet, producing an immutable transaction signature and a verifiable on-chain account address.

---

## Features

- **Register a Property** — Upload a deed PDF, provide the property address, owner name, and sale price. Gemini analyzes the document; if it passes, the record is written to Solana and stored in MongoDB.
- **AI Verification Summary** — After registration, users see a full breakdown: confidence score, fraud risk badge, AI-written analysis, risk factors, and a recommendation (APPROVE / REVIEW REQUIRED / REJECT).
- **On-Chain Account** — Every registered property receives a Solana PDA (Program Derived Address) and a link to the Solana Explorer transaction.
- **Browse Properties** — Public dashboard showing all registered properties with fraud risk indicators, confidence scores, owner info, and transfer history.
- **My Properties** — Authenticated view showing only properties registered by the logged-in user.
- **Property Transfer** — Owners can transfer a property to a new buyer (name + email). The transfer is recorded on-chain and the property record in MongoDB is updated with the new owner and previous owner history.
- **Duplicate Guard** — Attempting to register an already-registered address returns a distinct amber warning instead of a generic error.
- **Google OAuth** — All write operations (register, transfer) require authentication via Google. Sessions are managed server-side with secure cookies.

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite | Build tool |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| React Router v6 | Client-side routing |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| Google Gemini AI | Deed fraud analysis |
| Solana Web3.js + Anchor | Blockchain interaction |
| MongoDB Atlas | Property records & analytics |
| Multer | PDF file upload handling |
| pdf-parse | PDF text extraction |
| Google OAuth 2.0 | Authentication |

### Blockchain
| Component | Detail |
|---|---|
| Network | Solana Devnet |
| Program | Custom Anchor program + SPL Memo fallback |
| Program ID | `5GGuCnwt8Lk3c9ZJMKLjQYAuD5wwihP73RKNuEFmTB7G` |
| On-chain data | Property ID, deed hash, owner, timestamp |

### Infrastructure
| Service | Purpose |
|---|---|
| Render | Backend hosting |
| Vercel / Static host | Frontend hosting |
| MongoDB Atlas | Cloud database |

---

## Architecture

```
User (Browser)
     │
     ▼
React Frontend  ──────────────────────────────────────────┐
     │                                                     │
     │  REST API (HTTPS)                                   │
     ▼                                                     │
Express Backend (Render)                                   │
     │                                                     │
     ├──▶ Google Gemini AI  ──▶ Fraud analysis             │
     │                          (risk score, factors,      │
     │                           recommendation)           │
     │                                                     │
     ├──▶ Solana Devnet  ──────▶ Immutable tx record       │
     │    (SPL Memo / Anchor)    (PDA + tx signature)      │
     │                                                     │
     └──▶ MongoDB Atlas  ──────▶ Property analytics,       │
                                 transfer history,         │
                                 user auth events          │
                                                           │
     ◀─────────────────────────────────────────────────────┘
        Property record + Explorer URL + AI summary
```

---

## Project Structure

```
DeedLockHolmes/
├── backend/
│   ├── server.js               # Express app entry point
│   ├── auth.js                 # Google OAuth + session middleware
│   ├── config/
│   │   └── blockchain.js       # Solana connection + Anchor setup
│   ├── routes/
│   │   ├── property.routes.js  # Register, transfer, list, analyze
│   │   ├── auth.routes.js      # OAuth login/logout/callback
│   │   ├── analytics.routes.js # Usage analytics
│   │   └── verification.routes.js
│   ├── services/
│   │   ├── solana.service.js   # On-chain registration + transfer
│   │   ├── gemini.service.js   # AI deed analysis
│   │   ├── mongo.service.js    # MongoDB operations
│   │   └── email.service.js    # Transfer confirmation emails
│   ├── utils/
│   │   └── hash.js             # SHA-256 deed hashing
│   └── idl/
│       └── property_registry.json  # Anchor program IDL
│
└── front-end/
    └── src/
        ├── pages/
        │   ├── Landing.tsx      # Home page
        │   ├── Register.tsx     # Property registration flow
        │   ├── Dashboard.tsx    # Browse all properties
        │   ├── MyProperties.tsx # User's own properties
        │   ├── About.tsx        # About page
        │   ├── Login.tsx        # Login page
        │   └── Signup.tsx       # Signup page
        ├── components/
        │   ├── PropertyCard.tsx       # Property display card
        │   ├── VerificationSummary.tsx # Post-registration AI summary
        │   ├── TransferModal.tsx      # Property transfer UI
        │   ├── UploadCard.tsx         # Deed upload form
        │   ├── ProgressSteps.tsx      # Registration progress indicator
        │   └── Navbar.tsx             # Navigation + auth modal
        ├── api/
        │   ├── propertyApi.ts   # Property API calls
        │   └── authApi.ts       # Auth API calls
        └── types/
            └── property.ts      # TypeScript interfaces
```

---

## How It Works — Registration Flow

```
1. User uploads deed PDF + fills in address, owner name, sale price
2. Backend extracts text from PDF (pdf-parse)
3. Gemini AI analyzes the deed text → returns risk score, factors, recommendation
4. If risk score ≥ 90 or recommendation = REJECT → blocked, not recorded
5. If address already exists in MongoDB → blocked with "Property Already Exists"
6. Otherwise → SHA-256 hash of deed computed
7. Record written to Solana devnet (Anchor program or SPL Memo fallback)
8. Property stored in MongoDB with tx signature and PDA
9. Frontend shows Verification Summary with full AI breakdown
```

---

## Environment Variables

### Backend (`.env`)
```
PORT=3001
SOLANA_RPC=https://api.devnet.solana.com
WALLET_PATH=/path/to/solana/wallet.json
PROGRAM_ID=5GGuCnwt8Lk3c9ZJMKLjQYAuD5wwihP73RKNuEFmTB7G
GEMINI_API_KEY=your_gemini_api_key
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB_NAME=deedlock_holmes
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_session_secret
```

### Frontend (`.env.local`)
```
VITE_API_BASE_URL=http://localhost:3001/api
```

---

## Running Locally

### Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in your keys
npm run dev
```

### Frontend
```bash
cd front-end
npm install
cp .env.example .env.local   # set VITE_API_BASE_URL
npm run dev
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/properties` | No | List all registered properties |
| GET | `/api/properties/mine` | Yes | List current user's properties |
| GET | `/api/properties/:id` | No | Get property by ID |
| POST | `/api/properties/register` | Yes | Register new property (multipart/form-data) |
| POST | `/api/properties/:id/transfer` | Yes | Transfer property to new owner |
| GET | `/api/properties/:id/analyze` | No | Get AI analysis for a property |
| GET | `/api/auth/google` | No | Begin Google OAuth flow |
| GET | `/api/auth/google/callback` | No | OAuth callback |
| GET | `/api/auth/me` | Yes | Get current user |
| POST | `/api/auth/logout` | Yes | Log out |

---

## License

MIT — built for HenHacks 2025.
