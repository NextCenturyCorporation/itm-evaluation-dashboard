import React, { useState } from 'react';
import surveyTheme from './surveyTheme.json'
import { useSelector } from "react-redux";
import 'survey-core/defaultV2.min.css';
import { Model } from 'survey-core';
import { Survey, ReactQuestionFactory } from "survey-react-ui";
import { Alert } from 'react-bootstrap'

export function ReviewTextBasedPage() {
    const textBasedConfigs = useSelector(state => state.configs.textBasedConfigs);
    const [selectedConfig, setSelectedConfig] = useState(null);

    const handleConfigSelect = (configName) => {
        let config = JSON.parse(JSON.stringify(textBasedConfigs[configName]));
        config.showPrevButton = true;

        if (config) {
            const surveyModel = new Model(config);
            surveyModel.applyTheme(surveyTheme);
            setSelectedConfig(surveyModel);
        }
    };

    const renderConfigButtons = () => {
        const mreConfigs = [];
        const otherConfigs = [];

        Object.entries(textBasedConfigs).forEach(([configName, config]) => {
            if (config.eval === 'mre') {
                mreConfigs.push(configName);
            } else {
                otherConfigs.push(configName);
            }
        });

        const buttonStyle = {
            width: '200px',
            marginBottom: '10px'
        };

        const groupStyle = {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            marginBottom: '20px'
        };

        return (
            <>
                {otherConfigs.length > 0 && (
                    <div style={groupStyle}>
                        <h3>DRE Scenarios</h3>
                        {otherConfigs.map(configName => (
                            <button
                                key={configName}
                                onClick={() => handleConfigSelect(configName)}
                                className="btn btn-primary"
                                style={buttonStyle}
                            >
                                {configName}
                            </button>
                        ))}
                    </div>
                )}

                {mreConfigs.length > 0 && (
                    <div style={groupStyle}>
                        <h3>MRE Scenarios</h3>
                        {mreConfigs.map(configName => (
                            <button
                                key={configName}
                                onClick={() => handleConfigSelect(configName)}
                                className="btn btn-primary"
                                style={buttonStyle}
                            >
                                {configName}
                            </button>
                        ))}
                    </div>
                )}
            </>
        );
    };

    return (
        <div>
            <Alert variant="warning" dismissible>
                <Alert.Heading>Note: This page is for reviewing materials only. No data will be collected.</Alert.Heading>
            </Alert>
            <h1>Review Text-Based Scenarios</h1>

            {!selectedConfig && (
                <div>
                    <h2>Select a configuration:</h2>
                    {renderConfigButtons()}
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