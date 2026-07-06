interface NflWeekNavProps {
  currentWeek: number;
  selectedWeek: number;
  onWeekChange: (week: number) => void;
}

export function NflWeekNav({ currentWeek, selectedWeek, onWeekChange }: NflWeekNavProps) {
  const totalWeeks = 18;

  return (
    <div className="nfl-week-nav">
      <button
        className="btn btn-sm btn-secondary"
        onClick={() => onWeekChange(Math.max(1, selectedWeek - 1))}
        disabled={selectedWeek <= 1}
        aria-label="Semana anterior"
      >
        ←
      </button>

      <div className="nfl-week-pills">
        {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => (
          <button
            key={week}
            className={`nfl-week-pill ${week === selectedWeek ? 'nfl-week-pill--selected' : ''} ${week === currentWeek ? 'nfl-week-pill--current' : ''}`}
            onClick={() => onWeekChange(week)}
            aria-label={`Semana ${week}`}
          >
            {week}
          </button>
        ))}
      </div>

      <button
        className="btn btn-sm btn-secondary"
        onClick={() => onWeekChange(Math.min(totalWeeks, selectedWeek + 1))}
        disabled={selectedWeek >= totalWeeks}
        aria-label="Semana siguiente"
      >
        →
      </button>
    </div>
  );
}
