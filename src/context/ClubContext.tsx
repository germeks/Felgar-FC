import React, { createContext, useContext, useState, useEffect } from 'react';
import { Player, Match, PhotoItem, PachangaStats, Chronicle, BackupMeta } from '../types';
import { INITIAL_PLAYERS, INITIAL_MATCHES, INITIAL_PHOTOS, INITIAL_SEASONS, INITIAL_CHRONICLES, DEFAULT_PHOTO_CATEGORIES } from '../data/initialData';
import { db, sanitizeForFirestore, handleFirestoreError, OperationType } from '../firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';
import { calculatePlayerStatsFromMatches, syncPlayersWithMatches } from '../utils/statsUtils';
import { compressImage } from '../utils/imageCompression';

interface ClubContextType {
  activeTab: 'inicio' | 'partidos' | 'jugadores' | 'cronicas' | 'galeria';
  setActiveTab: (tab: 'inicio' | 'partidos' | 'jugadores' | 'cronicas' | 'galeria') => void;
  players: Player[];
  matches: Match[];
  photos: PhotoItem[];
  chronicles: Chronicle[];
  selectedChronicleId: string | null;
  setSelectedChronicleId: (id: string | null) => void;
  openChronicle: (id: string) => void;
  seasons: string[];
  photoCategories: string[];
  stats: PachangaStats;
  isSiteAuthenticated: boolean;
  loginSite: (password: string) => boolean;
  logoutSite: () => void;
  isAdmin: boolean;
  loginAdmin: (password: string) => boolean;
  logoutAdmin: () => void;
  addSeason: (name: string) => void;
  updateSeason: (oldName: string, newName: string) => void;
  deleteSeason: (name: string) => void;
  addPhotoCategory: (name: string) => Promise<string | void>;
  updatePhotoCategory: (oldName: string, newName: string) => Promise<void>;
  deletePhotoCategory: (name: string) => Promise<void>;
  addMatch: (newMatch: Omit<Match, 'id'>) => void;
  updateMatch: (match: Match) => void;
  deleteMatch: (id: string) => void;
  addPlayer: (newPlayer: Omit<Player, 'id'>) => void;
  updatePlayer: (player: Player) => void;
  deletePlayer: (id: string) => void;
  syncAllPlayerStats: () => Promise<void>;
  addPhoto: (newPhoto: Omit<PhotoItem, 'id' | 'uploadedAt'>) => void;
  updatePhoto: (photo: PhotoItem) => void;
  deletePhoto: (id: string) => void;
  addChronicle: (newChronicle: Omit<Chronicle, 'id' | 'createdAt'>) => void;
  updateChronicle: (chronicle: Chronicle) => void;
  deleteChronicle: (id: string) => void;
  resetToDefaults: () => void;
  createBackup: (name?: string) => Promise<{ id: string; success: boolean }>;
  getBackups: () => Promise<BackupMeta[]>;
  restoreBackup: (backupId: string) => Promise<boolean>;
  restoreFromJson: (jsonData: any) => Promise<boolean>;
  exportBackupJson: () => Promise<any>;
}

const ClubContext = createContext<ClubContextType | undefined>(undefined);

export const ClubProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<'inicio' | 'partidos' | 'jugadores' | 'cronicas' | 'galeria'>('inicio');
  const [selectedChronicleId, setSelectedChronicleId] = useState<string | null>(null);

  const [rawPlayers, setRawPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [seasons, setSeasons] = useState<string[]>([]);
  const [photoCategories, setPhotoCategories] = useState<string[]>(() => {
    try {
      const localCats = localStorage.getItem('felgar_friends_photo_categories_v2');
      if (localCats) {
        const parsed = JSON.parse(localCats);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_PHOTO_CATEGORIES;
  });
  const [chronicles, setChronicles] = useState<Chronicle[]>([]);

  // Synchronize player statistics (matchesPlayed, goals, mvps, assists) dynamically with pachangas
  const players: Player[] = React.useMemo(() => {
    return syncPlayersWithMatches(rawPlayers, matches);
  }, [rawPlayers, matches]);

  // Site gate access state (protected with password "FelgarMadrid")
  const [isSiteAuthenticated, setIsSiteAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('felgar_fc_site_auth') === 'true';
    } catch (e) {
      return false;
    }
  });

  const loginSite = (password: string): boolean => {
    const clean = password.trim();
    if (
      clean === 'FelgarMadrid' ||
      clean.toLowerCase() === 'felgarmadrid' ||
      clean === 'Chinocablon' ||
      clean.toLowerCase() === 'chinocablon'
    ) {
      setIsSiteAuthenticated(true);
      try {
        localStorage.setItem('felgar_fc_site_auth', 'true');
      } catch (e) {
        console.warn('Could not persist site auth', e);
      }
      return true;
    }
    return false;
  };

  const logoutSite = () => {
    setIsSiteAuthenticated(false);
    try {
      localStorage.removeItem('felgar_fc_site_auth');
    } catch (e) {
      console.warn('Could not remove site auth', e);
    }
  };

  // Admin permission state (protected with password "FelgarMadrid" or "Chinocablon")
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem('felgar_fc_admin_auth') === 'true';
    } catch (e) {
      return false;
    }
  });

  const loginAdmin = (password: string): boolean => {
    const clean = password.trim();
    if (
      clean === 'FelgarMadrid' ||
      clean.toLowerCase() === 'felgarmadrid' ||
      clean === 'Chinocablon' ||
      clean.toLowerCase() === 'chinocablon'
    ) {
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

  // Sync from Firestore
  useEffect(() => {
    let initialLoadDone = false;

    const unsubPlayers = onSnapshot(
      collection(db, 'players'),
      async (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
        
        // Smart recovery: Check if the user has players or photos in their browser's localStorage
        try {
          const localPlayersRaw = localStorage.getItem('felgar_friends_players_v2');
          if (localPlayersRaw) {
            const localPlayers = JSON.parse(localPlayersRaw);
            if (Array.isArray(localPlayers) && localPlayers.length > 0) {
              const existingIds = new Set(data.map((p) => p.id));
              const missingPlayers = localPlayers.filter((lp: Player) => lp && lp.id && !existingIds.has(lp.id));
              
              // 1. Recover any completely missing players
              if (missingPlayers.length > 0) {
                console.log(`[Auto-Recovery] Recuperando ${missingPlayers.length} jugadores desde localStorage a Firebase...`);
                const batch = writeBatch(db);
                missingPlayers.forEach((p: Player) => {
                  batch.set(doc(db, 'players', p.id), sanitizeForFirestore(p));
                });
                batch.commit().catch((err) => console.error("Error guardando jugadores recuperados", err));
              }

              // 2. Recover missing photos if local storage has a photo for a player lacking one
              const photoUpdates: { id: string; photoUrl: string; photoPosition?: string; photoZoom?: number }[] = [];
              data.forEach((p) => {
                if (!p.photoUrl || !p.photoUrl.trim()) {
                  const match = localPlayers.find(
                    (lp: Player) =>
                      lp &&
                      lp.photoUrl &&
                      lp.photoUrl.trim() &&
                      (lp.id === p.id ||
                        lp.name.trim().toLowerCase() === p.name.trim().toLowerCase() ||
                        (p.name.includes('Jaime') && lp.name.includes('Jaime')))
                  );
                  if (match && match.photoUrl) {
                    photoUpdates.push({
                      id: p.id,
                      photoUrl: match.photoUrl,
                      photoPosition: match.photoPosition,
                      photoZoom: match.photoZoom,
                    });
                  }
                }
              });

              if (photoUpdates.length > 0) {
                console.log(`[Auto-Recovery] Restaurando fotos locales para ${photoUpdates.length} jugadores en Firebase...`);
                const batch = writeBatch(db);
                photoUpdates.forEach((pu) => {
                  const toUpdate: any = { photoUrl: pu.photoUrl };
                  if (pu.photoPosition) toUpdate.photoPosition = pu.photoPosition;
                  if (pu.photoZoom) toUpdate.photoZoom = pu.photoZoom;
                  batch.update(doc(db, 'players', pu.id), toUpdate);
                });
                batch.commit().catch((err) => console.error("Error restaurando fotos a Firebase", err));
              }
            }
          }
        } catch (e) {
          console.warn("Could not check local player recovery", e);
        }

        setRawPlayers(data);
        initialLoadDone = true;
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'players');
      }
    );

    let matchesLoaded = false;
    const unsubMatches = onSnapshot(
      collection(db, 'matches'),
      async (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
        
        // Smart recovery: Check if the user has matches in their browser's localStorage that are missing in Firestore
        try {
          const localMatchesRaw = localStorage.getItem('felgar_friends_matches_v2');
          if (localMatchesRaw) {
            const localMatches = JSON.parse(localMatchesRaw);
            if (Array.isArray(localMatches) && localMatches.length > 0) {
              const existingIds = new Set(data.map((m) => m.id));
              const missingMatches = localMatches.filter((lm: Match) => lm && lm.id && !existingIds.has(lm.id));
              if (missingMatches.length > 0) {
                console.log(`[Auto-Recovery] Recuperando ${missingMatches.length} partidos desde localStorage a Firebase...`);
                const batch = writeBatch(db);
                missingMatches.forEach((m: Match) => {
                  batch.set(doc(db, 'matches', m.id), sanitizeForFirestore(m));
                });
                batch.commit().catch((err) => console.error("Error guardando partidos recuperados", err));
              }
            }
          }
        } catch (e) {
          console.warn("Could not check local matches recovery", e);
        }

        // Clean match titles containing "de los Lunes" if present in Firestore
        const matchesToClean = data.filter((m) => m.title && /de los lunes/i.test(m.title));
        if (matchesToClean.length > 0) {
          try {
            const batch = writeBatch(db);
            matchesToClean.forEach((m) => {
              const cleanTitle = m.title.replace(/\s*de los Lunes\s*/gi, ' ').replace(/\s+/g, ' ').trim();
              batch.set(doc(db, 'matches', m.id), sanitizeForFirestore({ ...m, title: cleanTitle }));
            });
            batch.commit().catch(() => {});
          } catch (e) {
            console.warn("Could not batch update cleaned match titles", e);
          }
        }

        const cleanedMatches = data.map((m) => {
          if (m.title && /de los lunes/i.test(m.title)) {
            return {
              ...m,
              title: m.title.replace(/\s*de los Lunes\s*/gi, ' ').replace(/\s+/g, ' ').trim(),
            };
          }
          return m;
        });

        cleanedMatches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setMatches(cleanedMatches);
        matchesLoaded = true;
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'matches');
      }
    );

    let photosLoaded = false;
    const unsubPhotos = onSnapshot(
      collection(db, 'photos'),
      async (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PhotoItem));
        data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setPhotos(data);
        photosLoaded = true;
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'photos');
      }
    );

    let chronLoaded = false;
    const unsubChronicles = onSnapshot(
      collection(db, 'chronicles'),
      async (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chronicle));
        data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setChronicles(data);
        chronLoaded = true;
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'chronicles');
      }
    );

    let settingsLoaded = false;
    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'general'),
      async (docSnap) => {
        if (docSnap.exists()) {
          const sData = docSnap.data();
          if (sData.seasons && Array.isArray(sData.seasons)) {
            setSeasons(sData.seasons);
          }
          if (sData.photoCategories && Array.isArray(sData.photoCategories) && sData.photoCategories.length > 0) {
            setPhotoCategories(sData.photoCategories);
            try {
              localStorage.setItem('felgar_friends_photo_categories_v2', JSON.stringify(sData.photoCategories));
            } catch (e) {}
          } else if (!settingsLoaded) {
            try {
              const localCats = localStorage.getItem('felgar_friends_photo_categories_v2');
              const catsToUse = localCats ? JSON.parse(localCats) : DEFAULT_PHOTO_CATEGORIES;
              setPhotoCategories(catsToUse);
              await setDoc(doc(db, 'settings', 'general'), sanitizeForFirestore({ photoCategories: catsToUse }), { merge: true });
            } catch (e) {}
          }
        } else {
          if (!settingsLoaded) {
            try {
              const localS = localStorage.getItem('felgar_friends_seasons_v2');
              let toSaveSeasons = INITIAL_SEASONS;
              if (localS) {
                const parsed = JSON.parse(localS);
                if (Array.isArray(parsed) && parsed.length > 0) toSaveSeasons = parsed;
              }
              const localCats = localStorage.getItem('felgar_friends_photo_categories_v2');
              const catsToUse = localCats ? JSON.parse(localCats) : DEFAULT_PHOTO_CATEGORIES;
              await setDoc(doc(db, 'settings', 'general'), sanitizeForFirestore({ seasons: toSaveSeasons, photoCategories: catsToUse }));
              setPhotoCategories(catsToUse);
            } catch (e) {}
          }
          setSeasons(INITIAL_SEASONS);
        }
        settingsLoaded = true;
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'settings/general');
      }
    );

    return () => {
      unsubPlayers();
      unsubMatches();
      unsubPhotos();
      unsubChronicles();
      unsubSettings();
    };
  }, []);

  // Auto-sync player statistics to Firestore whenever matches or rawPlayers change
  useEffect(() => {
    if (!rawPlayers.length || !matches.length) return;

    const playersNeedingSync = rawPlayers.filter((p) => {
      const computed = calculatePlayerStatsFromMatches(p, matches);
      return (
        p.matchesPlayed !== computed.matchesPlayed ||
        p.goals !== computed.goals ||
        (p.mvps || 0) !== computed.mvps ||
        (p.assists || 0) !== computed.assists
      );
    });

    if (playersNeedingSync.length > 0) {
      try {
        const batch = writeBatch(db);
        playersNeedingSync.forEach((p) => {
          const computed = calculatePlayerStatsFromMatches(p, matches);
          const updatedPlayer: Player = {
            ...p,
            matchesPlayed: computed.matchesPlayed,
            goals: computed.goals,
            assists: computed.assists,
            mvps: computed.mvps,
          };
          batch.set(doc(db, 'players', p.id), sanitizeForFirestore(updatedPlayer));
        });
        batch.commit().catch((err) => console.warn('Error committing player stats sync to Firestore:', err));
      } catch (err) {
        console.warn('Error in auto-sync player stats:', err);
      }
    }
  }, [rawPlayers, matches]);

  // Derived head-to-head stats
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
  const addMatch = async (newMatchData: Omit<Match, 'id'>) => {
    const id = 'm_' + Date.now();
    let finalImageUrl = newMatchData.imageUrl;
    if (finalImageUrl && (finalImageUrl.startsWith('data:') || finalImageUrl.length > 500000)) {
      try {
        finalImageUrl = await compressImage(finalImageUrl, {
          maxDimension: 1280,
          quality: 0.8,
          maxSizeBytes: 500 * 1024,
        });
      } catch (err) {
        console.warn('Could not compress match image', err);
      }
    }
    const createdMatch: Match = { ...newMatchData, imageUrl: finalImageUrl, id };

    try {
      await setDoc(doc(db, 'matches', id), sanitizeForFirestore(createdMatch));
    } catch (e) {
      console.error('Failed to add match', e);
      handleFirestoreError(e, OperationType.CREATE, `matches/${id}`);
    }
  };

  const syncAllPlayerStats = async () => {
    const currentMatches = matches.length > 0 ? matches : INITIAL_MATCHES;
    const currentPlayers = rawPlayers.length > 0 ? rawPlayers : INITIAL_PLAYERS;
    try {
      const batch = writeBatch(db);
      currentPlayers.forEach((p) => {
        const computed = calculatePlayerStatsFromMatches(p, currentMatches);
        const updatedPlayer: Player = {
          ...p,
          matchesPlayed: computed.matchesPlayed,
          goals: computed.goals,
          assists: computed.assists,
          mvps: computed.mvps,
        };
        batch.set(doc(db, 'players', p.id), sanitizeForFirestore(updatedPlayer));
      });
      await batch.commit();
    } catch (e) {
      console.error('Failed to manually sync all player stats', e);
    }
  };

  const updateMatch = async (match: Match) => {
    let finalImageUrl = match.imageUrl;
    if (finalImageUrl && (finalImageUrl.startsWith('data:') || finalImageUrl.length > 500000)) {
      try {
        finalImageUrl = await compressImage(finalImageUrl, {
          maxDimension: 1280,
          quality: 0.8,
          maxSizeBytes: 500 * 1024,
        });
      } catch (err) {
        console.warn('Could not compress match image', err);
      }
    }
    const updatedMatch: Match = { ...match, imageUrl: finalImageUrl };
    try {
      await setDoc(doc(db, 'matches', match.id), sanitizeForFirestore(updatedMatch));
    } catch (e) {
      console.error('Failed to update match', e);
      handleFirestoreError(e, OperationType.UPDATE, `matches/${match.id}`);
    }
  };

  const deleteMatch = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'matches', id));
    } catch (e) {
      console.error('Failed to delete match', e);
      handleFirestoreError(e, OperationType.DELETE, `matches/${id}`);
    }
  };

  const addPlayer = async (newPlayer: Omit<Player, 'id'>) => {
    const id = 'p_' + Date.now();
    let finalPhoto = newPlayer.photoUrl;
    if (finalPhoto && (finalPhoto.startsWith('data:') || finalPhoto.length > 350000)) {
      try {
        finalPhoto = await compressImage(finalPhoto, {
          maxDimension: 800,
          quality: 0.82,
          maxSizeBytes: 350 * 1024,
        });
      } catch (err) {
        console.warn('Could not compress player photo', err);
      }
    }
    const playerToSave = { ...newPlayer };
    if ((!playerToSave.birthDate || !playerToSave.birthDate.trim()) && (playerToSave.age === 25 || playerToSave.age === 26)) {
      delete playerToSave.age;
    }
    try {
      const sanitized = sanitizeForFirestore({ ...playerToSave, photoUrl: finalPhoto, id });
      await setDoc(doc(db, 'players', id), sanitized);
    } catch (e) {
      console.error('Failed to add player', e);
      handleFirestoreError(e, OperationType.CREATE, `players/${id}`);
    }
  };

  const updatePlayer = async (player: Player) => {
    let finalPhoto = player.photoUrl;
    if (finalPhoto && (finalPhoto.startsWith('data:') || finalPhoto.length > 350000)) {
      try {
        finalPhoto = await compressImage(finalPhoto, {
          maxDimension: 800,
          quality: 0.82,
          maxSizeBytes: 350 * 1024,
        });
      } catch (err) {
        console.warn('Could not compress player photo', err);
      }
    }
    const playerToSave = { ...player };
    if ((!playerToSave.birthDate || !playerToSave.birthDate.trim()) && (playerToSave.age === 25 || playerToSave.age === 26)) {
      delete playerToSave.age;
    }
    try {
      const sanitized = sanitizeForFirestore({ ...playerToSave, photoUrl: finalPhoto });
      await setDoc(doc(db, 'players', player.id), sanitized);
    } catch (e) {
      console.error('Failed to update player', e);
      handleFirestoreError(e, OperationType.UPDATE, `players/${player.id}`);
    }
  };

  const deletePlayer = async (id: string) => {
    setRawPlayers((prev) => prev.filter((p) => p.id !== id));
    try {
      await deleteDoc(doc(db, 'players', id));
    } catch (e) {
      console.error('Failed to delete player', e);
      handleFirestoreError(e, OperationType.DELETE, `players/${id}`);
    }
  };

  const addPhoto = async (newPhoto: Omit<PhotoItem, 'id' | 'uploadedAt'>) => {
    const id = 'ph_' + Date.now();
    let finalUrl = newPhoto.url;
    if (finalUrl && (finalUrl.startsWith('data:') || finalUrl.length > 500000)) {
      try {
        finalUrl = await compressImage(finalUrl, {
          maxDimension: 1400,
          quality: 0.8,
          maxSizeBytes: 550 * 1024,
        });
      } catch (err) {
        console.warn('Could not compress photo', err);
      }
    }
    const photo: PhotoItem = {
      ...newPhoto,
      url: finalUrl,
      id,
      uploadedAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'photos', id), sanitizeForFirestore(photo));
    } catch (e) {
      console.error('Failed to add photo', e);
      handleFirestoreError(e, OperationType.CREATE, `photos/${id}`);
    }
  };

  const updatePhoto = async (photo: PhotoItem) => {
    let finalUrl = photo.url;
    if (finalUrl && (finalUrl.startsWith('data:') || finalUrl.length > 500000)) {
      try {
        finalUrl = await compressImage(finalUrl, {
          maxDimension: 1400,
          quality: 0.8,
          maxSizeBytes: 550 * 1024,
        });
      } catch (err) {
        console.warn('Could not compress photo', err);
      }
    }
    const updated = { ...photo, url: finalUrl };
    try {
      await setDoc(doc(db, 'photos', photo.id), sanitizeForFirestore(updated));
    } catch (e) {
      console.error('Failed to update photo', e);
      handleFirestoreError(e, OperationType.UPDATE, `photos/${photo.id}`);
    }
  };

  const deletePhoto = async (id: string) => {
    // 1. Inmediatamente retiramos la foto del estado local para respuesta instantánea
    setPhotos((prev) => prev.filter((p) => p.id !== id));

    // 2. Limpiamos de la caché de localStorage si estuviese almacenada
    try {
      const local = localStorage.getItem('felgar_friends_photos_v2');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          localStorage.setItem(
            'felgar_friends_photos_v2',
            JSON.stringify(parsed.filter((p: any) => p.id !== id))
          );
        }
      }
    } catch (e) {
      console.warn('Could not update localStorage on photo deletion', e);
    }

    // 3. Borramos el documento de Firestore
    try {
      await deleteDoc(doc(db, 'photos', id));
    } catch (e) {
      console.error('Failed to delete photo from Firestore', e);
      handleFirestoreError(e, OperationType.DELETE, `photos/${id}`);
    }
  };

  const addChronicle = async (newChronicle: Omit<Chronicle, 'id' | 'createdAt'>) => {
    const id = 'c_' + Date.now();
    let finalImageUrl = newChronicle.imageUrl;
    if (finalImageUrl && (finalImageUrl.startsWith('data:') || finalImageUrl.length > 500000)) {
      try {
        finalImageUrl = await compressImage(finalImageUrl, {
          maxDimension: 1280,
          quality: 0.8,
          maxSizeBytes: 500 * 1024,
        });
      } catch (err) {
        console.warn('Could not compress chronicle image', err);
      }
    }
    const chronicle: Chronicle = {
      ...newChronicle,
      imageUrl: finalImageUrl,
      id,
      createdAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'chronicles', id), sanitizeForFirestore(chronicle));
    } catch (e) {
      console.error('Failed to add chronicle', e);
      handleFirestoreError(e, OperationType.CREATE, `chronicles/${id}`);
    }
  };

  const updateChronicle = async (chronicle: Chronicle) => {
    let finalImageUrl = chronicle.imageUrl;
    if (finalImageUrl && (finalImageUrl.startsWith('data:') || finalImageUrl.length > 500000)) {
      try {
        finalImageUrl = await compressImage(finalImageUrl, {
          maxDimension: 1280,
          quality: 0.8,
          maxSizeBytes: 500 * 1024,
        });
      } catch (err) {
        console.warn('Could not compress chronicle image', err);
      }
    }
    const updated = { ...chronicle, imageUrl: finalImageUrl };
    try {
      await setDoc(doc(db, 'chronicles', chronicle.id), sanitizeForFirestore(updated));
    } catch (e) {
      console.error('Failed to update chronicle', e);
      handleFirestoreError(e, OperationType.UPDATE, `chronicles/${chronicle.id}`);
    }
  };

  const deleteChronicle = async (id: string) => {
    setChronicles((prev) => prev.filter((c) => c.id !== id));
    if (selectedChronicleId === id) {
      setSelectedChronicleId(null);
    }
    try {
      await deleteDoc(doc(db, 'chronicles', id));
    } catch (e) {
      console.error('Failed to delete chronicle', e);
      handleFirestoreError(e, OperationType.DELETE, `chronicles/${id}`);
    }
  };

  const openChronicle = (id: string) => {
    setSelectedChronicleId(id);
    setActiveTab('cronicas');
  };

  const addSeason = async (name: string) => {
    if (seasons.includes(name)) return;
    const newSeasons = [name, ...seasons];
    try {
      await setDoc(doc(db, 'settings', 'general'), sanitizeForFirestore({ seasons: newSeasons }), { merge: true });
    } catch (e) {
      console.error('Failed to add season', e);
      handleFirestoreError(e, OperationType.UPDATE, 'settings/general');
    }
  };

  const updateSeason = async (oldName: string, newName: string) => {
    const newSeasons = seasons.map((s) => (s === oldName ? newName : s));
    try {
      await setDoc(doc(db, 'settings', 'general'), sanitizeForFirestore({ seasons: newSeasons }), { merge: true });
    } catch (e) {
      console.error('Failed to update season', e);
      handleFirestoreError(e, OperationType.UPDATE, 'settings/general');
    }
  };

  const deleteSeason = async (name: string) => {
    const newSeasons = seasons.filter((s) => s !== name);
    try {
      await setDoc(doc(db, 'settings', 'general'), sanitizeForFirestore({ seasons: newSeasons }), { merge: true });
    } catch (e) {
      console.error('Failed to delete season', e);
      handleFirestoreError(e, OperationType.UPDATE, 'settings/general');
    }
  };

  const addPhotoCategory = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (photoCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return trimmed;

    const newCategories = [...photoCategories, trimmed];
    setPhotoCategories(newCategories);
    try {
      localStorage.setItem('felgar_friends_photo_categories_v2', JSON.stringify(newCategories));
      await setDoc(doc(db, 'settings', 'general'), sanitizeForFirestore({ photoCategories: newCategories }), { merge: true });
    } catch (e) {
      console.error('Failed to add photo category', e);
      handleFirestoreError(e, OperationType.UPDATE, 'settings/general');
    }
    return trimmed;
  };

  const updatePhotoCategory = async (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || oldName === trimmed) return;

    const newCategories = photoCategories.map((c) => (c === oldName ? trimmed : c));
    setPhotoCategories(newCategories);

    // Also update photos locally that used old category
    setPhotos((prev) =>
      prev.map((p) => (p.category === oldName ? { ...p, category: trimmed } : p))
    );

    try {
      localStorage.setItem('felgar_friends_photo_categories_v2', JSON.stringify(newCategories));
      await setDoc(doc(db, 'settings', 'general'), sanitizeForFirestore({ photoCategories: newCategories }), { merge: true });

      const photosToUpdate = photos.filter((p) => p.category === oldName);
      if (photosToUpdate.length > 0) {
        const batch = writeBatch(db);
        photosToUpdate.forEach((p) => {
          batch.update(doc(db, 'photos', p.id), { category: trimmed });
        });
        await batch.commit();
      }
    } catch (e) {
      console.error('Failed to update photo category', e);
      handleFirestoreError(e, OperationType.UPDATE, 'settings/general');
    }
  };

  const deletePhotoCategory = async (name: string) => {
    if (photoCategories.length <= 1) return;
    const newCategories = photoCategories.filter((c) => c !== name);
    const fallbackCategory = newCategories[0];
    setPhotoCategories(newCategories);

    // Reassign photos using this category to fallback
    setPhotos((prev) =>
      prev.map((p) => (p.category === name ? { ...p, category: fallbackCategory } : p))
    );

    try {
      localStorage.setItem('felgar_friends_photo_categories_v2', JSON.stringify(newCategories));
      await setDoc(doc(db, 'settings', 'general'), sanitizeForFirestore({ photoCategories: newCategories }), { merge: true });

      const photosToUpdate = photos.filter((p) => p.category === name);
      if (photosToUpdate.length > 0) {
        const batch = writeBatch(db);
        photosToUpdate.forEach((p) => {
          batch.update(doc(db, 'photos', p.id), { category: fallbackCategory });
        });
        await batch.commit();
      }
    } catch (e) {
      console.error('Failed to delete photo category', e);
      handleFirestoreError(e, OperationType.UPDATE, 'settings/general');
    }
  };

  const resetToDefaults = async () => {
    // In Firebase this would require a cloud function or a batch delete, for safety we disable it or just reset local state
    alert("El reseteo a datos de prueba está deshabilitado en la versión en la nube para no perder datos reales.");
  };

  const createBackup = async (name?: string): Promise<{ id: string; success: boolean }> => {
    const backupId = 'backup_' + Date.now();
    const backupName = name?.trim() || `Copia de seguridad - ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
    const timestamp = new Date().toISOString();

    const summary = {
      playersCount: rawPlayers.length,
      matchesCount: matches.length,
      chroniclesCount: chronicles.length,
      photosCount: photos.length,
    };

    const backupMeta: BackupMeta = {
      id: backupId,
      name: backupName,
      createdAt: timestamp,
      summary,
    };

    try {
      // 1. Save metadata document in Firestore under 'backups'
      await setDoc(doc(db, 'backups', backupId), sanitizeForFirestore(backupMeta));
      await setDoc(doc(db, 'backups', 'latest_meta'), sanitizeForFirestore(backupMeta));

      // 2. Save items in subcollections to avoid the 1MB document limit
      for (const p of rawPlayers) {
        await setDoc(doc(db, 'backups', backupId, 'players', p.id), sanitizeForFirestore(p));
      }
      for (const m of matches) {
        await setDoc(doc(db, 'backups', backupId, 'matches', m.id), sanitizeForFirestore(m));
      }
      for (const ph of photos) {
        await setDoc(doc(db, 'backups', backupId, 'photos', ph.id), sanitizeForFirestore(ph));
      }
      for (const c of chronicles) {
        await setDoc(doc(db, 'backups', backupId, 'chronicles', c.id), sanitizeForFirestore(c));
      }
      for (const s of seasons) {
        await setDoc(doc(db, 'backups', backupId, 'seasons', s), { name: s });
      }

      // Also persist backup in localStorage for quick offline recovery if needed
      try {
        const localBackupsRaw = localStorage.getItem('felgar_backups_list');
        const list: BackupMeta[] = localBackupsRaw ? JSON.parse(localBackupsRaw) : [];
        list.unshift(backupMeta);
        localStorage.setItem('felgar_backups_list', JSON.stringify(list.slice(0, 15)));
      } catch (err) {}

      return { id: backupId, success: true };
    } catch (e) {
      console.error('Failed to create backup', e);
      handleFirestoreError(e, OperationType.CREATE, `backups/${backupId}`);
      return { id: backupId, success: false };
    }
  };

  const getBackups = async (): Promise<BackupMeta[]> => {
    try {
      const snap = await getDocs(collection(db, 'backups'));
      const metas = snap.docs
        .filter((d) => d.id !== 'latest_meta')
        .map((d) => d.data() as BackupMeta)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return metas;
    } catch (e) {
      console.warn('Could not fetch backups from Firestore, checking local storage', e);
      try {
        const local = localStorage.getItem('felgar_backups_list');
        if (local) return JSON.parse(local);
      } catch {}
      return [];
    }
  };

  const restoreFromParsedData = async (data: {
    players?: Player[];
    matches?: Match[];
    photos?: PhotoItem[];
    chronicles?: Chronicle[];
    seasons?: string[];
  }): Promise<boolean> => {
    try {
      // Restore Players
      if (data.players && Array.isArray(data.players) && data.players.length > 0) {
        const curPlayersSnap = await getDocs(collection(db, 'players'));
        for (const docSnap of curPlayersSnap.docs) {
          await deleteDoc(doc(db, 'players', docSnap.id));
        }
        for (const p of data.players) {
          await setDoc(doc(db, 'players', p.id), sanitizeForFirestore(p));
        }
        setRawPlayers(data.players);
      }

      // Restore Matches
      if (data.matches && Array.isArray(data.matches)) {
        const curMatchesSnap = await getDocs(collection(db, 'matches'));
        for (const docSnap of curMatchesSnap.docs) {
          await deleteDoc(doc(db, 'matches', docSnap.id));
        }
        for (const m of data.matches) {
          await setDoc(doc(db, 'matches', m.id), sanitizeForFirestore(m));
        }
        setMatches(data.matches);
      }

      // Restore Photos
      if (data.photos && Array.isArray(data.photos)) {
        const curPhotosSnap = await getDocs(collection(db, 'photos'));
        for (const docSnap of curPhotosSnap.docs) {
          await deleteDoc(doc(db, 'photos', docSnap.id));
        }
        for (const ph of data.photos) {
          await setDoc(doc(db, 'photos', ph.id), sanitizeForFirestore(ph));
        }
        setPhotos(data.photos);
      }

      // Restore Chronicles
      if (data.chronicles && Array.isArray(data.chronicles)) {
        const curChronSnap = await getDocs(collection(db, 'chronicles'));
        for (const docSnap of curChronSnap.docs) {
          await deleteDoc(doc(db, 'chronicles', docSnap.id));
        }
        for (const c of data.chronicles) {
          await setDoc(doc(db, 'chronicles', c.id), sanitizeForFirestore(c));
        }
        setChronicles(data.chronicles);
      }

      // Restore Seasons
      if (data.seasons && Array.isArray(data.seasons) && data.seasons.length > 0) {
        const curSeasonsSnap = await getDocs(collection(db, 'seasons'));
        for (const docSnap of curSeasonsSnap.docs) {
          await deleteDoc(doc(db, 'seasons', docSnap.id));
        }
        for (const s of data.seasons) {
          await setDoc(doc(db, 'seasons', s), { name: s });
        }
        setSeasons(data.seasons);
      }

      return true;
    } catch (e) {
      console.error('Failed to restore from parsed data', e);
      return false;
    }
  };

  const restoreBackup = async (backupId: string): Promise<boolean> => {
    try {
      const playersSnap = await getDocs(collection(db, 'backups', backupId, 'players'));
      const matchesSnap = await getDocs(collection(db, 'backups', backupId, 'matches'));
      const photosSnap = await getDocs(collection(db, 'backups', backupId, 'photos'));
      const chroniclesSnap = await getDocs(collection(db, 'backups', backupId, 'chronicles'));
      const seasonsSnap = await getDocs(collection(db, 'backups', backupId, 'seasons'));

      const bPlayers = playersSnap.docs.map((d) => d.data() as Player);
      const bMatches = matchesSnap.docs.map((d) => d.data() as Match);
      const bPhotos = photosSnap.docs.map((d) => d.data() as PhotoItem);
      const bChronicles = chroniclesSnap.docs.map((d) => d.data() as Chronicle);
      const bSeasons = seasonsSnap.docs.map((d) => d.data().name as string);

      return await restoreFromParsedData({
        players: bPlayers,
        matches: bMatches,
        photos: bPhotos,
        chronicles: bChronicles,
        seasons: bSeasons,
      });
    } catch (e) {
      console.error('Failed to restore backup from Firestore', e);
      handleFirestoreError(e, OperationType.GET, `backups/${backupId}`);
      return false;
    }
  };

  const exportBackupJson = async (): Promise<any> => {
    return {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      club: 'Felgar FC',
      summary: {
        playersCount: rawPlayers.length,
        matchesCount: matches.length,
        chroniclesCount: chronicles.length,
        photosCount: photos.length,
      },
      data: {
        players: rawPlayers,
        matches,
        photos,
        chronicles,
        seasons,
        photoCategories,
      },
    };
  };

  const restoreFromJson = async (jsonData: any): Promise<boolean> => {
    const payload = jsonData?.data ? jsonData.data : jsonData;
    return await restoreFromParsedData(payload);
  };

  return (
    <ClubContext.Provider
      value={{
        activeTab,
        setActiveTab,
        players,
        matches,
        photos,
        chronicles,
        selectedChronicleId,
        setSelectedChronicleId,
        openChronicle,
        seasons,
        photoCategories,
        stats,
        isSiteAuthenticated,
        loginSite,
        logoutSite,
        isAdmin,
        loginAdmin,
        logoutAdmin,
        addSeason,
        updateSeason,
        deleteSeason,
        addPhotoCategory,
        updatePhotoCategory,
        deletePhotoCategory,
        addMatch,
        updateMatch,
        deleteMatch,
        addPlayer,
        updatePlayer,
        deletePlayer,
        syncAllPlayerStats,
        addPhoto,
        updatePhoto,
        deletePhoto,
        addChronicle,
        updateChronicle,
        deleteChronicle,
        resetToDefaults,
        createBackup,
        getBackups,
        restoreBackup,
        restoreFromJson,
        exportBackupJson,
      }}
    >
      {children}
    </ClubContext.Provider>
  );
};

export const useClub = () => {
  const context = useContext(ClubContext);
  if (context === undefined) {
    throw new Error('useClub must be used within a ClubProvider');
  }
  return context;
};
