import { useReducer, useCallback } from 'react';
import { scenarios } from './scenarios';
import { gameReducer, initialGameState } from './store/gameReducer';
import { ScenarioSelect } from './components/ScenarioSelect';
import { Briefing } from './components/Briefing';
import { RiskCheck } from './components/RiskCheck';
import { Escalation } from './components/Escalation';
import { Desk } from './components/Desk';
import { Scorecard } from './components/Scorecard';
import './index.css';

function App() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  const handleSelectScenario = useCallback(
    (scenario: (typeof scenarios)[0]) => {
      dispatch({ type: 'SELECT_SCENARIO', scenario });
    },
    []
  );

  const renderScreen = () => {
    switch (state.screen) {
      case 'SCENARIO_SELECT':
        return (
          <ScenarioSelect scenarios={scenarios} onSelect={handleSelectScenario} />
        );
      case 'BRIEFING':
        return (
          <Briefing
            state={state}
            onComplete={(instruction) =>
              dispatch({ type: 'BRIEFING_COMPLETE', instruction })
            }
          />
        );
      case 'RISK_CHECK':
        return (
          <RiskCheck
            state={state}
            onContinue={() => dispatch({ type: 'RISK_CHECK_CONTINUE' })}
          />
        );
      case 'ESCALATION':
        return (
          <Escalation
            state={state}
            onOverride={(note, conductDelta) =>
              dispatch({ type: 'COMPLIANCE_OVERRIDE', note, conductDelta })
            }
            onReject={(note) =>
              dispatch({ type: 'COMPLIANCE_REJECT', note })
            }
          />
        );
      case 'DESK':
        return (
          <Desk
            state={state}
            onAdvanceTick={() => dispatch({ type: 'ADVANCE_TICK' })}
            onTrade={(action, size) =>
              dispatch({ type: 'EXECUTE_TRADE', action, size })
            }
            onResolveGlitch={(note) =>
              dispatch({ type: 'RESOLVE_GLITCH', note })
            }
            onEndSession={() => dispatch({ type: 'END_SESSION' })}
          />
        );
      case 'SCORECARD':
        return (
          <Scorecard
            state={state}
            onReset={() => dispatch({ type: 'RESET_GAME' })}
          />
        );
      default:
        return null;
    }
  };

  return <div className="app">{renderScreen()}</div>;
}

export default App;
