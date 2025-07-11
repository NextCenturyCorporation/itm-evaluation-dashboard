import React, { useState } from 'react';
import { Accordion, Card, Row, Col, Button, ListGroup, Modal } from "react-bootstrap";
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ZoomInIcon from '@material-ui/icons/ZoomIn';
import { FaInfoCircle } from 'react-icons/fa';
import SituationModal from "./situationModal";
import VitalsDropdown from "./vitalsDropdown";
import '../../css/template.css';
import { renderSituation } from './surveyUtils';
import { isDefined } from '../AggregateResults/DataFunctions';
import Patient from '../TextBasedScenarios/patient';
import Supplies from '../TextBasedScenarios/supplies';
import MoreDetailsModal from '../TextBasedScenarios/moreDetailsModal';
import { useSelector } from 'react-redux';

const Dynamic = ({ patients, situation, supplies, decision, dmName, actions, scenes, explanation, showModal, updateActionLogs, mission, scenarioIndex }) => {
    const [visiblePatients, setVisiblePatients] = useState(() => {
        const initialVisibility = {};
        patients.forEach(patient => {
            initialVisibility[patient.name] = true;
        });
        return initialVisibility;
    });
    const [visibleVitals, setVisibleVitals] = useState({});
    const [showPatientModal, setShowPatientModal] = useState(false);
    const [activeImage, setActiveImage] = useState(null);
    const [activeTitle, setActiveTitle] = useState('');
    const [activeDescription, setActiveDescription] = useState('');
    const [showSituationModal, setShowSituationModal] = useState(showModal);
    const [showMoreDetailsModal, setShowMoreDetailsModal] = useState(false);
    const [actionLogs, setActionLogs] = useState([]);
    
    const [openScenes, setOpenScenes] = useState(() => {
        const initialOpenScenes = {};
        if (scenes) {
            scenes.forEach(scene => {
                initialOpenScenes[scene.id] = true;
            });
        } else {
            initialOpenScenes['Scene 1'] = true;
        }
        return initialOpenScenes;
    });
    
    const [openMedicAccordions, setOpenMedicAccordions] = useState(() => {
        const initialOpenMedicAccordions = {};
        if (scenes) {
            scenes.forEach(scene => {
                initialOpenMedicAccordions[scene.id] = true;
            });
        } else {
            initialOpenMedicAccordions['Scene 1'] = true;
        }
        return initialOpenMedicAccordions;
    });
    
    const [openPatientAccordions, setOpenPatientAccordions] = useState(() => {
        const initialOpenPatientAccordions = {};
        if (scenes) {
            scenes.forEach(scene => {
                initialOpenPatientAccordions[scene.id] = true;
            });
        } else {
            initialOpenPatientAccordions['Scene 1'] = true;
        }
        return initialOpenPatientAccordions;
    });
    
    const textBasedConfigs = useSelector(state => state.configs.textBasedConfigs);
    const matchingScenario = textBasedConfigs[scenarioIndex];

    const getProbe = (action) => {
        if (!matchingScenario) { return null }
        const probeId = action['probe_id']

        for (const page of matchingScenario.pages) {
            for (const element of page.elements) {
                if (element.probe_id === probeId) {
                    return element
                }
            }
        }
        return null
    }

    const logAction = (actionName) => {
        const newLog = { dmName, actionName, timestamp: new Date().toISOString() };
        const updatedLogs = [...actionLogs, newLog];
        if (updateActionLogs) {
            updateActionLogs(newLog);
        }
        setActionLogs(updatedLogs);
    };

    const toggleSceneAccordion = (sceneId) => {
        setOpenScenes(prev => ({
            ...prev,
            [sceneId]: !prev[sceneId]
        }));
        logAction(`Toggle scene accordion: ${sceneId}`);
    };

    const toggleMedicAccordion = (sceneId) => {
        setOpenMedicAccordions(prev => ({
            ...prev,
            [sceneId]: !prev[sceneId]
        }));
        logAction(`Toggle medic actions accordion: ${sceneId}`);
    };

    const togglePatientAccordion = (sceneId) => {
        setOpenPatientAccordions(prev => ({
            ...prev,
            [sceneId]: !prev[sceneId]
        }));
        logAction(`Toggle patients accordion: ${sceneId}`);
    };

    const togglePatientVisibility = (patientName) => {
        setVisiblePatients(prev => ({
            ...prev,
            [patientName]: !prev[patientName]
        }));
        logAction(`Toggle patient visibility: ${patientName}`);
    };

    const toggleVitalsVisibility = (patientName) => {
        setVisibleVitals(prev => ({
            ...prev,
            [patientName]: !prev[patientName]
        }));
        logAction(`Toggle vitals visibility: ${patientName}`);
    };

    const toggleImageModal = (imgUrl, title, description) => {
        setActiveImage(imgUrl);
        setActiveTitle(title);
        setActiveDescription(description);
        setShowPatientModal(!showPatientModal);
        logAction(`Toggle image modal: ${title}`);
    };

    const handleCloseSituationModal = () => {
        setShowSituationModal(false)
        setTimeout(() => {
            window.scrollTo(0, 0);
        }, 5);
        logAction('Close situation modal');
    };

    const handleShowSituationModal = () => {
        setShowSituationModal(true);
        logAction('Show situation modal');
    };

    const handleShowMoreDetailsModal = () => {
        setShowMoreDetailsModal(true);
        logAction('Show more details modal');
    };

    const handleCloseMoreDetailsModal = () => {
        setShowMoreDetailsModal(false);
        logAction('Close more details modal');
    };

    const getActionText = (action) => {
        if (typeof action === 'string') return action;
        return action?.text || '';
    };

    const processActionText = (action, index, sceneActions) => {
        const probe = getProbe(action)
        const text = getActionText(action)
        let processedText = text.replace('Question:', 'The medic was asked:').replace('<HIGHLIGHT>', '');

        if (index > 0 && getActionText(sceneActions[index - 1])?.includes('Question:')) {
            processedText = 'The medic chose to: ' + processedText;
            if (processedText.includes(' on ') && processedText.includes('Treat')) {
                processedText = processedText.substring(0, processedText.indexOf(' on '));
            }
            if ((scenarioIndex.toLowerCase().includes('qol') || scenarioIndex.toLowerCase().includes('vol')) &&
                probe?.choices) {
                return (
                    <div>
                        <div className="mb-3">{processedText}</div>
                        <Card className="bg-light border-0">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-2">
                                    <small className="text-muted">What the medic could have done:</small>
                                </div>
                                <ListGroup variant="flush">
                                    {probe.choices.map((choice, idx) => (
                                        <ListGroup.Item
                                            key={idx}
                                            className="bg-light border-0 py-1 ps-3"
                                        >
                                            • {choice.text}
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            </Card.Body>
                        </Card>
                    </div>
                );
            }
        }
        return processedText;
    };

    /*
    const getSceneStyle = (action) => {
        const text = getActionText(action);
        const isMedicAction = !(text.includes('Update:') || text.includes('Note:') || text.includes('Question:'));
        return {
            "fontWeight": !isMedicAction ? "700" : "500",
            "backgroundColor": text.includes("<HIGHLIGHT>") ? "rgb(251 252 152)" : !isMedicAction ? "#eee" : "#fff",
            "fontSize": text.includes('Question:') ? '20px' : '16px'
        }
    }
    */

    function Scene({ sceneId, sceneSupplies, sceneActions, sceneCharacters, scenesLength }) {
        const isSceneOpen = openScenes[sceneId] === undefined ? true : openScenes[sceneId];
        const isMedicAccordionOpen = openMedicAccordions[sceneId] === undefined ? true : openMedicAccordions[sceneId];
        const isPatientAccordionOpen = openPatientAccordions[sceneId] === undefined ? true : openPatientAccordions[sceneId];

        const patientButtons = patients.map(patient => (
            sceneCharacters.includes(patient.name) && (
                <div className="patient-buttons" key={`button-${patient.name}`}>
                    <Button
                        variant={visiblePatients[patient.name] ? "primary" : "secondary"}
                        onClick={() => togglePatientVisibility(patient.name)}
                        className="me-1"
                    >
                        {patient.name} {visiblePatients[patient.name] && <CheckCircleIcon />}
                    </Button>
                </div>
            )
        ));

        const patientCards = patients.map(patient => {
            if (visiblePatients[patient.name] && sceneCharacters.includes(patient.name)) {
                return (
                    <Col md={6} key={`card-${patient.name}`}>
                        {patient.demographics ? (
                            <div className='patient-card'>
                                <Patient
                                    patient={patient}
                                    onImageClick={() => toggleImageModal(patient.imgUrl, patient.name, patient.description)}
                                    blockedVitals={[]}
                                />
                            </div>
                        ) : (
                            <Card className="patient-card" style={{ display: 'inline-block' }}>
                                <Card.Header>
                                    <div>{patient.name} <Card.Text>{patient.age && <><span>{patient.age} years old, {patient.sex === 'F' ? 'Female' : 'Male'}</span><br /></>}<span>{patient.description}</span></Card.Text></div>
                                </Card.Header>
                                <Row className="g-0">
                                    <Col md={8} className="mr-4">
                                        <div style={{ position: 'relative' }}>
                                            <img src={`data:image/jpeg;base64,${patient.imgUrl}`} alt={patient.name} className="patient-image" />
                                            <ZoomInIcon 
                                                className="magnifying-glass" 
                                                onClick={() => toggleImageModal(patient.imgUrl, patient.name, patient.description)} 
                                            />
                                        </div>
                                    </Col>
                                    <Col md={4}>
                                        <VitalsDropdown
                                            vitals={patient.vitals}
                                            patientName={patient.name}
                                            isVisible={visibleVitals[patient.name]}
                                            toggleVisibility={() => toggleVitalsVisibility(patient.name)}
                                        />
                                    </Col>
                                </Row>
                            </Card>
                        )}
                    </Col>
                );
            }
            return null;
        });

        const groupedActions = [];
        let currentGroup = [];
        // group action list by updates, makes it a little more readable
        if (sceneActions) {
            sceneActions.forEach((action, index) => {
                const text = getActionText(action);

                if (text.includes('Update:') && currentGroup.length > 0) {
                    groupedActions.push([...currentGroup]);
                    currentGroup = [action];
                } else {
                    currentGroup.push(action);
                }

                if (index === sceneActions.length - 1 && currentGroup.length > 0) {
                    groupedActions.push([...currentGroup]);
                }
            });
        }

        const sceneBody = <>
            <Row className="mb-4">
                <Col md={12}>
                    <Supplies supplies={sceneSupplies} />
                </Col>
            </Row>
            <Row>
                <Col md={12}>
                    <Accordion 
                        activeKey={isMedicAccordionOpen ? "1" : ""} 
                        className="medic-actions-accordion mb-3"
                    >
                        <Accordion.Item eventKey="1">
                            <Accordion.Header 
                                className="medic-actions-header"
                                onClick={() => toggleMedicAccordion(sceneId)}
                            >
                                <strong className="w-100 text-center" style={{ fontWeight: 'bold', fontSize: '16px' }}>Medic Actions</strong>
                            </Accordion.Header>
                            <Accordion.Body>
                                <div className="actions-container">
                                    {groupedActions.map((group, groupIndex) => (
                                        <div key={`group-${groupIndex}`} className="event-action-group mb-4">
                                            {group.map((action, index) => {
                                                const text = typeof action === 'string' ? action : action?.text || '';
                                                const isUpdate = text.includes('Update:') || text.includes('Note:');
                                                const isQuestion = text.includes('Question:');
                                                const isHighlight = text.includes('<HIGHLIGHT>');

                                                let actionClass = 'action-item';
                                                if (isUpdate) actionClass += ' update';
                                                else if (isQuestion) actionClass += ' question';
                                                else actionClass += ' choice';
                                                if (isHighlight) actionClass += ' highlight';

                                                return (
                                                    <div
                                                        key={`action-${groupIndex}-${index}`}
                                                        className={actionClass}
                                                    >
                                                        {processActionText(action, index, group)}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </Accordion.Body>
                        </Accordion.Item>
                    </Accordion>

                    <Accordion 
                        activeKey={isPatientAccordionOpen ? "1" : ""} 
                        className="mb-3"
                    >
                        <Accordion.Item eventKey="1">
                            <Accordion.Header
                                onClick={() => togglePatientAccordion(sceneId)}
                            >
                                <strong className="w-100 text-center" style={{ fontWeight: 'bold', fontSize: '16px' }}>Patients</strong>
                            </Accordion.Header>
                            <Accordion.Body className="border border-top-0 rounded-bottom">
                                <div className="mb-3 d-flex flex-wrap">
                                    {patientButtons}
                                </div>
                                <div className="card-container">
                                    <Row>
                                        {patientCards}
                                    </Row>
                                </div>
                            </Accordion.Body>
                        </Accordion.Item>
                    </Accordion>
                </Col>
            </Row>
        </>

        return (
            <>
                {scenesLength > 1 ? (
                    <Accordion 
                        className='sceneAccordion' 
                        activeKey={isSceneOpen ? "0" : ""}
                    >
                        <Accordion.Item eventKey="0">
                            <Accordion.Header onClick={() => toggleSceneAccordion(sceneId)}>
                                <strong>{sceneId}</strong>
                            </Accordion.Header>
                            <Accordion.Body className='scene'>
                                {sceneBody}
                            </Accordion.Body>
                        </Accordion.Item>
                    </Accordion>
                ) : (
                    <div className="scene">
                        {sceneBody}
                    </div>
                )}
            </>
        );
    }

    return (
        <div>
            {showSituationModal &&
                <SituationModal
                    show={showSituationModal}
                    handleClose={handleCloseSituationModal}
                    situation={situation} />
            }
            <Card className="mb-3">
                <Card.Header className="bg-light border">
                    <div className="d-flex justify-content-center align-items-center position-relative py-2">
                        <h5 className="mb-0 text-center" style={{ fontWeight: 'bold', fontSize: '16px' }}>
                            Situation
                            <ZoomInIcon
                                className="ms-2"
                                onClick={handleShowSituationModal}
                                style={{ cursor: 'pointer', verticalAlign: 'middle' }}
                            />
                        </h5>

                        {mission?.roe && mission.roe !== "" && (
                            <div
                                className="d-flex align-items-center position-absolute end-0 me-2"
                                style={{ cursor: 'pointer', top: '50%', transform: 'translateY(-50%)' }}
                                onClick={handleShowMoreDetailsModal}
                            >
                                <FaInfoCircle size={28} color="#17a2b8" />
                                <span className="ms-2 small text-muted d-none d-md-inline">Click For More Info</span>
                            </div>
                        )}
                    </div>
                </Card.Header>
                <Card.Body className="overflow-auto" style={{ maxHeight: '200px' }}>
                    {renderSituation(situation)}
                </Card.Body>
            </Card>
            {isDefined(scenes) ?
                scenes.map((scene) => (
                    <Scene
                        key={scene.id}
                        sceneId={scene.id}
                        sceneActions={scene.actions}
                        sceneSupplies={scene.supplies}
                        sceneCharacters={scene.char_ids}
                        scenesLength={scenes.length}
                    />
                ))
                : <Scene
                    sceneId='Scene 1'
                    sceneActions={actions}
                    sceneSupplies={supplies}
                    sceneCharacters={patients.map((p) => p.name)}
                    scenesLength={1}
                />
            }

            <Modal
                show={showPatientModal}
                onHide={() => toggleImageModal("", activeTitle, "")}
                size="xl"
                centered
                className="w-100 mw-100"
            >
                <Modal.Header closeButton>
                    <Modal.Title>{activeTitle}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-3">
                    <p>{activeDescription}</p>
                    <div className="d-flex justify-content-center align-items-center">
                        <img
                            src={`data:image/jpeg;base64,${activeImage}`}
                            alt="Enlarged view"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '70vh',
                                objectFit: 'contain'
                            }}
                        />
                    </div>
                </Modal.Body>
            </Modal>

            <MoreDetailsModal
                show={showMoreDetailsModal}
                onHide={handleCloseMoreDetailsModal}
                mission={mission}
            />
        </div>
    );
};

export default Dynamic;