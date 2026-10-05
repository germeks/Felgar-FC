import React, { createContext, useContext, useState, useEffect } from 'react';
import { Player, Match, PhotoItem, PachangaStats, Chronicle } from '../types';
import { INITIAL_PLAYERS, INITIAL_MATCHES, INITIAL_PHOTOS, INITIAL_SEASONS, INITIAL_CHRONICLES, DEFAULT_PHOTO_CATEGORIES } from '../data/initialData';
import { db, sanitizeForFirestore, handleFirestoreError, OperationType } from '../firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
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
    const basePlayers = rawPlayers.length > 0 ? rawPlayers : INITIAL_PLAYERS;
    const baseMatches = matches.length > 0 ? matches : INITIAL_MATCHES;
    return syncPlayersWithMatches(basePlayers, baseMatches);
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
        
        // Auto-migrate from localStorage if Firestore is empty and local has data
        if (!initialLoadDone && data.length === 0) {
          try {
            const localPlayers = localStorage.getItem('felgar_friends_players_v2');
            if (localPlayers) {
              const parsed = JSON.parse(localPlayers);
              if (Array.isArray(parsed) && parsed.length > 0) {
                console.log("Migrando jugadores de localStorage a Firebase...");
                const batch = writeBatch(db);
                parsed.forEach((p: Player) => {
                  batch.set(doc(db, 'players', p.id), sanitizeForFirestore(p));
                });
                await batch.commit();
              } else if (INITIAL_PLAYERS.length > 0) {
                const batch = writeBatch(db);
                INITIAL_PLAYERS.forEach((p) => batch.set(doc(db, 'players', p.id), sanitizeForFirestore(p)));
                await batch.commit();
              }
            } else if (INITIAL_PLAYERS.length > 0) {
              const batch = writeBatch(db);
              INITIAL_PLAYERS.forEach((p) => batch.set(doc(db, 'players', p.id), sanitizeForFirestore(p)));
              await batch.commit();
            }
          } catch(e) { console.error("Migration error", e); }
        }

        const MOCK_DEMO_NICKNAMES = [
          'El Muro', 'San Varela', 'El Capi', 'El Mariscal', 'El Galgo',
          'La Brújula', 'Magia', 'El Todoterreno', 'El Rifle', 'El Zurdo',
          'Gabi Gol', 'Pablito'
        ];

        // Clean out sample demo nicknames if they still exist in Firestore
        const playersToClean = data.filter(
          (p) => (p.nickname && MOCK_DEMO_NICKNAMES.includes(p.nickname)) || p.name.includes('"')
        );

        let finalPlayersData = data;
        if (playersToClean.length > 0) {
          finalPlayersData = data.map((p) => {
            const cleanName = p.name.replace(/"[^"]*"\s*/g, '').replace(/\s+/g, ' ').trim();
            const shouldRemoveNick = p.nickname && MOCK_DEMO_NICKNAMES.includes(p.nickname);
            const { nickname, ...rest } = p;
            return shouldRemoveNick ? { ...rest, name: cleanName } : { ...p, name: cleanName };
          });

          // Sync cleaned records to Firestore
          try {
            const batch = writeBatch(db);
            playersToClean.forEach((p) => {
              const cleanName = p.name.replace(/"[^"]*"\s*/g, '').replace(/\s+/g, ' ').trim();
              const shouldRemoveNick = p.nickname && MOCK_DEMO_NICKNAMES.includes(p.nickname);
              const { nickname, ...rest } = p;
              const cleaned = shouldRemoveNick ? { ...rest, name: cleanName } : { ...p, name: cleanName };
              batch.set(doc(db, 'players', p.id), sanitizeForFirestore(cleaned));
            });
            batch.commit().catch(() => {});
          } catch {}
        }

        // Clean out standard fake age (25 or 26) for players without birth date
        const playersWithFakeAge = finalPlayersData.filter(
          (p) => (!p.birthDate || !p.birthDate.trim()) && (p.age === 25 || p.age === 26)
        );

        if (playersWithFakeAge.length > 0) {
          finalPlayersData = finalPlayersData.map((p) => {
            if ((!p.birthDate || !p.birthDate.trim()) && (p.age === 25 || p.age === 26)) {
              const { age, ...rest } = p;
              return rest;
            }
            return p;
          });

          try {
            const batch = writeBatch(db);
            playersWithFakeAge.forEach((p) => {
              const { age, ...cleaned } = p;
              batch.set(doc(db, 'players', p.id), sanitizeForFirestore(cleaned));
            });
            batch.commit().catch(() => {});
          } catch {}

          try {
            localStorage.setItem('felgar_friends_players_v2', JSON.stringify(finalPlayersData));
          } catch {}
        }
        
        setRawPlayers(finalPlayersData.length > 0 ? finalPlayersData : INITIAL_PLAYERS);
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
        
        if (!matchesLoaded && data.length === 0) {
          try {
            const localMatches = localStorage.getItem('felgar_friends_matches_v2');
            if (localMatches) {
              const parsed = JSON.parse(localMatches);
              if (Array.isArray(parsed) && parsed.length > 0) {
                const batch = writeBatch(db);
                parsed.forEach((m: Match) => batch.set(doc(db, 'matches', m.id), sanitizeForFirestore(m)));
                await batch.commit();
              } else if (INITIAL_MATCHES.length > 0) {
                const batch = writeBatch(db);
                INITIAL_MATCHES.forEach((m) => batch.set(doc(db, 'matches', m.id), sanitizeForFirestore(m)));
                await batch.commit();
              }
            } else if (INITIAL_MATCHES.length > 0) {
              const batch = writeBatch(db);
              INITIAL_MATCHES.forEach((m) => batch.set(doc(db, 'matches', m.id), sanitizeForFirestore(m)));
              await batch.commit();
            }
          } catch(e) {}
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
        setMatches(cleanedMatches.length > 0 ? cleanedMatches : INITIAL_MATCHES);
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
        
        if (!photosLoaded && data.length === 0) {
          try {
            const localPhotos = localStorage.getItem('felgar_friends_photos_v2');
            if (localPhotos) {
              const parsed = JSON.parse(localPhotos);
              if (Array.isArray(parsed) && parsed.length > 0) {
                const batch = writeBatch(db);
                parsed.forEach((p: PhotoItem) => batch.set(doc(db, 'photos', p.id), sanitizeForFirestore(p)));
                await batch.commit();
              } else if (INITIAL_PHOTOS.length > 0) {
                const batch = writeBatch(db);
                INITIAL_PHOTOS.forEach((p) => batch.set(doc(db, 'photos', p.id), sanitizeForFirestore(p)));
                await batch.commit();
              }
            } else if (INITIAL_PHOTOS.length > 0) {
              const batch = writeBatch(db);
              INITIAL_PHOTOS.forEach((p) => batch.set(doc(db, 'photos', p.id), sanitizeForFirestore(p)));
              await batch.commit();
            }
          } catch(e) {}
        }

        data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setPhotos(data.length > 0 ? data : (photosLoaded ? [] : INITIAL_PHOTOS));
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
        
        if (!chronLoaded && data.length === 0) {
          try {
            const localChron = localStorage.getItem('felgar_friends_chronicles_v2');
            if (localChron) {
              const parsed = JSON.parse(localChron);
              if (Array.isArray(parsed) && parsed.length > 0) {
                const batch = writeBatch(db);
                parsed.forEach((c: Chronicle) => batch.set(doc(db, 'chronicles', c.id), sanitizeForFirestore(c)));
                await batch.commit();
              } else if (INITIAL_CHRONICLES.length > 0) {
                const batch = writeBatch(db);
                INITIAL_CHRONICLES.forEach((c) => batch.set(doc(db, 'chronicles', c.id), sanitizeForFirestore(c)));
                await batch.commit();
              }
            } else if (INITIAL_CHRONICLES.length > 0) {
              const batch = writeBatch(db);
              INITIAL_CHRONICLES.forEach((c) => batch.set(doc(db, 'chronicles', c.id), sanitizeForFirestore(c)));
              await batch.commit();
            }
          } catch(e) {}
        }

        data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setChronicles(data.length > 0 ? data : (chronLoaded ? [] : INITIAL_CHRONICLES));
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
