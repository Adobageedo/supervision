# CSV Import Guide - Updated for New Schema

## ✅ What Was Fixed

### 1. **import_data.py Updates**
- ✅ Removed `intervention_intervenants` table references
- ✅ Updated `interventions` schema to new simplified fields
- ✅ Auto-detects CSV delimiters (comma, semicolon, tab)
- ✅ Auto-detects file encoding (UTF-8, Latin-1, ISO-8859-1, Windows-1252)
- ✅ Added password hashing for plain text passwords
- ✅ Supports both `DATABASE_*` and `DB_*` environment variables

### 2. **CSV Format Converter**
- ✅ Created `convert_csv_format.py` to fix encoding/delimiter issues
- ✅ Converts all CSVs to UTF-8 with comma delimiters
- ✅ Successfully converted all 6 CSV files

---

## 📋 Current CSV Files Status

After running `convert_csv_format.py`, all files are now:
- ✅ **Encoding:** UTF-8
- ✅ **Delimiter:** Comma (`,`)
- ✅ **Ready for import**

### Files:
1. `users.csv` - 2 users (admin, operator)
2. `predefined_values.csv` - 393 rows (centrales, equipements, types)
3. `companies.csv` - Company data
4. `intervenants.csv` - Intervenant data
5. `interventions.csv` - Intervention data (new schema)
6. `audit_logs.csv` - Audit log templates

---

## 🚀 How to Import Data

### Step 1: Install Dependencies (if needed)
```bash
pip install psycopg2-binary python-dotenv bcrypt
```

### Step 2: Convert CSV Format (Already Done!)
```bash
python convert_csv_format.py
```

### Step 3: Run Import
```bash
python import_data.py
```

You'll be prompted:
1. **Regenerate sample CSV templates?** → `no` (you have real data)
2. **Clear existing data before import?** → `yes` (for clean import)
3. **Confirm deletion?** → `yes`

---

## 📊 New Interventions Schema

The CSV now uses the simplified schema:

### Required Columns
- `titre` - Event title
- `centrale` - Centrale name
- `equipement` - Equipment name

### New Intervenant Fields (Simplified)
- `entrepriseIntervenante` - Company name (text)
- `nombreIntervenant` - Number of intervenants (integer)
- `intervenantEnregistre` - Intervenant details (text)

### Date Fields
- `dateRef` - Reference date (replaces old `dateDebut`)
- `debutInter` - Intervention start time
- `finInter` - Intervention end time

### Other Fields
- `typeEvenement` - Event types as JSON array: `["Maintenance","Panne"]`
- `typeDysfonctionnement` - Dysfunction types as JSON array
- `hasPerteProduction` - Production loss flag (true/false)
- `hasPerteCommunication` - Communication loss flag (true/false)
- `indispoTerminee` - Unavailability finished (true/false)
- `dateIndisponibiliteDebut` - Unavailability start
- `dateIndisponibiliteFin` - Unavailability end
- `rapportAttendu` - Report expected (true/false)
- `rapportRecu` - Report received (true/false)
- `commentaires` - Comments (text)

---

## 🔐 Password Handling

The import script now automatically hashes plain text passwords:

### In CSV:
```csv
id,email,password,firstName,lastName,role,isActive
,admin@supervision.com,Admin123!,Admin,User,admin,true
```

### In Database (after import):
```
password: $2a$10$... (bcrypt hash)
```

**Benefits:**
- ✅ No need to pre-hash passwords
- ✅ Secure storage automatically
- ✅ Works with existing hashed passwords too

---

## 📝 CSV Format Examples

### users.csv
```csv
id,email,password,firstName,lastName,role,isActive,refreshToken,lastLogin,createdAt,updatedAt
,admin@supervision.com,Admin123!,Admin,User,admin,true,,,,
,operator@supervision.com,Admin123!,John,Doe,user,true,,,,
```

### predefined_values.csv
```csv
id,type,value,description,nickname,equipmentType,parentId,isActive,sortOrder,createdAt,updatedAt
1,centrale,ANNET,ANNET,ANNE,,,true,1,,
58,equipement, PARC,,,PARC,12,true,1,,
330,type_dysfonctionnement,Découplage,,,,,true,1,,
372,type_evenement,Curatif / Dépannage,,,,,true,1,,
```

### interventions.csv
```csv
id,titre,centraleType,centrale,equipement,entrepriseIntervenante,nombreIntervenant,intervenantEnregistre,dateRef,debutInter,finInter,hasPerteProduction,hasPerteCommunication,indispoTerminee,dateIndisponibiliteDebut,dateIndisponibiliteFin,typeEvenement,typeDysfonctionnement,rapportAttendu,rapportRecu,commentaires,isArchived,archivedAt,createdById,updatedById,createdAt,updatedAt
,Maintenance Turbine 1,,Centrale Nord,Turbine 1,Maintenance Corp,2,Dupont Jean; Martin Sophie,2024-01-15T00:00:00,2024-01-15T08:00:00,2024-01-15T12:00:00,false,false,false,,,["Maintenance preventive"],[],false,false,Maintenance trimestrielle,false,,,,,
```

---

## ⚠️ Important Notes

### IDs
- Leave `id` column **empty** for auto-generated UUIDs
- Or specify IDs (useful for `parentId` relationships in predefined_values)

### Dates
- Format: ISO 8601 (`2024-01-15T08:00:00` or `2024-01-15T08:00:00Z`)
- Empty cells = NULL in database

### Boolean Values
- Accepted: `true`, `false`, `1`, `0`, `yes`, `no`
- Case-insensitive

### JSON Arrays
- `typeEvenement` and `typeDysfonctionnement` accept:
  - JSON format: `["Maintenance","Panne"]`
  - Comma-separated: `Maintenance,Panne`
  - Empty: `[]` or leave blank

### Predefined Types
Must be lowercase:
- `centrale`
- `equipement`
- `type_evenement`
- `type_dysfonctionnement`
- `type_intervenant`

---

## 🔄 Import Process Flow

```
1. Read CSV files (auto-detect encoding & delimiter)
   ↓
2. Validate required columns
   ↓
3. For each row:
   - Cast values to correct types
   - Hash passwords (if users table)
   - Apply defaults
   ↓
4. Insert into database
   ↓
5. Reset sequences (if IDs were specified)
   ↓
6. Commit transaction
```

---

## 🐛 Troubleshooting

### Problem: "Missing required columns"
**Solution:** Check CSV headers match exactly (case-sensitive)

### Problem: "Could not parse with any encoding"
**Solution:** Run `python convert_csv_format.py` first

### Problem: "Invalid predefined_values.type"
**Solution:** Ensure type column uses lowercase values

### Problem: Passwords not working
**Solution:** 
- Check bcrypt is installed: `pip install bcrypt`
- Passwords are hashed automatically on import
- Login with plain text password from CSV

### Problem: ParentId relationships not working
**Solution:** 
- First import: Specify IDs in CSV for parent records
- Second import: Use those IDs as parentId values
- Or import in two passes

---

## 📊 Expected Import Results

With your current data:

```
✅ users: 2 rows
✅ predefined_values: 393 rows
   - 57 centrales
   - 273 equipements  
   - 42 type_dysfonctionnement
   - 21 type_evenement
✅ companies: X rows
✅ intervenants: X rows (note: table still exists for reference)
✅ interventions: X rows (new simplified schema)
✅ audit_logs: X rows
```

---

## 🎯 Next Steps After Import

1. **Start backend server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start frontend:**
   ```bash
   cd frontend
   npm start
   ```

3. **Login:**
   - URL: http://localhost:4200
   - Email: `admin@supervision.com`
   - Password: `Admin123!`

4. **Verify data:**
   - Check interventions list loads
   - Create new intervention with simplified form
   - Verify predefined values appear in dropdowns

---

## 📁 File Reference

### Scripts
- `import_data.py` - Main import script (updated for new schema)
- `convert_csv_format.py` - CSV format converter

### Data Files
- `csv_data/*.csv` - All CSV files (now UTF-8 with comma delimiters)

### Documentation
- `FIELD_MAPPING_REFERENCE.md` - Complete field mapping
- `DEPLOYMENT_SUMMARY.md` - Deployment overview
- `QUICK_START.md` - Application startup guide

---

**Last Updated:** 2025-11-28  
**Schema Version:** 2.0.0 (Simplified)  
**Import Script Version:** 2.0.0
