# Complete Field Mapping Reference

## 🎯 Purpose
This document ensures consistency across **Frontend**, **Backend**, and **Database** for the interventions system.

---

## 📊 Intervention Fields - Complete Mapping

### Core Event Information

| Frontend Form Field | Backend Entity Field | Database Column | Type | Notes |
|-------------------|---------------------|----------------|------|-------|
| `titreEvenement` | `titre` | `titre` | string | **IMPORTANT:** Form uses different name! |
| `centrale` | `centrale` | `centrale` | string | Centrale name |
| `centraleType` | `centraleType` | `centraleType` | string | Centrale type |
| `equipement` | `equipement` | `equipement` | string | Equipment name |
| `typeEvenement` | `typeEvenement` | `typeEvenement` | string (JSON) | Array stringified |
| `typeDysfonctionnement` | `typeDysfonctionnement` | `typeDysfonctionnement` | string (JSON) | Array stringified |
| `dateRef` | `dateRef` | `dateRef` | Date | Reference date |
| `commentaires` | `commentaires` | `commentaires` | string | Comments |

### Intervention Details (New Simplified Schema)

| Frontend Form Field | Backend Entity Field | Database Column | Type | Notes |
|-------------------|---------------------|----------------|------|-------|
| `societeIntervenant` | `entrepriseIntervenante` | `entrepriseIntervenante` | string | Company name (text) |
| `intervenantEnregistre` | `intervenantEnregistre` | `intervenantEnregistre` | string | Intervenant details (text) |
| `nombreIntervenant` | `nombreIntervenant` | `nombreIntervenant` | number | Count of intervenants |
| `dateDebutIntervention` | `debutInter` | `debutInter` | Date | Intervention start |
| `dateFinIntervention` | `finInter` | `finInter` | Date | Intervention end |

**Key Changes:**
- ❌ Removed: `interventionIntervenants` array (junction table)
- ✅ New: Direct text fields for simpler data entry
- ✅ No more complex dropdown selections

### Loss/Unavailability Information

| Frontend Form Field | Backend Entity Field | Database Column | Type | Notes |
|-------------------|---------------------|----------------|------|-------|
| `hasPerteProduction` | `hasPerteProduction` | `hasPerteProduction` | boolean | Production loss flag |
| `hasPerteCommunication` | `hasPerteCommunication` | `hasPerteCommunication` | boolean | Communication loss flag |
| `dateDebutIndisponibilite` | `dateIndisponibiliteDebut` | `dateIndisponibiliteDebut` | Date | Unavailability start |
| `dateFinIndisponibilite` | `dateIndisponibiliteFin` | `dateIndisponibiliteFin` | Date | Unavailability end |
| `indisponibiliteTerminee` | `indispoTerminee` | `indispoTerminee` | boolean | Unavailability finished |

### Report Status

| Frontend Form Field | Backend Entity Field | Database Column | Type | Notes |
|-------------------|---------------------|----------------|------|-------|
| `rapportAttendu` | `rapportAttendu` | `rapportAttendu` | boolean | Report expected |
| `rapportRecu` | `rapportRecu` | `rapportRecu` | boolean | Report received |

### Metadata (Auto-managed)

| Frontend Display | Backend Entity Field | Database Column | Type | Notes |
|-----------------|---------------------|----------------|------|-------|
| - | `id` | `id` | uuid | Primary key |
| - | `createdById` | `createdById` | uuid | Creator user |
| - | `updatedById` | `updatedById` | uuid | Last updater |
| Created At | `createdAt` | `createdAt` | Date | Auto-set |
| Updated At | `updatedAt` | `updatedAt` | Date | Auto-set |
| - | `isArchived` | `isArchived` | boolean | Archive flag |
| - | `archivedAt` | `archivedAt` | Date | Archive date |

---

## 🔄 Data Flow Examples

### Creating an Intervention

#### Frontend Form Submission
```typescript
{
  titreEvenement: "Power outage",       // ← Note: different name!
  centrale: "Solar Plant A",
  equipement: "Inverter 3",
  typeEvenement: ["Panne", "Urgence"],
  dateRef: "2025-11-28T10:00:00Z",
  societeIntervenant: "TechCorp",       // ← Frontend name
  intervenantEnregistre: "John Doe",
  nombreIntervenant: 2,
  hasPerteProduction: true
}
```

#### Backend Controller Mapping
```typescript
{
  titre: titreEvenement,                 // ← Maps here!
  centrale: centrale,
  equipement: equipement,
  typeEvenement: JSON.stringify(typeEvenement),
  dateRef: dateRef,
  entrepriseIntervenante: societeIntervenant,  // ← Maps here!
  intervenantEnregistre: intervenantEnregistre,
  nombreIntervenant: nombreIntervenant,
  hasPerteProduction: !!hasPerteProduction
}
```

#### Database Insert
```sql
INSERT INTO interventions (
  titre,                    -- ← Final name
  centrale,
  equipement,
  "typeEvenement",
  "dateRef",
  "entrepriseIntervenante", -- ← Final name
  "intervenantEnregistre",
  "nombreIntervenant",
  "hasPerteProduction"
) VALUES (...)
```

### Loading an Intervention

#### Database Query Result
```typescript
{
  id: "uuid-here",
  titre: "Power outage",          // ← Database field
  centrale: "Solar Plant A",
  entrepriseIntervenante: "TechCorp",
  // ... other fields
}
```

#### Backend Response (JSON)
```json
{
  "success": true,
  "data": {
    "intervention": {
      "id": "uuid-here",
      "titre": "Power outage",     
      "centrale": "Solar Plant A",
      "entrepriseIntervenante": "TechCorp"
    }
  }
}
```

#### Frontend Model/Form Loading
```typescript
// Load into form with mapping
formData = {
  ...intervention,
  titreEvenement: intervention.titre  // ← Map back to form field!
}
```

---

## ⚠️ Critical Mapping Points

### 1. Title Field Name Difference
- **Form Field:** `titreEvenement` (for validation consistency)
- **Backend/DB:** `titre` (entity field name)
- **Mapping Required:** Both directions (submit & load)

### 2. Intervenant Company Field
- **Form Field:** `societeIntervenant`
- **Backend/DB:** `entrepriseIntervenante`
- **Mapping Required:** Controller level

### 3. Date Field Deprecations
- ❌ **OLD:** `dateDebut`, `dateFin`
- ✅ **NEW:** `dateRef`, `debutInter`, `finInter`
- **Migration:** Complete - old fields removed

### 4. Boolean Flag Naming
- ❌ **OLD:** `perteProduction`, `perteCommunication`
- ✅ **NEW:** `hasPerteProduction`, `hasPerteCommunication`
- **Benefit:** Clearer intent with `has` prefix

### 5. Intervenant Data Storage
- ❌ **OLD:** Array of objects via junction table
- ✅ **NEW:** Direct text fields
  - `entrepriseIntervenante`: Company name
  - `intervenantEnregistre`: Names/details
  - `nombreIntervenant`: Count

---

## 🧪 Testing Field Mapping

### Checklist
- [ ] Create intervention: Form → Backend → Database
- [ ] Load intervention: Database → Backend → Form
- [ ] Update intervention: Form → Backend → Database
- [ ] Export CSV: Database → Backend formatting
- [ ] Filter by fields: Frontend → Backend query
- [ ] Sort by fields: Frontend → Backend orderBy

### Common Issues

**Issue:** 400 error "Title is required"
- **Cause:** Form sending `titre` instead of `titreEvenement`
- **Fix:** Ensure form uses `titreEvenement` field name

**Issue:** Field shows `undefined` in form
- **Cause:** Missing mapping when loading from backend
- **Fix:** Add mapping in `loadIntervention()` method

**Issue:** 500 error on sorting
- **Cause:** Invalid sortBy field name
- **Fix:** Validate sortBy against allowed fields list

---

## 📝 Notes for Developers

1. **Always map `titreEvenement` ↔ `titre`** in form submission/loading
2. **Backend validation** expects `titreEvenement` in POST/PUT requests
3. **Database** stores as `titre`
4. **JSON fields** (`typeEvenement`, `typeDysfonctionnement`) must be stringified before DB
5. **No junction table** - all intervenant data is in main table
6. **Date sorting** - use `createdAt` as default, not `dateRef` (nullable)

---

**Last Updated:** 2025-11-28  
**Schema Version:** 2.0.0 (Simplified)
