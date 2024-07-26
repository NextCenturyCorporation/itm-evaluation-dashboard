import React, { useState } from 'react';
import surveyTheme from './surveyTheme.json'
import { useSelector } from "react-redux";
import 'survey-core/defaultV2.min.css';
import { Model } from 'survey-core';
import { Survey, ReactQuestionFactory } from "survey-react-ui";
export function ReviewTextBasedPage() {
    const textBasedConfigs = useSelector(state => state.configs.textBasedConfigs);
    const [selectedConfig, setSelectedConfig] = useState(null);

    const handleConfigSelect = (configName) => {
        // deep copy
        let config = JSON.parse(JSON.stringify(textBasedConfigs[configName]));

        // allow user to go forward and back
        config.showPrevButton = true

        if (config) {
            const surveyModel = new Model(config);
            surveyModel.applyTheme(surveyTheme);
            setSelectedConfig(surveyModel);
        }
    };

    return (
        <div>
            <h1>Review Text-Based Scenarios</h1>

            {!selectedConfig && (
                <div>
                    <h2>Select a configuration:</h2>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '10px'  // This adds space between buttons
                    }}>
                        {Object.keys(textBasedConfigs).map((configName) => (
                            <button
                                key={configName}
                                onClick={() => handleConfigSelect(configName)}
                                className="btn btn-primary"
                                style={{ width: '200px' }}  // Set a fixed width for consistency
                            >
                                {configName}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {selectedConfig && (
                <div>
                    <button
                        onClick={() => setSelectedConfig(null)}
                        className="btn btn-secondary mb-3"
                    >
                        Back to Config Selection
                    </button>
                    <Survey model={selectedConfig} />
                </div>
            )}
        </div>
    );
}