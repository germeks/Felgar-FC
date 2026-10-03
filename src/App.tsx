import React, { useEffect, Suspense, lazy } from 'react';
import { ClubProvider, useClub } from './context/ClubContext';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { HomeSection } from './components/HomeSection';
import { Footer } from './components/Footer';

// Code-splitting for heavy secondary sections to boost mobile initial load speed
const MatchesSection = lazy(() =>
  import('./components/MatchesSection').then((m) => ({ default: m.MatchesSection }))
);
const PlayersSection = lazy(() =>
  import('./components/PlayersSection').then((m) => ({ default: m.PlayersSection }))
);
const ChroniclesSection = lazy(() =>
  import('./components/ChroniclesSection').then((m) => ({ default: m.ChroniclesSection }))
);
const GallerySection = lazy(() =>
  import('./components/GallerySection').then((m) => ({ default: m.GallerySection }))
);

const SectionSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse py-2" role="status" aria-label="Cargando contenido...">
    <div className="h-12 bg-slate-200/80 rounded-2xl w-full" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div className="h-28 bg-slate-200/70 rounded-2xl" />
      <div className="h-28 bg-slate-200/70 rounded-2xl" />
      <div className="h-28 bg-slate-200/70 rounded-2xl" />
    </div>
    <div className="h-64 bg-slate-200/60 rounded-2xl w-full" />
  </div>
);

const MainContent: React.FC = () => {
  const { activeTab } = useClub();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activeTab]);

  return (
    <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 flex-1 w-full pb-20 md:pb-8">
      <Suspense fallback={<SectionSkeleton />}>
        {activeTab === 'inicio' && <HomeSection />}
        {activeTab === 'partidos' && <MatchesSection />}
        {activeTab === 'jugadores' && <PlayersSection />}
        {activeTab === 'cronicas' && <ChroniclesSection />}
        {activeTab === 'galeria' && <GallerySection />}
      </Suspense>
    </main>
  );
};

export default function App() {
  return (
    <ClubProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        <Navbar />
        <MainContent />
        <Footer />
        <MobileBottomNav />
      </div>
    </ClubProvider>
  );
}
