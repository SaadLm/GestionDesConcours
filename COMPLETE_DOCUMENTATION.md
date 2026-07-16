# Gestion des Concours - Complete Application Documentation

## Table of Contents
1. [Application Overview](#application-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Overview](#architecture-overview)
4. [Database Schema & Entities](#database-schema--entities)
5. [Backend Architecture](#backend-architecture)
6. [Frontend Architecture](#frontend-architecture)
7. [API Endpoints](#api-endpoints)
8. [User Roles & Permissions](#user-roles--permissions)
9. [Authentication & Security](#authentication--security)
10. [Core Features & Functionality](#core-features--functionality)
11. [Frontend Pages & Components](#frontend-pages--components)
12. [Backend Services & Controllers](#backend-services--controllers)
13. [Data Flow & Integration Patterns](#data-flow--integration-patterns)
14. [Setup & Running Instructions](#setup--running-instructions)

---

## Application Overview

**Gestion des Concours** is a comprehensive competition (concours) management system designed to handle:
- **Candidate Registration**: Public portal for candidates to apply for competitions
- **Application Tracking**: Candidates can follow their application status
- **Administrative Management**: Admins manage competitions, specialties, centers, and users
- **Allocation Planning**: Global managers allocate specialties to centers with capacity planning
- **Room Assignment**: Local managers assign candidates to exam rooms (salles)
- **Reporting**: Generate statistics and tracking reports

**Target Users**:
- **Candidates**: Apply for competitions via public portal
- **Local Managers (Gestionnaire Local)**: Manage candidate assignments at their assigned center
- **Global Managers (Gestionnaire Global)**: Oversee all centers and allocations
- **Admins**: Full system control, user management, platform configuration

**Key Business Flows**:
1. Candidate Registration → Validation → Room Assignment → Exam
2. Specialty Allocation Planning → Capacity Management → Resource Visibility
3. User Management → Role-Based Access Control → Audit Trails

---

## Technology Stack

### Backend
- **Framework**: Spring Boot 3.2.2 (Spring Data JPA, Spring Security)
- **Language**: Java 17
- **Database**: PostgreSQL (via Supabase)
- **Build Tool**: Maven
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Gmail SMTP for notifications
- **API Documentation**: Swagger/OpenAPI 3.0

### Frontend
- **Framework**: Angular 18.2.0 (Standalone Components)
- **Language**: TypeScript
- **Styling**: CSS3 with custom design system
- **HTTP Client**: Angular HttpClient with Interceptors
- **State Management**: Observable-based (RxJS)
- **Build Tool**: Angular CLI

### Development & Testing
- **IDE**: VS Code
- **Testing**: JUnit, Mockito (backend)
- **API Testing**: Swagger UI, Postman

---

## Architecture Overview

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Angular 18)                    │
├─────────────────────────────────────────────────────────────────┤
│ Shared          Auth          Admin           Manager    Public  │
│ Components      Login         Dashboard       Pages      Pages   │
│ Layouts         Registration  User Mgmt       Tracking   Suivi   │
└────────────────────────────────┬──────────────────────────────────┘
                                 │
                    Angular HttpClient Interceptor
                    Authorization Bearer <JWT>
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND (Spring Boot 3.2.2, Java 17)               │
├─────────────────────────────────────────────────────────────────┤
│  Controllers    Services    Repositories   Security   DTOs      │
│  ├─ AuthController          JwtUtils       JpaRepository      │
│  ├─ ConcoursController      EmailService   UserRepository     │
│  ├─ CentreController        CandidatureServ                    │
│  ├─ ManagerController                                          │
│  ├─ AdminController                                            │
│  └─ PublicController                                           │
└────────────────────────────────┬──────────────────────────────────┘
                                 │
                       Database Access Layer
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              DATABASE (PostgreSQL via Supabase)                  │
├─────────────────────────────────────────────────────────────────┤
│ Tables: users, concours, centres, specialites, candidats,        │
│         candidatures, centre_specialites, salles, diplomes,      │
│         documents, notifications, roles                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema & Entities

### Core Entities

#### 1. **User** (`users` table)
Represents system users with authentication and role management.

```java
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @Column(nullable = false)
    private String motDePasse;        // Encrypted password
    
    private String nom;
    private String prenom;
    private String telephone;
    
    @ManyToOne
    @JoinColumn(name = "role_id")
    private Role role;                // ADMIN, GESTIONNAIRE_GLOBAL, GESTIONNAIRE_LOCAL
    
    @ManyToOne
    @JoinColumn(name = "centre_id")
    private Centre centre;            // For local managers
    
    @Column(name = "active_token")
    private String activeToken;       // Current JWT token for session validation
    
    private LocalDateTime dateCreation;
}
```

**Key Fields**:
- `email`: Unique identifier for login
- `motDePasse`: BCrypt encrypted password
- `role`: Determines access permissions
- `centre`: Only set for GESTIONNAIRE_LOCAL (their assigned center)
- `activeToken`: Current valid JWT, checked on every request

**Relationships**:
- ManyToOne with Role
- ManyToOne with Centre (optional)

---

#### 2. **Role** (`roles` table)
Defines user permissions and access levels.

```java
@Entity
@Table(name = "roles")
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String nom;               // "ADMIN", "GESTIONNAIRE_GLOBAL", "GESTIONNAIRE_LOCAL"
    
    private String description;
    
    @OneToMany(mappedBy = "role")
    private List<User> users;
}
```

**Predefined Roles**:
- **ADMIN**: Full system access (create/edit/delete everything)
- **GESTIONNAIRE_GLOBAL**: Manage all centers and allocations
- **GESTIONNAIRE_LOCAL**: Manage only their assigned center

---

#### 3. **Concours** (`concours` table)
Represents a competition/exam session.

```java
@Entity
@Table(name = "concours")
public class Concours {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String titre;             // "Concours d'entrée 2026"
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false)
    private LocalDate dateConcours;   // Exam date
    
    @Column(nullable = false)
    private LocalDate dateDebutInscription;  // Registration opens
    
    @Column(nullable = false)
    private LocalDate dateFinInscription;    // Registration closes
    
    @Column(nullable = false)
    private String statut;            // "OUVERT", "FERME", "TERMINE"
    
    @ManyToOne
    @JoinColumn(name = "centre_id")
    private Centre centre;            // Associated center
    
    @OneToMany(mappedBy = "concours", cascade = CascadeType.ALL)
    private List<Candidature> candidatures;
}
```

**Key Fields**:
- `titre`: Name of the competition
- `dateConcours`: When the exam happens
- `dateDebutInscription` / `dateFinInscription`: Registration window
- `statut`: Controls visibility and participation eligibility
- `centre`: Which center hosts this competition

**Relationships**:
- ManyToOne with Centre
- OneToMany with Candidature

---

#### 4. **Centre** (`centres` table)
Represents a physical exam center location.

```java
@Entity
@Table(name = "centres")
public class Centre {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String nom;               // "Centre de Casablanca"
    
    @Column(nullable = false)
    private String ville;             // City location
    
    private String adresse;           // Street address
    private String telephone;         // Contact phone
    
    @OneToMany(mappedBy = "centre", cascade = CascadeType.ALL)
    private List<Salle> salles;       // Exam rooms in this center
    
    @OneToMany(mappedBy = "centre", cascade = CascadeType.ALL)
    private List<Concours> concours;  // Competitions at this center
    
    @OneToMany(mappedBy = "centre", cascade = CascadeType.ALL)
    private List<CentreSpecialite> specialites;  // Allocated specialties
    
    @OneToMany(mappedBy = "centre", cascade = CascadeType.ALL)
    private List<User> users;         // Managers assigned to this center
}
```

**Key Fields**:
- `nom`: Center name
- `ville`: City (Casablanca, Rabat, etc.)
- `adresse`: Physical address
- `telephone`: Contact number

**Relationships**:
- OneToMany with Salle
- OneToMany with Concours
- OneToMany with CentreSpecialite
- OneToMany with User

---

#### 5. **Specialite** (`specialites` table)
Represents an academic specialty/field of study.

```java
@Entity
@Table(name = "specialites")
public class Specialite {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String nom;               // "Informatique", "Génie Civil"
    
    @Column(columnDefinition = "TEXT")
    private String description;       // Detailed description
    
    @OneToMany(mappedBy = "specialite", cascade = CascadeType.ALL)
    private List<CentreSpecialite> allocations;
    
    @OneToMany(mappedBy = "specialite", cascade = CascadeType.ALL)
    private List<Candidature> candidatures;
}
```

**Key Fields**:
- `nom`: Specialty name
- `description`: What the specialty covers

**Relationships**:
- OneToMany with CentreSpecialite (allocation records)
- OneToMany with Candidature (candidate applications)

---

#### 6. **CentreSpecialite** (`centre_specialites` table)
Allocation record: how many places are allocated for a specialty at a center.

```java
@Entity
@Table(name = "centre_specialites")
public class CentreSpecialite {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "centre_id", nullable = false)
    private Centre centre;
    
    @ManyToOne
    @JoinColumn(name = "specialite_id", nullable = false)
    private Specialite specialite;
    
    @Column(nullable = false)
    private Integer nombrePlaces;     // How many spots for this specialty at this center
    
    private LocalDateTime dateCreation;
}
```

**Purpose**: Capacity planning matrix
- **Example**: Centre Casablanca has 50 spots for Informatique, 30 for Génie Civil
- Used to validate candidate approvals (don't exceed allocated spots)

**Relationships**:
- ManyToOne with Centre
- ManyToOne with Specialite

---

#### 7. **Candidat** (`candidats` table)
Represents a person applying for a competition.

```java
@Entity
@Table(name = "candidats")
public class Candidat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String nom;
    
    @Column(nullable = false)
    private String prenom;
    
    @Column(nullable = false, unique = true)
    private String cin;               // National ID number
    
    @Column(nullable = false)
    private LocalDate dateNaissance;
    
    private String lieuNaissance;
    private String adresse;
    
    @Column(nullable = false)
    private String email;
    
    @Column(nullable = false)
    private String telephone;
    
    @OneToMany(mappedBy = "candidat", cascade = CascadeType.ALL)
    private List<Diplome> diplomes;
    
    @OneToMany(mappedBy = "candidat", cascade = CascadeType.ALL)
    private List<Candidature> candidatures;
}
```

**Key Fields**:
- `cin`: Unique national identifier
- `email`: Contact for notifications
- `dateNaissance`: Birth date for eligibility checks

**Relationships**:
- OneToMany with Diplome
- OneToMany with Candidature

---

#### 8. **Candidature** (`candidatures` table)
An application instance: a candidate applying for a specific competition/specialty/center.

```java
@Entity
@Table(name = "candidatures")
public class Candidature {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String numeroCandidature;       // Unique ID: "CAND-2026-000145"
    
    @ManyToOne
    @JoinColumn(name = "candidat_id", nullable = false)
    private Candidat candidat;
    
    @ManyToOne
    @JoinColumn(name = "concours_id", nullable = false)
    private Concours concours;
    
    @ManyToOne
    @JoinColumn(name = "specialite_id", nullable = false)
    private Specialite specialite;
    
    @ManyToOne
    @JoinColumn(name = "centre_id", nullable = false)
    private Centre centre;
    
    @ManyToOne
    @JoinColumn(name = "salle_id")
    private Salle salle;                    // Room assignment (null if not assigned)
    
    @Column(nullable = false)
    private String statut;                  // "EN_ATTENTE", "VALIDEE", "REJETEE"
    
    @Column(columnDefinition = "TEXT")
    private String commentaire;             // Rejection reason
    
    private LocalDateTime dateCreation;
    private LocalDateTime dateModification;
}
```

**Key Fields**:
- `numeroCandidature`: Unique tracking number shown to candidate
- `statut`: Application status (EN_ATTENTE, VALIDEE, REJETEE)
- `salle`: Assigned exam room (auto-assigned on validation)
- `commentaire`: Rejection reason if status is REJETEE

**Statuses**:
- **EN_ATTENTE**: Awaiting manager review
- **VALIDEE**: Approved, candidate will take exam
- **REJETEE**: Rejected, with reason

**Relationships**:
- ManyToOne with Candidat
- ManyToOne with Concours
- ManyToOne with Specialite
- ManyToOne with Centre
- ManyToOne with Salle

---

#### 9. **Salle** (`salles` table)
An exam room at a center.

```java
@Entity
@Table(name = "salles")
public class Salle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String nom;               // "Salle A", "Salle B"
    
    @Column(nullable = false)
    private Integer capacite;         // Max 50 candidates per room
    
    @ManyToOne
    @JoinColumn(name = "centre_id", nullable = false)
    private Centre centre;
    
    @OneToMany(mappedBy = "salle", cascade = CascadeType.ALL)
    private List<Candidature> candidatures;
    
    private LocalDateTime dateCreation;
}
```

**Key Fields**:
- `nom`: Room identifier (A, B, C, etc.)
- `capacite`: Max candidates (typically 50)
- `centre`: Which center this room belongs to

**Business Logic**:
- When a candidature is VALIDEE, it's automatically assigned to the first available salle with capacity < 50
- Multiple rooms can exist at same center to distribute candidates

**Relationships**:
- ManyToOne with Centre
- OneToMany with Candidature

---

#### 10. **Diplome** (`diplomes` table)
Educational qualification of a candidate.

```java
@Entity
@Table(name = "diplomes")
public class Diplome {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "candidat_id", nullable = false)
    private Candidat candidat;
    
    @Column(nullable = false)
    private String nomDiplome;        // "Licence en Informatique"
    
    @Column(nullable = false)
    private String niveau;            // "Licence", "Master", "Bac"
    
    private String specialite;        // Diploma specialty
    
    @Column(nullable = false)
    private Integer anneeObtention;   // Year obtained
}
```

**Relationships**:
- ManyToOne with Candidat

---

#### 11. **Document** (`documents` table)
Supporting documents submitted by candidates.

```java
@Entity
@Table(name = "documents")
public class Document {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "candidature_id")
    private Candidature candidature;
    
    @Column(nullable = false)
    private String typeDocument;      // "CV", "DIPLOME", "CIN"
    
    @Column(nullable = false)
    private String urlDocument;       // File path or URL
    
    private LocalDateTime dateUpload;
}
```

**Relationships**:
- ManyToOne with Candidature

---

#### 12. **Notification** (`notifications` table)
System notifications for user actions.

```java
@Entity
@Table(name = "notifications")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
    
    @Column(nullable = false)
    private String titre;
    
    @Column(columnDefinition = "TEXT")
    private String contenu;
    
    @Column(nullable = false)
    private String typeNotification;  // "INFO", "WARNING", "ERROR"
    
    private Boolean isRead;
    
    private LocalDateTime dateCreation;
}
```

**Relationships**:
- ManyToOne with User

---

### Database Relationships Summary

```
User ─── Role
  ├── Centre (GESTIONNAIRE_LOCAL only)
  └── Notification

Centre ─── CentreSpecialite ─── Specialite
  ├── Concours
  ├── Salle ─── Candidature
  └── (Users)

Concours ─── Candidature
              ├── Candidat ─── Diplome
              ├── Specialite
              ├── Centre
              ├── Salle
              └── Document
```

---

## Backend Architecture

### Project Structure

```
src/main/java/com/competition/
├── config/                    # Configuration classes
│   ├── SecurityConfig.java   # Spring Security setup, CORS, JWT filters
│   ├── JwtAuthenticationFilter.java  # JWT extraction & validation
│   └── WebConfig.java        # Beans, interceptors
│
├── controller/               # REST API endpoints
│   ├── AuthController.java   # Login/logout
│   ├── ConcoursController.java
│   ├── CentreController.java
│   ├── AdminCentreSpecialiteController.java
│   ├── AdminSpecialiteController.java
│   ├── AdminReportsController.java
│   ├── CentreController.java
│   ├── ManagerController.java
│   ├── PublicController.java
│   ├── SalleAdminController.java
│   ├── SalleController.java
│   └── UserController.java
│
├── dto/                      # Data Transfer Objects
│   ├── ApiResponse.java      # Standard response wrapper
│   ├── AuthenticationRequest.java
│   ├── AuthenticationResponse.java
│   └── (Other DTOs)
│
├── exception/               # Custom exceptions
│   └── (Exception classes)
│
├── model/                   # JPA Entities
│   ├── User.java
│   ├── Role.java
│   ├── Centre.java
│   ├── Concours.java
│   ├── Specialite.java
│   ├── CentreSpecialite.java
│   ├── Candidat.java
│   ├── Candidature.java
│   ├── Salle.java
│   ├── Diplome.java
│   ├── Document.java
│   ├── Notification.java
│   └── (Other models)
│
├── repository/              # JPA Repositories (DAO layer)
│   ├── UserRepository.java
│   ├── ConcoursRepository.java
│   ├── CentreRepository.java
│   ├── CandidatureRepository.java
│   ├── CandidatRepository.java
│   ├── SpecialiteRepository.java
│   ├── CentreSpecialiteRepository.java
│   ├── SalleRepository.java
│   └── (Other repositories)
│
├── security/               # Security utilities
│   ├── JwtUtils.java       # Token generation/validation
│   ├── CustomUserDetailsService.java
│   └── (Security filters)
│
└── service/                # Business logic layer
    ├── UserService.java
    ├── EmailService.java
    ├── CandidatureService.java
    └── (Other services)
```

### Key Controllers

#### **AuthController** (`/api/v1/auth`)
Handles user authentication.

```java
POST /auth/login
- Input: { email, password }
- Output: { token, role, email, fullName, centreId }
- Process:
  1. Validate credentials via AuthenticationManager
  2. Generate JWT token
  3. Save token to user.activeToken in database
  4. Return token to client

POST /auth/logout
- Invalidates token by clearing user.activeToken
```

---

#### **ConcoursController** (`/api/v1/admin/concours`)
Manages competition creation and configuration.

```java
GET /admin/concours                 # List all competitions
POST /admin/concours                # Create new competition
GET /admin/concours/{id}            # Get specific competition
PUT /admin/concours/{id}            # Update competition
DELETE /admin/concours/{id}         # Delete competition

Security: Requires ADMIN or GESTIONNAIRE_GLOBAL role
```

---

#### **AdminCentreSpecialiteController** (`/api/v1/admin/centre-specialites`)
Manages specialty allocations to centers.

```java
GET /admin/centre-specialites       # List all allocations
POST /admin/centre-specialites      # Create allocation (specify center, specialty, places)
GET /admin/centre-specialites/{id}  # Get specific allocation
PUT /admin/centre-specialites/{id}  # Update allocation
DELETE /admin/centre-specialites/{id} # Delete allocation

GET /admin/centres/{centreId}/specialites  # Get specialties for a center

Security: Requires ADMIN or GESTIONNAIRE_GLOBAL role
```

---

#### **ManagerController** (`/api/v1/manager`)
Manager functions for candidate processing.

```java
GET /manager/candidatures?centreId=X    # List candidatures (filtered by center)
POST /manager/candidatures/{id}/valider # Approve candidature (auto-assign to salle)
POST /manager/candidatures/{id}/rejeter?commentaire=X # Reject with reason
PUT /manager/candidatures/{id}/salle    # Manually assign to different room

GET /manager/centres                    # List all centers
GET /manager/centres/{centreId}/salles-with-candidates  # Get rooms & candidates status

Security: Requires ADMIN, GESTIONNAIRE_GLOBAL, or GESTIONNAIRE_LOCAL
Note: GESTIONNAIRE_LOCAL can only access their assigned center
```

---

#### **PublicController** (`/api/v1/public`)
Public endpoints (no authentication required).

```java
POST /public/postuler                   # Submit candidature
GET /public/suivi/{numero}              # Track candidature status
GET /public/concours                    # List open competitions
GET /public/specialites                 # List specialties
GET /public/centres                     # List centers
GET /public/concours-options            # Get filtered options (by center/specialty)
```

---

#### **SalleController** (`/api/v1/manager`) & **SalleAdminController** (`/api/v1/admin`)
Manage exam rooms.

```java
Admin Endpoints (SalleAdminController):
GET /admin/salles                       # List all rooms
POST /admin/salles                      # Create room
GET /admin/salles/{id}                  # Get specific room
PUT /admin/salles/{id}                  # Update room
DELETE /admin/salles/{id}               # Delete room

Manager Endpoints (SalleController):
GET /manager/centres/{centreId}/salles-with-candidates  # Get rooms with candidates
```

---

### Key Services

#### **UserService**
- User CRUD operations
- Password management
- Role assignment
- Center assignment for managers

#### **EmailService**
- Send notifications to candidates
- Rejection reasons
- Approval confirmations
- Configuration: Uses Gmail SMTP with environment variables
  - `GMAIL_USERNAME`: Email sender
  - `GMAIL_APP_PASSWORD`: App-specific password

#### **CandidatureService**
- Candidate application processing
- Validation logic
- Quota enforcement (checking CentreSpecialite allocations)
- Auto-assignment to salles
- Repository methods:
  - `countBySalleId(Long salleId)`: Count reserved seats per room
  - `findBySalleId(Long salleId)`: Get all candidates in a room

---

### Security Configuration

#### JWT Authentication Flow

```
1. User logs in with credentials
   ↓
2. AuthController.login() validates via AuthenticationManager
   ↓
3. JwtUtils generates JWT token (signed with secret key)
   ↓
4. Token saved to user.activeToken in database
   ↓
5. Token returned to client in response
   ↓
6. Client stores token in sessionStorage
   ↓
7. Client includes token in every request: Authorization: Bearer <token>
   ↓
8. JwtAuthenticationFilter on every request:
   - Extracts token from Authorization header
   - Validates signature
   - Checks if token matches user.activeToken in database
   - Sets SecurityContext with user authorities
   ↓
9. @PreAuthorize checks if user has required role
   ↓
10. If validation fails → HTTP 401 Unauthorized
```

#### Roles & Permissions

```
ADMIN
├── Create/Edit/Delete competitions (Concours)
├── Create/Edit/Delete specialties
├── Create/Edit/Delete centers
├── Manage specialty allocations
├── Create/Edit/Delete users
├── View all candidatures globally
├── Validate/Reject candidatures
├── Assign rooms
└── View reports

GESTIONNAIRE_GLOBAL
├── Create/Edit/Delete competitions
├── Create/Edit/Delete specialties
├── View/Manage specialty allocations
├── View all candidatures
├── Validate/Reject candidatures
├── Assign rooms
├── View all centers
└── View reports

GESTIONNAIRE_LOCAL (scoped to assigned center)
├── View candidatures for their center only
├── Validate/Reject candidatures
├── Assign candidates to rooms
├── View rooms in their center
└── Cannot access other centers' data

PUBLIC (Anonymous)
├── View available competitions
├── View specialties
├── View centers
├── Submit candidature (Postuler)
└── Track candidature status (Suivi)
```

---

## Frontend Architecture

### Project Structure

```
frontend/src/app/
├── core/                          # Core services (singleton)
│   └── core-module.ts            # Shared initialization
│
├── shared/                        # Shared components & utilities
│   └── (Shared pipes, directives)
│
├── layouts/                       # Main layout components
│   ├── main-layout.component.ts  # Wrapper for all pages
│   ├── header.component.ts       # Navigation bar
│   └── sidebar.component.ts      # Navigation sidebar
│
├── components/                    # Feature components
│   ├── auth/                     # Authentication
│   │   └── login/
│   │       ├── login.component.ts
│   │       ├── login.component.html
│   │       └── login.component.css
│   │
│   ├── administrateur/           # Admin features
│   │   ├── administrateur.component.ts  # Main admin page
│   │   ├── administrateur-dashboard.component.ts
│   │   ├── competition-management.component.ts
│   │   ├── specialty-allocation.component.ts
│   │   ├── centres-management.component.ts
│   │   ├── specialty-management.component.ts
│   │   ├── user-management.component.ts
│   │   ├── centre-assignments.component.ts
│   │   ├── roles-access.component.ts
│   │   ├── platform-settings.component.ts
│   │   └── reports-statistics.component.ts
│   │
│   ├── gestionnaire-global/      # Global manager features
│   │   ├── gestionnaire-global.component.ts
│   │   ├── allocations.component.ts
│   │   ├── candidatures.component.ts
│   │   └── reports.component.ts
│   │
│   ├── gestionnaire-local/       # Local manager features
│   │   ├── gestionnaire-local.component.ts
│   │   ├── candidatures.component.ts
│   │   ├── room-assignments.component.ts
│   │   └── centre-status.component.ts
│   │
│   ├── inscription/              # Candidate registration
│   │   ├── inscription.component.ts
│   │   └── (Multi-step form components)
│   │
│   ├── home/                     # Public home page
│   │   └── home.component.ts
│   │
│   ├── tracking/                 # Candidate tracking
│   │   └── suivi.component.ts
│   │
│   ├── supervision/              # System monitoring
│   │   └── supervision.component.ts
│   │
│   └── (Other feature components)
│
├── services/                      # HTTP & business logic
│   ├── api.service.ts           # All HTTP calls to backend
│   ├── auth.service.ts          # Authentication logic
│   ├── auth-utils.ts            # Helper functions
│   └── (Other services)
│
├── interceptors/                  # HTTP interceptors
│   └── auth.interceptor.ts      # Adds Authorization header
│
├── models/                        # TypeScript interfaces
│   └── models.ts                # All data type definitions
│
├── utils/                         # Utility functions
│   ├── auth-utils.ts            # Role checking, token storage
│   └── (Other utilities)
│
├── app.component.ts              # Root component
├── app.component.html            # Root template
├── app.component.css             # Root styles
├── app.config.ts                 # Angular configuration
├── app.routes.ts                 # Route definitions
└── app.ts                        # Bootstrap
```

### Key Interfaces (models.ts)

```typescript
// Standard API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// User & Authentication
export interface UserBase {
  id?: number;
  email: string;
  nom?: string;
  prenom?: string;
  role?: Role;
  centreId?: number;
}

export interface Role {
  id?: number;
  nom: string;
}

// Core Business Models
export interface Centre {
  id?: number;
  nom: string;
  ville: string;
  adresse?: string;
  telephone?: string;
}

export interface Concours {
  id?: number;
  titre?: string;
  description?: string;
  dateConcours: string;
  dateDebutInscription: string;
  dateFinInscription: string;
  statut: string;
  centre?: Centre;
}

export interface Specialite {
  id?: number;
  nom: string;
  description?: string;
}

export interface ConcoursOption {
  optionId: string;
  concoursId: number;
  concoursTitre: string;
  centreId: number;
  centreNom: string;
  centreVille: string;
  specialiteId: number;
  specialiteNom: string;
  nombrePlaces?: number;
}

export interface CentreSpecialiteAllocation {
  id?: number;
  centreId?: number;
  centreName?: string;
  specialiteId?: number;
  nombrePlaces: number;
}

// Candidature Tracking
export interface Candidat {
  id?: number;
  nom: string;
  prenom: string;
  cin: string;
  dateNaissance: string;
  lieuNaissance: string;
  adresse: string;
  email: string;
  telephone: string;
  diplomes?: Diplome[];
}

export interface Candidature {
  id?: number;
  numeroCandidature: string;
  candidat: Candidat;
  concours: Concours;
  specialite: Specialite;
  centre: Centre;
  salle?: Salle;
  statut: string;
  commentaire?: string;
  dateCreation: string;
}

export interface Salle {
  id?: number;
  nom: string;
  capacite: number;
  centre?: Centre;
}

export interface Diplome {
  id?: number;
  nomDiplome: string;
  niveau: string;
  specialite: string;
  anneeObtention: number;
}
```

---

### Key Services

#### **ApiService** (`api.service.ts`)
Centralized HTTP client for all backend communication.

```typescript
constructor(private http: HttpClient)
baseUrl = 'http://localhost:8080/api/v1'

// Public endpoints (no auth required)
postuler(candidature: Candidature): Observable<ApiResponse<Candidature>>
suivreCandidature(numero: string): Observable<ApiResponse<Candidature>>
getConcours(): Observable<ApiResponse<Concours[]>>
getSpecialites(): Observable<ApiResponse<Specialite[]>>
getCentres(): Observable<ApiResponse<Centre[]>>
getConcoursOptions(): Observable<ApiResponse<ConcoursOption[]>>

// Manager endpoints (requires auth)
getCandidatures(centreId?: number, concoursId?: number): Observable<ApiResponse<Candidature[]>>
validerCandidature(id: number): Observable<ApiResponse<void>>
rejeterCandidature(id: number, commentaire: string): Observable<ApiResponse<void>>
getSallesWithCandidates(centreId: number): Observable<ApiResponse<any>>
assignSalle(candidatureId: number, salleId?: number): Observable<ApiResponse<void>>

// Admin endpoints (requires auth)
getAdminConcours(): Observable<ApiResponse<Concours[]>>
createConcours(concours: Concours): Observable<ApiResponse<Concours>>
updateConcours(id: number, concours: Concours): Observable<ApiResponse<Concours>>
deleteConcours(id: number): Observable<ApiResponse<void>>

getAdminCentres(): Observable<ApiResponse<Centre[]>>
createCentre(centre: Centre): Observable<ApiResponse<Centre>>
updateCentre(id: number, centre: Centre): Observable<ApiResponse<Centre>>
deleteCentre(id: number): Observable<ApiResponse<void>>

getAdminSpecialites(): Observable<ApiResponse<Specialite[]>>
createSpecialite(specialite: Specialite): Observable<ApiResponse<Specialite>>
updateSpecialite(id: number, specialite: Specialite): Observable<ApiResponse<Specialite>>
deleteSpecialite(id: number): Observable<ApiResponse<void>>

getCentreSpecialites(centreId: number): Observable<ApiResponse<CentreSpecialiteAllocation[]>>
getCentreSpecialitesByCentre(centreId: number): Observable<ApiResponse<CentreSpecialiteAllocation[]>>
createCentreSpecialite(allocation: CentreSpecialiteAllocation): Observable<ApiResponse<CentreSpecialiteAllocation>>
updateCentreSpecialite(id: number, allocation: CentreSpecialiteAllocation): Observable<ApiResponse<CentreSpecialiteAllocation>>
deleteCentreSpecialite(id: number): Observable<ApiResponse<void>>
```

#### **AuthService** (`auth.service.ts`)
Manages user authentication and authorization.

```typescript
login(email: string, password: string): Observable<any>
logout(): void
isLoggedIn(): boolean
getToken(): string | null
setToken(token: string): void
getRole(): string | null
getEmail(): string | null
getFullName(): string | null
getCentreId(): number | null
canAccessAdmin(): boolean
canAccessManagerGlobal(): boolean
canAccessManagerLocal(): boolean
canManagePlatform(): boolean
```

#### **AuthInterceptor** (`auth.interceptor.ts`)
Automatically adds JWT token to all HTTP requests.

```typescript
intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  const token = this.auth.getToken();
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  return next.handle(req);
}
```

---

## API Endpoints

### Complete Endpoint Reference

#### **PUBLIC ENDPOINTS** (No Authentication)

```
POST   /api/v1/public/postuler
       Submit a new candidature
       Body: { candidat, concours, specialite, centre }
       Response: { success, message, data: Candidature }

GET    /api/v1/public/suivi/{numeroCandidature}
       Track application status
       Response: { success, message, data: Candidature }

GET    /api/v1/public/concours
       List all available competitions
       Response: { success, message, data: Concours[] }

GET    /api/v1/public/specialites
       List all specialties
       Response: { success, message, data: Specialite[] }

GET    /api/v1/public/centres
       List all centers
       Response: { success, message, data: Centre[] }

GET    /api/v1/public/concours-options
       Get filtered competition options
       Query params: ?centreId=X&specialiteId=Y&concoursId=Z
       Response: { success, message, data: ConcoursOption[] }
```

#### **AUTHENTICATION**

```
POST   /api/v1/auth/login
       User login
       Body: { email, password }
       Response: { token, role, email, fullName, centreId }

POST   /api/v1/auth/logout
       User logout (invalidates token)
       Response: { success, message }
```

#### **MANAGER ENDPOINTS** (Requires: ADMIN, GESTIONNAIRE_GLOBAL, GESTIONNAIRE_LOCAL)

```
GET    /api/v1/manager/candidatures
       List candidatures (filtered by centreId if provided)
       Query params: ?centreId=X&concoursId=Y
       Response: { success, message, data: Candidature[] }

POST   /api/v1/manager/candidatures/{id}/valider
       Approve candidature
       Auto-assigns to available salle if quota allows
       Response: { success, message }

POST   /api/v1/manager/candidatures/{id}/rejeter?commentaire=X
       Reject candidature with reason
       Response: { success, message }

PUT    /api/v1/manager/candidatures/{id}/salle?salleId=Y
       Assign candidature to a specific room
       Response: { success, message }

GET    /api/v1/manager/centres
       List all centers
       Role: ADMIN, GESTIONNAIRE_GLOBAL only
       Response: { success, message, data: Centre[] }

GET    /api/v1/manager/centres/{centreId}/salles-with-candidates
       Get rooms and candidate assignments for a center
       Response: {
         centreId, centreName,
         salles: [{ salle, candidatures: [...] }],
         unassignedCandidatures: [...]
       }
```

#### **ADMIN - COMPETITION MANAGEMENT** (Requires: ADMIN, GESTIONNAIRE_GLOBAL)

```
GET    /api/v1/admin/concours
       List all competitions
       Response: { success, message, data: Concours[] }

GET    /api/v1/admin/concours/{id}
       Get specific competition
       Response: { success, message, data: Concours }

POST   /api/v1/admin/concours
       Create new competition
       Body: { titre, description, dateConcours, dateDebutInscription, dateFinInscription, statut, centre }
       Response: { success, message, data: Concours }

PUT    /api/v1/admin/concours/{id}
       Update competition
       Body: { titre, description, ... }
       Response: { success, message, data: Concours }

DELETE /api/v1/admin/concours/{id}
       Delete competition
       Response: { success, message }
```

#### **ADMIN - SPECIALTY MANAGEMENT** (Requires: ADMIN, GESTIONNAIRE_GLOBAL)

```
GET    /api/v1/admin/specialites
       List all specialties
       Response: { success, message, data: Specialite[] }

GET    /api/v1/admin/specialites/{id}
       Get specific specialty
       Response: { success, message, data: Specialite }

POST   /api/v1/admin/specialites
       Create new specialty
       Body: { nom, description }
       Response: { success, message, data: Specialite }

PUT    /api/v1/admin/specialites/{id}
       Update specialty
       Body: { nom, description }
       Response: { success, message, data: Specialite }

DELETE /api/v1/admin/specialites/{id}
       Delete specialty
       Response: { success, message }
```

#### **ADMIN - CENTER MANAGEMENT** (Requires: ADMIN, GESTIONNAIRE_GLOBAL)

```
GET    /api/v1/admin/centres
       List all centers
       Response: { success, message, data: Centre[] }

GET    /api/v1/admin/centres/{id}
       Get specific center
       Response: { success, message, data: Centre }

POST   /api/v1/admin/centres
       Create new center
       Body: { nom, ville, adresse, telephone }
       Response: { success, message, data: Centre }

PUT    /api/v1/admin/centres/{id}
       Update center
       Body: { nom, ville, adresse, telephone }
       Response: { success, message, data: Centre }

DELETE /api/v1/admin/centres/{id}
       Delete center
       Response: { success, message }
```

#### **ADMIN - SPECIALTY ALLOCATIONS** (Requires: ADMIN, GESTIONNAIRE_GLOBAL)

```
GET    /api/v1/admin/centre-specialites
       List all allocations
       Response: { success, message, data: CentreSpecialiteAllocation[] }

GET    /api/v1/admin/centre-specialites/{id}
       Get specific allocation
       Response: { success, message, data: CentreSpecialiteAllocation }

GET    /api/v1/admin/centres/{centreId}/specialites
       Get specialties allocated to a center
       Response: { success, message, data: CentreSpecialiteAllocation[] }

POST   /api/v1/admin/centre-specialites
       Create allocation (assign specialty to center with number of places)
       Body: { centre: {id}, specialite: {id}, nombrePlaces }
       Response: { success, message, data: CentreSpecialiteAllocation }

PUT    /api/v1/admin/centre-specialites/{id}
       Update allocation
       Body: { nombrePlaces }
       Response: { success, message, data: CentreSpecialiteAllocation }

DELETE /api/v1/admin/centre-specialites/{id}
       Delete allocation
       Response: { success, message }
```

#### **ADMIN - ROOM MANAGEMENT** (Requires: ADMIN)

```
GET    /api/v1/admin/salles
       List all rooms
       Response: { success, message, data: Salle[] }

GET    /api/v1/admin/salles/{id}
       Get specific room
       Response: { success, message, data: Salle }

POST   /api/v1/admin/salles
       Create new room
       Body: { nom, capacite, centre: {id} }
       Response: { success, message, data: Salle }

PUT    /api/v1/admin/salles/{id}
       Update room
       Body: { nom, capacite }
       Response: { success, message, data: Salle }

DELETE /api/v1/admin/salles/{id}
       Delete room
       Response: { success, message }
```

#### **ADMIN - USER MANAGEMENT** (Requires: ADMIN)

```
GET    /api/v1/admin/users
       List all users
       Response: { success, message, data: UserBase[] }

GET    /api/v1/admin/users/{id}
       Get specific user
       Response: { success, message, data: UserBase }

POST   /api/v1/admin/users
       Create new user
       Body: { email, motDePasse, nom, prenom, role: {id}, centre: {id} }
       Response: { success, message, data: UserBase }

PUT    /api/v1/admin/users/{id}
       Update user
       Body: { email, nom, prenom, role: {id}, centre: {id} }
       Response: { success, message, data: UserBase }

DELETE /api/v1/admin/users/{id}
       Delete user
       Response: { success, message }
```

#### **ADMIN - REPORTS** (Requires: ADMIN, GESTIONNAIRE_GLOBAL)

```
GET    /api/v1/admin/reports
       Generate system statistics
       Response: { success, message, data: ReportData }

GET    /api/v1/admin/reports/centre/{centreId}
       Generate report for specific center
       Response: { success, message, data: ReportData }
```

---

## User Roles & Permissions

### Role Hierarchy & Access Matrix

| Feature | ADMIN | GESTIONNAIRE_GLOBAL | GESTIONNAIRE_LOCAL | PUBLIC |
|---------|-------|---------------------|-------------------|--------|
| **Authentication** |
| Login | ✅ | ✅ | ✅ | ✅ |
| Logout | ✅ | ✅ | ✅ | N/A |
| **Competition Management** |
| View competitions | ✅ | ✅ | ✅ (own center) | ✅ |
| Create competition | ✅ | ✅ | ❌ | ❌ |
| Edit competition | ✅ | ✅ | ❌ | ❌ |
| Delete competition | ✅ | ✅ | ❌ | ❌ |
| **Specialty Management** |
| View specialties | ✅ | ✅ | ✅ | ✅ |
| Create specialty | ✅ | ✅ | ❌ | ❌ |
| Edit specialty | ✅ | ✅ | ❌ | ❌ |
| Delete specialty | ✅ | ✅ | ❌ | ❌ |
| **Center Management** |
| View all centers | ✅ | ✅ | ❌ | ✅ |
| View own center | ✅ | ✅ | ✅ | N/A |
| Create center | ✅ | ✅ | ❌ | ❌ |
| Edit center | ✅ | ✅ | ❌ | ❌ |
| Delete center | ✅ | ✅ | ❌ | ❌ |
| **Specialty Allocations** |
| View allocations | ✅ | ✅ | ❌ | ❌ |
| Create allocation | ✅ | ✅ | ❌ | ❌ |
| Edit allocation | ✅ | ✅ | ❌ | ❌ |
| Delete allocation | ✅ | ✅ | ❌ | ❌ |
| **Room Management** |
| View rooms | ✅ | ✅ | ✅ (own center) | ❌ |
| Create room | ✅ | ❌ | ❌ | ❌ |
| Edit room | ✅ | ❌ | ❌ | ❌ |
| Delete room | ✅ | ❌ | ❌ | ❌ |
| **Candidature Management** |
| View candidatures | ✅ (all) | ✅ (all) | ✅ (own center) | ❌ |
| Submit candidature | N/A | N/A | N/A | ✅ |
| Track candidature | N/A | N/A | N/A | ✅ |
| Validate candidature | ✅ | ✅ | ✅ (own center) | ❌ |
| Reject candidature | ✅ | ✅ | ✅ (own center) | ❌ |
| Assign room | ✅ | ✅ | ✅ (own center) | ❌ |
| **User Management** |
| View users | ✅ | ❌ | ❌ | ❌ |
| Create user | ✅ | ❌ | ❌ | ❌ |
| Edit user | ✅ | ❌ | ❌ | ❌ |
| Delete user | ✅ | ❌ | ❌ | ❌ |
| **Reports & Analytics** |
| View system reports | ✅ | ✅ | ✅ (own center) | ❌ |
| Generate reports | ✅ | ✅ | ❌ | ❌ |

### Access Control Logic

```typescript
// Frontend auth-utils.ts
export function canManagePlatform(): boolean {
  // ADMIN or GESTIONNAIRE_GLOBAL
  return hasRole(['ADMIN', 'GESTIONNAIRE_GLOBAL']);
}

export function canManageCenter(centreId: number): boolean {
  const role = getRole();
  const userCentreId = getCentreId();
  
  if (role === 'ADMIN' || role === 'GESTIONNAIRE_GLOBAL') {
    return true;  // Can manage any center
  }
  if (role === 'GESTIONNAIRE_LOCAL') {
    return userCentreId === centreId;  // Can only manage own center
  }
  return false;
}

export function canViewDashboard(): boolean {
  // Any authenticated user
  return isLoggedIn();
}
```

---

## Authentication & Security

### JWT Implementation

#### Token Generation (Backend)

```java
// JwtUtils.java
public String generateToken(User user) {
    // Payload includes user ID, email, roles
    // Expires in 24 hours
    // Signed with SECRET_KEY
    return Jwts.builder()
        .setSubject(user.getEmail())
        .claim("userId", user.getId())
        .claim("role", user.getRole().getNom())
        .setIssuedAt(Date.from(Instant.now()))
        .setExpiration(Date.from(Instant.now().plus(24, ChronoUnit.HOURS)))
        .signWith(getSigningKey(), SignatureAlgorithm.HS256)
        .compact();
}

public String extractUsername(String token) {
    return Jwts.parser().setSigningKey(getSigningKey()).build()
        .parseClaimsJws(token).getBody().getSubject();
}

public boolean isTokenValid(String token) {
    try {
        Jwts.parser().setSigningKey(getSigningKey()).build()
            .parseClaimsJws(token);
        return true;
    } catch (Exception e) {
        return false;
    }
}
```

#### Login Flow

```
1. Client → POST /api/v1/auth/login { email, password }
   ↓
2. Backend AuthController.authenticate():
   - Validate credentials via AuthenticationManager
   - Load User from database
   ↓
3. Generate JWT token:
   - Payload: { sub: email, userId, role, iat, exp }
   - Sign with SECRET_KEY
   ↓
4. Save token to database:
   - user.setActiveToken(token)
   - userRepository.save(user)
   ↓
5. Return to client:
   {
     "token": "eyJhbGciOiJIUzI1NiJ9...",
     "role": "GESTIONNAIRE_GLOBAL",
     "email": "manager@example.com",
     "fullName": "John Manager",
     "centreId": 1
   }
   ↓
6. Client stores in sessionStorage:
   - sessionStorage.setItem('authToken', token)
   - sessionStorage.setItem('userRole', role)
   - (AuthService handles this)
```

#### Request Validation Flow

```
1. Client → GET /api/v1/admin/concours
   Header: Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
   ↓
2. JwtAuthenticationFilter intercepts request
   ↓
3. Extract token from Authorization header
   ↓
4. Call JwtUtils.extractUsername(token)
   - If invalid signature → return 401
   - If expired → return 401
   ↓
5. Get user from UserDetailsService
   ↓
6. Get activeToken from database
   ↓
7. Compare incoming token == user.activeToken
   - If not equal → return 401
   - If equal → continue
   ↓
8. Set SecurityContext with user authorities
   ↓
9. Check @PreAuthorize annotation
   - If user lacks required role → return 403
   ↓
10. Execute controller method
```

#### Logout Flow

```
1. Client → POST /api/v1/auth/logout
   Header: Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
   ↓
2. Backend extracts user from token
   ↓
3. Clear activeToken:
   - user.setActiveToken(null)
   - userRepository.save(user)
   ↓
4. Subsequent requests with same token:
   - token != null but user.activeToken == null
   - JwtAuthenticationFilter returns 401
   ↓
5. Client removes token from sessionStorage
```

### Security Headers & CORS

```java
// SecurityConfig.java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // CORS configuration
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.asList(
            "http://localhost:4200",      // Local development
            "http://localhost:3000"       // Alternative frontend port
        ));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(Arrays.asList("*"));
        config.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    // Security filter chain
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())  // Disabled for REST API (CORS + JWT)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/public/**").permitAll()
                .requestMatchers("/api/v1/auth/login").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
```

### Environment Variables & Secrets

```properties
# application.properties
spring.datasource.url=jdbc:postgresql://[host]:[port]/[database]
spring.datasource.username=[user]
spring.datasource.password=[password]

# Supabase PostgreSQL
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# JWT Secret (should be environment variable)
jwt.secret=${JWT_SECRET:your-secret-key-here}

# Email Configuration (Gmail SMTP)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=${GMAIL_USERNAME}
spring.mail.password=${GMAIL_APP_PASSWORD}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
```

**Note**: Environment variables should be set on deployment:
- `JWT_SECRET`: Private key for signing JWTs
- `GMAIL_USERNAME`: Email account for sending notifications
- `GMAIL_APP_PASSWORD`: App-specific password (not actual password)

---

## Core Features & Functionality

### 1. Candidate Registration (Public)

**Flow**:
1. Candidate navigates to `/inscription`
2. Multi-step form:
   - **Step 1**: Select Concours/Center/Specialty (from `/public/concours-options`)
   - **Step 2**: Enter personal information (name, CIN, email, phone, address)
   - **Step 3**: Upload/enter diplomas
   - **Step 4**: Review and submit
3. Submit to `POST /public/postuler`
4. Backend creates `Candidat` + `Candidature` records
5. Generates unique `numeroCandidature` (CAND-2026-XXXXX)
6. Returns number to candidate

**Frontend Component**: `inscription.component.ts`
- Multi-step form validation
- Concours selection from options
- Diplome management
- File uploads for documents

**Backend Process**:
```java
@PostMapping("/public/postuler")
public ResponseEntity<ApiResponse<Candidature>> postuler(
    @RequestBody CandidatureRequest request) {
    
    // 1. Find or create Candidat
    Candidat candidat = candidatRepository.findByCin(request.getCin())
        .orElse(new Candidat(request.getCandidatData()));
    
    // 2. Validate dates
    if (LocalDate.now().isBefore(concours.getDateDebutInscription())
        || LocalDate.now().isAfter(concours.getDateFinInscription())) {
        throw new Exception("Inscription fermée");
    }
    
    // 3. Create Candidature
    Candidature candidature = new Candidature();
    candidature.setCandidature(candidat);
    candidature.setConcours(concours);
    candidature.setSpecialite(specialite);
    candidature.setCentre(centre);
    candidature.setStatut("EN_ATTENTE");
    candidature.setNumeroCandidature(generateNumber());
    
    candidatureRepository.save(candidature);
    
    // 4. Send confirmation email
    emailService.sendConfirmation(candidat.getEmail(), numeroCandidature);
    
    return ApiResponse.success("Candidature soumise", candidature);
}
```

---

### 2. Candidate Tracking (Public)

**Flow**:
1. Candidate navigates to `/tracking`
2. Enters `numeroCandidature` (CAND-2026-XXXXX)
3. System queries `GET /public/suivi/{numero}`
4. Returns current status and details

**Statuses**:
- **EN_ATTENTE**: Waiting for manager review
- **VALIDEE**: Approved, assigned to exam room
- **REJETEE**: Rejected, with reason displayed

**Frontend Component**: `tracking.component.ts`
```typescript
suivreCandidature(numero: string) {
  this.api.suivreCandidature(numero).subscribe({
    next: (res) => {
      this.candidature = res.data;
      // Display status with color coding
      // Show rejection reason if applicable
    }
  });
}
```

---

### 3. Candidature Validation & Rejection (Manager)

**Flow**:
1. Manager views candidatures: `GET /manager/candidatures?centreId=X`
2. Candidatures displayed in list with status EN_ATTENTE
3. Manager clicks "Validate" or "Reject"

#### Validation Process

```
1. Manager clicks "Validate" button
   ↓
2. Backend checks quota:
   - Count current VALIDEE candidatures for this specialty at this center
   - Get allocation limit from CentreSpecialite
   - If count >= limit → Reject with "Quota atteint"
   ↓
3. If quota allows:
   - Set candidature.statut = "VALIDEE"
   - Find first salle with candidatures.count < 50
   - Assign: candidature.setSalle(salle)
   ↓
4. Save candidature
   ↓
5. Send email to candidate:
   - "Votre candidature a été validée"
   - Exam room information
   ↓
6. Return success response
```

**Backend Logic**:
```java
@PostMapping("/manager/candidatures/{id}/valider")
public ResponseEntity<ApiResponse<void>> validerCandidature(@PathVariable Long id) {
    Candidature candidature = repository.findById(id)
        .orElseThrow(() -> new Exception("Not found"));
    
    // Check quota
    int count = candidatureRepository.countBySpecialiteIdAndCentreIdAndStatut(
        candidature.getSpecialite().getId(),
        candidature.getCentre().getId(),
        "VALIDEE"
    );
    
    CentreSpecialite allocation = centreSpecialiteRepository
        .findByCentreAndSpecialite(candidature.getCentre(), candidature.getSpecialite())
        .orElseThrow();
    
    if (count >= allocation.getNombrePlaces()) {
        throw new Exception("Quota atteint");
    }
    
    // Auto-assign to salle
    Salle salle = salleRepository.findFirstByCentreOrderByCandidaturesSize(
        candidature.getCentre()
    );
    
    if (salle != null && candidatureRepository.countBySalleId(salle.getId()) < 50) {
        candidature.setSalle(salle);
    }
    
    candidature.setStatut("VALIDEE");
    candidatureRepository.save(candidature);
    
    // Send email
    emailService.sendValidationEmail(candidature.getCandidato().getEmail());
    
    return ApiResponse.success("Validée");
}
```

#### Rejection Process

```
1. Manager clicks "Reject" button
2. Manager enters rejection reason/comment
3. Backend:
   - Set candidature.statut = "REJETEE"
   - Set candidature.commentaire = reason
   - Save
   - Send email with reason
4. Candidate can view reason in tracking page
```

---

### 4. Room Assignment & Management

**Flow for Automatic Assignment**:
1. When candidature is validated, backend auto-assigns to first available salle
2. First available = salle with < 50 candidates, ordered by current count

**Manual Assignment** (by manager):
```
1. Manager views `/manager/centres/{centreId}/salles-with-candidates`
2. Shows all salles and their current occupancy
3. Shows unassigned validated candidatures
4. Manager can drag-assign or click to reassign
5. Calls: PUT /manager/candidatures/{id}/salle?salleId=X
```

**Backend Response for Salles Status**:
```java
GET /manager/centres/{centreId}/salles-with-candidates

Response: {
  centreId: 1,
  centreNom: "Centre de Casablanca",
  salles: [
    {
      salle: {
        id: 1,
        nom: "Salle A",
        capacite: 50
      },
      candidatures: [
        { id: 10, numeroCandidature: "CAND-2026-00001", candidat: {...} },
        { id: 11, numeroCandidature: "CAND-2026-00002", candidat: {...} },
        // ... up to 50
      ]
    },
    {
      salle: { id: 2, nom: "Salle B", capacite: 50 },
      candidatures: [ ... ]
    }
  ],
  unassignedCandidatures: [
    // Validated but not yet assigned to salle
  ]
}
```

---

### 5. Specialty Allocation Planning

**Business Purpose**:
- Admins define how many spots each specialty gets at each center
- Example: Centre Casablanca gets 50 spots for Informatique

**Frontend Component**: `specialty-allocation.component.ts`
- Shows capacity overview cards per center
  - Number of specialties
  - Total allocated places
  - Total reserved places (candidates assigned)
- Shows allocations table with:
  - Specialty name
  - Center name
  - Allocated places / Reserved places

**Data Flow**:
```
1. Component loads in ngOnInit()
   ↓
2. Fetch centers: GET /admin/centres
3. Fetch allocations for each center: GET /admin/centres/{id}/specialites
4. Fetch salles with candidates: GET /manager/centres/{id}/salles-with-candidates
   (to calculate reserved count per center)
   ↓
5. Calculate totals:
   - getTotalSpots(centreId) = sum of nombrePlaces for that center
   - getReservedPlacesByCenter(centreId) = sum of candidates assigned to salles
   ↓
6. Display in template:
   - Capacity cards show: Specialties count, Total allocated, Total reserved
   - Allocations table shows: Specialty, Center, Allocated / Reserved, Actions
```

**Admin Can**:
- Create allocation: `POST /admin/centre-specialites`
  - Select center + specialty + number of places
- Edit allocation: `PUT /admin/centre-specialites/{id}`
  - Change number of places
- Delete allocation: `DELETE /admin/centre-specialites/{id}`

---

### 6. User Management (Admin Only)

**Features**:
- Create users with roles (ADMIN, GESTIONNAIRE_GLOBAL, GESTIONNAIRE_LOCAL)
- Assign centers to local managers
- Reset passwords
- View and edit user details
- Delete users

**Frontend Component**: `user-management.component.ts`
- List of all users with role badges
- Create user form with role selection
- Edit modal for user details
- Center assignment dropdown for local managers
- Password reset button

**API Endpoints**:
```
GET    /admin/users                  # List all
POST   /admin/users                  # Create
GET    /admin/users/{id}             # Get one
PUT    /admin/users/{id}             # Update
DELETE /admin/users/{id}             # Delete
```

---

### 7. Reports & Statistics

**Available Reports**:
1. **System Overview**:
   - Total candidatures
   - Validated vs. Rejected counts
   - Pending count
   - Success rate

2. **Center-Specific**:
   - Candidatures by center
   - Specialties distribution
   - Room occupancy
   - Approval rates

3. **Export** (optional):
   - CSV export of candidatures
   - PDF reports

**Frontend Component**: `reports-statistics.component.ts`
- Charts showing statistics
- Filters by date range, center, specialty
- Export buttons

---

## Frontend Pages & Components

### Component Hierarchy

```
AppComponent
├── AuthComponent (Login)
├── MainLayoutComponent
│   ├── HeaderComponent (Navigation)
│   ├── SidebarComponent (Menu)
│   └── RouterOutlet (Page content)
│
├── InscriptionComponent (Public)
│   ├── Step 1: Concours Selection
│   ├── Step 2: Personal Info
│   ├── Step 3: Diplomas
│   └── Step 4: Review & Submit
│
├── TrackingComponent (Public)
│   └── Status Display
│
├── HomeComponent (Public)
│
├── AuthAdministrateurComponent (Authenticated)
│   ├── AdministrateurDashboardComponent
│   ├── CompetitionManagementComponent
│   │   ├── Concours List
│   │   ├── Create Modal
│   │   ├── Edit Modal
│   │   └── Candidates Overlay
│   │
│   ├── SpecialtyAllocationComponent
│   │   ├── Capacity Overview Cards
│   │   ├── Allocations Table
│   │   └── Reservation Display
│   │
│   ├── CentresManagementComponent
│   │   ├── Centers List
│   │   ├── Create Modal
│   │   └── Edit Modal
│   │
│   ├── SpecialtyManagementComponent
│   │   ├── Specialties List
│   │   └── CRUD Forms
│   │
│   ├── UserManagementComponent
│   │   ├── Users Table
│   │   ├── Create User Form
│   │   └── Role/Center Assignment
│   │
│   ├── CentreAssignmentsComponent
│   │   └── Manager ↔ Center mapping
│   │
│   ├── RolesAccessComponent
│   │   └── Permission matrix display
│   │
│   ├── PlatformSettingsComponent
│   │   └── System configuration
│   │
│   └── ReportsStatisticsComponent
│       └── Charts & export
│
├── GestionnaireGlobalComponent
│   ├── AllocationManagementComponent
│   ├── CandidaturesGlobalComponent
│   └── ReportsGlobalComponent
│
└── GestionnaireLocalComponent
    ├── CandidaturesLocalComponent
    ├── RoomAssignmentComponent
    └── CentreStatusComponent
```

### Key Component Details

#### **Inscription Component** (Public)
- Multi-step form for candidate registration
- Step 1: Select Concours/Center/Specialty
  - Fetches options from `GET /public/concours-options`
  - User filters by center, specialty, or competition
- Step 2: Personal Information
  - Full name, CIN, birth date, address, phone, email
  - Validation (CIN length, email format, etc.)
- Step 3: Diplomas
  - Dynamic form for adding multiple diplomas
  - Fields: Diploma name, level, specialty, year obtained
- Step 4: Review
  - Display summary
  - Confirm and submit
- Submission: `POST /public/postuler`
- Response displays generated `numeroCandidature`

---

#### **Tracking Component** (Public)
- Simple form: Input candidature number
- `GET /public/suivi/{numero}`
- Display result with status badge
- If rejected, show rejection reason
- Color-coded status:
  - EN_ATTENTE: Yellow/Orange
  - VALIDEE: Green
  - REJETEE: Red

---

#### **Competition Management Component** (Admin)
- List of all concours with:
  - Title, dates, status badge
  - Associated center
  - Action buttons: Edit, Delete, View Candidates
- Create Button opens form:
  - Fields: Title, Description, Dates, Status, Center dropdown
  - Modal overlay with backdrop
  - Close on outside click or Cancel button
- Edit: Click row to open edit modal
  - Pre-populated with current data
  - Save updates via `PUT /admin/concours/{id}`
- View Candidates:
  - Overlay showing all candidatures for that concours
  - Filters by status
- Delete: Confirmation dialog

---

#### **Specialty Allocation Component** (Admin)
- **Capacity Overview Cards** (Vue d'Ensemble):
  ```
  ┌─────────────────────────┐
  │ Centre: Casablanca      │
  │ Ville: Casablanca       │
  ├─────────────────────────┤
  │ Spécialités: 3          │
  │ Places Totales: 150     │
  │ Places Réservées: 87    │
  └─────────────────────────┘
  ```
  - Shows allocated vs. reserved places per center
  - Updated when candidatures are validated/rejected

- **Allocations Table**:
  ```
  | Spécialité  | Centre      | Places Allouées / Réservées | Actions |
  |─────────────|─────────────|────────────────────────────|─────────|
  | Informatique| Casablanca  | 50 / 30                    | ✏️ 🗑️  |
  | Génie Civil | Casablanca  | 40 / 25                    | ✏️ 🗑️  |
  ```
  - Places column shows: Allocated / Reserved
  - Reserved count comes from salle assignments
  - Only managers can edit/delete

---

#### **Candidature Management (Manager)** 
- List of candidatures for manager's center(s)
- Columns: Candidature #, Candidate Name, Specialty, Status, Actions
- Filters: By status, by specialty
- Action buttons:
  - **Validate**: Checks quota, auto-assigns to salle, sends email
  - **Reject**: Opens modal for rejection reason input
- Manual room assignment:
  - Drag-and-drop or click to reassign
  - Shows salle capacity and current occupancy

---

## Backend Services & Controllers

### ConcoursController Flow

```
Request: POST /api/v1/admin/concours
{
  "titre": "Concours 2026",
  "description": "Main entrance exam",
  "dateConcours": "2026-06-15",
  "dateDebutInscription": "2026-01-01",
  "dateFinInscription": "2026-05-31",
  "statut": "OUVERT",
  "centre": { "id": 1 }
}
  ↓
[Security] JwtAuthenticationFilter validates token
  ↓
[Authorization] @PreAuthorize checks role (ADMIN or GESTIONNAIRE_GLOBAL)
  ↓
ConcoursController.createConcours()
  ├─ Resolve centre relationship:
  │  centreRepository.findById(1).ifPresent(concours::setCentre)
  │
  ├─ Save to database:
  │  concoursRepository.save(concours)
  │
  └─ Return ApiResponse wrapper:
     {
       "success": true,
       "message": "Concours créé avec succès.",
       "data": { "id": 1, "titre": "Concours 2026", ... }
     }
```

### CentreSpecialiteController (Allocations) Flow

```
Request: POST /api/v1/admin/centre-specialites
{
  "centre": { "id": 1 },
  "specialite": { "id": 2 },
  "nombrePlaces": 50
}
  ↓
Service validates:
- Centre exists
- Specialty exists
- No duplicate allocation already exists
  ↓
Create CentreSpecialite record:
- centre_id = 1
- specialite_id = 2
- nombrePlaces = 50
  ↓
Return created record
```

---

### ManagerController (Candidature Validation) Flow

```
Request: POST /api/v1/manager/candidatures/{id}/valider
Header: Authorization: Bearer <jwt>
  ↓
[Security] Validate JWT & session
  ↓
[Authorization] Check if user is GESTIONNAIRE_LOCAL for that center
  ↓
ManagerController.validerCandidature(id)
  ├─ Load candidature with relations
  │
  ├─ Query allocation:
  │  centreSpecialiteRepository.findByCentreAndSpecialite(centre, specialite)
  │
  ├─ Check quota:
  │  count = candidatureRepository.countBySpecialiteAndCentreAndStatut(
  │    specialite.id, centre.id, "VALIDEE"
  │  )
  │  if (count >= allocation.nombrePlaces) {
  │    throw new QuotaExceededException();
  │  }
  │
  ├─ Find available salle:
  │  salle = salleRepository.findFirstByCentreOrderByCandidaturesCount(centre)
  │  if (candidatureRepository.countBySalleId(salle.id) < 50) {
  │    candidature.setSalle(salle)
  │  }
  │
  ├─ Update status:
  │  candidature.setStatut("VALIDEE")
  │  candidatureRepository.save(candidature)
  │
  ├─ Send email notification:
  │  emailService.sendApprovalEmail(
  │    candidat.email,
  │    salle.nom,
  │    dateConcours
  │  )
  │
  └─ Return success response
```

---

## Data Flow & Integration Patterns

### Complete Request/Response Flow Example: Submit Candidature

```
FRONTEND (Angular)
│
├─ User fills inscription form (Step 1-4)
│  └─ Form data:
│     {
│       candidat: { nom, prenom, cin, dateNaissance, email, telephone, adresse },
│       concours: { id: 1 },
│       specialite: { id: 2 },
│       centre: { id: 1 }
│     }
│
├─ User clicks "Submit"
│  └─ inscriptionService.postuler(formData)
│     └─ this.apiService.postuler(candidature)
│        └─ this.http.post('/api/v1/public/postuler', candidature)
│
└─ HTTP Request sent to backend
   POST http://localhost:8080/api/v1/public/postuler
   Body: { candidat, concours, specialite, centre }
   Headers: Content-Type: application/json

────────────────────────────────────────────────────────────

BACKEND (Spring Boot)

├─ DispatcherServlet routes to PublicController
│
├─ PublicController.postuler(CandidatureRequest)
│  └─ Method body:
│     1. Validate input (non-null fields)
│     2. Find or create Candidat
│        candidat = candidatRepository.findByCin(request.cin)
│                   .orElse(new Candidat(request.candidatData))
│
│     3. Load relations
│        concours = concoursRepository.findById(request.concoursId)
│        specialite = specialiteRepository.findById(request.specialiteId)
│        centre = centreRepository.findById(request.centreId)
│
│     4. Validate dates
│        if (LocalDate.now() < concours.dateDebutInscription
│            || LocalDate.now() > concours.dateFinInscription)
│          throw new Exception("Registration closed");
│
│     5. Create Candidature
│        Candidature candidature = new Candidature();
│        candidature.setCandidature(candidat);
│        candidature.setConcours(concours);
│        candidature.setSpecialite(specialite);
│        candidature.setCentre(centre);
│        candidature.setStatut("EN_ATTENTE");
│        candidature.setNumeroCandidature(generateUniqueName());
│        candidature.setDateCreation(LocalDateTime.now());
│
│     6. Persist to database
│        candidatureRepository.save(candidature);
│
│     7. Send confirmation email
│        emailService.sendConfirmation(
│          candidat.getEmail(),
│          candidature.getNumeroCandidature(),
│          concours.getTitre()
│        )
│
│     8. Build response
│        ApiResponse<Candidature> response = new ApiResponse<>();
│        response.setSuccess(true);
│        response.setMessage("Votre candidature a été soumise...");
│        response.setData(candidature);
│
└─ HTTP Response sent to client
   Status: 200 OK
   Body:
   {
     "success": true,
     "message": "Votre candidature a été soumise avec succès. Votre numéro est : CAND-2026-000145",
     "data": {
       "id": 145,
       "numeroCandidature": "CAND-2026-000145",
       "candidat": {
         "id": 87,
         "nom": "Dupont",
         "prenom": "Jean",
         "cin": "AB123456",
         ...
       },
       "concours": { "id": 1, "titre": "Concours 2026", ... },
       "specialite": { "id": 2, "nom": "Informatique", ... },
       "centre": { "id": 1, "nom": "Centre de Casablanca", ... },
       "statut": "EN_ATTENTE",
       "dateCreation": "2026-07-15T10:30:00"
     }
   }

────────────────────────────────────────────────────────────

FRONTEND (Continued)

└─ ApiService returns Observable<ApiResponse<Candidature>>
   ├─ InscriptionComponent.postuler() completes
   ├─ Component displays success message & numero
   │  "Merci! Votre numéro est: CAND-2026-000145"
   ├─ Button to print/save number
   └─ Navigation option to view other pages
```

---

### Observable Chaining Pattern (forkJoin for Parallel Loads)

**Example**: Loading dashboard with multiple data sources

```typescript
// specialtyAllocationComponent.ts

ngOnInit() {
  // Parallel load all required data
  forkJoin([
    this.api.getAdminCentres(),           // GET /admin/centres
    this.api.getAdminSpecialites()        // GET /admin/specialites
  ]).subscribe({
    next: ([centresRes, specialitesRes]) => {
      this.centres = centresRes.data;
      this.specialites = specialitesRes.data;
      
      // Load allocations for each centre sequentially
      this.loadAllocations();
      this.loadSallesData();
    },
    error: (err) => console.error('Load failed', err)
  });
}

loadAllocations() {
  const allocRequests = this.centres.map(centre =>
    this.api.getCentreSpecialitesByCentre(centre.id!).pipe(
      map(res => res.data.map(alloc => ({
        ...alloc,
        centreName: centre.nom
      })))
    )
  );
  
  forkJoin(allocRequests).subscribe({
    next: (results) => {
      this.allocations = results.flat();
    }
  });
}

loadSallesData() {
  const salleRequests = this.centres.map(centre =>
    this.api.getSallesWithCandidates(centre.id!).pipe(
      map(res => ({
        centreId: centre.id,
        salles: res.data?.salles || []
      }))
    )
  );
  
  forkJoin(salleRequests).subscribe({
    next: (results) => {
      results.forEach(item => {
        const reserved = item.salles
          .reduce((sum, s) => sum + (s.candidatures?.length || 0), 0);
        this.sallesData.set(item.centreId, reserved);
      });
    }
  });
}

getReservedPlacesByCenter(centreId: number): number {
  return this.sallesData.get(centreId) || 0;
}
```

---

## Setup & Running Instructions

### Prerequisites
- Node.js 18+ (for Angular frontend)
- Java 17+ (for Spring Boot backend)
- PostgreSQL 12+ (or Supabase PostgreSQL)
- Maven 3.6+ (for building backend)
- Angular CLI 18+ (for frontend development)

### Backend Setup

#### 1. Clone & Navigate
```bash
cd C:\Projects\GestionDesConcours
```

#### 2. Database Configuration
Create `.env` file or set environment variables:
```
DATABASE_URL=jdbc:postgresql://host:5432/concours_db
DATABASE_USER=your_user
DATABASE_PASSWORD=your_password
JWT_SECRET=your-secret-key-min-32-chars
GMAIL_USERNAME=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-specific-password
```

#### 3. Update application.properties
```properties
spring.datasource.url=${DATABASE_URL}
spring.datasource.username=${DATABASE_USER}
spring.datasource.password=${DATABASE_PASSWORD}
jwt.secret=${JWT_SECRET}
spring.mail.username=${GMAIL_USERNAME}
spring.mail.password=${GMAIL_APP_PASSWORD}
```

#### 4. Build & Run
```bash
# Build
.\mvnw.cmd clean package

# Run
.\mvnw.cmd spring-boot:run

# Backend starts at: http://localhost:8080
# Swagger UI: http://localhost:8080/swagger-ui/index.html
```

### Frontend Setup

#### 1. Navigate to Frontend
```bash
cd frontend
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Configure API Endpoint
Update `src/app/services/api.service.ts`:
```typescript
private baseUrl = 'http://localhost:8080/api/v1';
```

#### 4. Run Development Server
```bash
ng serve --open

# Frontend starts at: http://localhost:4200
```

#### 5. Build for Production
```bash
ng build --configuration production

# Output in: dist/
```

### Testing the Application

#### Login Credentials
```
Admin:
  Email: admin@competition.com
  Password: admin123

Global Manager:
  Email: global@competition.com
  Password: global123

Local Manager (Casablanca):
  Email: local@competition.com
  Password: local123
```

#### Test Flows
1. **Public Inscription**:
   - Navigate to http://localhost:4200
   - Click "Inscription"
   - Fill form and submit
   - Note candidature number

2. **Track Candidature**:
   - Navigate to "Suivi"
   - Enter candidature number
   - View status

3. **Manager Dashboard**:
   - Login as global or local manager
   - View candidatures
   - Validate/Reject candidates
   - Assign to rooms

4. **Admin Dashboard**:
   - Login as admin
   - Create competitions
   - Create specialties
   - Create centers
   - Manage allocations
   - Manage users

---
---

## Recent Changes - Centre-Specialite Allocation System

### Overview of Changes

The system has been significantly updated to improve how specialities are allocated to centers and how concours options are generated for public registration. These changes provide better flexibility and capacity management.

### What Was Before

**Previous System:**
- **Concours-Specialite Direct Relationship**: The `Concours` entity had a direct `@ManyToOne` relationship with `Specialite`
- **Public Concours Options**: The `getConcoursOptions()` endpoint generated options based on the direct concours-specialite relationship
- **Limited Flexibility**: Each concours could only be associated with one speciality directly
- **Capacity Management**: The `CentreSpecialite` table existed but was not the primary mechanism for generating registration options

**Previous Data Flow:**
1. Admin creates a concours with a specific centre and speciality
2. The `getConcoursOptions()` endpoint would show that concours-speciality combination
3. Capacity was managed separately via `CentreSpecialite` but didn't drive the registration options

### What We Changed

**New System:**
- **Centre-Specialite as Primary Allocation Mechanism**: The `CentreSpecialite` entity is now the primary way specialities are assigned to centers
- **DTO-Based API Creation**: Created `CentreSpecialiteRequest` DTO for cleaner API input
- **Enhanced Centres Management UI**: Added ability to add/remove speciality allocations directly in the centres management page
- **Updated Concours Options Logic**: The `getConcoursOptions()` endpoint returns each concours with its selected speciality; the matching centre-specialite allocation provides its capacity
- **Concours Model Update**: Added `specialite` field to `Concours` as a reference (optional, for backward compatibility)

**Key Changes Made:**

1. **Backend - New DTO (`CentreSpecialiteRequest.java`):**
   ```java
   @Data
   public class CentreSpecialiteRequest {
       private Long centreId;
       private Long specialiteId;
       private Integer nombrePlaces;
   }
   ```

2. **Backend - Updated Controller (`AdminCentreSpecialiteController.java`):**
   - Modified `createAllocation()` to accept DTO instead of nested entity objects
   - Controller now looks up `Centre` and `Specialite` entities by their IDs
   - Builds `CentreSpecialite` entity with found entities before saving

3. **Backend - Updated Public Controller (`PublicController.java`):**
   - Modified `getConcoursOptions()` to return one option per open concours
   - Uses the centre and speciality selected on the concours itself
   - Uses the matching centre-specialite allocation only to display the available places

4. **Frontend - Updated API Service (`api.service.ts`):**
   - Changed `createCentreSpecialite()` to send simple DTO format: `{ centreId, specialiteId, nombrePlaces }`
   - Removed nested object format that was sending `{ centre: { id }, specialite: { id } }`

5. **Frontend - Enhanced Centres Management (`centres-management.component.ts`):**
   - Added UI to view all specialities allocated to a center
   - Added form to add new speciality allocations with place counts
   - Added delete functionality to remove speciality allocations
   - Added dropdown to select from available specialities (excluding already allocated ones)

### How It Works Now

**New Data Flow:**
1. Admin creates centres and specialities via their respective management pages
2. Admin goes to centres management page and clicks "Afficher spécialités" on a centre
3. Admin adds specialities to the centre with allocated places using the new form
4. Admin creates a concours assigned to that centre with status "OUVERT"
5. The `getConcoursOptions()` endpoint returns one registration option for each open concours, combining:
   - The centre assigned to the concours
   - The speciality assigned to the concours
   - Its matching centre-specialite allocation for the number of places

**Benefits:**
- **Better Capacity Management**: Each centre can have multiple specialities with different capacity allocations
- **Clear Registration Scope**: Each concours is launched for one selected speciality at one selected centre
- **Centralized Management**: All speciality allocations are managed in one place (centres management)
- **Clear Capacity Tracking**: Places are explicitly allocated per centre-speciality combination
- **Scalable Architecture**: Easy to add more allocation logic in the future

### Required Setup for New System

**To make concours options appear for public registration:**

1. **Create Centres**: Use the centres management page to create exam centers
2. **Create Specialities**: Use the speciality management page to create available specialities
3. **Allocate Specialities to Centres**: 
   - Go to centres management page
   - Click "Afficher spécialités" on a centre
   - Click "+ Ajouter une spécialité"
   - Select speciality and specify number of places
   - Repeat for each speciality you want to offer at that centre
4. **Create Concours**: Create a concours assigned to that centre with status "OUVERT"
5. **Verify Options**: The inscription page should now show options based on the allocations

**Important Notes:**
- Without centre-specialite allocations, no registration options will appear even if concours exist
- The concours must have status "OUVERT" to appear in public options
- Each concours creates a single registration option for its selected speciality
- The number of places from the allocation is shown to candidates

### Migration Considerations

**For Existing Data:**
- Existing `Concours` entities with direct specialite relationships will still work
- The new system is backward compatible with the old `specialite` field in `Concours`
- However, to use the new allocation system, you need to create centre-specialite allocations

**For Frontend:**
- The inscription component uses `getConcoursOptions()` and displays one card per concours
- Each concours must have a centre and speciality selected before it can be displayed publicly

**For Backend:**
- The old API format for creating allocations is no longer supported
- All allocation creation must use the new DTO format

### Summary

The centre-specialite allocation system has been transformed from a secondary capacity tracking mechanism to the primary driver of registration options. This provides better flexibility, clearer capacity management, and a more intuitive admin interface for managing what specialities are offered at each centre.

---

## Recent Changes - Registration Documents, Candidate Review, and Theme

### PDF document submission

The public registration form is now a four-step process. In step 4, candidates must upload the following PDF files (maximum 5 MB each):

- Copy of CIN
- Curriculum Vitae
- Diplomas and attestations

The files are submitted with the candidature through `POST /api/v1/public/postuler-avec-documents` using multipart form data. They are saved in the backend `uploads` directory, while their metadata (original filename, stored filename, type, and candidature) is stored in the `documents` table. The configured request limit is 16 MB to support the three required files.

The former email-notification checkbox and fifth registration step were removed. The terms-and-privacy acceptance checkbox is now at the bottom of step 4.

### Candidate document review

The competition-management screen now loads candidates only for the selected concours. The frontend sends `concoursId`, and `GET /api/v1/manager/candidatures` now applies that filter on the backend.

Candidate rows are compact by default. Administrators and global managers can:

- Expand a candidate with **Détails** to review personal and academic information.
- Open submitted PDFs using the CIN, CV, and DIPLOME document buttons.

Documents are served through the protected endpoint:

`GET /api/v1/manager/candidatures/{candidatureId}/documents/{documentId}`

Access to the file-viewing endpoint is restricted to `ADMIN` and `GESTIONNAIRE_GLOBAL` roles.

### Room management and assignment

Administrators and global managers now have a **Salles** supervision page. It supports creating, editing, filtering, and deleting exam rooms. Each room must be linked to:

- One centre
- One speciality already allocated to that centre
- Its capacity

The room API (`/api/v1/admin/salles`) is available to both `ADMIN` and `GESTIONNAIRE_GLOBAL`. The candidate-assignment page then filters by centre followed by speciality, shows only validated candidates, displays their automatic room assignment, and offers only rooms compatible with their speciality for manual reassignment.

### Institutional visual theme

The Angular interface now follows an Emploi-Public Morocco-inspired government portal theme:

- Deep navy (`#072F75`) for the sidebar, structure, and headings.
- Gold (`#F2AF29`) for primary calls to action.
- Poppins/Open Sans typography, high-contrast text, white elevated cards, and rounded form controls.
- Responsive spacing and keyboard focus states across shared controls.

The shared implementation is located in `frontend/src/styles.css` and `frontend/src/app/app.component.css`.

## Summary

This comprehensive documentation covers:

✅ **Application Overview**: Purpose, target users, key business flows  
✅ **Technology Stack**: Frontend (Angular 18), Backend (Spring Boot 3.2.2), Database (PostgreSQL)  
✅ **Database Schema**: 12 core entities with relationships and business logic  
✅ **Backend Architecture**: Controllers, Services, Repositories, Security  
✅ **Frontend Architecture**: Components, Services, Models, Interceptors  
✅ **All API Endpoints**: Public, Authentication, Manager, Admin (50+ endpoints)  
✅ **User Roles & Permissions**: Matrix showing access levels  
✅ **Authentication & Security**: JWT implementation, session validation, CORS  
✅ **Core Features**: Registration, Tracking, Validation, Allocation, Reporting  
✅ **Document Workflow**: Required PDF upload, protected storage, and candidate-file review  
✅ **Visual System**: Institutional Emploi-Public-inspired responsive theme  
✅ **Component Details**: Each major component explained with code samples  
✅ **Data Flow**: Complete request/response cycles with examples  
✅ **Setup Instructions**: Backend and frontend installation & running

For questions or updates, refer to individual component files or the API documentation at `http://localhost:8080/swagger-ui/index.html`.
