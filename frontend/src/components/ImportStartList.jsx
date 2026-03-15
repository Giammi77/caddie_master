import React, { useState, useEffect } from 'react';
import { parseStartList } from '../parser';
import {
  getTournaments, createTournament, deleteTournament,
  analyzeStartList, confirmEntries,
} from '../storage';

function ImportStartList({ onTournamentReady }) {
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [rawText, setRawText] = useState('');
  const [step, setStep] = useState('input'); // input | review | done
  const [parsedData, setParsedData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [existingTournaments, setExistingTournaments] = useState([]);

  useEffect(() => {
    setExistingTournaments(getTournaments());
  }, []);

  const handleAnalyze = () => {
    if (!name || !rawText) return;

    const tourn = createTournament(name, date);
    setTournament(tourn);

    const parsed = parseStartList(rawText);
    if (!parsed.length) {
      alert('Nessuna partenza trovata nel testo. Verifica il formato.');
      return;
    }

    const result = analyzeStartList(tourn.id, parsed);
    setParsedData(result.tee_times);
    setSummary(result.summary);
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
    confirmEntries(tournament.id, rawText, parsedData);
    setStep('done');
    onTournamentReady(tournament);
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
          >
            Conferma e Salva
          </button>
          <button
            className="btn btn-secondary btn-full"
            style={{ marginTop: 8 }}
            onClick={() => {
              deleteTournament(tournament.id);
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
          <label>Nome gara</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Es: Gara Sociale Marzo"
          />
        </div>
        <div className="form-group">
          <label>Data</label>
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Lista partenze (incolla il testo)</label>
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
          disabled={!name || !rawText}
        >
          Analizza
        </button>
      </div>
    </div>
  );
}

export default ImportStartList;
