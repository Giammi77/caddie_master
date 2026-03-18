import React, { useState, useEffect } from 'react';
import { parseStartList } from '../parser';
import {
  getTournaments, createTournament, deleteTournament,
  getPlayers, confirmEntries,
} from '../storage';

function extractHeader(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let name = '';
  let date = new Date().toISOString().split('T')[0];

  if (lines.length >= 1 && !lines[0].match(/^\d{1,2}:\d{2}/)) {
    name = lines[0];
  }
  if (lines.length >= 2) {
    const dateMatch = lines[1].match(/(\d{2})-(\d{2})-(\d{4})/);
    if (dateMatch) {
      date = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
    }
  }
  return { name, date };
}

function filterValidLines(text) {
  return text.split('\n').filter(line => {
    const parts = line.split('\t');
    return parts.length >= 3 && /^\d{1,2}:\d{2}/.test(parts[0].trim());
  }).join('\n');
}

function ImportStartList({ onTournamentReady }) {
  const [rawText, setRawText] = useState('');
  const [step, setStep] = useState('input'); // input | review | done
  const [parsedData, setParsedData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [reviewName, setReviewName] = useState('');
  const [reviewDate, setReviewDate] = useState('');
  const [existingTournaments, setExistingTournaments] = useState([]);

  useEffect(() => {
    setExistingTournaments(getTournaments());
  }, []);

  const handleAnalyze = () => {
    if (!rawText.trim()) return;

    const parsed = parseStartList(rawText);
    if (!parsed.length) {
      alert('Nessuna partenza trovata nel testo. Verifica il formato.');
      return;
    }

    // Estrai nome e data dall'intestazione
    const { name, date } = extractHeader(rawText);
    setReviewName(name);
    setReviewDate(date);

    // Analisi in memoria: confronta con anagrafica senza creare la gara
    const players = getPlayers();
    let known = 0, unknown = 0;
    const teeTimes = parsed.map(group => ({
      ...group,
      players: group.players.map(p => {
        const existing = players[p.full_name];
        if (existing) {
          known++;
          return { ...p, row_number: existing.row_number, status: 'known' };
        }
        unknown++;
        return { ...p, row_number: null, status: 'unknown' };
      }),
    }));
    setParsedData(teeTimes);
    setSummary({ total: known + unknown, known, unknown });
    setStep('review');
  };

  const handleRowChange = (teeIdx, playerIdx, value) => {
    const updated = parsedData.map((group, i) => {
      if (i !== teeIdx) return group;
      return {
        ...group,
        players: group.players.map((p, j) => {
          if (j !== playerIdx) return p;
          return { ...p, row_number: value ? parseInt(value, 10) : null };
        }),
      };
    });
    setParsedData(updated);
  };

  const handleConfirm = () => {
    const tourn = createTournament(reviewName || 'Gara', reviewDate);
    setTournament(tourn);
    confirmEntries(tourn.id, rawText, parsedData);
    setStep('done');
    onTournamentReady(tourn);
  };

  const handleSelectExisting = (t) => {
    onTournamentReady(t);
  };

  const handleDeleteTournament = (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Eliminare questa gara?')) return;
    deleteTournament(id);
    setExistingTournaments(getTournaments());
  };

  if (step === 'done') {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">&#10003;</div>
        <p>Gara importata!</p>
        <button className="btn btn-primary" onClick={() => onTournamentReady(tournament)}>
          Vai alle File
        </button>
      </div>
    );
  }

  if (step === 'review') {
    return (
      <div>
        <div className="summary-bar">
          <div className="summary-item">
            <div className="summary-number">{summary.total}</div>
            <div className="summary-label">Totale</div>
          </div>
          <div className="summary-item">
            <div className="summary-number" style={{ color: '#2e7d32' }}>{summary.known}</div>
            <div className="summary-label">Noti</div>
          </div>
          <div className="summary-item">
            <div className="summary-number" style={{ color: '#e65100' }}>{summary.unknown}</div>
            <div className="summary-label">Da assegnare</div>
          </div>
        </div>

        <div className="card">
          <div className="form-group">
            <label>Nome gara</label>
            <input
              className="input"
              value={reviewName}
              onChange={(e) => setReviewName(e.target.value)}
              placeholder="Es: Gara Sociale Marzo"
              style={!reviewName.trim() ? { borderColor: '#e65100' } : {}}
            />
            {!reviewName.trim() && (
              <p style={{ color: '#e65100', fontSize: '0.85rem', marginTop: 4 }}>
                Inserisci il nome della gara prima di salvare.
              </p>
            )}
          </div>
          <div className="form-group">
            <label>Data</label>
            <input
              className="input"
              type="date"
              value={reviewDate}
              onChange={(e) => setReviewDate(e.target.value)}
            />
          </div>
        </div>

        {parsedData.map((group, teeIdx) => (
          <div key={teeIdx} className="card">
            <div className="tee-time-header">
              {group.tee_time} - Tee {group.tee_number}
            </div>
            {group.players.map((player, playerIdx) => (
              <div key={playerIdx} className="player-item">
                <div style={{ flex: 1 }}>
                  <div className="player-name">{player.full_name}</div>
                  <span className={`badge ${player.status === 'known' ? 'badge-known' : 'badge-unknown'}`}>
                    {player.status === 'known' ? 'Noto' : 'Nuovo'}
                  </span>
                </div>
                <input
                  type="number"
                  className="input input-row-number"
                  inputMode="numeric"
                  min="1"
                  value={player.row_number || ''}
                  onChange={(e) => handleRowChange(teeIdx, playerIdx, e.target.value)}
                  placeholder="N."
                />
              </div>
            ))}
          </div>
        ))}

        <div style={{ padding: '12px' }}>
          <button
            className="btn btn-primary btn-full"
            onClick={handleConfirm}
            disabled={!reviewName.trim()}
          >
            Conferma e Salva
          </button>
          <button
            className="btn btn-secondary btn-full"
            style={{ marginTop: 8 }}
            onClick={() => {
              setStep('input');
              setParsedData(null);
            }}
          >
            Annulla
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {existingTournaments.length > 0 && (
        <div className="card">
          <h3>Gare precedenti</h3>
          {existingTournaments.map(t => (
            <div
              key={t.id}
              className="tournament-item"
              onClick={() => handleSelectExisting(t)}
            >
              <span className="player-name">{t.name}</span>
              <span className="player-time">{t.date}</span>
              <span className="badge badge-count">{t.entries.length}</span>
              <button
                className="btn btn-danger"
                style={{ padding: '6px 10px', minHeight: 'auto', fontSize: '0.75rem' }}
                onClick={(e) => handleDeleteTournament(e, t.id)}
              >
                Elimina
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h3>Nuova Gara</h3>
        <div className="form-group">
          <label>Lista partenze</label>
          <label
            style={{
              display: 'inline-block',
              padding: '7px 16px',
              background: '#e8f5e9',
              border: '1px solid #a5d6a7',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '0.9rem',
              color: '#2e7d32',
              marginBottom: 8,
            }}
          >
            Carica file .txt
            <input
              type="file"
              accept=".txt,text/plain"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  setRawText(filterValidLines(ev.target.result));
                };
                reader.readAsText(file, 'UTF-8');
                e.target.value = '';
              }}
            />
          </label>
          <textarea
            className="textarea"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Incolla qui la lista partenze..."
          />
        </div>
        <button
          className="btn btn-primary btn-full"
          onClick={handleAnalyze}
          disabled={!rawText.trim()}
        >
          Analizza
        </button>
      </div>
    </div>
  );
}

export default ImportStartList;
