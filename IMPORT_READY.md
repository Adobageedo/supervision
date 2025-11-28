# ✅ Import Script Ready!

## What Was Fixed

### Issue: Integer IDs vs UUID Database
Your CSV files use integer IDs (1, 2, 33, 144, etc.) but the PostgreSQL database expects UUIDs.

### Solution: Automatic Conversion ✅
The import script now automatically converts integer IDs to deterministic UUIDs using UUID v5.

---

## Changes Made to `import_data.py`

### 1. Added UUID Conversion Function
```python
def _int_to_uuid(value, namespace='supervision'):
    """Convert integer ID to deterministic UUID v5."""
    namespace_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, namespace)
    return str(uuid.uuid5(namespace_uuid, str(value)))
```

### 2. Updated Schema Casting
All `uuid` type fields now use the conversion function:
- `id` (primary keys)
- `parentId`, `companyId`, `createdById`, `updatedById`, etc.

### 3. Removed Integer ID Rejection
Previously, the script dropped integer IDs. Now it converts them!

### 4. Added Helpful Messages
Shows when integer IDs are being converted:
```
🔄 Converting integer IDs to UUIDs for companies
🔄 Converting integer IDs to UUIDs for intervenants
```

---

## How It Works

### Your CSV (Integer IDs)
```csv
id,name,companyId
1,John Doe,33
2,Jane Smith,144
```

### Database (UUIDs)
```
id: fa96ec60-5183-56d6-b596-095bc2fc969d
name: John Doe
companyId: 7b5e71aa-7d82-541e-a83e-d26f712b94fc
```

### Key Benefits
- ✅ **Deterministic**: Same integer always maps to same UUID
- ✅ **Consistent**: Re-importing produces same UUIDs
- ✅ **Automatic**: No manual work needed
- ✅ **Preserves relationships**: Foreign keys work correctly

---

## Ready to Import!

### Step 1: Verify CSV Files
Your files are already converted to UTF-8 with comma delimiters:
```bash
ls -la csv_data/
```

Should show:
- ✅ `users.csv` (2 rows)
- ✅ `predefined_values.csv` (393 rows)
- ✅ `companies.csv`
- ✅ `intervenants.csv`
- ✅ `interventions.csv`
- ✅ `audit_logs.csv`

### Step 2: Run Import
```bash
cd /Users/edoardo/Documents/Supervision
python import_data.py
```

### Step 3: Answer Prompts
1. **Regenerate sample CSV templates?** → `no`
2. **Clear existing data before import?** → `yes`
3. **Confirm deletion?** → `yes`

### Step 4: Watch the Magic ✨
```
📊 Importing users...
📄 Read 2 rows from users.csv (encoding: utf-8, delimiter: ',')
  🔐 Hashed password for admin@supervision.com
  🔐 Hashed password for operator@supervision.com
✅ Imported 2/2 rows into users

📊 Importing predefined_values...
📄 Read 393 rows from predefined_values.csv (encoding: utf-8, delimiter: ',')
🔄 Converting integer IDs to UUIDs for predefined_values
✅ Imported 393/393 rows into predefined_values

📊 Importing companies...
🔄 Converting integer IDs to UUIDs for companies
✅ Imported X/X rows into companies

📊 Importing intervenants...
🔄 Converting integer IDs to UUIDs for intervenants
✅ Imported X/X rows into intervenants

📊 Importing interventions...
✅ Imported X/X rows into interventions

📊 Importing audit_logs...
✅ Imported X/X rows into audit_logs

============================================================
✅ Import complete! Total rows imported: XXX
============================================================
```

---

## What Gets Imported

### Users (2 rows)
- `admin@supervision.com` / `Admin123!` (admin role)
- `operator@supervision.com` / `Admin123!` (user role)
- Passwords automatically hashed with bcrypt

### Predefined Values (393 rows)
- **57 Centrales**: ANNET, BORGO, CHÂTEAU, etc.
- **273 Équipements**: Inverters, transformers, etc.
- **42 Types de dysfonctionnement**: Découplage, Automate, etc.
- **21 Types d'événement**: Curatif, Preventive, etc.

All with proper parent-child relationships via `parentId`!

### Companies
Your company data with integer IDs → UUID conversion

### Intervenants
Your intervenant data with `companyId` foreign keys working correctly

### Interventions
New simplified schema with embedded intervenant fields

---

## After Import

### Start the Application
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

### Login
- URL: http://localhost:4200
- Email: `admin@supervision.com`
- Password: `Admin123!`

### Verify Data
1. **Dashboard** - Should show statistics
2. **Interventions List** - Should load without errors
3. **Create Intervention** - Dropdowns populated with your data
4. **Predefined Values** - All 393 values available

---

## Troubleshooting

### If Import Fails

**Check encoding:**
```bash
python convert_csv_format.py
```

**Check database connection:**
```bash
psql -h localhost -p 4201 -U supervision_user -d supervision_maintenance
```

**Check CSV format:**
- Delimiter: Comma (`,`)
- Encoding: UTF-8
- Headers: Match database column names

**View detailed errors:**
The script shows exactly which row failed and why.

---

## Documentation Reference

- **`CSV_IMPORT_GUIDE.md`** - Complete import guide
- **`INTEGER_ID_MAPPING.md`** - How integer→UUID conversion works
- **`FIELD_MAPPING_REFERENCE.md`** - Database field mappings
- **`DEPLOYMENT_SUMMARY.md`** - Overall deployment status

---

## 🎉 You're All Set!

Your import script is now fully compatible with:
- ✅ Integer IDs (auto-converted to UUIDs)
- ✅ Multiple encodings (auto-detected)
- ✅ Multiple delimiters (auto-detected)
- ✅ Password hashing (automatic)
- ✅ New simplified intervention schema
- ✅ All relationships preserved

Just run `python import_data.py` and watch it work!

---

**Last Updated:** 2025-11-28  
**Script Version:** 2.0.1  
**Status:** ✅ READY TO IMPORT
