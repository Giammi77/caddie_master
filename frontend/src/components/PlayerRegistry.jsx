import React, { useState, useEffect, useCallback } from 'react';
import {
  getPlayersList, addPlayer, updatePlayerRow,
  deletePlayer, importPlayers, deleteAllPlayers,
} from '../storage';

function PlayerRegistry() {
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState('');
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editRow, setEditRow] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const [importText, setImportText] = useState('');
  const [newName, setNewName] = useState('');
  const [newRow, setNewRow] = useState('');

  const loadPlayers = useCallback(() => {
    setPlayers(getPlayersList(search));
  }, [search]);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  const handleDelete = (fullName) => {
    if (!window.confirm(`Eliminare ${fullName}?`)) return;
    deletePlayer(fullName);
    loadPlayers();
  };

  const handleDeleteAll = () => {
    if (!window.confirm('Eliminare TUTTA l\'anagrafica? Questa azione non e\' reversibile.')) return;
    if (!window.confirm('Sei sicuro? Verranno eliminati tutti i giocatori.')) return;
    deleteAllPlayers();
    loadPlayers();
  };

  const handleEditSave = () => {
    if (!editRow) return;
    try {
      updatePlayerRow(editingPlayer.full_name, parseInt(editRow, 10));
      setEditingPlayer(null);
      loadPlayers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddPlayer = () => {
    if (!newName || !newRow) return;
    try {
      addPlayer(newName, parseInt(newRow, 10));
      setNewName('');
      setNewRow('');
      loadPlayers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const result = importPlayers(importText);
    alert(`Importati: ${result.imported}, Errori/duplicati: ${result.errors}`);
    setImportText('');
    loadPlayers();
  };

  // Raggruppa giocatori per fila
  const groupedByRow = {};
  for (const p of players) {
    if (!groupedByRow[p.row_number]) {
      groupedByRow[p.row_number] = [];
    }
    groupedByRow[p.row_number].push(p);
  }
  const rowNumbers = Object.keys(groupedByRow).map(Number).sort((a, b) => a - b);

  return (
    <div>
      <div className="tab-bar">
        <button
          className={`tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          Lista
        </button>
        <button
          className={`tab ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          Aggiungi
        </button>
        <button
          className={`tab ${activeTab === 'import' ? 'active' : ''}`}
          onClick={() => setActiveTab('import')}
        >
          Importa
        </button>
      </div>

      {activeTab === 'list' && (
        <>
          <div className="search-bar">
            <input
              className="input"
              placeholder="Cerca giocatore..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {players.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">&#128100;</div>
              <p>{search ? 'Nessun risultato.' : 'Nessun giocatore in anagrafica.'}</p>
            </div>
          ) : (
            <>
              <div className="summary-bar">
                <div className="summary-item">
                  <div className="summary-number">{players.length}</div>
                  <div className="summary-label">Giocatori</div>
                </div>
                <div className="summary-item">
                  <div className="summary-number">{rowNumbers.length}</div>
                  <div className="summary-label">File</div>
                </div>
              </div>

              {rowNumbers.map((rowNum) => (
                <div key={rowNum} className="row-card">
                  <div className="row-card-header" style={{ cursor: 'default', borderLeft: '4px solid #1a7a3a' }}>
                    <span className="row-number">{rowNum}</span>
                    <div className="row-info">
                      <span className="badge badge-count">{groupedByRow[rowNum].length} giocatori</span>
                    </div>
                  </div>
                  <div className="row-card-body">
                    {groupedByRow[rowNum].map((player) => (
                      <div key={player.full_name} className="player-item">
                        <span className="player-name">{player.full_name}</span>
                        <span
                          className="badge badge-row"
                          onClick={() => {
                            setEditingPlayer(player);
                            setEditRow(String(player.row_number));
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          {player.row_number}
                        </span>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(player.full_name)}
                        >
                          &#x2715;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div style={{ padding: '12px' }}>
                <button
                  className="btn btn-danger btn-full"
                  onClick={handleDeleteAll}
                >
                  Elimina tutta l'anagrafica
                </button>
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'add' && (
        <div className="card">
          <h3>Aggiungi Giocatore</h3>
          <div className="form-group">
            <label>Nome completo</label>
            <input
              className="input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="COGNOME NOME"
            />
          </div>
          <div className="form-group">
            <label>Numero fila</label>
            <input
              className="input input-row-number"
              type="number"
              inputMode="numeric"
              min="1"
              value={newRow}
              onChange={(e) => setNewRow(e.target.value)}
              placeholder="N."
            />
          </div>
          <button
            className="btn btn-primary btn-full"
            onClick={handleAddPlayer}
            disabled={!newName || !newRow}
          >
            Aggiungi
          </button>
        </div>
      )}

      {activeTab === 'import' && (
        <div className="card">
          <h3>Importa Anagrafica</h3>
          <p className="info-text" style={{ margin: '0 0 10px' }}>
            Una riga per giocatore, formato:<br />
            <code>COGNOME NOME;FILA</code><br />
            Separatori accettati: ; , oppure tab
          </p>
          <div className="form-group">
            <textarea
              className="textarea"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={"ROSSI MARIO;5\nBIANCHI LUIGI;12\nVERDI ANNA;3"}
            />
          </div>
          <button
            className="btn btn-primary btn-full"
            onClick={handleImport}
            disabled={!importText.trim()}
          >
            Importa
          </button>
        </div>
      )}

      {editingPlayer && (
        <div className="modal-overlay" onClick={() => setEditingPlayer(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Modifica Fila</h3>
            <p style={{ margin: '0 0 12px', fontWeight: 500 }}>{editingPlayer.full_name}</p>
            <div className="form-group">
              <label>Numero fila</label>
              <input
                className="input input-row-number"
                type="number"
                inputMode="numeric"
                min="1"
                value={editRow}
                onChange={(e) => setEditRow(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => setEditingPlayer(null)} style={{ flex: 1 }}>
                Annulla
              </button>
              <button className="btn btn-primary" onClick={handleEditSave} style={{ flex: 1 }}>
                Salva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerRegistry;
