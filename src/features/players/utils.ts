import type { Player } from '@/api/types';

const hasNumber = (player: Player): player is Player & { number: number } =>
  player.number !== null && player.number !== undefined;

/** Players with a shirt number first (by number), then the rest alphabetically by surname. */
export function sortPlayers(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    if (hasNumber(a) && hasNumber(b) && a.number !== b.number) return a.number - b.number;
    if (hasNumber(a) !== hasNumber(b)) return hasNumber(a) ? -1 : 1;
    return (
      a.last_name.localeCompare(b.last_name, 'uk') || a.first_name.localeCompare(b.first_name, 'uk')
    );
  });
}

/** Two letters for a card without a shirt number: "Курильчук Максим" -> "КМ". */
export function getInitials(player: Pick<Player, 'first_name' | 'last_name'>): string {
  return `${player.last_name.charAt(0)}${player.first_name.charAt(0)}`.toUpperCase();
}
