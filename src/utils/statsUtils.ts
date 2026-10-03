import { Player, Match, GoalScorer } from '../types';

export interface PlayerComputedStats {
  matchesPlayed: number;
  goals: number;
  assists: number;
  mvps: number;
  wins: number;
  losses: number;
  draws: number;
  goalAverage: number;
}

/**
 * Calculates real-time statistics for a player directly from the list of matches.
 */
export function calculatePlayerStatsFromMatches(
  player: { id: string; name: string; nickname?: string },
  matches: Match[]
): PlayerComputedStats {
  const pId = player.id;
  const pName = player.name.trim().toLowerCase();
  const pNick = player.nickname ? player.nickname.trim().toLowerCase() : null;

  let matchesPlayed = 0;
  let goals = 0;
  let assists = 0;
  let mvps = 0;
  let wins = 0;
  let losses = 0;
  let draws = 0;

  matches.forEach((m) => {
    // Check if player participated in this match
    const inBlue = (m.playersBlue || []).some(
      (id) =>
        id === pId ||
        id.toLowerCase().trim() === pName ||
        (pNick !== null && id.toLowerCase().trim() === pNick)
    );
    const inWhite = (m.playersWhite || []).some(
      (id) =>
        id === pId ||
        id.toLowerCase().trim() === pName ||
        (pNick !== null && id.toLowerCase().trim() === pNick)
    );

    // Calculate goals in this match
    let matchGoals = 0;
    (m.scorersBlue || []).forEach((s) => {
      if (
        s.type !== 'Propia Puerta' &&
        (s.playerId === pId ||
          (s.playerName &&
            (s.playerName.trim().toLowerCase() === pName ||
              (pNick !== null && s.playerName.trim().toLowerCase() === pNick))))
      ) {
        matchGoals++;
      }
    });

    (m.scorersWhite || []).forEach((s) => {
      if (
        s.type !== 'Propia Puerta' &&
        (s.playerId === pId ||
          (s.playerName &&
            (s.playerName.trim().toLowerCase() === pName ||
              (pNick !== null && s.playerName.trim().toLowerCase() === pNick))))
      ) {
        matchGoals++;
      }
    });

    const played = inBlue || inWhite || matchGoals > 0;
    if (played) {
      matchesPlayed++;

      const isBlue =
        inBlue ||
        (m.scorersBlue || []).some(
          (s) =>
            s.playerId === pId ||
            (s.playerName &&
              (s.playerName.trim().toLowerCase() === pName ||
                (pNick !== null && s.playerName.trim().toLowerCase() === pNick)))
        );
      const isWhite =
        inWhite ||
        (m.scorersWhite || []).some(
          (s) =>
            s.playerId === pId ||
            (s.playerName &&
              (s.playerName.trim().toLowerCase() === pName ||
                (pNick !== null && s.playerName.trim().toLowerCase() === pNick)))
        );

      if (m.goalsBlue === m.goalsWhite) {
        draws++;
      } else if (isBlue && m.goalsBlue > m.goalsWhite) {
        wins++;
      } else if (isWhite && m.goalsWhite > m.goalsBlue) {
        wins++;
      } else if ((isBlue && m.goalsBlue < m.goalsWhite) || (isWhite && m.goalsWhite < m.goalsBlue)) {
        losses++;
      }
    }

    goals += matchGoals;

    // Check MVP award
    if (m.mvp) {
      const mvpTrimmed = m.mvp.trim().toLowerCase();
      if (
        m.mvp === pId ||
        mvpTrimmed === pName ||
        (pNick !== null && mvpTrimmed === pNick)
      ) {
        mvps++;
      }
    }
  });

  const goalAverage = matchesPlayed > 0 ? Number((goals / matchesPlayed).toFixed(2)) : 0;

  return {
    matchesPlayed,
    goals,
    assists,
    mvps,
    wins,
    losses,
    draws,
    goalAverage,
  };
}

/**
 * Returns player's nickname (mote / apodo) if available, otherwise falls back to full name.
 * Cleans any residual wrapping quotes.
 */
export function getPlayerDisplayName(
  player?: { name: string; nickname?: string } | null,
  fallback = 'Jugador'
): string {
  if (!player) return fallback;
  const nick = player.nickname?.trim();
  if (nick) {
    const cleanNick = nick.replace(/^["']+|["']+$/g, '').trim();
    if (cleanNick.length > 0) return cleanNick;
  }
  return player.name;
}

/**
 * Returns a new list of players with their stats (matchesPlayed, goals, mvps, assists)
 * synchronized with the actual matches.
 */
export function syncPlayersWithMatches(players: Player[], matches: Match[]): Player[] {
  return players.map((player) => {
    const stats = calculatePlayerStatsFromMatches(player, matches);
    return {
      ...player,
      matchesPlayed: stats.matchesPlayed,
      goals: stats.goals,
      assists: stats.assists,
      mvps: stats.mvps,
      wins: stats.wins,
      losses: stats.losses,
      draws: stats.draws,
    };
  });
}

/**
 * Resolves the up-to-date display name of a scorer using the players list as source of truth.
 * Prioritizes the player's nickname/mote if present, falling back to full name.
 */
export function getScorerPlayerName(scorer: GoalScorer, players: Player[]): string {
  if (scorer.playerId) {
    const p = players.find((pl) => pl.id === scorer.playerId);
    if (p) return getPlayerDisplayName(p);
  }
  if (scorer.playerName) {
    const clean = scorer.playerName.trim().toLowerCase();
    const p = players.find(
      (pl) =>
        pl.name.trim().toLowerCase() === clean ||
        (pl.nickname && pl.nickname.trim().toLowerCase() === clean)
    );
    if (p) return getPlayerDisplayName(p);
  }
  return scorer.playerName || 'Jugador';
}

export interface GroupedScorer {
  id: string;
  name: string;
  count: number;
}

/**
 * Groups a list of scorers by player ID (or player name if ID is missing),
 * using the current player roster to ensure renamed players don't show obsolete mock names
 * and goals for the same player aren't split.
 * Uses player nickname if present, falling back to full name.
 */
export function groupScorers(scorers: GoalScorer[], players: Player[]): GroupedScorer[] {
  const map = new Map<string, GroupedScorer>();
  for (const s of scorers) {
    const p = s.playerId
      ? players.find((pl) => pl.id === s.playerId)
      : s.playerName
      ? players.find(
          (pl) =>
            pl.name.trim().toLowerCase() === s.playerName.trim().toLowerCase() ||
            (pl.nickname && pl.nickname.trim().toLowerCase() === s.playerName.trim().toLowerCase())
        )
      : null;
    const key = p ? p.id : (s.playerName || 'desconocido').toLowerCase().trim();
    const displayName = p ? getPlayerDisplayName(p) : (s.playerName || 'Jugador');
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, { id: key, name: displayName, count: 1 });
    }
  }
  return Array.from(map.values());
}

