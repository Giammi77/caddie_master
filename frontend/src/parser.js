/**
 * Parsa il testo della lista partenze.
 *
 * Formato riga: ORARIO\tTEE\tGIOCATORE1\tGIOCATORE2\t...
 * Formato giocatore: "COGNOME NOME HANDICAP" (handicap = ultimo token numerico)
 */
export function parseStartList(rawText) {
  const results = [];

  for (const line of rawText.trim().split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const parts = trimmed.split('\t');
    if (parts.length < 3) continue;

    const teeTime = parts[0].trim();
    if (!/^\d{1,2}:\d{2}$/.test(teeTime)) continue;

    const teeNumber = parseInt(parts[1].trim(), 10);
    if (isNaN(teeNumber)) continue;

    const players = [];
    for (let i = 2; i < parts.length; i++) {
      const entry = parts[i].trim();
      if (!entry || entry.toLowerCase() === 'privacy') continue;

      const tokens = entry.split(/\s+/);
      if (!tokens.length) continue;

      const lastToken = parseInt(tokens[tokens.length - 1], 10);
      let fullName, handicap;

      if (!isNaN(lastToken)) {
        handicap = lastToken;
        fullName = tokens.slice(0, -1).join(' ').toUpperCase().trim();
      } else {
        handicap = null;
        fullName = entry.toUpperCase().trim();
      }

      if (fullName) {
        players.push({ full_name: fullName, handicap });
      }
    }

    if (players.length) {
      results.push({ tee_time: teeTime, tee_number: teeNumber, players });
    }
  }

  return results;
}
