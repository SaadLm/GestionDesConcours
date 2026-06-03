# API Documentation - Gestion des Concours

## Base URL
`http://localhost:8080/api/v1`

## Swagger UI (Interactive Testing)
`http://localhost:8080/swagger-ui/index.html`

---

## 1. Candidat (Public)

### Postuler à un concours
- **URL**: `/public/postuler`
- **Méthode**: `POST`
- **Corps (JSON)**:
```json
{
  "candidat": {
    "nom": "Dupont",
    "prenom": "Jean",
    "cin": "AB123456",
    "dateNaissance": "1995-05-15",
    "email": "jean.dupont@email.com",
    "telephone": "0600000000",
    "adresse": "123 Rue de Casablanca"
  },
  "concours": { "id": 1 },
  "specialite": { "id": 1 },
  "centre": { "id": 1 }
}
```
- **Réponse**:
```json
{
  "success": true,
  "message": "Votre candidature a été soumise avec succès. Votre numéro est : CAND-2026-000145",
  "data": { ... }
}
```

### Suivre une candidature
- **URL**: `/public/suivi/{numero}`
- **Méthode**: `GET`
- **Paramètre**: `numero` (ex: `CAND-2026-000145`)

---

## 2. Authentification

### Connexion (Manager/Admin)
- **URL**: `/auth/login`
- **Méthode**: `POST`
- **Corps**:
```json
{
  "email": "admin@competition.com",
  "password": "admin123"
}
```
- **Réponse**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ..."
}
```

---

## 3. Gestionnaire (Sécurisé)
*Nécessite le header `Authorization: Bearer <token>`*

### Liste des candidatures
- **URL**: `/manager/candidatures`
- **Méthode**: `GET`
- **Optionnel**: `?centreId=1`

### Valider une candidature
- **URL**: `/manager/candidatures/{id}/valider`
- **Méthode**: `POST`

### Rejeter une candidature
- **URL**: `/manager/candidatures/{id}/rejeter?commentaire=Dossier incomplet`
- **Méthode**: `POST`
