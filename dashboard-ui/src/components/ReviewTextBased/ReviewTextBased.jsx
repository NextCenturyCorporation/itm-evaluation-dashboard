import React, { useState } from 'react';
import surveyTheme from './surveyTheme.json'
import { useSelector } from "react-redux";
import 'survey-core/defaultV2.min.css';
import { Model } from 'survey-core';
import { Survey } from "survey-react-ui";
import { Alert, Button, Card, Container, Row, Col } from 'react-bootstrap';

const HEADER_COLOR = '#602414';
const SUBHEADER_COLOR = '#8B4513';
const TEXT_COLOR = '#602414';

const customStyles = `
  .custom-btn {
    color: ${TEXT_COLOR};
    border-color: ${TEXT_COLOR};
    background-color: white;
  }
  .custom-btn:hover, .custom-btn:focus, .custom-btn:active {
    background-color: ${TEXT_COLOR} !important;
    color: white !important;
    border-color: ${TEXT_COLOR} !important;
  }
  .subheader {
    background-color: ${SUBHEADER_COLOR};
    color: white;
    padding: 10px 15px;
    margin-top: 15px;
    margin-bottom: 15px;
    border-radius: 4px;
  }
`;

export function ReviewTextBasedPage() {
    const textBasedConfigs = useSelector(state => state.configs.textBasedConfigs);
    const [selectedConfig, setSelectedConfig] = useState(null);

    const ensureStringProperties = (obj) => {
        const stringProps = ['name', 'title', 'description'];
        Object.keys(obj).forEach(key => {
            if (stringProps.includes(key) && obj[key] !== null && obj[key] !== undefined) {
                obj[key] = String(obj[key]);
            }
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                ensureStringProperties(obj[key]);
            }
        });
        return obj;
    };

    const handleConfigSelect = (configName) => {
        let config = JSON.parse(JSON.stringify(textBasedConfigs[configName]));
        config = ensureStringProperties(config);

        if (config) {
            try {
                config.showTitle = true;
                const surveyModel = new Model(config);
                surveyModel.applyTheme(surveyTheme);
                surveyModel.focusOnFirstError = false;
                setSelectedConfig(surveyModel);
            } catch (error) {
                console.error('Error creating survey model:', error);
            }
        }
    };

    const renderConfigButtons = () => {

        const phase1AdeptConfigs = [];
        const phase1SoarTechConfigs = [];
        const phase2AdeptConfigs = [];
        const dreAdeptConfigs = [];
        const dreSoarTechConfigs = [];
        const mreAdeptConfigs = [];
        const mreSoarTechConfigs = [];

        Object.entries(textBasedConfigs).forEach(([configName, config]) => {
            if (config.eval === 'phase1') {
                if (config.author === 'adept') {
                    phase1AdeptConfigs.push(configName);
                } else {
                    phase1SoarTechConfigs.push(configName);
                }
            } else if (config.eval && config.eval.includes('June 2025')) {
                // All Phase 2 scenarios are ADEPT scenarios
                phase2AdeptConfigs.push(configName);
            } else if (config.eval === 'dre') {
                if (configName.includes('DryRunEval')) {
                    dreAdeptConfigs.push(configName);
                } else {
                    dreSoarTechConfigs.push(configName);
                }
            } else if (config.eval === 'mre') {
                if (configName.includes('MetricsEval')) {
                    mreAdeptConfigs.push(configName);
                } else {
                    mreSoarTechConfigs.push(configName);
                }
            }
        });

        phase2AdeptConfigs.sort((a, b) => {
            const scenarioA = textBasedConfigs[a].scenario_id || a;
            const scenarioB = textBasedConfigs[b].scenario_id || b;
            return scenarioA.localeCompare(scenarioB);
        });

        const getAdeptLabel = (configName) => {
            if (configName.includes('Submarine')) return 'Submarine';
            if (configName.includes('Desert')) return 'Desert';
            if (configName.includes('Jungle')) return 'Jungle';
            if (configName.includes('Urban')) return 'Urban';
            return configName;
        };

        const getSoarTechLabel = (configName) => {
            return configName.replace('-1', '').charAt(0).toUpperCase() + configName.replace('-1', '').slice(1);
        };

        const renderConfigGroup = (configs, title, labelFunction = null) => (
            <div>
                <h5 className="subheader">{title}</h5>
                <Row xs={1} md={2} lg={3} className="g-4">
                    {configs.map(configName => (
                        <Col key={configName}>
                            <Button
                                variant="outline-primary"
                                onClick={() => handleConfigSelect(configName)}
                                className="w-100 text-start text-truncate custom-btn"
                            >
                                {labelFunction ? labelFunction(configName) : configName}
                            </Button>
                        </Col>
                    ))}
                </Row>
            </div>
        );

        return (
            <>
                <Card className="mb-4 border-0 shadow">
                    <Card.Header as="h5" style={{ backgroundColor: HEADER_COLOR, color: 'white' }}>Phase 2 Scenarios (June 2025)</Card.Header>
                    <Card.Body className="bg-light">
                        {renderConfigGroup(phase2AdeptConfigs, "ADEPT")}
                    </Card.Body>
                </Card>

                <Card className="mb-4 border-0 shadow">
                    <Card.Header as="h5" style={{ backgroundColor: HEADER_COLOR, color: 'white' }}>Phase 1 Scenarios</Card.Header>
                    <Card.Body className="bg-light">
                        {renderConfigGroup(phase1AdeptConfigs, "ADEPT", getAdeptLabel)}
                        {renderConfigGroup(phase1SoarTechConfigs, "SoarTech", getSoarTechLabel)}
                    </Card.Body>
                </Card>

                <Card className="mb-4 border-0 shadow">
                    <Card.Header as="h5" style={{ backgroundColor: HEADER_COLOR, color: 'white' }}>DRE Scenarios</Card.Header>
                    <Card.Body className="bg-light">
                        {renderConfigGroup(dreAdeptConfigs, "ADEPT")}
                        {renderConfigGroup(dreSoarTechConfigs, "SoarTech")}
                    </Card.Body>
                </Card>

                <Card className="mb-4 border-0 shadow">
                    <Card.Header as="h5" style={{ backgroundColor: HEADER_COLOR, color: 'white' }}>MRE Scenarios</Card.Header>
                    <Card.Body className="bg-light">
                        {renderConfigGroup(mreAdeptConfigs, "ADEPT", getAdeptLabel)}
                        {renderConfigGroup(mreSoarTechConfigs, "SoarTech", getSoarTechLabel)}
                    </Card.Body>
                </Card>
            </>
        );
    };

    return (
        <div className={`min-vh-100 d-flex flex-column ${selectedConfig ? 'bg-light' : ''}`}>
            <style>{customStyles}</style>
            {!selectedConfig && (
                <Container className="py-4">
                    <Alert variant="warning" dismissible>
                        <Alert.Heading>Note:</Alert.Heading>
                        <p>This page is for reviewing materials only. No data will be collected.</p>
                    </Alert>

                    <h1 className="mb-4" style={{ color: HEADER_COLOR }}>Review Text-Based Scenarios</h1>
                    <h2 className="mb-3" style={{ color: HEADER_COLOR }}>Select a configuration:</h2>
                    {renderConfigButtons()}
                </Container>
            )}

            {selectedConfig && (
                <>
                    <Container fluid className="py-2 bg-white border-bottom">
                        <Button
                            variant="outline-secondary"
                            onClick={() => setSelectedConfig(null)}
                            className="me-2 custom-btn"
                        >
                            &larr; Back to Config Selection
                        </Button>
                    </Container>
                    <div className="flex-grow-1 overflow-auto">
                        <Survey model={selectedConfig}/>
                    </div>
                </>
            )}
        </div>
    );
}

export default ReviewTextBasedPage;