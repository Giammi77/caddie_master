import React, { useState, useEffect } from 'react';
import { getRowsSummary } from '../storage';

function RowSummary({ tournamentId }) {
  const [rows, setRows] = useState([]);
  const [doneRows, setDoneRows] = useState(new Set());
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    if (!tournamentId) return;
    setRows(getRowsSummary(tournamentId));
    setDoneRows(new Set());
  }, [tournamentId]);

  if (!tournamentId) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">&#9971;</div>
        <p>Nessuna gara selezionata.<br />Importa una lista partenze.</p>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">&#128230;</div>
        <p>Nessuna fila da preparare.</p>
      </div>
    );
  }

  const toggleDone = (rowNumber, e) => {
    e.stopPropagation();
    const next = new Set(doneRows);
    if (next.has(rowNumber)) {
      next.delete(rowNumber);
    } else {
      next.add(rowNumber);
    }
    setDoneRows(next);
  };

  const getPriority = (row) => {
    const activeRows = rows.filter(r => !doneRows.has(r.row_number));
    if (!activeRows.length) return 'low';
    const position = activeRows.findIndex(r => r.row_number === row.row_number);
    if (position === -1) return 'low';
    const ratio = position / activeRows.length;
    if (ratio < 0.33) return 'high';
    if (ratio < 0.66) return 'medium';
    return 'low';
  };

  // File non fatte prima, poi fatte
  const sortedRows = [...rows].sort((a, b) => {
    const aDone = doneRows.has(a.row_number);
    const bDone = doneRows.has(b.row_number);
    if (aDone !== bDone) return aDone ? 1 : -1;
    return 0;
  });

  const totalBags = rows.reduce((sum, r) => sum + r.count, 0);
  const doneBags = rows
    .filter(r => doneRows.has(r.row_number))
    .reduce((sum, r) => sum + r.count, 0);
  const doneCount = doneRows.size;

  return (
    <div>
      <div className="summary-bar">
        <div className="summary-item">
          <div className="summary-number">{rows.length}</div>
          <div className="summary-label">File</div>
        </div>
        <div className="summary-item">
          <div className="summary-number">{totalBags}</div>
          <div className="summary-label">Sacche</div>
        </div>
        <div className="summary-item">
          <div className="summary-number" style={{ color: '#2e7d32' }}>
            {doneCount}/{rows.length}
          </div>
          <div className="summary-label">Pronte</div>
        </div>
        <div className="summary-item">
          <div className="summary-number" style={{ color: '#2e7d32' }}>
            {doneBags}/{totalBags}
          </div>
          <div className="summary-label">Sacche OK</div>
        </div>
      </div>

      {sortedRows.map((row) => {
        const isDone = doneRows.has(row.row_number);
        const isExpanded = expandedRow === row.row_number;
        const priority = isDone ? '' : getPriority(row);

        return (
          <div key={row.row_number} className="row-card">
            <div
              className={`row-card-header ${isDone ? 'done' : `priority-${priority}`}`}
              onClick={() => setExpandedRow(isExpanded ? null : row.row_number)}
            >
              <span className="row-number">{row.row_number}</span>
              <div className="row-info">
                <span className="badge badge-count">{row.count} sacche</span>
                <div className="row-first-time">
                  Prima partenza: {row.first_tee_time}
                </div>
              </div>
              <button
                className={`check-btn ${isDone ? 'checked' : ''}`}
                onClick={(e) => toggleDone(row.row_number, e)}
              >
                {isDone ? '\u2713' : ''}
              </button>
            </div>

            {isExpanded && (
              <div className="row-card-body">
                {row.players.map((player, pIdx) => (
                  <div key={pIdx} className="player-item">
                    <span className="player-time">{player.tee_time}</span>
                    <span className="player-name">{player.full_name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default RowSummary;
