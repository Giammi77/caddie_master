import React, { useState } from 'react';
import './App.css';
import NavBar from './components/NavBar';
import ImportStartList from './components/ImportStartList';
import TournamentView from './components/TournamentView';
import RowSummary from './components/RowSummary';
import PlayerRegistry from './components/PlayerRegistry';

function App() {
  const [activeTab, setActiveTab] = useState('import');
  const [currentTournament, setCurrentTournament] = useState(null);

  const handleTournamentReady = (t) => {
    setCurrentTournament(t);
    setActiveTab('rows');
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'import': return 'Importa Gara';
      case 'tournament': return currentTournament ? currentTournament.name : 'Gara';
      case 'rows': return 'File Deposito';
      case 'registry': return 'Anagrafica';
      default: return 'Caddie Master';
    }
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'import':
        return <ImportStartList onTournamentReady={handleTournamentReady} />;
      case 'tournament':
        return <TournamentView tournamentId={currentTournament?.id} />;
      case 'rows':
        return <RowSummary tournamentId={currentTournament?.id} />;
      case 'registry':
        return <PlayerRegistry />;
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <div className="page-header">
        <h1 className="page-title">{getTitle()}</h1>
      </div>
      {renderPage()}
      <NavBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default App;
