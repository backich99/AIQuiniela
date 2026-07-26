// Liga MX team logos from ESPN
export const LIGA_MX_LOGOS: Record<string, string> = {
  'América': 'https://a.espncdn.com/i/teamlogos/soccer/500/227.png',
  'Atlante': 'https://a.espncdn.com/i/teamlogos/soccer/500/226.png',
  'Atlas': 'https://a.espncdn.com/i/teamlogos/soccer/500/216.png',
  'Atlético de San Luis': 'https://a.espncdn.com/i/teamlogos/soccer/500/15720.png',
  'Cruz Azul': 'https://a.espncdn.com/i/teamlogos/soccer/500/218.png',
  'FC Juarez': 'https://a.espncdn.com/i/teamlogos/soccer/500/17851.png',
  'Guadalajara': 'https://a.espncdn.com/i/teamlogos/soccer/500/219.png',
  'León': 'https://a.espncdn.com/i/teamlogos/soccer/500/228.png',
  'Monterrey': 'https://a.espncdn.com/i/teamlogos/soccer/500/220.png',
  'Necaxa': 'https://a.espncdn.com/i/teamlogos/soccer/500/229.png',
  'Pachuca': 'https://a.espncdn.com/i/teamlogos/soccer/500/234.png',
  'Puebla': 'https://a.espncdn.com/i/teamlogos/soccer/500/231.png',
  'Pumas UNAM': 'https://a.espncdn.com/i/teamlogos/soccer/500/233.png',
  'Querétaro': 'https://a.espncdn.com/i/teamlogos/soccer/500/222.png',
  'Santos': 'https://a.espncdn.com/i/teamlogos/soccer/500/225.png',
  'Tigres UANL': 'https://a.espncdn.com/i/teamlogos/soccer/500/232.png',
  'Tijuana': 'https://a.espncdn.com/i/teamlogos/soccer/500/10125.png',
  'Toluca': 'https://a.espncdn.com/i/teamlogos/soccer/500/223.png',
};

export function getTeamLogo(teamName: string): string | null {
  return LIGA_MX_LOGOS[teamName] || null;
}
