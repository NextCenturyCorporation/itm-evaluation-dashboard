import React from 'react';
import '../../css/scenario-progress.css';

const ScenarioProgress = ({ current, total }) => {
  const percentage = ((current / total) * 100).toFixed(0);
  
  return (
    <div className="scenario-progress-compact">
      <div className="scenario-compact-inner">
        <div className="scenario-compact-badge">
          <span className="badge-text">
            Scenario {current} <span className="badge-divider">of</span> {total}
          </span>
        </div>
        <div className="scenario-compact-bar-container">
          <div className="scenario-compact-bar">
            <div 
              className="scenario-compact-fill" 
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="scenario-compact-percent">{percentage}%</span>
        </div>
      </div>
    </div>
  );
};

export default ScenarioProgress;