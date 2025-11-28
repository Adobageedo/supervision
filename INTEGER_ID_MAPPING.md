# Integer ID to UUID Mapping

## ✅ Problem Solved!

Your CSV files use integer IDs (1, 2, 33, 144, etc.) but the database expects UUIDs.

The import script now **automatically converts** integer IDs to deterministic UUIDs using UUID v5.

---

## How It Works

### Conversion Function
```python
def _int_to_uuid(value, namespace='supervision'):
    """Convert integer ID to deterministic UUID v5."""
    namespace_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, namespace)
    return str(uuid.uuid5(namespace_uuid, str(value)))
```

### Key Features
- ✅ **Deterministic**: Same integer always maps to same UUID
- ✅ **Consistent**: Works across multiple imports
- ✅ **Automatic**: No manual conversion needed
- ✅ **Preserves relationships**: Foreign keys work correctly

---

## Example Mappings

| Integer ID | UUID |
|------------|------|
| 1 | `fa96ec60-5183-56d6-b596-095bc2fc969d` |
| 33 | `7b5e71aa-7d82-541e-a83e-d26f712b94fc` |
| 144 | `f851ea32-dd5f-59fd-a73d-54043f072808` |

---

## What Gets Converted

All UUID fields in the schema:
- `id` (primary keys)
- `parentId` (predefined_values)
- `companyId` (intervenants)
- `createdById` (all tables)
- `updatedById` (all tables)
- `userId` (audit_logs)

---

## CSV Format

You can now use **integer IDs** in your CSV files:

### ✅ Before (Integer IDs)
```csv
id,name,companyId
1,John Doe,33
2,Jane Smith,144
```

### ✅ After Import (UUIDs in Database)
```sql
id: fa96ec60-5183-56d6-b596-095bc2fc969d
name: John Doe
companyId: 7b5e71aa-7d82-541e-a83e-d26f712b94fc
```

---

## Benefits

### 1. **Keep Your Existing Data**
- No need to manually convert IDs
- Use your existing CSV files as-is

### 2. **Relationships Work**
```csv
# companies.csv
id,name
33,TechCorp

# intervenants.csv
id,name,companyId
1,John,33  ← Automatically links to correct company UUID
```

### 3. **Consistent Across Imports**
- Re-importing same data produces same UUIDs
- Safe to import multiple times

---

## How to Use

### Step 1: Keep Your Integer IDs
No changes needed to your CSV files!

### Step 2: Run Import
```bash
python import_data.py
```

The script will:
1. Read your integer IDs
2. Convert them to UUIDs automatically
3. Maintain all relationships

### Step 3: Verify
Check the database - all IDs are now proper UUIDs:
```sql
SELECT id, name FROM companies LIMIT 5;
-- Returns UUIDs like: fa96ec60-5183-56d6-b596-095bc2fc969d
```

---

## Technical Details

### UUID v5 Generation
- **Namespace**: `uuid.uuid5(uuid.NAMESPACE_DNS, 'supervision')`
- **Input**: String representation of integer ID
- **Output**: Deterministic UUID

### Why UUID v5?
- Deterministic (same input = same output)
- Standard UUID format
- Collision-resistant
- Works with PostgreSQL UUID type

---

## Troubleshooting

### Problem: "Invalid UUID format"
**Cause**: Old import script version  
**Solution**: Use updated `import_data.py` (includes `_int_to_uuid()`)

### Problem: "Relationships not working"
**Cause**: Inconsistent ID conversion  
**Solution**: Ensure all related IDs use same conversion (automatic)

### Problem: "Want to use real UUIDs"
**Solution**: You can! The script accepts both:
- Integer IDs → Converted to UUIDs
- UUID strings → Used as-is

---

## Migration Path

### Option 1: Keep Integer IDs (Recommended)
- ✅ No changes to CSV files
- ✅ Automatic conversion
- ✅ Works immediately

### Option 2: Pre-convert to UUIDs
If you want to see actual UUIDs in your CSV:

```python
import uuid
import csv

def convert_csv_ids():
    # Read CSV with integer IDs
    # Convert each ID using _int_to_uuid()
    # Write back with UUID strings
    pass
```

But this is **not necessary** - the import script handles it!

---

**Last Updated:** 2025-11-28  
**Script Version:** 2.0.1 (Integer ID Support)
