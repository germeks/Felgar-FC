export type PlayerPosition = 'POR' | 'DEF' | 'MED' | 'DEL';

export type TeamSide = 'Azules' | 'Blancos' | 'Indiferente';

export interface Player {
  id: string;
  name: string;
  nickname?: string;
  number?: number;
  position?: PlayerPosition;
  preferredSide: TeamSide;
  matchesPlayed: number;
  goals: number;
  assists: number;
  mvps: number;
  photoUrl: string;
  joinedDate: string;
  bio?: string;
  age?: number;
  nationality?: string;
  preferredFoot?: string;
  heightCm?: number;
  yellowCards?: number;
  redCards?: number;
}

export interface GoalScorer {
  playerId?: string;
  playerName: string;
  minute?: number;
  type?: 'Normal' | 'Golazo' | 'Penalti' | 'Falta' | 'Punterazo' | 'De rebote' | 'Cabeza' | 'Propia Puerta';
  side: 'Azules' | 'Blancos';
}

export interface Match {
  id: string;
  title: string; // e.g. "Pachanga Semanal #24", "Especial Fin de Año"
  date: string; // "YYYY-MM-DD"
  time?: string; // "22:00"
  location: string;
  goalsBlue: number;
  goalsWhite: number;
  scorersBlue: GoalScorer[];
  scorersWhite: GoalScorer[];
  playersBlue?: string[]; // IDs of players who played for Azules
  playersWhite?: string[]; // IDs of players who played for Blancos
  status: 'Finalizado';
  mvp?: string;
  notes?: string;
  imageUrl?: string;
}

export type PhotoCategory =
  | 'Partidos'
  | 'Celebraciones'
  | 'Fotos de Grupo'
  | 'Pifias y Risas'
  | 'Entrenamientos'
  | 'Plantilla'
  | 'Afición';

export interface PhotoItem {
  id: string;
  title: string;
  date: string; // "YYYY-MM-DD"
  url: string;
  category: PhotoCategory;
  description?: string;
  uploadedAt: string;
}

export interface PachangaStats {
  totalMatches: number;
  blueWins: number;
  whiteWins: number;
  draws: number;
  goalsBlue: number;
  goalsWhite: number;
}
