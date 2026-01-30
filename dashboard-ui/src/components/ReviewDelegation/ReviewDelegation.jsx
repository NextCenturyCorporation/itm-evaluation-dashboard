import React, { useState } from 'react';
import surveyTheme from '../Survey/surveyTheme.json'
import { useSelector } from "react-redux";
import 'survey-core/defaultV2.min.css';
import { Model } from 'survey-core';
import { Survey } from "survey-react-ui";
import { Accordion, Alert, Button, Card, Container, Row, Col } from 'react-bootstrap';
import '../../css/review-del.css';

const HEADER_COLOR = '#602414';

const PH1_NAME_MAP = {
    'DryRunEval-MJ2-eval': 'phase1-adept-eval-MJ2',
    'DryRunEval-MJ4-eval': 'phase1-adept-eval-MJ4',
    'DryRunEval-MJ5-eval': 'phase1-adept-eval-MJ5',
    'DryRunEval-IO2-eval': 'phase1-adept-eval-IO2',
    'DryRunEval-IO4-eval': 'phase1-adept-eval-IO4',
    'DryRunEval-IO5-eval': 'phase1-adept-eval-IO5',
    'qol-ph1-eval-2': 'qol-ph1-eval-2',
    'qol-ph1-eval-3': 'qol-ph1-eval-3',
    'qol-ph1-eval-4': 'qol-ph1-eval-4',
    'vol-ph1-eval-2': 'vol-ph1-eval-2',
    'vol-ph1-eval-3': 'vol-ph1-eval-3',
    'vol-ph1-eval-4': 'vol-ph1-eval-4',
};

const CONFIG_METADATA = [
    { key: 'dre', version: 'delegation_v4.0', title: 'DRE Scenarios', isPhase2: false, useScenarioIndex: true },
    { key: 'ph1', version: 'delegation_v5.0', title: 'Phase 1 Scenarios', isPhase2: false, useScenarioIndex: true, nameMap: PH1_NAME_MAP },
    { key: 'ph2_june', version: 'delegation_v6.0', title: 'Phase 2 June 2025 Collaboration', isPhase2: true },
    { key: 'ph2_july', version: 'delegation_v7.0', title: 'Phase 2 July 2025 Collaboration', isPhase2: true },
    { key: 'ph2_sept', version: 'delegation_v8.0', title: 'Phase 2 September 2025 Collaboration', isPhase2: true },
    { key: 'uk', version: 'delegation_v9.0', title: 'UK Collaboration', isPhase2: false, useScenarioIndex: true },
    { key: 'ph2_feb', version: 'delegation_v10.0', title: 'Phase 2 February 2026 Collaboration', isPhase2: true },
];

export function ReviewDelegationPage() {
    const delegationConfigs = useSelector(state => state.configs.surveyConfigs);
    const [selectedConfig, setSelectedConfig] = useState(null);
    const [reviewingText, setReviewingText] = useState(null);

    const handleConfigSelect = (page) => {
        if (page) {
            try {
                const surveyModel = new Model(page);
                surveyModel.applyTheme(surveyTheme);
                setSelectedConfig(surveyModel);

                // Determine the reviewing text based on evaluation version
                let reviewText = '';
                if (page['evalNumber'] === 4) {
                    reviewText = page['scenarioIndex'] + ' - ' + page['admName'] + ' - ' + page['admAlignment'];
                } else if (page['evalNumber'] >= 8) {
                    reviewText = page['scenarioName'] ? page['scenarioName'] : page['scenarioIndex'] + ' - ' + page['admName'] + ' - ' + page['target'];
                } else {
                    reviewText = (page['scenarioIndex'] ? PH1_NAME_MAP[page['scenarioIndex']] : 'Unknown') + ' - ' + page['admName'] + ' - ' + page['admAlignment'];
                }

                setReviewingText(reviewText);
            } catch (error) {
                console.error('Error creating survey model:', error);
            }
        }
    };

    const addPageToScenarios = (scenarios, page, useScenarioIndex) => {
        const scenarioKey = useScenarioIndex ? page['scenarioIndex'] : (page['scenarioName'] || page['scenarioIndex']);
        
        if (!scenarios[scenarioKey]) {
            scenarios[scenarioKey] = {};
        }
        if (!scenarios[scenarioKey][page['admName']]) {
            scenarios[scenarioKey][page['admName']] = [];
        }
        scenarios[scenarioKey][page['admName']].push(page);
    };

    const renderConfigButtons = () => {
        // Initialize scenario collections
        const scenarioCollections = {};
        CONFIG_METADATA.forEach(meta => {
            scenarioCollections[meta.key] = {};
        });

        // Populate scenario collections
        CONFIG_METADATA.forEach((meta, index) => {
            const config = delegationConfigs[meta.version];
            if (!config) return;

            for (const page of config['pages']) {
                if (Object.keys(page).includes('scenarioIndex') || Object.keys(page).includes('scenarioName')) {
                    addPageToScenarios(scenarioCollections[meta.key], page, meta.useScenarioIndex);
                }
            }
        });

        const renderConfigGroup = (configs, title, isPhase2 = false) => (
            <Accordion className="accordion">
                <Accordion.Item eventKey="0">
                    <Accordion.Header><strong className="scenarioName">{title}</strong></Accordion.Header>
                    <Accordion.Body>
                        {Object.keys(configs).map(admName => {
                            return (
                                <Accordion className="accordion" key={admName + '-' + title}>
                                    <Accordion.Item eventKey="1">
                                        <Accordion.Header>{admName}</Accordion.Header>
                                        <Accordion.Body>
                                            <Row xs={1} md={2} lg={2} className="g-4">
                                                {configs[admName].sort((a, b) => {
                                                    const aValue = isPhase2 ? a['target'] : a['admAlignment'];
                                                    const bValue = isPhase2 ? b['target'] : b['admAlignment'];
                                                    return aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' });
                                                }).map((page, index) => (
                                                    <Col key={title + ' ' + admName + ' ' + (isPhase2 ? page['target'] : page['admAlignment']) + ' ' + index}>
                                                        <Button
                                                            variant="outline-primary"
                                                            onClick={() => handleConfigSelect(page)}
                                                            className="text-start text-truncate custom-btn"
                                                        >
                                                            {isPhase2 ? page['target'] : page['admAlignment']}
                                                        </Button>
                                                    </Col>
                                                ))}
                                            </Row>
                                        </Accordion.Body>
                                    </Accordion.Item>
                                </Accordion>
                            )
                        })}
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>
        );

        const renderScenarioCard = (meta) => {
            const scenarios = scenarioCollections[meta.key];
            if (Object.keys(scenarios).length === 0) return null;

            return (
                <Card key={meta.key} className="mb-4 border-0 shadow">
                    <Card.Header as="h5" style={{ backgroundColor: HEADER_COLOR, color: 'white' }}>
                        {meta.title}
                    </Card.Header>
                    <Card.Body className="bg-light">
                        {Object.keys(scenarios).sort().map((scenarioName) => {
                            const displayName = meta.nameMap ? meta.nameMap[scenarioName] : scenarioName;
                            return (
                                <div key={scenarioName}>
                                    {renderConfigGroup(scenarios[scenarioName], displayName, meta.isPhase2)}
                                </div>
                            );
                        })}
                    </Card.Body>
                </Card>
            );
        };

        return (
            <>
                {CONFIG_METADATA.map(meta => renderScenarioCard(meta))}
            </>
        );
    };

    return (
        <div className={`review-delegation-page min-vh-100 d-flex flex-column ${selectedConfig ? 'bg-light' : ''}`}>
            {!selectedConfig && (
                <Container className="py-4">
                    <Alert variant="warning" dismissible>
                        <Alert.Heading>Note:</Alert.Heading>
                        <p>This page is for reviewing materials only. No data will be collected.</p>
                    </Alert>

                    <h1 className="mb-4" style={{ color: HEADER_COLOR }}>Review Delegation Materials</h1>
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
                            className="me-2 back-btn"
                        >
                            &larr; Back to Config Selection
                        </Button>
                    </Container>
                    <h5 className='subtitle'>Reviewing {reviewingText}</h5>
                    <div className="flex-grow-1 overflow-auto">
                        <Survey model={selectedConfig} />
                    </div>
                </>
            )}
        </div>
    );
}

export default ReviewDelegationPage;