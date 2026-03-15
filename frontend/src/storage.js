/**
 * Storage layer locale - tutti i dati sul dispositivo via localStorage.
 *
 * Struttura dati:
 * - players: { [fullName]: { full_name, row_number } }
 * - tournaments: [ { id, name, date, raw_text, entries: [...] } ]
 * - config: { total_rows }
 */

const PLAYERS_KEY = 'caddie_players';
const TOURNAMENTS_KEY = 'caddie_tournaments';
const CONFIG_KEY = 'caddie_config';

// --- Config ---
export function getConfig() {
  const raw = localStorage.getItem(CONFIG_KEY);
  return raw ? JSON.parse(raw) : { total_rows: 35 };
}

export function saveConfig(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

// --- Players ---
export function getPlayers() {
  const raw = localStorage.getItem(PLAYERS_KEY);
  return raw ? JSON.parse(raw) : {};
}

function savePlayers(players) {
  localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
}

export function getPlayersList(searchQuery = '') {
  const players = getPlayers();
  let list = Object.values(players).sort((a, b) => {
    // Ordina per fila, poi per nome
    if (a.row_number !== b.row_number) return a.row_number - b.row_number;
    return a.full_name.localeCompare(b.full_name);
  });
  if (searchQuery) {
    const q = searchQuery.toUpperCase();
    list = list.filter(p => p.full_name.includes(q));
  }
  return list;
}

export function deleteAllPlayers() {
  localStorage.removeItem(PLAYERS_KEY);
}

export function deleteAllTournaments() {
  localStorage.removeItem(TOURNAMENTS_KEY);
}

export function addPlayer(fullName, rowNumber) {
  const players = getPlayers();
  const name = fullName.toUpperCase().trim();
  if (players[name]) {
    throw new Error('Giocatore gia\' presente in anagrafica');
  }
  players[name] = { full_name: name, row_number: rowNumber };
  savePlayers(players);
  return players[name];
}

export function updatePlayerRow(fullName, rowNumber) {
  const players = getPlayers();
  const name = fullName.toUpperCase().trim();
  if (!players[name]) {
    throw new Error('Giocatore non trovato');
  }
  players[name].row_number = rowNumber;
  savePlayers(players);
}

export function deletePlayer(fullName) {
  const players = getPlayers();
  delete players[fullName.toUpperCase().trim()];
  savePlayers(players);
}

export function importPlayers(text) {
  const players = getPlayers();
  let imported = 0;
  let errors = 0;

  for (const line of text.trim().split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Formato: COGNOME NOME;FILA o COGNOME NOME,FILA o COGNOME NOME\tFILA
    let name = '', row = '';
    for (const sep of [';', ',', '\t']) {
      if (trimmed.includes(sep)) {
        const parts = trimmed.split(sep);
        name = parts[0].trim().toUpperCase();
        row = parts[parts.length - 1].trim();
        break;
      }
    }

    const rowNum = parseInt(row, 10);
    if (!name || isNaN(rowNum) || rowNum < 1) {
      errors++;
      continue;
    }

    if (!players[name]) {
      players[name] = { full_name: name, row_number: rowNum };
      imported++;
    } else {
      errors++; // duplicato
    }
  }

  savePlayers(players);
  return { imported, errors };
}

// --- Tournaments ---
export function getTournaments() {
  const raw = localStorage.getItem(TOURNAMENTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveTournaments(tournaments) {
  localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(tournaments));
}

export function createTournament(name, date) {
  const tournaments = getTournaments();
  const tournament = {
    id: Date.now(),
    name,
    date,
    raw_text: '',
    entries: [],
  };
  tournaments.unshift(tournament);
  saveTournaments(tournaments);
  return tournament;
}

export function deleteTournament(id) {
  const tournaments = getTournaments().filter(t => t.id !== id);
  saveTournaments(tournaments);
}

export function getTournament(id) {
  return getTournaments().find(t => t.id === id) || null;
}

/**
 * Analizza la lista partenze confrontando con l'anagrafica.
 * Ritorna i dati parsati con status known/unknown per ogni giocatore.
 */
export function analyzeStartList(tournamentId, parsedData) {
  const players = getPlayers();
  const tournaments = getTournaments();
  const idx = tournaments.findIndex(t => t.id === tournamentId);
  if (idx === -1) throw new Error('Gara non trovata');

  let known = 0, unknown = 0;

  const teeTimesWithStatus = parsedData.map(group => ({
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

  return {
    tee_times: teeTimesWithStatus,
    summary: { total: known + unknown, known, unknown },
  };
}

/**
 * Conferma le iscrizioni: salva giocatori nuovi e entries della gara.
 */
export function confirmEntries(tournamentId, rawText, teeTimesData) {
  const players = getPlayers();
  const tournaments = getTournaments();
  const idx = tournaments.findIndex(t => t.id === tournamentId);
  if (idx === -1) throw new Error('Gara non trovata');

  const entries = [];
  let createdPlayers = 0;

  for (const group of teeTimesData) {
    for (const p of group.players) {
      // Salva giocatore in anagrafica solo se ha una fila assegnata
      if (p.row_number && !players[p.full_name]) {
        players[p.full_name] = { full_name: p.full_name, row_number: p.row_number };
        createdPlayers++;
      }

      // Salva entry della gara per tutti (anche senza fila)
      entries.push({
        full_name: p.full_name,
        row_number: p.row_number || null,
        tee_time: group.tee_time,
        tee_number: group.tee_number,
        handicap: p.handicap,
      });
    }
  }

  savePlayers(players);

  tournaments[idx].raw_text = rawText;
  tournaments[idx].entries = entries;
  saveTournaments(tournaments);

  return { created_players: createdPlayers, created_entries: entries.length };
}

/**
 * Ritorna le iscrizioni raggruppate per orario partenza.
 */
export function getEntriesByTime(tournamentId) {
  const tournament = getTournament(tournamentId);
  if (!tournament) return [];

  const grouped = {};
  for (const entry of tournament.entries) {
    const key = `${entry.tee_time}_${entry.tee_number}`;
    if (!grouped[key]) {
      grouped[key] = {
        tee_time: entry.tee_time,
        tee_number: entry.tee_number,
        players: [],
      };
    }
    grouped[key].players.push(entry);
  }

  return Object.keys(grouped)
    .sort()
    .map(key => grouped[key]);
}

/**
 * Ritorna le file raggruppate e ordinate per primo orario partenza.
 */
export function getRowsSummary(tournamentId) {
  const tournament = getTournament(tournamentId);
  if (!tournament) return [];

  const rows = {};
  for (const entry of tournament.entries) {
    const row = entry.row_number;
    if (!row) continue; // Ometti giocatori senza fila
    if (!rows[row]) {
      rows[row] = [];
    }
    rows[row].push({
      full_name: entry.full_name,
      tee_time: entry.tee_time,
      tee_number: entry.tee_number,
    });
  }

  const result = Object.entries(rows).map(([rowNumber, players]) => {
    players.sort((a, b) => a.tee_time.localeCompare(b.tee_time));
    return {
      row_number: parseInt(rowNumber, 10),
      first_tee_time: players[0].tee_time,
      count: players.length,
      players,
    };
  });

  result.sort((a, b) => a.first_tee_time.localeCompare(b.first_tee_time));

  return result;
}
