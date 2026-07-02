export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Centre {
  id?: number;
  nom: string;
  ville: string;
  adresse?: string;
  telephone?: string;
}

export interface Specialite {
  id?: number;
  nom: string;
  description?: string;
}

export interface Concours {
  id?: number;
  nom?: string;
  titre?: string;
  description?: string;
  dateConcours: string;
  dateDebutInscription: string;
  dateFinInscription: string;
  statut: string;
  specialites?: Specialite[];
  centres?: Centre[];
}

export interface CentreSpecialiteAllocation {
  id?: number;
  centreId?: number;
  centreName?: string;
  specialite?: Specialite;
  specialiteId?: number;
  nombrePlaces: number;
}

export interface ReportData {
  type?: string;
  generatedAt?: string;
  totalCandidatures?: number;
  validees?: number;
  rejetees?: number;
  enAttente?: number;
  tauxReussite?: string;
}

export interface Diplome {
  id?: number;
  nomDiplome: string;
  niveau: string;
  specialite: string;
  anneeObtention: number;
}

export interface DocumentReference {
  cin: string;
  cv: string;
  diplome: string;
}

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
  numeroCandidature?: string;
  candidat: Candidat;
  concours: Partial<Concours>;
  specialite: Partial<Specialite>;
  centre: Partial<Centre>;
  diplome: Diplome;
  experienceProfessionnelle: string;
  documents: DocumentReference;
  notifications: {
    email: boolean;
    sms: boolean;
  };
  dateSoumission?: string;
  statut?: string;
  commentaire?: string;
}

export type RoleType = 'Gestionnaire local' | 'Gestionnaire global' | 'Administrateur';

export interface UserBase {
  id?: number;
  email: string;
  nom: string;
  prenom?: string;
  role: RoleType;
  centreId?: number;
  centre?: Pick<Centre, 'id' | 'nom' | 'ville'>;
}

export interface GestionnaireLocal extends UserBase {
  role: 'Gestionnaire local';
  centreId: number;
  permissions: string[];
}

export interface GestionnaireGlobal extends UserBase {
  role: 'Gestionnaire global';
  permissions: string[];
}

export interface Administrateur extends UserBase {
  role: 'Administrateur';
  permissions: string[];
}
