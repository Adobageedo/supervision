# Exemples d'Utilisation de l'API

Guide pratique avec exemples curl pour tester l'API.

## 🔐 Authentification

### 1. Login (Obtenir un Token)

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@supervision.com",
    "password": "Admin123!"
  }'
```

**Réponse:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@supervision.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "admin"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Enregistrer le token:**
```bash
export TOKEN="votre_access_token_ici"
```

### 2. Obtenir le Profil

```bash
curl http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Rafraîchir le Token

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "votre_refresh_token"
  }'
```

### 4. Déconnexion

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔧 Interventions

### 1. Créer une Intervention

```bash
curl -X POST http://localhost:3000/api/interventions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Perte du chargeur 48V",
    "centrale": "Centrale Éolienne Nord",
    "equipement": "Chargeur 48V",
    "typeEvenement": "Panne",
    "typeDysfonctionnement": "Perte du chargeur 48V",
    "dateDebut": "2024-01-15T08:00:00Z",
    "dateFin": "2024-01-15T14:30:00Z",
    "commentaires": "Remplacement du chargeur défectueux. Temps d intervention: 6h30",
    "perteProduction": 250.5,
    "perteCommunication": 0,
    "intervenants": [
      {
        "nom": "Dupont",
        "prenom": "Jean",
        "type": "Technicien",
        "entreprise": "Maintenance Pro"
      },
      {
        "nom": "Martin",
        "prenom": "Sophie",
        "type": "Ingénieur",
        "entreprise": "Maintenance Pro"
      }
    ]
  }'
```

### 2. Lister les Interventions

**Liste simple:**
```bash
curl http://localhost:3000/api/interventions \
  -H "Authorization: Bearer $TOKEN"
```

**Avec filtres:**
```bash
curl "http://localhost:3000/api/interventions?centrale=Centrale%20Éolienne%20Nord&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

**Avec recherche:**
```bash
curl "http://localhost:3000/api/interventions?search=chargeur&sortBy=dateDebut&sortOrder=DESC" \
  -H "Authorization: Bearer $TOKEN"
```

**Avec filtres de date:**
```bash
curl "http://localhost:3000/api/interventions?dateDebutFrom=2024-01-01&dateDebutTo=2024-12-31" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Obtenir une Intervention Spécifique

```bash
curl http://localhost:3000/api/interventions/INTERVENTION_ID \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Modifier une Intervention

```bash
curl -X PUT http://localhost:3000/api/interventions/INTERVENTION_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dateFin": "2024-01-15T16:00:00Z",
    "commentaires": "Intervention terminée avec succès. Délai supplémentaire pour tests."
  }'
```

### 5. Archiver une Intervention

```bash
curl -X POST http://localhost:3000/api/interventions/INTERVENTION_ID/archive \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Restaurer une Intervention Archivée

```bash
curl -X POST http://localhost:3000/api/interventions/INTERVENTION_ID/restore \
  -H "Authorization: Bearer $TOKEN"
```

### 7. Supprimer une Intervention

```bash
curl -X DELETE http://localhost:3000/api/interventions/INTERVENTION_ID \
  -H "Authorization: Bearer $TOKEN"
```

### 8. Obtenir les Statistiques

```bash
curl http://localhost:3000/api/interventions/stats \
  -H "Authorization: Bearer $TOKEN"
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total": 150,
      "active": 130,
      "archived": 20,
      "byCentrale": [
        { "centrale": "Centrale Éolienne Nord", "count": "45" },
        { "centrale": "Centrale Solaire Est", "count": "32" }
      ],
      "byTypeEvenement": [
        { "type": "Panne", "count": "65" },
        { "type": "Maintenance Préventive", "count": "40" }
      ]
    }
  }
}
```

### 9. Exporter en CSV

```bash
curl "http://localhost:3000/api/interventions/export/csv?centrale=Centrale%20Éolienne%20Nord" \
  -H "Authorization: Bearer $TOKEN" \
  -o interventions.csv
```

**Avec filtres:**
```bash
curl "http://localhost:3000/api/interventions/export/csv?dateDebutFrom=2024-01-01&dateDebutTo=2024-12-31" \
  -H "Authorization: Bearer $TOKEN" \
  -o interventions_2024.csv
```

---

## 📋 Valeurs Prédéfinies

### 1. Obtenir Toutes les Valeurs

```bash
curl http://localhost:3000/api/predefined \
  -H "Authorization: Bearer $TOKEN"
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "values": {
      "centrale": [
        { "id": "uuid1", "value": "Centrale Éolienne Nord" },
        { "id": "uuid2", "value": "Centrale Solaire Est" }
      ],
      "equipement": [
        { "id": "uuid3", "value": "Éolienne E01" },
        { "id": "uuid4", "value": "Transformateur T1" }
      ],
      "type_evenement": [...],
      "type_dysfonctionnement": [...],
      "type_intervenant": [...]
    }
  }
}
```

### 2. Obtenir les Valeurs par Type

```bash
# Centrales
curl http://localhost:3000/api/predefined/centrale \
  -H "Authorization: Bearer $TOKEN"

# Équipements
curl http://localhost:3000/api/predefined/equipement \
  -H "Authorization: Bearer $TOKEN"

# Types d'événements
curl http://localhost:3000/api/predefined/type_evenement \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Créer une Nouvelle Valeur (Admin uniquement)

```bash
curl -X POST http://localhost:3000/api/predefined \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "centrale",
    "value": "Nouvelle Centrale Hydro",
    "description": "Centrale hydroélectrique en cours de construction"
  }'
```

### 4. Modifier une Valeur (Admin uniquement)

```bash
curl -X PUT http://localhost:3000/api/predefined/VALUE_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "Centrale Hydro Alpes",
    "description": "Centrale hydroélectrique des Alpes"
  }'
```

### 5. Supprimer une Valeur (Admin uniquement)

```bash
curl -X DELETE http://localhost:3000/api/predefined/VALUE_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## 👥 Gestion des Utilisateurs (Admin)

### 1. Lister Tous les Utilisateurs

```bash
curl http://localhost:3000/api/auth/users \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Créer un Utilisateur

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "technicien@supervision.com",
    "password": "Tech123!@#",
    "firstName": "Marie",
    "lastName": "Technicienne",
    "role": "write"
  }'
```

### 3. Modifier le Rôle d'un Utilisateur

```bash
curl -X PUT http://localhost:3000/api/auth/users/USER_ID/role \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin"
  }'
```

### 4. Désactiver un Utilisateur

```bash
curl -X DELETE http://localhost:3000/api/auth/users/USER_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📜 Audit et Logs (Admin)

### 1. Obtenir les Logs d'Audit

```bash
curl http://localhost:3000/api/audit \
  -H "Authorization: Bearer $TOKEN"
```

**Avec filtres:**
```bash
curl "http://localhost:3000/api/audit?entityType=intervention&action=create&page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Obtenir l'Historique d'une Entité

```bash
curl http://localhost:3000/api/audit/entity/INTERVENTION_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔍 Health Check

```bash
curl http://localhost:3000/api/health
```

**Réponse:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.5
}
```

---

## 📊 Exemples de Scénarios Complets

### Scénario 1: Création Complète d'une Intervention

```bash
#!/bin/bash

# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@supervision.com",
    "password": "Admin123!"
  }' | jq -r '.data.accessToken')

echo "Token obtenu: $TOKEN"

# 2. Créer l'intervention
INTERVENTION=$(curl -s -X POST http://localhost:3000/api/interventions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Maintenance préventive éolienne E01",
    "centrale": "Centrale Éolienne Nord",
    "equipement": "Éolienne E01",
    "typeEvenement": "Maintenance Préventive",
    "typeDysfonctionnement": "Inspection annuelle",
    "dateDebut": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "commentaires": "Maintenance préventive planifiée",
    "intervenants": [
      {
        "nom": "Durand",
        "prenom": "Pierre",
        "type": "Technicien"
      }
    ]
  }')

INTERVENTION_ID=$(echo $INTERVENTION | jq -r '.data.intervention.id')
echo "Intervention créée avec ID: $INTERVENTION_ID"

# 3. Récupérer les détails
curl -s http://localhost:3000/api/interventions/$INTERVENTION_ID \
  -H "Authorization: Bearer $TOKEN" | jq

# 4. Mettre à jour (intervention terminée)
curl -s -X PUT http://localhost:3000/api/interventions/$INTERVENTION_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dateFin": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "commentaires": "Maintenance préventive terminée avec succès"
  }' | jq

echo "Intervention mise à jour"
```

### Scénario 2: Export de Données Filtrées

```bash
#!/bin/bash

# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@supervision.com","password":"Admin123!"}' \
  | jq -r '.data.accessToken')

# Export des interventions du dernier mois
curl "http://localhost:3000/api/interventions/export/csv?dateDebutFrom=$(date -d '1 month ago' +%Y-%m-%d)" \
  -H "Authorization: Bearer $TOKEN" \
  -o "interventions_$(date +%Y%m).csv"

echo "Export réussi: interventions_$(date +%Y%m).csv"
```

### Scénario 3: Monitoring et Statistiques

```bash
#!/bin/bash

TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@supervision.com","password":"Admin123!"}' \
  | jq -r '.data.accessToken')

# Health check
echo "=== Health Check ==="
curl -s http://localhost:3000/api/health | jq

# Statistiques
echo -e "\n=== Statistiques ==="
curl -s http://localhost:3000/api/interventions/stats \
  -H "Authorization: Bearer $TOKEN" | jq

# Audit récent
echo -e "\n=== Logs d'Audit Récents ==="
curl -s "http://localhost:3000/api/audit?limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 🧪 Tests avec Postman/Insomnia

### Collection Postman

Créez une collection avec ces variables:
- `base_url`: `http://localhost:3000/api`
- `token`: (sera défini après le login)

### Environnements

**Développement:**
```json
{
  "base_url": "http://localhost:3000/api",
  "token": ""
}
```

**Production:**
```json
{
  "base_url": "https://your-domain.com/api",
  "token": ""
}
```

---

## 🔗 Codes de Statut HTTP

| Code | Signification |
|------|---------------|
| 200 | OK - Requête réussie |
| 201 | Created - Ressource créée |
| 400 | Bad Request - Données invalides |
| 401 | Unauthorized - Non authentifié |
| 403 | Forbidden - Accès refusé (rôle insuffisant) |
| 404 | Not Found - Ressource non trouvée |
| 409 | Conflict - Conflit (ex: email déjà utilisé) |
| 429 | Too Many Requests - Rate limit atteint |
| 500 | Internal Server Error - Erreur serveur |

---

## 💡 Conseils

1. **Stockez le token**: Utilisez des variables d'environnement
2. **Gérez l'expiration**: Implémentez le refresh automatique
3. **Testez progressivement**: Commencez par le login puis les autres endpoints
4. **Utilisez jq**: Pour formater les réponses JSON
5. **Logs**: Consultez les logs en cas d'erreur: `docker-compose logs -f backend`

---

**Bon test de l'API! 🚀**
