interface NflPickSelectorProps {
  pick: string | null;
  onPick: (pick: string) => void;
  disabled?: boolean;
  homeTeam: string;
  awayTeam: string;
}

export function NflPickSelector({ pick, onPick, disabled, homeTeam, awayTeam }: NflPickSelectorProps) {
  const options = [
    { value: 'LOCAL', emoji: '🏠', label: 'LOCAL', description: `Gana ${homeTeam}` },
    { value: 'EMPATE', emoji: '🤝', label: 'EMPATE', description: 'Empate' },
    { value: 'VISITANTE', emoji: '✈️', label: 'VISITANTE', description: `Gana ${awayTeam}` },
  ];

  return (
    <div className="nfl-pick-selector">
      {options.map((opt) => (
        <button
          key={opt.value}
          className={`nfl-pick-btn ${pick === opt.value ? 'nfl-pick-btn--selected' : ''}`}
          onClick={() => onPick(opt.value)}
          disabled={disabled}
          title={opt.description}
          aria-label={opt.description}
        >
          <span className="nfl-pick-emoji">{opt.emoji}</span>
          <span className="nfl-pick-label">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
