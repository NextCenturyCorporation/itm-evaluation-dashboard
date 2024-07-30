import React, { useState } from 'react';
import surveyTheme from './surveyTheme.json'
import { useSelector } from "react-redux";
import 'survey-core/defaultV2.min.css';
import { Model } from 'survey-core';
import { Survey } from "survey-react-ui";
import { Alert, Button, Card, Container, Row, Col } from 'react-bootstrap';

const HEADER_COLOR = '#602414'; // Darker brown to match the header
const TEXT_COLOR = '#602414'; // Keeping the dark red-brown for text
const ALERT_BG_COLOR = '#FFF3CD'; // Light yellow for the alert background

// Custom CSS for button hover effect and alert styling
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
`;

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
        const dreConfigs = [];
        const otherConfigs = [];

        Object.entries(textBasedConfigs).forEach(([configName, config]) => {
            if (config.eval === 'mre') {
                mreConfigs.push(configName);
            } else if (config.eval === 'dre') {
                dreConfigs.push(configName);
            } else {
                otherConfigs.push(configName)
            }
        });

        const renderConfigGroup = (configs, title) => (
            configs.length > 0 && (
                <Card className="mb-4 border-0 shadow-sm">
                    <Card.Header as="h5" style={{ backgroundColor: HEADER_COLOR, color: 'white' }}>{title}</Card.Header>
                    <Card.Body className="bg-light">
                        <Row xs={1} md={2} lg={3} className="g-4">
                            {configs.map(configName => (
                                <Col key={configName}>
                                    <Button
                                        variant="outline-primary"
                                        onClick={() => handleConfigSelect(configName)}
                                        className="w-100 text-start text-truncate custom-btn"
                                    >
                                        {configName}
                                    </Button>
                                </Col>
                            ))}
                        </Row>
                    </Card.Body>
                </Card>
            )
        );

        return (
            <>
                {renderConfigGroup(dreConfigs, "DRE Scenarios")}
                {renderConfigGroup(mreConfigs, "MRE Scenarios")}
                {renderConfigGroup(otherConfigs, "Misc Scenarios")}
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
                        <span className="fs-5 fw-bold" style={{ color: HEADER_COLOR }}>Selected Configuration: {selectedConfig.name}</span>
                    </Container>
                    <div className="flex-grow-1 overflow-auto">
                        <Survey model={selectedConfig} />
                    </div>
                </>
            )}
        </div>
    );
}

export default ReviewTextBasedPage;