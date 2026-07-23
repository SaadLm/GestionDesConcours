# Description complète du projet — pour la rédaction d'un rapport de stage

> Ce document est une description exhaustive du projet sur lequel j'ai travaillé durant mon stage.
> Il contient le contexte, la stack technique, l'architecture, le schéma de base de données,
> les rôles et permissions, les fonctionnalités, et **le détail du travail que j'ai personnellement réalisé**.
> Il sert de base à la rédaction d'un rapport de stage en français.

---

## 1. Présentation générale du projet

### 1.1 Intitulé
**Gestion des Concours** — Plateforme web de gestion des concours (examens d'admission).

### 1.2 Contexte et problématique
La plateforme a pour objectif de **numériser et centraliser la gestion des concours d'admission** (type concours de la fonction publique / concours d'entrée à l'université au Maroc).

Avant cette solution, le processus était :
- **Manuel et papier** : les candidats déposaient des dossiers physiques.
- **Peu traçable** : difficile de suivre l'état d'une candidature.
- **Chronophage** pour les gestionnaires (tri, validation, affectation en salles).
- **Sans contrôle d'accès fin** : pas de séparation claire des responsabilités entre les différents acteurs.

La plateforme résout ces problèmes en proposant :
- Un **portail public** d'inscription en ligne (avec dépôt de documents PDF).
- Un **suivi de candidature** en temps réel par numéro de candidature.
- Un **back-office** à plusieurs niveaux d'accès (administrateur, gestionnaire global, gestionnaire local).
- Une **gestion automatisée** des centres, salles, spécialités, allocations de places et affectations.

### 1.3 Acteurs (rôles) du système
| Rôle | Description |
|------|-------------|
| **Candidat (Public)** | Dépose sa candidature en ligne et suit son statut. |
| **Gestionnaire Local** | Gère uniquement le centre qui lui est rattaché (candidatures, salles, concours de son centre). |
| **Gestionnaire Global** | Supervise tous les centres, les allocations de spécialités et génère des rapports nationaux. |
| **Administrateur** | Contrôle total : gestion des utilisateurs, des rôles, de la plateforme et de toutes les données. |

---

## 2. Stack technologique

### 2.1 Backend
- **Framework** : Spring Boot 3.2.2 (Java 17)
- **Persistance** : Spring Data JPA / Hibernate
- **Sécurité** : Spring Security + JWT (JSON Web Tokens)
- **Base de données** : PostgreSQL (hébergée sur Supabase)
- **Outil de build** : Maven
- **Envoi d'emails** : Gmail SMTP (notifications aux candidats)
- **Documentation API** : Swagger / OpenAPI 3.0
- **Hébergement** : Railway (déploiement cloud du backend)

### 2.2 Frontend
- **Framework** : Angular 18.2.0 (composants standalone)
- **Langage** : TypeScript
- **Client HTTP** : Angular HttpClient avec intercepteur d'authentification
- **Gestion d'état** : RxJS (Observables, forkJoin)
- **Styles** : CSS3 (design system institutionnel personnalisé)
- **Build** : Angular CLI

### 2.3 Environnement de développement
- IDE : Visual Studio Code
- Contrôle de version : Git
- Système d'exploitation : Windows

---

## 3. Architecture générale

### 3.1 Architecture en trois tiers
```
┌──────────────────────────────────────────────────┐
│            FRONTEND (Angular 18)                 │
│   Pages publiques · Auth · Back-office           │
│   HttpClient + Interceptor (Bearer JWT)          │
└────────────────────┬─────────────────────────────┘
                     │  REST API (JSON)
                     ▼
┌──────────────────────────────────────────────────┐
│         BACKEND (Spring Boot 3.2.2)              │
│  Controllers · Services · Repositories           │
│  Spring Security + JWT · DTOs                    │
└────────────────────┬─────────────────────────────┘
                     │  JDBC
                     ▼
┌──────────────────────────────────────────────────┐
│        BASE DE DONNÉES (PostgreSQL)              │
│  users · concours · centres · specialites        │
│  candidats · candidatures · salles · documents   │
└──────────────────────────────────────────────────┘
```

### 3.2 Structure du backend
```
src/main/java/com/competition/
├── config/         → SecurityConfig, JwtAuthenticationFilter, WebConfig
├── controller/     → Endpoints REST (Auth, Concours, Centre, Manager, Public, Salle, Reports, User)
├── dto/            → ApiResponse, requêtes/réponses
├── model/          → Entités JPA (User, Role, Centre, Concours, Specialite, Candidat, Candidature, Salle, Document...)
├── repository/     → Interfaces JpaRepository (accès données)
├── security/       → JwtUtils, CustomUserDetailsService
└── service/        → Logique métier (UserService, EmailService, CandidatureService, FileStorageService)
```

### 3.3 Structure du frontend
```
frontend/src/app/
├── components/
│   ├── auth/              → Connexion
│   ├── home/              → Accueil public
│   ├── inscription/       → Inscription candidat (formulaire multi-étapes)
│   ├── tracking/          → Suivi de candidature
│   ├── administrateur/    → 12 composants du back-office (concours, centres, spécialités, salles, allocations, rapports, utilisateurs...)
│   ├── supervision/       → Layout à onglets (navigation par rôle)
│   └── gestionnaire-local/ & gestionnaire-global/
├── services/       → ApiService (tous les appels HTTP), AuthService
├── interceptors/   → AuthInterceptor (ajout du header Authorization)
├── guards/         → Guards de route (adminOnlyGuard, supervisionGuard)
├── models/         → Interfaces TypeScript (modèles de données)
└── app.routes.ts   → Définition des routes
```

---

## 4. Schéma de la base de données

### 4.1 Entités principales et relations
```
User ─── Role
  ├── Centre (uniquement pour le Gestionnaire Local)
  └── Notification

Centre ─── CentreSpecialite ─── Specialite
  ├── Concours
  ├── Salle ─── Candidature
  └── Users (gestionnaires rattachés)

Concours ─── Candidature
              ├── Candidat ─── Diplome
              ├── Specialite
              ├── Centre
              ├── Salle
              └── Document
```

### 4.2 Détail des entités clés

**User** : email, motDePasse (BCrypt), nom, prénom, téléphone, role, centre (pour gestionnaire local), activeToken (JWT en cours), dateCreation.

**Concours** : titre, description, dateConcours, dateDebutInscription, dateFinInscription, statut (OUVERT/FERME/TERMINE), centre, specialite.

**Centre** : nom, ville, adresse, téléphone. Un centre possède des salles, des concours, des allocations de spécialités et des gestionnaires.

**Candidature** : numeroCandidature (unique, ex. CAND-2026-000145), candidat, concours, specialite, centre, salle, statut (EN_ATTENTE / VALIDEE / REJETEE), commentaire, dates.

**Salle** : nom, capacité (max 50), centre. Lors de la validation d'une candidature, une salle est attribuée automatiquement.

**Document** : fichiers PDF déposés par les candidats (CIN, CV, diplômes).

---

## 5. Sécurité et authentification

### 5.1 Authentification JWT
1. L'utilisateur se connecte (email + mot de passe).
2. Le backend valide les identifiants via `AuthenticationManager`.
3. Un **token JWT** est généré (validité 24h, signé avec une clé secrète).
4. Le token est sauvegardé dans `user.activeToken` en base (vérifié à chaque requête).
5. Le frontend stocke le token dans le `localStorage` et l'envoie dans le header `Authorization: Bearer <token>` via un intercepteur HTTP.
6. À chaque requête, le `JwtAuthenticationFilter` valide le token (signature + expiration + correspondance avec `activeToken`).

### 5.2 Contrôle d'accès basé sur les rôles (RBAC)
Chaque endpoint est protégé par l'annotation `@PreAuthorize`, par exemple :
```java
@PreAuthorize("hasAnyRole('ADMIN', 'GESTIONNAIRE_GLOBAL', 'GESTIONNAIRE_LOCAL')")
```

---

## 6. Matrice des rôles et permissions

| Fonctionnalité | Admin | Gestionnaire Global | Gestionnaire Local | Public |
|---|:---:|:---:|:---:|:---:|
| Déposer une candidature | — | — | — | ✅ |
| Suivre une candidature | — | — | — | ✅ |
| Gérer les concours | ✅ | ✅ | ✅ (son centre) | — |
| Gérer les spécialités | ✅ | ✅ | lecture (son centre) | — |
| Gérer les centres | ✅ | ✅ | — | — |
| Gérer les salles | ✅ | ✅ | ✅ (son centre) | — |
| Allocations spécialités | ✅ | ✅ | lecture (son centre) | — |
| Valider/Rejeter candidatures | ✅ | ✅ | ✅ (son centre) | — |
| Affecter des salles | ✅ | ✅ | ✅ (son centre) | — |
| Gérer les utilisateurs | ✅ | — | — | — |
| Rapports & statistiques | ✅ | ✅ | ✅ (son centre) | — |

---

## 7. Fonctionnalités principales

1. **Inscription publique multi-étapes** : sélection concours/centre/spécialité → infos personnelles → diplômes → dépôt de documents PDF (CIN, CV, diplômes, max 5 Mo chacun) → soumission via `multipart/form-data`.
2. **Suivi de candidature** : par numéro unique, avec code couleur selon le statut.
3. **Gestion des concours** : création/édition/suppression, consultation des candidats par concours, validation/rejet avec dépôt de motifs.
4. **Validation et rejet de candidatures** : contrôle des quotas (places allouées par spécialité/centre), affectation automatique en salle.
5. **Gestion des salles et affectations** : création de salles rattachées à un centre et une spécialité, affectation manuelle des candidats validés.
6. **Allocation des spécialités aux centres** : définition du nombre de places par spécialité et par centre (planification de capacité).
7. **Gestion des utilisateurs** (admin) : création de comptes, assignation des rôles et centres, suppression douce (soft delete).
8. **Rapports et statistiques** : par concours, par spécialité, par centre (totaux, validées, rejetées, en attente, taux de réussite).
9. **Notifications par email** : confirmation d'inscription, validation, rejet avec motif.

---

## 8. APIs principales (résumé)

- **Public** (sans auth) : `POST /public/postuler-avec-documents`, `GET /public/suivi/{numero}`, `GET /public/concours-options`
- **Auth** : `POST /auth/login`, `POST /auth/logout`
- **Manager** : `GET /manager/candidatures`, `POST /manager/candidatures/{id}/valider`, `POST /manager/candidatures/{id}/rejeter`, `GET /manager/my-centre`, `GET /manager/centres/{id}/salles-with-candidates`
- **Admin** : CRUD sur `/admin/concours`, `/admin/centres`, `/admin/specialites`, `/admin/salles`, `/admin/centre-specialites`, `/admin/users`, `/admin/reports/*`

---

## 9. TRAVAIL RÉALISÉ DURANT LE STAGE (mes contributions)

> Cette section décrit **le travail que j'ai personnellement accompli**. C'est le cœur du rapport de stage.

### 9.1 Évolution du rôle « Gestionnaire Local » (fonctionnalité majeure)
**Problématique** : Le gestionnaire local n'avait accès qu'à un tableau de bord limité (candidatures, salles). Il ne pouvait pas gérer les concours, consulter les spécialités allouées, voir les allocations ou générer des rapports de son centre — alors qu'il en avait le besoin métier.

**Objectif** : Donner au gestionnaire local **le même ensemble de pages que le gestionnaire global**, mais **strictement limité à son centre rattaché** (il ne voit et ne gère que les données de son centre).

**Travail réalisé côté backend (Spring Boot / Java)** :
J'ai modifié **4 contrôleurs** pour ajouter les permissions du rôle local et appliquer le filtrage par centre côté serveur (sécurité enforceée au niveau API) :

1. **`AdminReportsController`** — Ajout de `GESTIONNAIRE_LOCAL`. J'ai créé une méthode utilitaire `scopedCandidatures(Principal)` qui :
   - retourne toutes les candidatures pour l'Admin et le Gestionnaire Global (comportement inchangé, aucune régression) ;
   - retourne **uniquement les candidatures du centre du gestionnaire local** pour ce rôle.
   Ainsi, tous les types de rapports (par concours, par spécialité, par centre, statistiques globales) sont automatiquement limités au centre du local, **sans casser les pages admin**.

2. **`AdminCentreSpecialiteController`** — La route `GET /` (liste de toutes les allocations) renvoie désormais uniquement les allocations du centre du local.

3. **`CentreController`** — Ajout du rôle local sur `GET /centres` et `GET /centres/{id}` : le local ne reçoit que son propre centre (liste à un seul élément). Les opérations d'écriture (création/édition/suppression de centres) restent réservées à l'Admin.

4. **`SalleController`** — `GET /manager/centres` renvoie désormais uniquement le centre du local.

J'ai utilisé le patron existant du projet : récupération de l'utilisateur authentifié via `Principal` + `userRepository.findByEmail(...)`, puis une méthode `localCentreId(user)` qui renvoie l'ID du centre rattaché.

**Travail réalisé côté frontend (Angular / TypeScript)** :
J'ai modifié **9 composants/services** pour adapter l'interface au rôle local :

1. **`app.routes.ts`** — Les routes enfants du gestionnaire local reflètent désormais celles du global (concours, spécialités, allocations, salles, affectations, rapports), à l'exception de la page « Centres » (son centre étant fixe).
2. **`supervision-layout.component.ts`** — Redéfinition des onglets du local (6 onglets, sans « Centres »).
3. **`specialty-management`** — Pour le local : chargement des spécialités via `getMyCentre()` → `getCentreSpecialitesByCentre()` (uniquement les spécialités allouées à son centre). Masquage du formulaire de création et du bouton supprimer.
4. **`specialty-allocation`** — Masquage du filtre « par centre » pour le local (un seul centre) ; les données sont naturellement limitées par le filtrage backend.
5. **`centre-assignments`** — Pour le local : chargement via `getMyCentre()`, verrouillage de la sélection du centre, auto-sélection de son centre.
6. **`reports-statistics`** — Pour le local : verrouillage du type de rapport sur « par centre », préréglage du `centreId`, masquage des sélecteurs et du bouton « statistiques globales », génération automatique au chargement.
7. **`salles-management`** — Pour le local : préréglage et verrouillage du filtre centre, désactivation des sélecteurs de centre.
8. **`competition-management`** — Désactivation du sélecteur de centre dans les formulaires (création/édition) pour le local, car le backend force son centre.

**Garanties de qualité** :
- **Aucune régression** pour l'Admin et le Gestionnaire Global : tout le filtrage est conditionnel (`if isLocal` / `if role == LOCAL`), les autres rôles conservent le comportement d'origine.
- **Sécurité côté serveur** : le filtrage frontend n'est que cosmétique (UX) ; le backend valide et restreint systématiquement les données au centre du local, quelle que soit la requête reçue.
- **Vérification** : compilation backend Maven réussie (`mvnw compile`), build frontend Angular réussi sans erreur (`ng build`).

### 9.2 Rattachement des centres aux concours et dépôt de documents PDF
- Ajout de la relation entre **Concours** et **Centre** (et spécialité), de sorte qu'un concours est lancé pour un centre et une spécialité précis.
- Mise en place du **dépôt de fichiers PDF** lors de l'inscription (CIN, CV, diplômes) via `multipart/form-data`, avec stockage côté backend (dossier `uploads`) et métadonnées en base (table `documents`).
- Création de l'endpoint protégé de consultation des documents des candidats.

### 9.3 Nouveau thème visuel institutionnel
- Refonte de l'interface selon une charte **inspirée du portail Emploi-Public Maroc** :
  - Bleu marine profond (`#072F75`) pour la structure et les titres.
  - Or (`#F2AF29`) pour les appels à l'action principaux.
  - Typographies Poppins / Open Sans, cartes blanches surélevées, contrôles arrondis.
- Implémentation dans `styles.css` et `app.component.css`.

### 9.4 Page de gestion des salles
- Création de la page **Salles** (CRUD) : création, édition, filtrage et suppression de salles, chacune rattachée à un centre et une spécialité allouée.
- Page d'affectation des candidats par centre puis spécialité, avec affectation manuelle des candidats validés.

### 9.5 Corrections de bugs et routage par rôle
- Correction du **routage par rôle** (guards Angular `adminOnlyGuard`, `supervisionGuard`).
- Correction du **CRUD utilisateurs** (page de gestion des comptes).
- Correction d'erreurs dans le **composant de gestion des concours**.
- Correction de l'affichage de la **liste des candidats**.

### 9.6 Déploiement
- **Hébergement du backend** sur Railway (plateforme cloud), avec configuration des variables d'environnement (base de données Supabase, secret JWT, identifiants SMTP).

---

## 10. Difficultés rencontrées et solutions

| Difficulté | Solution apportée |
|---|---|
| Séparer proprement les périmètres des rôles sans dupliquer le code | Réutilisation des mêmes composants Angular avec des branches conditionnelles sur le rôle ; filtrage centralisé côté backend via un utilitaire `scopedCandidatures`. |
| Éviter toute fuite de données entre centres pour le gestionnaire local | Double sécurité : filtrage frontend (UX) **ET** enforcement systématique côté backend (source de vérité). |
| Préserver le fonctionnement des pages Admin/Global | Tout le code de filtrage est conditionnel ; les autres rôles empruntent le chemin d'origine sans modification. Vérifié par compilation et build. |
| Dépôt de fichiers volumineux (PDF) | Configuration de la limite de requête multipart (16 Mo) pour accepter les 3 documents requis. |
| Affichage des options d'inscription publique | Refonte de la logique `getConcoursOptions()` pour s'appuyer sur les allocations centre-spécialité. |

---

## 11. Compétences acquises / mobilisées

- **Backend** : Spring Boot, Spring Security, JPA/Hibernate, JWT, architecture en couches (controller/service/repository), annotations de sécurité `@PreAuthorize`.
- **Frontend** : Angular (composants standalone, routing, guards, services, intercepteurs HTTP, RxJS).
- **Base de données** : modélisation relationnelle (PostgreSQL), conception de schéma, requêtes JPA.
- **Sécurité** : authentification stateless par JWT, contrôle d'accès basé sur les rôles (RBAC), filtrage des données par périmètre.
- **DevOps / Déploiement** : hébergement cloud (Railway), variables d'environnement, base de données managée (Supabase).
- **Méthode** : travail avec Git (commits thématiques), lecture de documentation existante, développement sans régression.

---

## 12. Plan suggéré pour le rapport de stage

1. **Page de garde** (nom, établissement, encadrant, dates).
2. **Remerciements**.
3. **Introduction générale** (contexte, problématique, objectifs, plan).
4. **Chapitre 1 — Présentation de l'organisme d'accueil et du projet**.
5. **Chapitre 2 — Étude technique** (stack, architecture, base de données, sécurité).
6. **Chapitre 3 — Analyse et conception** (rôles, matrice de permissions, diagrammes de cas d'utilisation / classes / séquence).
7. **Chapitre 4 — Réalisation** (le travail effectué : §9 ci-dessus, avec captures d'écran et extraits de code).
8. **Chapitre 5 — Tests et déploiement** (vérifications, hébergement Railway).
9. **Conclusion et perspectives** (bilan, limites, évolutions futures : export PDF/CSV, notifications temps réel, application mobile).
10. **Bibliographie / Webographie** (docs Spring Boot, Angular, JWT, PostgreSQL...).
11. **Annexes** (extraits de code, table des figures).

---

## 13. Évolutions futures possibles (perspectives)
- Export de rapports en **PDF / CSV**.
- **Notifications en temps réel** (WebSockets) pour les gestionnaires.
- **Tableau de bord analytique** avancé (graphiques).
- **Application mobile** pour le suivi candidat.
- **Internationalisation** (multilingue : arabe / français / anglais).

---

*Fin de la description.*
