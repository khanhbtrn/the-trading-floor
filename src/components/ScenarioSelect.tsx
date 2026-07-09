import type { ScenarioConfig } from '../types';

interface ScenarioSelectProps {
  scenarios: ScenarioConfig[];
  onSelect: (scenario: ScenarioConfig) => void;
}

export function ScenarioSelect({ scenarios, onSelect }: ScenarioSelectProps) {
  return (
    <div className="screen scenario-select">
      <header className="screen-header">
        <h1>Trading Floor</h1>
        <p className="subtitle">Select a scenario to begin your session</p>
      </header>
      <div className="scenario-grid">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            className="scenario-card"
            onClick={() => onSelect(scenario)}
          >
            <h2>{scenario.name}</h2>
            <span className="scenario-date">{scenario.dateRange}</span>
            <p className="scenario-flavor">{scenario.flavorText}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
