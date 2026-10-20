import React, { useState, useEffect } from 'react';
import { useClub } from '../context/ClubContext';
import { BackupMeta } from '../types';
import { 
  X, 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Users, 
  Calendar, 
  Camera, 
  FileText, 
  ShieldCheck,
  HardDrive
} from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose }) => {
  const { 
    players, 
    matches, 
    photos, 
    chronicles, 
    createBackup, 
    getBackups, 
    restoreBackup, 
    restoreFromJson, 
    exportBackupJson 
  } = useClub();

  const [activeTab, setActiveTab] = useState<'create' | 'restore'>('create');
  const [backupName, setBackupName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Cloud backups list
  const [backupsList, setBackupsList] = useState<BackupMeta[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);

  // Restore confirmation state
  const [selectedBackupToRestore, setSelectedBackupToRestore] = useState<BackupMeta | null>(null);

  // File upload state for restore
  const [uploadedJsonData, setUploadedJsonData] = useState<any | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setMessage(null);
      setSelectedBackupToRestore(null);
      setUploadedJsonData(null);
      setUploadedFileName('');
      loadBackups();
    }
  }, [isOpen]);

  const loadBackups = async () => {
    setIsLoadingBackups(true);
    try {
      const list = await getBackups();
      setBackupsList(list);
    } catch (e) {
      console.error('Error loading backups', e);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  if (!isOpen) return null;

  const handleCreateCloudBackup = async () => {
    setIsProcessing(true);
    setMessage(null);
    try {
      const res = await createBackup(backupName.trim() || undefined);
      if (res.success) {
        setMessage({
          type: 'success',
          text: '¡Copia de seguridad guardada con éxito en la nube de Firebase!'
        });
        setBackupName('');
        await loadBackups();
      } else {
        setMessage({
          type: 'error',
          text: 'No se pudo completar la copia de seguridad. Inténtalo de nuevo.'
        });
      }
    } catch (e) {
      setMessage({
        type: 'error',
        text: 'Error inesperado al crear la copia.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadJsonBackup = async () => {
    try {
      const data = await exportBackupJson();
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `felgar_fc_backup_${dateStr}.json`;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({
        type: 'success',
        text: `Archivo de copia descargado: ${filename}`
      });
    } catch (e) {
      setMessage({
        type: 'error',
        text: 'Error al exportar el archivo de copia de seguridad.'
      });
    }
  };

  const handleConfirmRestoreCloud = async () => {
    if (!selectedBackupToRestore) return;
    setIsProcessing(true);
    setMessage(null);
    try {
      const success = await restoreBackup(selectedBackupToRestore.id);
      if (success) {
        setMessage({
          type: 'success',
          text: `¡Copia "${selectedBackupToRestore.name}" restaurada con éxito!`
        });
        setSelectedBackupToRestore(null);
      } else {
        setMessage({
          type: 'error',
          text: 'Hubo un error al restaurar la copia de seguridad.'
        });
      }
    } catch (e) {
      setMessage({
        type: 'error',
        text: 'Error al restaurar los datos.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        setUploadedJsonData(parsed);
      } catch (err) {
        alert('El archivo seleccionado no es un JSON válido.');
        setUploadedJsonData(null);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestoreFile = async () => {
    if (!uploadedJsonData) return;
    setIsProcessing(true);
    setMessage(null);
    try {
      const success = await restoreFromJson(uploadedJsonData);
      if (success) {
        setMessage({
          type: 'success',
          text: '¡Datos restaurados correctamente desde el archivo JSON!'
        });
        setUploadedJsonData(null);
        setUploadedFileName('');
      } else {
        setMessage({
          type: 'error',
          text: 'No se pudieron restaurar los datos del archivo.'
        });
      }
    } catch (e) {
      setMessage({
        type: 'error',
        text: 'Error al procesar el archivo de copia.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20">
              <Database className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Copias de Seguridad (Backup)</h2>
              <p className="text-xs text-blue-200">
                Guarda una copia exacta de tu club y restáurala en cualquier momento
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2">
          <button
            onClick={() => { setActiveTab('create'); setMessage(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-white text-blue-700 border-slate-200 shadow-xs'
                : 'bg-transparent text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Crear Copia Actual</span>
          </button>

          <button
            onClick={() => { setActiveTab('restore'); setMessage(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition-all cursor-pointer ${
              activeTab === 'restore'
                ? 'bg-white text-blue-700 border-slate-200 shadow-xs'
                : 'bg-transparent text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Restaurar Copia</span>
            {backupsList.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800">
                {backupsList.length}
              </span>
            )}
          </button>
        </div>

        {/* Notification message */}
        {message && (
          <div className={`mx-6 mt-4 p-3 rounded-xl border flex items-center gap-2.5 text-xs font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {activeTab === 'create' && (
            <div className="space-y-6">
              {/* Summary of what will be backed up */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Estado actual a respaldar:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                    <Users className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                    <span className="text-lg font-black text-slate-900 block">{players.length}</span>
                    <span className="text-[10px] font-semibold text-slate-500">Jugadores</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                    <Calendar className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                    <span className="text-lg font-black text-slate-900 block">{matches.length}</span>
                    <span className="text-[10px] font-semibold text-slate-500">Pachangas</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                    <Camera className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                    <span className="text-lg font-black text-slate-900 block">{photos.length}</span>
                    <span className="text-[10px] font-semibold text-slate-500">Fotos</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                    <FileText className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                    <span className="text-lg font-black text-slate-900 block">{chronicles.length}</span>
                    <span className="text-[10px] font-semibold text-slate-500">Crónicas</span>
                  </div>
                </div>
              </div>

              {/* Cloud Backup Form */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Nombre o etiqueta de la copia (opcional):
                </label>
                <input
                  type="text"
                  value={backupName}
                  onChange={(e) => setBackupName(e.target.value)}
                  placeholder="Ej. Copia antes de la Pachanga #5"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleCreateCloudBackup}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                    <span>Guardar Copia en la Nube</span>
                  </button>

                  <button
                    onClick={handleDownloadJsonBackup}
                    type="button"
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-slate-600" />
                    <span>Descargar archivo JSON</span>
                  </button>
                </div>
              </div>

              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-blue-900">
                <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Las copias en la nube se almacenan de forma segura en Firebase Firestore. La opción de <strong>descargar en JSON</strong> guarda el archivo en tu dispositivo para que tengas una copia externa 100% independiente.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'restore' && (
            <div className="space-y-6">
              {/* Cloud Backups List */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-600" />
                    Copias guardadas en la Nube ({backupsList.length})
                  </span>
                  <button
                    onClick={loadBackups}
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <RefreshCw className="w-3 h-3" /> Actualizar lista
                  </button>
                </div>

                {isLoadingBackups ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Cargando copias disponibles...
                  </div>
                ) : backupsList.length === 0 ? (
                  <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                    No hay copias guardadas en la nube todavía. Crea una desde la pestaña anterior.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {backupsList.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200 transition-colors"
                      >
                        <div className="min-w-0 pr-3">
                          <h4 className="font-bold text-xs text-slate-900 truncate">{b.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                            <span>{formatDate(b.createdAt)}</span>
                            <span>•</span>
                            <span>{b.summary?.playersCount || 0} jug.</span>
                            <span>•</span>
                            <span>{b.summary?.matchesCount || 0} part.</span>
                            <span>•</span>
                            <span>{b.summary?.photosCount || 0} fotos</span>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedBackupToRestore(b)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex-shrink-0 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Restaurar</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Restore Confirmation Modal/Box */}
              {selectedBackupToRestore && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900">
                        ¿Confirmar restauración de "{selectedBackupToRestore.name}"?
                      </h4>
                      <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                        Esta acción sustituirá la plantilla, partidos y fotos actuales por los datos guardados en esta copia ({formatDate(selectedBackupToRestore.createdAt)}).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => setSelectedBackupToRestore(null)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleConfirmRestoreCloud}
                      disabled={isProcessing}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                    >
                      {isProcessing ? 'Restaurando...' : 'Sí, Restaurar ahora'}
                    </button>
                  </div>
                </div>
              )}

              {/* Restore from external JSON file */}
              <div className="border-t border-slate-200 pt-5">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2.5">
                  <HardDrive className="w-4 h-4 text-slate-600" />
                  O restaurar desde archivo JSON descargado en tu dispositivo:
                </span>

                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <label className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold rounded-lg cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-slate-600" />
                    <span>Seleccionar archivo .json</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>

                  {uploadedFileName && (
                    <span className="text-xs font-medium text-slate-600 truncate max-w-xs">
                      {uploadedFileName}
                    </span>
                  )}
                </div>

                {uploadedJsonData && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                    <span className="text-[11px] font-bold text-blue-900 block">
                      Archivo listo para restaurar:
                    </span>
                    <div className="text-[11px] text-blue-800 flex items-center gap-3">
                      <span>Jugadores: {uploadedJsonData.data?.players?.length || uploadedJsonData.players?.length || 0}</span>
                      <span>•</span>
                      <span>Partidos: {uploadedJsonData.data?.matches?.length || uploadedJsonData.matches?.length || 0}</span>
                      <span>•</span>
                      <span>Fotos: {uploadedJsonData.data?.photos?.length || uploadedJsonData.photos?.length || 0}</span>
                    </div>
                    <button
                      onClick={handleConfirmRestoreFile}
                      disabled={isProcessing}
                      className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs"
                    >
                      {isProcessing ? 'Restaurando archivo...' : 'Confirmar Restauración desde este Archivo'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
