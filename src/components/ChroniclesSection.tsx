import React, { useState, useMemo } from 'react';
import { useClub } from '../context/ClubContext';
import { Chronicle, Match } from '../types';
import {
  Newspaper,
  Calendar,
  User,
  PlusCircle,
  Edit2,
  Trash2,
  Sparkles,
  ArrowRight,
  Flame,
  Award,
  Clock,
  Search,
  BookOpen,
  Filter,
  X,
  Share2,
  ExternalLink,
  Smile,
  Zap,
  Image as ImageIcon,
  Upload,
  Loader2
} from 'lucide-react';
import { compressImage } from '../utils/imageCompression';
import { groupScorers } from '../utils/statsUtils';

const formatChronicleDate = (dateStr: string) => {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const dateObj = new Date(year, month, day);

      const weekday = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
      const monthName = dateObj.toLocaleDateString('es-ES', { month: 'long' });

      return `${weekday} ${day} de ${monthName} de ${year}`;
    }
  } catch (e) {
    console.error('Error formatting date:', e);
  }
  return dateStr;
};

export const ChroniclesSection: React.FC = () => {
  const {
    chronicles,
    matches,
    photos,
    players,
    isAdmin,
    addChronicle,
    updateChronicle,
    deleteChronicle,
    selectedChronicleId,
    setSelectedChronicleId,
    setActiveTab,
  } = useClub();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingChronicle, setEditingChronicle] = useState<Chronicle | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Match lookup map
  const matchMap = useMemo(() => {
    const map = new Map<string, Match>();
    matches.forEach((m) => map.set(m.id, m));
    return map;
  }, [matches]);

  // Active chronicle being read in full-screen reader modal
  const activeReadingChronicle = useMemo(() => {
    if (selectedChronicleId) {
      return chronicles.find((c) => c.id === selectedChronicleId) || null;
    }
    return null;
  }, [chronicles, selectedChronicleId]);

  // Filtered chronicles
  const filteredChronicles = useMemo(() => {
    return chronicles.filter((c) => {
      const match = matchMap.get(c.matchId);
      const matchesSearch =
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
        c.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (match && match.title.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesSeason =
        selectedSeason === 'all' || (match && match.season === selectedSeason);

      return matchesSearch && matchesSeason;
    });
  }, [chronicles, matchMap, searchTerm, selectedSeason]);

  // Featured cover chronicle: newest chronicle from the list
  const featuredChronicle = filteredChronicles[0] || null;
  const secondaryChronicles = filteredChronicles.slice(1);

  // Handler to open editor for new chronicle
  const handleOpenNewEditor = (defaultMatchId?: string) => {
    setEditingChronicle(null);
    setIsEditorOpen(true);
  };

  // Handler to open editor for existing chronicle
  const handleEdit = (chronicle: Chronicle, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingChronicle(chronicle);
    setIsEditorOpen(true);
  };

  // Handler to delete chronicle
  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    deleteChronicle(id);
    setConfirmDeleteId(null);
    if (selectedChronicleId === id) {
      setSelectedChronicleId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* 1. Header estilo Prensa Deportiva */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden border border-blue-900/40">
        {/* Subtle background decorative text */}
        <div className="absolute -right-6 -bottom-10 text-8xl sm:text-9xl font-black text-white/5 select-none pointer-events-none tracking-tighter">
          FELGAR
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <Newspaper className="w-3.5 h-3.5" />
              Diario Deportivo Oficial
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              Crónicas de Partido
              <span className="text-xs sm:text-sm font-semibold bg-blue-500 text-white px-2.5 py-0.5 rounded-full">
                {chronicles.length} {chronicles.length === 1 ? 'relato' : 'relatos'}
              </span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              El análisis más épico y divertido de nuestras pachangas: goles decisivos,
              remontadas heroicas, las jugadas del partido y el salseo de tercer tiempo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => handleOpenNewEditor()}
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all cursor-pointer transform hover:-translate-y-0.5"
              >
                <PlusCircle className="w-4 h-4" />
                Redactar Crónica
              </button>
            )}
          </div>
        </div>

        {/* Newspaper Sub-header bar */}
        <div className="mt-6 pt-5 border-t border-slate-700/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" /> Edición Martes Semanal
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span>Polideportivo Vicente del Bosque</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por gol, autor o jugador..."
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Si no hay crónicas */}
      {filteredChronicles.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <Newspaper className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No se encontraron crónicas</h3>
          <p className="text-slate-500 text-sm mb-6">
            {searchTerm
              ? 'Prueba a cambiar los términos de búsqueda.'
              : 'Aún no se ha redactado ninguna crónica de partido en el club.'}
          </p>
          {isAdmin && (
            <button
              onClick={() => handleOpenNewEditor()}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" /> Redactar la primera crónica
            </button>
          )}
        </div>
      )}

      {/* 2. Crónica Destacada de Portada (Hero) */}
      {featuredChronicle && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
              Portada Principal • Última Pachanga
            </div>
            <span className="text-xs text-slate-400 font-medium capitalize">
              {formatChronicleDate(featuredChronicle.date)}
            </span>
          </div>

          {(() => {
            const linkedMatch = matchMap.get(featuredChronicle.matchId);
            return (
              <div
                onClick={() => setSelectedChronicleId(featuredChronicle.id)}
                className="group relative bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer grid grid-cols-1 lg:grid-cols-12"
              >
                {/* Image Cover */}
                <div className="lg:col-span-7 relative h-72 lg:h-auto min-h-[300px] overflow-hidden bg-slate-900">
                  <img
                    src={
                      featuredChronicle.imageUrl ||
                      linkedMatch?.imageUrl ||
                      'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1000&auto=format&fit=crop&q=80'
                    }
                    alt={featuredChronicle.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-slate-950/30 lg:to-slate-950/70" />

                  {/* Match Score Badge Floating on Image */}
                  {linkedMatch && (
                    <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl px-4 py-2 text-white shadow-xl flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span className="text-xs font-bold text-blue-400">Azules</span>
                        <span className="text-sm font-black text-white ml-1">
                          {linkedMatch.goalsBlue}
                        </span>
                      </div>
                      <span className="text-slate-500 font-bold">-</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-white mr-1">
                          {linkedMatch.goalsWhite}
                        </span>
                        <span className="text-xs font-bold text-slate-200">Blancos</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300 border border-slate-400" />
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-white/80">
                    <span className="bg-blue-600/80 backdrop-blur-sm px-2.5 py-1 rounded-md font-bold text-[11px] uppercase tracking-wider text-white">
                      {linkedMatch?.title || 'Pachanga Semanal'}
                    </span>
                    <span className="flex items-center gap-1 text-slate-300 font-medium">
                      <User className="w-3.5 h-3.5 text-blue-400" /> {featuredChronicle.author}
                    </span>
                  </div>
                </div>

                {/* Content Side */}
                <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-4 bg-white">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20 text-[11px] font-bold">
                        Crónica de Portada
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                      {featuredChronicle.title}
                    </h2>

                    {featuredChronicle.subtitle && (
                      <p className="text-slate-600 text-sm font-medium leading-relaxed italic border-l-2 border-blue-500 pl-3">
                        "{featuredChronicle.subtitle}"
                      </p>
                    )}

                    <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed">
                      {featuredChronicle.content}
                    </p>
                  </div>

                  {/* Highlights Pill preview */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    {featuredChronicle.keyMoment && (
                      <div className="text-xs text-slate-700 bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-start gap-2">
                        <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="line-clamp-1">
                          <strong className="text-slate-900">La jugada:</strong>{' '}
                          {featuredChronicle.keyMoment}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1.5">
                        Leer crónica completa <ArrowRight className="w-4 h-4" />
                      </span>

                      {isAdmin && (
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={(e) => handleEdit(featuredChronicle, e)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Editar crónica"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {confirmDeleteId === featuredChronicle.id ? (
                            <div className="flex items-center gap-1 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg shadow-xs">
                              <span className="text-[10px] font-bold text-red-700">¿Borrar?</span>
                              <button
                                type="button"
                                onClick={(e) => handleDelete(featuredChronicle.id, e)}
                                className="text-[10px] font-bold text-red-600 hover:text-red-800 px-1 py-0.5 rounded hover:bg-red-100 cursor-pointer"
                              >
                                Sí
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteId(null);
                                }}
                                className="text-[10px] font-medium text-slate-600 hover:text-slate-900 px-1 py-0.5 rounded hover:bg-slate-200 cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(featuredChronicle.id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                              title="Eliminar crónica"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 3. Cuadrícula de Crónicas Anteriores */}
      {secondaryChronicles.length > 0 && (
        <div className="space-y-4 pt-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Hemeroteca de Crónicas
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              {secondaryChronicles.length} {secondaryChronicles.length === 1 ? 'partido anterior' : 'partidos anteriores'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {secondaryChronicles.map((chronicle) => {
              const linkedMatch = matchMap.get(chronicle.matchId);
              return (
                <article
                  key={chronicle.id}
                  onClick={() => setSelectedChronicleId(chronicle.id)}
                  className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer transform hover:-translate-y-1"
                >
                  <div>
                    {/* Card Image */}
                    <div className="relative h-48 overflow-hidden bg-slate-900">
                      <img
                        src={
                          chronicle.imageUrl ||
                          linkedMatch?.imageUrl ||
                          'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80'
                        }
                        alt={chronicle.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                      {/* Score Badge */}
                      {linkedMatch && (
                        <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-sm border border-slate-700/80 rounded-xl px-2.5 py-1 text-white shadow-md flex items-center gap-2 text-xs font-bold">
                          <span className="text-blue-400">Azul {linkedMatch.goalsBlue}</span>
                          <span className="text-slate-500">-</span>
                          <span className="text-slate-200">{linkedMatch.goalsWhite} Blanco</span>
                        </div>
                      )}

                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-white/90">
                        <span className="font-semibold capitalize">
                          {formatChronicleDate(chronicle.date)}
                        </span>
                        <span className="font-medium bg-black/40 px-2 py-0.5 rounded text-[10px]">
                          {linkedMatch?.season || 'Temporada 25/26'}
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-slate-600">
                          <User className="w-3 h-3 text-blue-600" /> {chronicle.author}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                        {chronicle.title}
                      </h4>

                      {chronicle.subtitle && (
                        <p className="text-xs text-slate-500 italic line-clamp-2 leading-relaxed">
                          {chronicle.subtitle}
                        </p>
                      )}

                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed pt-1">
                        {chronicle.content}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-5 pt-0 border-t border-slate-100 flex items-center justify-between mt-3">
                    <span className="text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Leer más <ArrowRight className="w-3.5 h-3.5" />
                    </span>

                    {isAdmin && (
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={(e) => handleEdit(chronicle, e)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {confirmDeleteId === chronicle.id ? (
                          <div className="flex items-center gap-1 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg shadow-xs">
                            <span className="text-[10px] font-bold text-red-700">¿Borrar?</span>
                            <button
                              type="button"
                              onClick={(e) => handleDelete(chronicle.id, e)}
                              className="text-[10px] font-bold text-red-600 hover:text-red-800 px-1 py-0.5 rounded hover:bg-red-100 cursor-pointer"
                            >
                              Sí
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(null);
                              }}
                              className="text-[10px] font-medium text-slate-600 hover:text-slate-900 px-1 py-0.5 rounded hover:bg-slate-200 cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(chronicle.id);
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Visor / Lector de Crónica Completa Estilo Artículo Periodístico */}
      {activeReadingChronicle && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
          <div
            className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Bar */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-blue-400" />
                <span className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-300">
                  Crónica Oficial Felgar FC
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const c = activeReadingChronicle;
                        setSelectedChronicleId(null);
                        handleEdit(c);
                      }}
                      className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Editar crónica"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {confirmDeleteId === activeReadingChronicle.id ? (
                      <div className="flex items-center gap-1.5 bg-red-900/80 border border-red-500/50 px-2.5 py-1 rounded-lg text-white shadow-sm">
                        <span className="text-xs font-bold text-red-200">¿Eliminar?</span>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(activeReadingChronicle.id, e)}
                          className="text-xs font-bold text-white bg-red-600 hover:bg-red-500 px-2 py-0.5 rounded transition-colors cursor-pointer"
                        >
                          Sí
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs text-slate-300 hover:text-white px-1.5 py-0.5 cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(activeReadingChronicle.id)}
                        className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Eliminar crónica"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={() => setSelectedChronicleId(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Cerrar crónica"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Article Body */}
            <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
              {/* Match Details Banner */}
              {(() => {
                const linkedMatch = matchMap.get(activeReadingChronicle.matchId);
                return (
                  <div className="space-y-4">
                    {linkedMatch && (
                      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-lg">
                        <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-slate-800/80 mb-3">
                          <span className="font-semibold text-blue-400 uppercase tracking-wider">
                            {linkedMatch.title}
                          </span>
                          <span className="capitalize font-medium">
                            {formatChronicleDate(linkedMatch.date)} • {linkedMatch.time || '22:00'}
                          </span>
                        </div>

                        {/* Teams & Score */}
                        <div className="flex items-center justify-around py-1">
                          <div className="text-center">
                            <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
                              Azules
                            </div>
                            <div className="text-3xl sm:text-4xl font-black text-white">
                              {linkedMatch.goalsBlue}
                            </div>
                          </div>

                          <div className="text-slate-600 font-black text-xl px-2">VS</div>

                          <div className="text-center">
                            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                              Blancos
                            </div>
                            <div className="text-3xl sm:text-4xl font-black text-white">
                              {linkedMatch.goalsWhite}
                            </div>
                          </div>
                        </div>

                        {/* Scorers list without minutaje, formatted cleanly for Fútbol 7 */}
                        {(linkedMatch.scorersBlue.length > 0 || linkedMatch.scorersWhite.length > 0) && (
                          <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-300">
                            <div>
                              <div className="text-blue-400 font-bold mb-1.5 flex items-center gap-1.5">
                                <span>⚽ Goles Azules ({linkedMatch.goalsBlue}):</span>
                              </div>
                              {groupScorers(linkedMatch.scorersBlue, players).length > 0 ? (
                                <div className="space-y-1">
                                  {groupScorers(linkedMatch.scorersBlue, players).map((s) => (
                                    <div
                                      key={s.id}
                                      className="flex items-center justify-between bg-blue-950/40 px-2 py-1 rounded border border-blue-900/40"
                                    >
                                      <span className="text-slate-200 font-medium">{s.name}</span>
                                      <span className="text-blue-400 font-bold text-xs">
                                        {'⚽'.repeat(s.count)} {s.count > 1 ? `(${s.count})` : ''}
                                      </span>
                                    </div>
                                  ))}
                                  {linkedMatch.goalsBlue > linkedMatch.scorersBlue.length && (
                                    <div className="text-[10px] text-blue-400/80 italic">
                                      +{linkedMatch.goalsBlue - linkedMatch.scorersBlue.length} sin asignar
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-500 italic text-[10px]">Sin goleadores registrados</span>
                              )}
                            </div>

                            <div className="text-right">
                              <div className="text-slate-300 font-bold mb-1.5 flex items-center justify-end gap-1.5">
                                <span>⚽ Goles Blancos ({linkedMatch.goalsWhite}):</span>
                              </div>
                              {groupScorers(linkedMatch.scorersWhite, players).length > 0 ? (
                                <div className="space-y-1">
                                  {groupScorers(linkedMatch.scorersWhite, players).map((s) => (
                                    <div
                                      key={s.id}
                                      className="flex items-center justify-between flex-row-reverse bg-slate-800/40 px-2 py-1 rounded border border-slate-700/50"
                                    >
                                      <span className="text-slate-200 font-medium">{s.name}</span>
                                      <span className="text-amber-300 font-bold text-xs">
                                        {'⚽'.repeat(s.count)} {s.count > 1 ? `(${s.count})` : ''}
                                      </span>
                                    </div>
                                  ))}
                                  {linkedMatch.goalsWhite > linkedMatch.scorersWhite.length && (
                                    <div className="text-[10px] text-slate-400/80 italic">
                                      +{linkedMatch.goalsWhite - linkedMatch.scorersWhite.length} sin asignar
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-500 italic text-[10px]">Sin goleadores registrados</span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                          <span className="text-slate-400">
                            Ubicación: <strong>{linkedMatch.location}</strong>
                          </span>
                          <button
                            onClick={() => {
                              setSelectedChronicleId(null);
                              setActiveTab('partidos');
                            }}
                            className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            Ver en Pachangas <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Article Header */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-bold text-slate-700">
                          <User className="w-3.5 h-3.5 text-blue-600" />
                          {activeReadingChronicle.author}
                        </span>
                        <span>•</span>
                        <span className="capitalize">
                          {formatChronicleDate(activeReadingChronicle.date)}
                        </span>
                      </div>

                      <h1 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight">
                        {activeReadingChronicle.title}
                      </h1>

                      {activeReadingChronicle.subtitle && (
                        <p className="text-slate-600 text-base sm:text-lg italic font-medium leading-relaxed border-l-4 border-blue-600 pl-4 py-1">
                          {activeReadingChronicle.subtitle}
                        </p>
                      )}
                    </div>

                    {/* Article Image */}
                    {activeReadingChronicle.imageUrl && (
                      <div className="rounded-2xl overflow-hidden shadow-md border border-slate-200">
                        <img
                          src={activeReadingChronicle.imageUrl}
                          alt={activeReadingChronicle.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-72 sm:h-96 object-cover"
                        />
                        <div className="p-2.5 bg-slate-50 text-[11px] text-slate-500 italic text-center">
                          Momento de la pachanga en el Polideportivo Vicente del Bosque.
                        </div>
                      </div>
                    )}

                    {/* Article Full Text */}
                    <div className="prose prose-slate max-w-none text-slate-700 text-base sm:text-lg leading-relaxed space-y-4">
                      {activeReadingChronicle.content.split('\n\n').map((paragraph, idx) => (
                        <p key={idx} className="whitespace-pre-line">
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    {/* Highlighted Journalistic Boxes (Key Moment, Controversy) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                      {activeReadingChronicle.keyMoment && (
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 text-slate-800">
                          <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-wider mb-2">
                            <Zap className="w-4 h-4" /> La Jugada Clave
                          </div>
                          <p className="text-xs sm:text-sm font-medium leading-relaxed">
                            {activeReadingChronicle.keyMoment}
                          </p>
                        </div>
                      )}

                      {activeReadingChronicle.controversy && (
                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4 text-slate-800">
                          <div className="flex items-center gap-2 text-purple-700 font-bold text-xs uppercase tracking-wider mb-2">
                            <Smile className="w-4 h-4" /> La Anécdota / Risas
                          </div>
                          <p className="text-xs sm:text-sm font-medium leading-relaxed">
                            {activeReadingChronicle.controversy}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                Edición archivada de Felgar FC
              </span>
              <button
                onClick={() => setSelectedChronicleId(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cerrar lectura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal de Creación / Edición de Crónica (Solo Admin) */}
      {isEditorOpen && (
        <ChronicleEditorModal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          editingChronicle={editingChronicle}
          matches={matches}
          photos={photos}
          onSave={async (data) => {
            try {
              if (editingChronicle) {
                await updateChronicle({ ...editingChronicle, ...data });
              } else {
                await addChronicle(data);
              }
              setIsEditorOpen(false);
            } catch (err) {
              console.error('Error al guardar crónica:', err);
              alert('Hubo un problema al guardar la crónica. Por favor inténtalo de nuevo.');
            }
          }}
        />
      )}
    </div>
  );
};

// Componente Editor Modal para Admin
interface ChronicleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingChronicle: Chronicle | null;
  matches: Match[];
  photos: any[];
  onSave: (data: Omit<Chronicle, 'id' | 'createdAt'>) => void;
}

const ChronicleEditorModal: React.FC<ChronicleEditorModalProps> = ({
  isOpen,
  onClose,
  editingChronicle,
  matches,
  photos,
  onSave,
}) => {
  const defaultMatchId = editingChronicle ? editingChronicle.matchId : (matches[0]?.id || '');
  const defaultMatch = matches.find((m) => m.id === defaultMatchId);
  const getPublishDate = (matchDateStr?: string) => {
    if (!matchDateStr) return new Date().toISOString().split('T')[0];
    try {
      const [y, m, d] = matchDateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      // La crónica se publica al día siguiente del partido
      dateObj.setDate(dateObj.getDate() + 1);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`;
    } catch {
      return matchDateStr;
    }
  };

  const [matchId, setMatchId] = useState(defaultMatchId);
  const [title, setTitle] = useState(editingChronicle?.title || '');
  const [subtitle, setSubtitle] = useState(editingChronicle?.subtitle || '');
  const [author, setAuthor] = useState(editingChronicle?.author || 'Redacción Felgar');
  const [date, setDate] = useState(
    editingChronicle?.date || getPublishDate(defaultMatch?.date)
  );
  const [content, setContent] = useState(editingChronicle?.content || '');
  const [keyMoment, setKeyMoment] = useState(editingChronicle?.keyMoment || '');
  const [controversy, setControversy] = useState(editingChronicle?.controversy || '');
  const [imageUrl, setImageUrl] = useState(editingChronicle?.imageUrl || '');
  const [isOptimizingImage, setIsOptimizingImage] = useState(false);

  // When match is changed, sync date if not editing existing
  const handleMatchChange = (id: string) => {
    setMatchId(id);
    const m = matches.find((match) => match.id === id);
    if (m && !editingChronicle) {
      setDate(getPublishDate(m.date));
      if (m.imageUrl && !imageUrl) {
        setImageUrl(m.imageUrl);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).');
        return;
      }
      setIsOptimizingImage(true);
      try {
        const compressed = await compressImage(file, {
          maxDimension: 1280,
          quality: 0.8,
          maxSizeBytes: 500 * 1024,
        });
        setImageUrl(compressed);
      } catch (err) {
        console.error('Error optimizando foto de crónica:', err);
        alert('No se pudo procesar la imagen seleccionada.');
      } finally {
        setIsOptimizingImage(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !matchId) {
      alert('Por favor completa al menos el partido vinculado, el título y el cuerpo de la crónica.');
      return;
    }

    let finalImageUrl = imageUrl.trim() || undefined;
    if (finalImageUrl && (finalImageUrl.startsWith('data:') || finalImageUrl.length > 500000)) {
      try {
        finalImageUrl = await compressImage(finalImageUrl, {
          maxDimension: 1280,
          quality: 0.8,
          maxSizeBytes: 500 * 1024,
        });
      } catch (err) {
        console.warn('Could not compress chronicle image before save', err);
      }
    }

    onSave({
      matchId,
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      author: author.trim() || 'Redacción Felgar',
      date,
      content: content.trim(),
      keyMoment: keyMoment.trim() || undefined,
      controversy: controversy.trim() || undefined,
      imageUrl: finalImageUrl,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base">
              {editingChronicle ? 'Editar Crónica de Partido' : 'Redactar Nueva Crónica'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
          {/* Match selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Partido Vinculado *
            </label>
            <select
              value={matchId}
              onChange={(e) => handleMatchChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              required
            >
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.date}) — Azules {m.goalsBlue} - {m.goalsWhite} Blancos
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              La crónica mostrará automáticamente el marcador oficial y los goleadores de este partido.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Autor de la Crónica
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Ej. Redacción Felgar / Jaime Aguilera"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Fecha de Publicación (Martes)
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Pachanga semanal · Publicación al día siguiente.
              </p>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Titular Periodístico *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Vendaval de goles y éxtasis Azul en el Vicente del Bosque"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Subtítulo / Entradilla
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Ej. Un demoledor hat-trick de Mateo sella el 7-5 en un duelo histórico."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Body Content */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Cuerpo de la Crónica *
            </label>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe el relato del partido. Puedes separar en párrafos dejando una línea vacía entre ellos..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:outline-none focus:border-blue-500 leading-relaxed"
              required
            />
          </div>

          {/* Image URL & Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Foto de Portada (Opcional)
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
              />
              <span className="text-xs font-bold text-slate-400">Ó</span>
              <label className={`cursor-pointer flex items-center justify-center ${isOptimizingImage ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200'} px-3 py-2 rounded-xl border font-semibold text-xs transition-colors whitespace-nowrap`}>
                {isOptimizingImage ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Optimizando...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    Subir foto
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  disabled={isOptimizingImage}
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
            {isOptimizingImage && (
              <p className="text-[11px] text-amber-600 mt-1.5 flex items-center gap-1 font-medium">
                <Loader2 className="w-3 h-3 animate-spin" /> Optimizando imagen para garantizar una carga ultrarrápida y guardado seguro...
              </p>
            )}
            {photos.length > 0 && (
              <div className="mt-2 flex items-center gap-2 overflow-x-auto py-1">
                <span className="text-[11px] text-slate-400 whitespace-nowrap">Elegir de galería:</span>
                {photos.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setImageUrl(p.url)}
                    className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 hover:opacity-80"
                  >
                    <img src={p.url} alt={p.title} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            {imageUrl && (
              <div className="mt-3 aspect-[16/6] rounded-xl overflow-hidden border border-slate-200 relative bg-slate-100">
                <img src={imageUrl} alt="Vista previa" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Extra Highlights */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Secciones Especiales del Periódico (Opcionales)
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ⚡ La Jugada Clave
              </label>
              <input
                type="text"
                value={keyMoment}
                onChange={(e) => setKeyMoment(e.target.value)}
                placeholder="Ej. El zapatazo desde 25 metros de Lucas que dio la vuelta al electrónico."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                🎭 La Polémica o Anécdota Divertida
              </label>
              <input
                type="text"
                value={controversy}
                onChange={(e) => setControversy(e.target.value)}
                placeholder="Ej. El despeje defectuoso que acabó en el tejado y el penalti por mano que nadie vio."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isOptimizingImage}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold text-sm rounded-xl shadow-md transition-colors cursor-pointer"
            >
              {editingChronicle ? 'Guardar Cambios' : 'Publicar Crónica'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
