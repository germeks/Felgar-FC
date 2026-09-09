import React from 'react';
import { ClubProvider, useClub } from './context/ClubContext';
import { Navbar } from './components/Navbar';
import { HomeSection } from './components/HomeSection';
import { MatchesSection } from './components/MatchesSection';
import { PlayersSection } from './components/PlayersSection';
import { GallerySection } from './components/GallerySection';
import { Footer } from './components/Footer';

const MainContent: React.FC = () => {
  const { activeTab } = useClub();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {activeTab === 'inicio' && <HomeSection />}
      {activeTab === 'partidos' && <MatchesSection />}
      {activeTab === 'jugadores' && <PlayersSection />}
      {activeTab === 'galeria' && <GallerySection />}
    </main>
  );
};

export default function App() {
  return (
    <ClubProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Navbar />
        <MainContent />
        <Footer />
      </div>
    </ClubProvider>
  );
}
