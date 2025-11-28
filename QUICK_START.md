# 🚀 Quick Start Guide

## Prerequisites
- PostgreSQL running on `localhost:4201`
- Node.js installed
- Database `supervision_maintenance` created
- User `supervision_user` with appropriate permissions

---

## 1. Start PostgreSQL

Ensure your PostgreSQL instance is running and accessible:
```bash
# Check if running
psql -h localhost -p 4201 -U supervision_user -d supervision_maintenance -c "SELECT version();"
```

---

## 2. Start Backend Server

```bash
cd /Users/edoardo/Documents/Supervision/backend

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

**Expected Output:**
```
🔍 [Database Config] {
  host: 'localhost',
  port: 4201,
  username: 'supervision_user',
  database: 'supervision_maintenance',
  NODE_ENV: 'development'
}
✅ Data Source has been initialized!
🚀 Server is running on port 4202
📍 API available at http://localhost:4202/api
```

**Backend will be available at:** `http://localhost:4202`

---

## 3. Start Frontend Application

Open a **new terminal** window:

```bash
cd /Users/edoardo/Documents/Supervision/frontend

# Install dependencies (if not already done)
npm install

# Start development server
npm start
```

**Expected Output:**
```
** Angular Live Development Server is listening on localhost:4200 **
✔ Compiled successfully.
```

**Frontend will be available at:** `http://localhost:4200`

---

## 4. Login to Application

### Default Admin Credentials
- **Email:** `admin@supervision.com`
- **Password:** `Admin123!`

### Login Process
1. Open browser to `http://localhost:4200`
2. Click "Login" or navigate to `/login`
3. Enter credentials above
4. You should be redirected to the dashboard

---

## 5. Test Basic Functionality

### ✅ View Interventions List
1. Navigate to "Interventions" menu
2. List should load without errors
3. You should see existing interventions (if any)

### ✅ Create New Intervention
1. Click "+ Nouvelle Intervention" button
2. Fill required fields:
   - **Titre Événement** (required)
   - **Centrale** (required)
   - **Équipement** (required)
   - **Date Référence** (required)
3. Optional: Add intervention details
   - Société Intervenant
   - Intervenants Enregistrés
   - Nombre d'intervenants
4. Click "Enregistrer"
5. Should see success message

### ✅ View Intervention Details
1. Click on any intervention from the list
2. Detail page should show all fields correctly
3. New schema fields should display properly

### ✅ Edit Intervention
1. From detail page, click "Modifier"
2. Form should pre-populate with existing data
3. Make changes and save
4. Should see updated data

---

## 🔧 Troubleshooting

### Problem: Backend won't start

**Error:** `Unable to compile TypeScript`
```bash
# Clear build cache
cd backend
rm -rf dist
rm -rf node_modules/.cache
npm run dev
```

**Error:** `Database connection failed`
- Check PostgreSQL is running: `pg_isready -h localhost -p 4201`
- Verify credentials in `.env` file
- Check database exists: `psql -h localhost -p 4201 -U supervision_user -l`

### Problem: Frontend build errors

**Error:** `Cannot find module`
```bash
# Clear and reinstall
cd frontend
rm -rf node_modules
rm package-lock.json
npm install
npm start
```

**Error:** `Port 4200 already in use`
```bash
# Kill existing process
lsof -ti:4200 | xargs kill -9
npm start
```

### Problem: 401 Unauthorized errors

**Cause:** Token expired or invalid
```bash
# Solution: Logout and login again
# Or clear browser localStorage:
localStorage.clear()
location.reload()
```

### Problem: 500 errors when loading interventions

**Check backend logs** for specific error message:
```bash
# Look for error stack trace in terminal
# Common issues:
# - Invalid sortBy field → Fixed with validation
# - Database field mismatch → Check FIELD_MAPPING_REFERENCE.md
```

---

## 📊 API Health Check

Test if backend is responding:

```bash
# Get API version
curl http://localhost:4202/api/health

# Login (get token)
curl -X POST http://localhost:4202/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@supervision.com","password":"Admin123!"}'

# Get interventions (replace <TOKEN> with actual token)
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:4202/api/interventions?page=1&limit=10
```

---

## 🎯 Post-Deployment Checklist

After starting both servers, verify:

- [ ] Backend responds to health check
- [ ] Frontend loads login page
- [ ] Login works with admin credentials
- [ ] Dashboard shows statistics
- [ ] Interventions list loads
- [ ] Can create new intervention
- [ ] Can edit existing intervention
- [ ] Can view intervention details
- [ ] No console errors in browser
- [ ] No 500 errors in backend logs

---

## 🔥 Common First-Time Setup Issues

### 1. Database Migration Not Run
```bash
cd backend
npm run migration:run
```

### 2. Missing Environment Variables
Check `.env` file exists with:
```env
DATABASE_HOST=localhost
DATABASE_PORT=4201
DATABASE_USER=supervision_user
DATABASE_PASSWORD=your_password
DATABASE_NAME=supervision_maintenance
JWT_SECRET=your_secret_key
PORT=4202
```

### 3. Node Version Incompatibility
Recommended: Node.js 18.x or 20.x
```bash
node --version  # Should be v18.x or v20.x
```

---

## 📚 Additional Resources

- **Production Checklist:** See `PRODUCTION_READY_CHECKLIST.md`
- **Field Mapping:** See `FIELD_MAPPING_REFERENCE.md`
- **Schema Changes:** See `SCHEMA_SIMPLIFIED.md`
- **API Documentation:** Available at `http://localhost:4202/api-docs` (if configured)

---

## 🆘 Need Help?

If you encounter issues not covered here:

1. Check backend terminal logs for errors
2. Check browser console for frontend errors
3. Verify database connection and schema
4. Review `FIELD_MAPPING_REFERENCE.md` for field name consistency
5. Ensure all dependencies are installed

---

**Last Updated:** 2025-11-28  
**Version:** 2.0.0 (Simplified Schema)
