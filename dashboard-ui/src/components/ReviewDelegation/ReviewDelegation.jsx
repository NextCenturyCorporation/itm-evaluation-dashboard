import React, { useState } from 'react';
import surveyTheme from '../Survey/surveyTheme.json'
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
  .main-content {
    zoom: 0.8;
    -moz-transform: scale(0.8);
    -moz-transform-origin: 0 0;
  }
  .sd-body.sd-body--static {
    max-width: none;
  }
`;

export function ReviewDelegationPage() {
    const delegationConfigs = useSelector(state => state.configs.surveyConfigs);
    const [selectedConfig, setSelectedConfig] = useState(null);
    const [reviewingText, setReviewingText] = useState(null);

    const handleSurveyComplete = (sender) => {
        const results = sender.data;
        console.log("Survey results:", results);
    };

    const handleConfigSelect = (page) => {
        if (page) {
            try {
                const surveyModel = new Model(page);
                surveyModel.applyTheme(surveyTheme);
                setSelectedConfig(surveyModel);
                setReviewingText(page['scenarioIndex'] + ' - ' + page['admName'] + ' - ' + page['admAlignment']);
            } catch (error) {
                console.error('Error creating survey model:', error);
            }
        }
    };

    const renderConfigButtons = () => {
        const scenarios = {};


        const config = delegationConfigs["delegation_v4.0"];
        for (const page of config['pages']) {
            if (Object.keys(page).includes('scenarioIndex')) {
                if (!Object.keys(scenarios).includes(page['scenarioIndex'])) {
                    scenarios[page['scenarioIndex']] = {};
                }
                if (!Object.keys(scenarios[page['scenarioIndex']]).includes(page['admName'])) {
                    scenarios[page['scenarioIndex']][page['admName']] = [];
                }
                scenarios[page['scenarioIndex']][page['admName']].push(page);
            }
        }
        const renderConfigGroup = (configs, title) => (
            <div>
                <h5 className="subheader">{title}</h5>

                {Object.keys(configs).map(admName => {
                    return (
                        <Row xs={1} md={2} lg={3} key={admName + '-' + title} className="g-4">
                            <h5 className="miniheader">{admName}</h5>
                            {configs[admName].map(page => (
                                <Col key={title + ' ' + admName + ' ' + page['admAlignment']}>
                                    <Button
                                        variant="outline-primary"
                                        onClick={() => handleConfigSelect(page)}
                                        className="text-start text-truncate custom-btn"
                                    >
                                        {page['admAlignment']}
                                    </Button>
                                </Col>

                            ))}
                        </Row>
                    )
                })}
            </div>
        );

        return (
            <>
                <Card className="mb-4 border-0 shadow">
                    <Card.Header as="h5" style={{ backgroundColor: HEADER_COLOR, color: 'white' }}>DRE Scenarios</Card.Header>
                    <Card.Body className="bg-light">
                        {Object.keys(scenarios).map((scenarioName => (
                            <div key={scenarioName}>
                                {renderConfigGroup(scenarios[scenarioName], scenarioName)}
                            </div>
                        )))}
                    </Card.Body>
                </Card>
            </>
        );

    };

    return (
        <div className={`min-vh-100 d-flex flex-column ${selectedConfig ? 'bg-light' : ''}`}>
            <style>{customStyles}</style>
            {!selectedConfig && (
                <Container className="py-4 main-content">
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
                        <Survey model={selectedConfig} onComplete={handleSurveyComplete} />
                    </div>
                </>
            )}
        </div>
    );
}

export default ReviewDelegationPage;