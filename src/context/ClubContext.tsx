import React, { createContext, useContext, useState, useEffect } from 'react';
import { Player, Match, PhotoItem, PachangaStats } from '../types';
import { INITIAL_PLAYERS, INITIAL_MATCHES, INITIAL_PHOTOS } from '../data/initialData';

interface ClubContextType {
  activeTab: 'inicio' | 'partidos' | 'jugadores' | 'galeria';
  setActiveTab: (tab: 'inicio' | 'partidos' | 'jugadores' | 'galeria') => void;
  players: Player[];
  matches: Match[];
  photos: PhotoItem[];
  stats: PachangaStats;
  isAdmin: boolean;
  loginAdmin: (password: string) => boolean;
  logoutAdmin: () => void;
  addMatch: (newMatch: Omit<Match, 'id'>) => void;
  deleteMatch: (id: string) => void;
  addPlayer: (newPlayer: Omit<Player, 'id'>) => void;
  updatePlayer: (player: Player) => void;
  deletePlayer: (id: string) => void;
  addPhoto: (newPhoto: Omit<PhotoItem, 'id' | 'uploadedAt'>) => void;
  deletePhoto: (id: string) => void;
  resetToDefaults: () => void;
}

const STORAGE_KEYS = {
  PLAYERS: 'felgar_friends_players_v2',
  MATCHES: 'felgar_friends_matches_v2',
  PHOTOS: 'felgar_friends_photos_v2',
};

const ClubContext = createContext<ClubContextType | undefined>(undefined);

export const ClubProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<'inicio' | 'partidos' | 'jugadores' | 'galeria'>('inicio');

  // Load from localStorage or fallback to initial data
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PLAYERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading players:', e);
    }
    return INITIAL_PLAYERS;
  });

  const [matches, setMatches] = useState<Match[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MATCHES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading matches:', e);
    }
    return INITIAL_MATCHES;
  });

  const [photos, setPhotos] = useState<PhotoItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PHOTOS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading photos:', e);
    }
    return INITIAL_PHOTOS;
  });

  // Admin permission state (protected with password "Chinocablon")
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem('felgar_fc_admin_auth') === 'true';
    } catch (e) {
      return false;
    }
  });

  const loginAdmin = (password: string): boolean => {
    const clean = password.trim();
    if (clean === 'Chinocablon' || clean.toLowerCase() === 'chinocablon') {
      setIsAdmin(true);
      try {
        localStorage.setItem('felgar_fc_admin_auth', 'true');
      } catch (e) {
        console.warn('Could not persist admin auth', e);
      }
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    try {
      localStorage.removeItem('felgar_fc_admin_auth');
    } catch (e) {
      console.warn('Could not remove admin auth', e);
    }
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
    } catch (e) {
      console.warn('Could not save players to storage', e);
    }
  }, [players]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
    } catch (e) {
      console.warn('Could not save matches to storage', e);
    }
  }, [matches]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(photos));
    } catch (e) {
      console.warn('Could not save photos to storage', e);
    }
  }, [photos]);

  // Derived head-to-head stats (Azules vs Blancos)
  const stats: PachangaStats = React.useMemo(() => {
    let blueWins = 0;
    let whiteWins = 0;
    let draws = 0;
    let goalsBlue = 0;
    let goalsWhite = 0;

    matches.forEach((m) => {
      goalsBlue += Number(m.goalsBlue) || 0;
      goalsWhite += Number(m.goalsWhite) || 0;
      if (m.goalsBlue > m.goalsWhite) {
        blueWins++;
      } else if (m.goalsWhite > m.goalsBlue) {
        whiteWins++;
      } else {
        draws++;
      }
    });

    return {
      totalMatches: matches.length,
      blueWins,
      whiteWins,
      draws,
      goalsBlue,
      goalsWhite,
    };
  }, [matches]);

  // Actions
  const addMatch = (newMatchData: Omit<Match, 'id'>) => {
    const id = 'm_' + Date.now();
    const createdMatch: Match = { ...newMatchData, id };

    // Update matches (newest first)
    setMatches((prev) => [createdMatch, ...prev]);

    // Update players' goals and matches based on lineups and scorers
    const allScorers = [...newMatchData.scorersBlue, ...newMatchData.scorersWhite];
    const lineupPlayerIds = new Set([
      ...(newMatchData.playersBlue || []),
      ...(newMatchData.playersWhite || []),
    ]);

    const hasExplicitLineup =
      (newMatchData.playersBlue && newMatchData.playersBlue.length > 0) ||
      (newMatchData.playersWhite && newMatchData.playersWhite.length > 0);

    setPlayers((prevPlayers) => {
      return prevPlayers.map((player) => {
        const goalsInMatch = allScorers.filter(
          (s) =>
            s.playerId === player.id ||
            s.playerName.toLowerCase().trim() === player.name.toLowerCase().trim()
        ).length;

        const isMvp =
          newMatchData.mvp &&
          newMatchData.mvp.toLowerCase().trim() === player.name.toLowerCase().trim();

        // Player attended if in lineup or scored a goal
        const playedThisMatch = hasExplicitLineup
          ? lineupPlayerIds.has(player.id) || goalsInMatch > 0
          : goalsInMatch > 0 || isMvp;

        if (playedThisMatch || goalsInMatch > 0 || isMvp) {
          return {
            ...player,
            goals: player.goals + goalsInMatch,
            matchesPlayed: playedThisMatch ? player.matchesPlayed + 1 : player.matchesPlayed,
            mvps: isMvp ? player.mvps + 1 : player.mvps,
          };
        }

        return player;
      });
    });
  };

  const deleteMatch = (id: string) => {
    setMatches((prev) => prev.filter((m) => m.id !== id));
  };

  const addPlayer = (newPlayerData: Omit<Player, 'id'>) => {
    const id = 'p_' + Date.now();
    setPlayers((prev) => [...prev, { ...newPlayerData, id }]);
  };

  const updatePlayer = (updatedPlayer: Player) => {
    setPlayers((prev) => prev.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p)));
  };

  const deletePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const addPhoto = (newPhotoData: Omit<PhotoItem, 'id' | 'uploadedAt'>) => {
    const id = 'ph_' + Date.now();
    const createdPhoto: PhotoItem = {
      ...newPhotoData,
      id,
      uploadedAt: new Date().toISOString(),
    };
    setPhotos((prev) => [createdPhoto, ...prev]);
  };

  const deletePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const resetToDefaults = () => {
    setPlayers(INITIAL_PLAYERS);
    setMatches(INITIAL_MATCHES);
    setPhotos(INITIAL_PHOTOS);
    localStorage.removeItem(STORAGE_KEYS.PLAYERS);
    localStorage.removeItem(STORAGE_KEYS.MATCHES);
    localStorage.removeItem(STORAGE_KEYS.PHOTOS);
  };

  return (
    <ClubContext.Provider
      value={{
        activeTab,
        setActiveTab,
        players,
        matches,
        photos,
        stats,
        isAdmin,
        loginAdmin,
        logoutAdmin,
        addMatch,
        deleteMatch,
        addPlayer,
        updatePlayer,
        deletePlayer,
        addPhoto,
        deletePhoto,
        resetToDefaults,
      }}
    >
      {children}
    </ClubContext.Provider>
  );
};

export const useClub = () => {
  const context = useContext(ClubContext);
  if (!context) {
    throw new Error('useClub must be used within a ClubProvider');
  }
  return context;
};
