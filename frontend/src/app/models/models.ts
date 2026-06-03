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
  titre: string;
  description?: string;
  dateConcours: string;
  dateDebutInscription: string;
  dateFinInscription: string;
  statut: string;
}

export interface Candidat {
  id?: number;
  nom: string;
  prenom: string;
  cin: string;
  dateNaissance: string;
  lieuNaissance?: string;
  adresse?: string;
  email: string;
  telephone: string;
}

export interface Candidature {
  id?: number;
  numeroCandidature?: string;
  candidat: Candidat;
  concours: Partial<Concours>;
  specialite: Partial<Specialite>;
  centre: Partial<Centre>;
  dateSoumission?: string;
  statut?: string;
  commentaire?: string;
}
