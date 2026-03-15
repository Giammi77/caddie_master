import React, { useState, useEffect } from 'react';
import { getEntriesByTime } from '../storage';

function TournamentView({ tournamentId }) {
  const [entries, setEntries] = useState([]);
  const [highlightRow, setHighlightRow] = useState(null);

  useEffect(() => {
    if (!tournamentId) return;
    setEntries(getEntriesByTime(tournamentId));
  }, [tournamentId]);

  if (!tournamentId) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">&#9971;</div>
        <p>Nessuna gara selezionata.<br />Importa una lista partenze.</p>
      </div>
    );
  }

  if (!entries.length) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">&#9971;</div>
        <p>Nessuna iscrizione per questa gara.</p>
      </div>
    );
  }

  return (
    <div>
      {highlightRow && (
        <div style={{
          padding: '8px 12px', background: '#e8f5e9',
          textAlign: 'center', fontSize: '0.85rem',
          position: 'sticky', top: 48, zIndex: 5,
        }}>
          Fila <strong>{highlightRow}</strong> evidenziata
          <button
            onClick={() => setHighlightRow(null)}
            style={{ marginLeft: 8, border: 'none', background: 'none', color: '#1a7a3a', fontWeight: 700, cursor: 'pointer' }}
          >
            &#x2715;
          </button>
        </div>
      )}

      {entries.map((group, idx) => (
        <div key={idx} className="card">
          <div className="tee-time-header">
            {group.tee_time} - Tee {group.tee_number}
          </div>
          {group.players.map((player, pIdx) => (
            <div
              key={pIdx}
              className={`player-item ${highlightRow === player.row_number ? 'highlight-row' : ''}`}
              onClick={() => setHighlightRow(
                highlightRow === player.row_number ? null : player.row_number
              )}
              style={{ cursor: 'pointer' }}
            >
              <span className="player-name">{player.full_name}</span>
              {player.row_number ? (
                <span className="badge badge-row">{player.row_number}</span>
              ) : (
                <span className="badge badge-unknown" style={{ fontSize: '0.65rem' }}>No fila</span>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default TournamentView;
