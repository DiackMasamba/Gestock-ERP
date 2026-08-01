export interface Chantier {
  id: number;
  nom: string;
  code: string;
  adresse?: string | null;
}

export interface Journalier {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  nom_complet: string;
  telephone?: string | null;
  photo_url?: string | null;
  taux_journalier: number;
  actif: boolean;
}

export interface Pointage {
  id: number;
  date: string;
  heure_arrivee: string | null;
  heure_depart: string | null;
  statut: 'present' | 'absent' | 'demi_journee';
  source: 'camera' | 'douchette' | 'manuel';
  journalier: Journalier;
  chantier: { id: number; nom: string; code: string };
}

export type ScanAction = 'arrivee' | 'depart' | 'deja_complet';

export interface ScanResult {
  action: ScanAction;
  message: string;
  pointage: Pointage;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}
