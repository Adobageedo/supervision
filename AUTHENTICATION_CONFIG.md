# Authentication Configuration

This application supports optional Firebase authentication that can be enabled or disabled via environment variables.

## How to Enable/Disable Authentication

### Frontend Configuration

Edit `frontend/src/environments/environment.ts` and `environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: '/api',
  requireAuth: true, // Set to false to disable authentication
  firebase: {
    // ... firebase config
  }
};
```

- **`requireAuth: true`** - Firebase authentication is required (default)
- **`requireAuth: false`** - No authentication required, all users have admin access

### Backend Configuration

Edit your `.env` file (or `backend/.env` for local dev):

```bash
REQUIRE_AUTH=true
```

- **`REQUIRE_AUTH=true`** - Firebase authentication is required (default)
- **`REQUIRE_AUTH=false`** - No authentication required, uses a mock admin user

## Usage Scenarios

### Scenario 1: Production with Firebase Auth (Recommended)

**Frontend** (`environment.prod.ts`):
```typescript
requireAuth: true
```

**Backend** (`.env`):
```bash
REQUIRE_AUTH=true
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="your-private-key"
```

Users must log in via Firebase. Each user gets their assigned role (admin/write/read).

---

### Scenario 2: Development without Auth (Quick Testing)

**Frontend** (`environment.ts`):
```typescript
requireAuth: false
```

**Backend** (`backend/.env`):
```bash
REQUIRE_AUTH=false
```

No login required. All users automatically get admin access. Perfect for:
- Local development
- Testing features without auth flow
- Demos

---

### Scenario 3: Mixed (Frontend no auth, Backend with auth)

Not recommended, but possible if you want to test backend auth independently.

---

## How It Works

### When `requireAuth: false` (No Auth Mode)

#### Frontend:
- `auth.guard.ts` - Allows access to all routes without checking login status
- Login page is skipped
- No Firebase initialization errors if config is missing

#### Backend:
- `auth.ts` middleware - Creates/uses a mock admin user (`no-auth@supervision.local`)
- All API requests succeed without Bearer token
- Mock user has `ADMIN` role with full permissions

### When `requireAuth: true` (Firebase Auth Mode)

#### Frontend:
- `auth.guard.ts` - Redirects to login if not authenticated
- Firebase SDK is initialized and manages auth state
- Users must sign in via Firebase

#### Backend:
- `auth.ts` middleware - Verifies Firebase ID tokens
- Creates/links users in local database
- Users get roles assigned in database

---

## Quick Start Commands

### Disable Auth for Local Development

1. **Frontend**: Change `environment.ts`:
   ```typescript
   requireAuth: false
   ```

2. **Backend**: Add to `backend/.env`:
   ```bash
   REQUIRE_AUTH=false
   ```

3. **Start services**:
   ```bash
   # Backend
   cd backend
   npm run dev

   # Frontend (new terminal)
   cd frontend
   npm start
   ```

4. **Access**: Open http://localhost:4200 - no login required!

---

### Enable Auth for Production

1. **Frontend**: Change `environment.prod.ts`:
   ```typescript
   requireAuth: true
   ```

2. **Backend**: Update `.env`:
   ```bash
   REQUIRE_AUTH=true
   FIREBASE_PROJECT_ID=supervision-61462
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@supervision-61462.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

3. **Deploy**:
   ```bash
   docker-compose -f docker-compose.prod.yml build
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Create users**: Go to Firebase Console > Authentication > Add user

---

## Security Note

⚠️ **WARNING**: `REQUIRE_AUTH=false` should **NEVER** be used in production environments. It completely bypasses authentication and gives everyone admin access.

Only use no-auth mode for:
- Local development
- Internal testing environments
- Demos on isolated networks

For production, always use `REQUIRE_AUTH=true` with proper Firebase configuration.

---

## Troubleshooting

### "Firebase not configured" warning but auth is disabled
- This is expected when `REQUIRE_AUTH=false`
- The warning is harmless - Firebase is in demo mode
- To remove the warning, set `REQUIRE_AUTH=true` and configure Firebase

### Routes still require login when `requireAuth=false`
- Check that `environment.ts` (or `environment.prod.ts`) has `requireAuth: false`
- Rebuild the frontend: `npm run build`
- Clear browser cache

### Backend still asks for token when `REQUIRE_AUTH=false`
- Check that `.env` file has `REQUIRE_AUTH=false`
- Restart the backend: `npm run dev`
- For Docker: rebuild and restart containers
