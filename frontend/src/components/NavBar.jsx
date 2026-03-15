import React from 'react';

const tabs = [
  { id: 'import', icon: '\u2795', label: 'Importa' },
  { id: 'tournament', icon: '\u23F0', label: 'Gara' },
  { id: 'rows', icon: '\u2630', label: 'File' },
  { id: 'registry', icon: '\uD83D\uDC64', label: 'Anagrafica' },
];

function NavBar({ activeTab, onTabChange }) {
  return (
    <nav className="navbar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="nav-icon">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export default NavBar;
