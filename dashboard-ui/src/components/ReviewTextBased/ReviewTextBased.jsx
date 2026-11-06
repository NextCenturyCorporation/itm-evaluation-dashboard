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

    const getConfigLabel = (configName, config) => {
        if (configName.includes('Submarine')) return 'Submarine';
        if (configName.includes('Desert')) return 'Desert';
        if (configName.includes('Jungle')) return 'Jungle';
        if (configName.includes('Urban')) return 'Urban';
        
        if (config.scenario_id) return config.scenario_id;
        
        return configName.replace('-1', '').charAt(0).toUpperCase() + 
               configName.replace('-1', '').slice(1);
    };

    const formatEvalGroupTitle = (evalValue) => {
        if (!evalValue) return 'Unspecified';
        
        return evalValue.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    };

    const organizeConfigsByEval = () => {
        const organized = {};
        const evalGroupOrder = []; 
        
        Object.entries(textBasedConfigs).forEach(([configName, config]) => {
            if (config.eval === 'mre-eval') return;
            
            const evalGroup = config.eval || null;
            if (!evalGroup) { return }
            
            const author = config.author || 'adept';
            
            if (!organized[evalGroup]) {
                organized[evalGroup] = {};
                evalGroupOrder.push(evalGroup); 
            }
            
            if (!organized[evalGroup][author]) {
                organized[evalGroup][author] = [];
            }
            
            organized[evalGroup][author].push({ name: configName, config });
        });
        
        Object.keys(organized).forEach(evalGroup => {
            Object.keys(organized[evalGroup]).forEach(author => {
                organized[evalGroup][author].sort((a, b) => {
                    const idA = a.config.scenario_id || a.name;
                    const idB = b.config.scenario_id || b.name;
                    return idA.localeCompare(idB);
                });
            });
        });
        
        return { organized, evalGroupOrder };
    };

    const renderConfigButtons = () => {
        const { organized: organizedConfigs, evalGroupOrder } = organizeConfigsByEval();
        
        const reversedEvalGroups = [...evalGroupOrder].reverse();
        
        return (
            <>
                {reversedEvalGroups.map(evalGroup => {
                    const evalGroupData = organizedConfigs[evalGroup];
                    const evalGroupTitle = formatEvalGroupTitle(evalGroup);
                    
                    return (
                        <Card key={evalGroup} className="mb-4 border-0 shadow">
                            <Card.Header as="h5" style={{ backgroundColor: HEADER_COLOR, color: 'white' }}>
                                {evalGroupTitle}
                            </Card.Header>
                            <Card.Body className="bg-light">
                                {Object.entries(evalGroupData).map(([author, configs]) => {
                                    const authorTitle = author.charAt(0).toUpperCase() + author.slice(1);
                                    
                                    return (
                                        <div key={`${evalGroup}-${author}`}>
                                            <h5 className="subheader">{authorTitle}</h5>
                                            <Row xs={1} md={2} lg={3} className="g-4">
                                                {configs.map(({ name, config }) => (
                                                    <Col key={name}>
                                                        <Button
                                                            variant="outline-primary"
                                                            onClick={() => handleConfigSelect(name)}
                                                            className="w-100 text-start text-truncate custom-btn"
                                                        >
                                                            {getConfigLabel(name, config)}
                                                        </Button>
                                                    </Col>
                                                ))}
                                            </Row>
                                        </div>
                                    );
                                })}
                            </Card.Body>
                        </Card>
                    );
                })}
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
                        <Survey model={selectedConfig} />
                    </div>
                </>
            )}
        </div>
    );
}

export default ReviewTextBasedPage;