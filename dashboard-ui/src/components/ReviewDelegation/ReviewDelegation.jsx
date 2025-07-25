import React, { useState } from 'react';
import surveyTheme from '../Survey/surveyTheme.json'
import { useSelector } from "react-redux";
import 'survey-core/defaultV2.min.css';
import { Model } from 'survey-core';
import { Survey } from "survey-react-ui";
import { Accordion, Alert, Button, Card, Container, Row, Col } from 'react-bootstrap';

const HEADER_COLOR = '#602414';
const SUBHEADER_COLOR = '#8B4513';
const TEXT_COLOR = '#602414';

const customStyles = `
  .custom-btn {
    color: ${TEXT_COLOR};
    border-color: ${TEXT_COLOR};
    background-color: white;
    margin-left: 24px;
    margin-right: 32px;
    width: 80%;
  }
  .back-btn {
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
  .scenarioName {
    font-size: 20px;
  }
  .miniheader {
    background-color: white;
    color: ${SUBHEADER_COLOR};
    border: 1px solid ${SUBHEADER_COLOR};
    padding: 10px 15px;
    margin-top: 48px;
    margin-bottom: -8px;
    margin-left: 24px;
    border-radius: 4px;
    width: 95%;
  }
  .sd-body.sd-body--static {
    max-width: none;
  }
  .accordion {
    margin-bottom: 8px;
  }
  .action-item {
    font-size: 14px;
  }
`;

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
                    reviewText = page['scenarioName'] + ' - ' + page['admName'] + ' - ' + page['target'];
                } else {
                    reviewText = (page['scenarioIndex'] ? PH1_NAME_MAP[page['scenarioIndex']] : 'Unknown') + ' - ' + page['admName'] + ' - ' + page['admAlignment'];
                }

                setReviewingText(reviewText);
            } catch (error) {
                console.error('Error creating survey model:', error);
            }
        }
    };

    const renderConfigButtons = () => {
        const dre_scenarios = {};
        const ph1_scenarios = {};
        const ph2_june_scenarios = {};
        const ph2_july_scenarios = {};

        const dre_config = delegationConfigs["delegation_v4.0"];
        const ph1_config = delegationConfigs["delegation_v5.0"];
        const ph2_june_config = delegationConfigs["delegation_v6.0"];
        const ph2_july_config = delegationConfigs["delegation_v7.0"];

        [dre_config, ph1_config, ph2_june_config, ph2_july_config].forEach((config, i) => {
            if (!config) return;

            for (const page of config['pages']) {
                if (Object.keys(page).includes('scenarioIndex') || Object.keys(page).includes('scenarioName')) {
                    let scenarioKey = '';

                    if (i === 0) {
                        scenarioKey = page['scenarioIndex'];
                        if (!Object.keys(dre_scenarios).includes(scenarioKey)) {
                            dre_scenarios[scenarioKey] = {};
                        }
                        if (!Object.keys(dre_scenarios[scenarioKey]).includes(page['admName'])) {
                            dre_scenarios[scenarioKey][page['admName']] = [];
                        }
                        dre_scenarios[scenarioKey][page['admName']].push(page);
                    } else if (i === 1) {
                        scenarioKey = page['scenarioIndex'];
                        if (!Object.keys(ph1_scenarios).includes(scenarioKey)) {
                            ph1_scenarios[scenarioKey] = {};
                        }
                        if (!Object.keys(ph1_scenarios[scenarioKey]).includes(page['admName'])) {
                            ph1_scenarios[scenarioKey][page['admName']] = [];
                        }
                        ph1_scenarios[scenarioKey][page['admName']].push(page);
                    } else if (i === 2) { 
                        scenarioKey = page['scenarioName'] || page['scenarioIndex'];
                        if (!Object.keys(ph2_june_scenarios).includes(scenarioKey)) {
                            ph2_june_scenarios[scenarioKey] = {};
                        }
                        if (!Object.keys(ph2_june_scenarios[scenarioKey]).includes(page['admName'])) {
                            ph2_june_scenarios[scenarioKey][page['admName']] = [];
                        }
                        ph2_june_scenarios[scenarioKey][page['admName']].push(page);
                    } else if (i === 3) {
                        scenarioKey = page['scenarioName'] || page['scenarioIndex'];
                        if (!Object.keys(ph2_july_scenarios).includes(scenarioKey)) {
                            ph2_july_scenarios[scenarioKey] = {};
                        }
                        if (!Object.keys(ph2_july_scenarios[scenarioKey]).includes(page['admName'])) {
                            ph2_july_scenarios[scenarioKey][page['admName']] = [];
                        }
                        ph2_july_scenarios[scenarioKey][page['admName']].push(page);
                    }
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

        return (
            <>
                {Object.keys(ph2_july_scenarios).length > 0 && (
                    <Card className="mb-4 border-0 shadow">
                        <Card.Header as="h5" style={{ backgroundColor: HEADER_COLOR, color: 'white' }}>
                            Phase 2 July 2025 Collaboration
                        </Card.Header>
                        <Card.Body className="bg-light">
                            {Object.keys(ph2_july_scenarios).sort().map((scenarioName => (
                                <div key={scenarioName}>
                                    {renderConfigGroup(ph2_july_scenarios[scenarioName], scenarioName, true)}
                                </div>
                            )))}
                        </Card.Body>
                    </Card>
                )}
                {Object.keys(ph2_june_scenarios).length > 0 && (
                    <Card className="mb-4 border-0 shadow">
                        <Card.Header as="h5" style={{ backgroundColor: HEADER_COLOR, color: 'white' }}>
                            Phase 2 June 2025 Collaboration
                        </Card.Header>
                        <Card.Body className="bg-light">
                            {Object.keys(ph2_june_scenarios).sort().map((scenarioName => (
                                <div key={scenarioName}>
                                    {renderConfigGroup(ph2_june_scenarios[scenarioName], scenarioName, true)}
                                </div>
                            )))}
                        </Card.Body>
                    </Card>
                )}
                {Object.keys(ph1_scenarios).length > 0 && (
                    <Card className="mb-4 border-0 shadow">
                        <Card.Header as="h5" style={{ backgroundColor: HEADER_COLOR, color: 'white' }}>
                            Phase 1 Scenarios
                        </Card.Header>
                        <Card.Body className="bg-light">
                            {Object.keys(ph1_scenarios).sort().map((scenarioName => (
                                <div key={PH1_NAME_MAP[scenarioName]}>
                                    {renderConfigGroup(ph1_scenarios[scenarioName], PH1_NAME_MAP[scenarioName])}
                                </div>
                            )))}
                        </Card.Body>
                    </Card>
                )}
                {Object.keys(dre_scenarios).length > 0 && (
                    <Card className="mb-4 border-0 shadow">
                        <Card.Header as="h5" style={{ backgroundColor: HEADER_COLOR, color: 'white' }}>
                            DRE Scenarios
                        </Card.Header>
                        <Card.Body className="bg-light">
                            {Object.keys(dre_scenarios).sort().map((scenarioName => (
                                <div key={scenarioName}>
                                    {renderConfigGroup(dre_scenarios[scenarioName], scenarioName)}
                                </div>
                            )))}
                        </Card.Body>
                    </Card>
                )}
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
                        <Survey model={selectedConfig}/>
                    </div>
                </>
            )}
        </div>
    );
}

export default ReviewDelegationPage;