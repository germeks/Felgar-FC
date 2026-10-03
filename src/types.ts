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
  wins?: number;
  losses?: number;
  draws?: number;
  photoUrl: string;
  photoPosition?: string; // Posición de enfoque en miniaturas/tarjetas (ej. "50% 15%")
  photoZoom?: number; // Nivel de zoom de la foto (ej. 1.0 a 2.5)
  joinedDate: string;
  birthDate?: string; // Fecha de nacimiento (YYYY-MM-DD)
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
  season?: string; // e.g. "Temporada 25/26", "Apertura", "Clausura"
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

export type PhotoCategory = string;

export interface PhotoItem {
  id: string;
  title: string;
  date: string; // "YYYY-MM-DD"
  url: string;
  category: PhotoCategory;
  description?: string;
  uploadedAt: string;
}

export interface Chronicle {
  id: string;
  matchId: string; // ID del partido vinculado
  title: string;
  subtitle?: string;
  author: string;
  date: string; // YYYY-MM-DD
  content: string; // Texto narrativo completo
  mvpHighlight?: string; // Comentario destacado del MVP
  keyMoment?: string; // La jugada clave del partido
  controversy?: string; // La polémica o anécdota divertida
  imageUrl?: string; // Foto de portada opcional
  tags?: string[];
  createdAt: string;
}

export interface PachangaStats {
  totalMatches: number;
  blueWins: number;
  whiteWins: number;
  draws: number;
  goalsBlue: number;
  goalsWhite: number;
}
