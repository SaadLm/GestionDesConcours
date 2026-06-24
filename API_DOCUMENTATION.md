# API Documentation - Gestion des Concours

This document provides a comprehensive guide to all the API endpoints in the backend. 
Each endpoint is detailed with its HTTP method, URL path, required roles, request payload, response format, and a clear description of its duty.

## Base URL
`http://localhost:8080/api/v1`

## Swagger UI (Interactive Testing)
`http://localhost:8080/swagger-ui/index.html`

---

## 🔑 Authentication Credentials for Testing
Use the following pre-seeded credentials to test different user roles:
1. **Admin (ADMIN)**:
   - Email: `admin@competition.com`
   - Password: `admin123`
2. **Gestionnaire Global (GESTIONNAIRE_GLOBAL)**:
   - Email: `global@competition.com`
   - Password: `global123`
3. **Gestionnaire Local (GESTIONNAIRE_LOCAL)**:
   - Email: `local@competition.com`
   - Password: `local123` (Attached to "Centre de Casablanca")

---

## 🔒 Session Verification & Security Check
- **JWT Storage**: Upon successful login, the generated JWT token is stored in the database under the `active_token` field of the user.
- **Verification**: For every secured request, the backend extracts the JWT from the `Authorization: Bearer <token>` header and compares it with the `active_token` stored in the database.
- **Rejection**: If a user is not logged in, or if the incoming JWT doesn't match the database value (e.g. they logged in elsewhere or logged out), the request is rejected with **HTTP 401 Unauthorized**.

---

## 1. Public Endpoints (No Token Required)

### ✉️ Postuler à un concours (Submit Candidature)
- **URL**: `/public/postuler`
- **Method**: `POST`
- **Duty**: Allows candidates to submit their application for a specific competition, specialty, and center.
- **Request Body (JSON)**:
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
- **Response (JSON)**:
  ```json
  {
    "success": true,
    "message": "Votre candidature a été soumise avec succès. Votre numéro est : CAND-2026-000145",
    "data": { "id": 12, "numeroCandidature": "CAND-2026-000145", ... }
  }
  ```

### 🔍 Suivre une candidature (Follow Candidature)
- **URL**: `/public/suivi/{numero}`
- **Method**: `GET`
- **Duty**: Allows a candidate to check the current status of their submitted application using their unique candidacy number.
- **Response (JSON)**:
  ```json
  {
    "success": true,
    "message": "Candidature trouvée.",
    "data": { "id": 12, "numeroCandidature": "CAND-2026-000145", "statut": "EN_ATTENTE", ... }
  }
  ```

---

## 2. Authentication

### 🔑 Connexion (User Login)
- **URL**: `/auth/login`
- **Method**: `POST`
- **Duty**: Authenticates the user with their email and password. Generates a JWT token and persists it to the database for subsequent session validation checks.
- **Request Body (JSON)**:
  ```json
  {
    "email": "admin@competition.com",
    "password": "admin123"
  }
  ```
- **Response (JSON)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiJ..."
  }
  ```

---

## 3. Manager & Admin Endpoints (Secured)
*Require the header `Authorization: Bearer <token>`*

### 📋 Liste des candidatures (List Candidatures)
- **URL**: `/manager/candidatures`
- **Method**: `GET`
- **Required Roles**: `ADMIN`, `GESTIONNAIRE_GLOBAL`, `GESTIONNAIRE_LOCAL`
- **Duty**: Retrieves a list of all candidatures. Can be filtered by `centreId` using a query parameter.
- **Query Parameter**: `centreId` (Long, optional)

### ✅ Valider une candidature (Approve Candidature)
- **URL**: `/manager/candidatures/{id}/valider`
- **Method**: `POST`
- **Required Roles**: `ADMIN`, `GESTIONNAIRE_GLOBAL`, `GESTIONNAIRE_LOCAL`
- **Duty**: Approves a candidate's registration. Checks center/specialty quotas first. If quotas allow, updates status to `VALIDEE` and **automatically assigns the candidate to the first room (`Salle`) in their center with available capacity (limit: 50)**.
- **Response (JSON)**:
  ```json
  {
    "success": true,
    "message": "Candidature validée avec succès."
  }
  ```

### ❌ Rejeter une candidature (Reject Candidature)
- **URL**: `/manager/candidatures/{id}/rejeter`
- **Method**: `POST`
- **Required Roles**: `ADMIN`, `GESTIONNAIRE_GLOBAL`, `GESTIONNAIRE_LOCAL`
- **Duty**: Rejects a candidate's registration and records a comment explaining why.
- **Query Parameter**: `commentaire` (String, required)

### 🏢 Liste des centres (List All Centers)
- **URL**: `/manager/centres`
- **Method**: `GET`
- **Required Roles**: `ADMIN`, `GESTIONNAIRE_GLOBAL`
- **Duty**: Returns a list of all centers configured in the system. Used by global managers/admins before selecting a center.

### 🚪 Salles et Candidats d'un Centre (Rooms and Candidates status)
- **URL**: `/manager/centres/{centreId}/salles-with-candidates`
- **Method**: `GET`
- **Required Roles**: `ADMIN`, `GESTIONNAIRE_GLOBAL`, `GESTIONNAIRE_LOCAL`
- **Duty**: Returns a detailed state of the rooms in a center: the rooms, their capacities, the list of candidates assigned to each room, and the list of validated candidates who haven't yet been assigned a room.
- **Security constraint**: A `GESTIONNAIRE_LOCAL` can only request this endpoint for their own assigned `centreId`.
- **Response (JSON)**:
  ```json
  {
    "success": true,
    "message": "Salles et candidats du centre récupérés avec succès.",
    "data": {
      "centreId": 1,
      "centreNom": "Centre de Casablanca",
      "salles": [
        {
          "salle": { "id": 1, "nom": "Salle A", "capacite": 50 },
          "candidatures": [ { "id": 10, "numeroCandidature": "CAND-...", "candidat": { ... } } ]
        }
      ],
      "unassignedCandidatures": []
    }
  }
  ```

### 🔁 Affecter ou Changer de Salle (Assign / Change Candidate Room)
- **URL**: `/manager/candidatures/{candidatureId}/salle`
- **Method**: `PUT`
- **Required Roles**: `ADMIN`, `GESTIONNAIRE_GLOBAL`, `GESTIONNAIRE_LOCAL`
- **Duty**: Manually sets, changes, or clears a candidate's assigned room.
- **Query Parameter**: `salleId` (Long, optional - leave empty to remove the candidate from their current room).
- **Security constraint**:
  - `GESTIONNAIRE_LOCAL` can only call this for candidates in their own center and can only assign rooms that belong to their center.
  - The candidature status must be `VALIDEE` to be assigned to a room.
  - The room's capacity (50) is verified.
- **Response (JSON)**:
  ```json
  {
    "success": true,
    "message": "Candidat affecté à la salle avec succès."
  }
  ```

---

## 4. Admin CRUD Endpoints (Admin Only)
*Require the header `Authorization: Bearer <token>` and `ADMIN` role*

### 👥 Liste des utilisateurs (List Users)
- **URL**: `/admin/users`
- **Method**: `GET`
- **Duty**: Returns a list of all user accounts (Admins, Global Managers, Local Managers).

### 🔍 Récupérer un utilisateur (Get User)
- **URL**: `/admin/users/{id}`
- **Method**: `GET`
- **Duty**: Retrieves detailed information for a specific user.

### ➕ Créer un utilisateur (Create User)
- **URL**: `/admin/users`
- **Method**: `POST`
- **Duty**: Creates a new user account. Passwords are automatically hashed. Local managers must be linked to a valid center.
- **Request Body (JSON)**:
  ```json
  {
    "nom": "Local",
    "prenom": "Manager",
    "email": "local@competition.com",
    "password": "localpassword",
    "role": "GESTIONNAIRE_LOCAL",
    "centreId": 1
  }
  ```

### ✏️ Modifier un utilisateur (Update User)
- **URL**: `/admin/users/{id}`
- **Method**: `PUT`
- **Duty**: Updates user profile details, role, or center. Password is optionally updated if a non-empty password is submitted.
- **Request Body (JSON)**: Same structure as Create User.

### 🗑️ Supprimer un utilisateur (Delete User)
- **URL**: `/admin/users/{id}`
- **Method**: `DELETE`
- **Duty**: Deletes a user account from the system.
