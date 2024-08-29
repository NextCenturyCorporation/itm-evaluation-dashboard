import React, { useState } from 'react';
import { Accordion, Card, Row, Col, Button, ListGroup, Modal } from "react-bootstrap";
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ZoomInIcon from '@material-ui/icons/ZoomIn';
import SituationModal from "./situationModal";
import VitalsDropdown from "./vitalsDropdown";
import './template.css';
import { renderSituation } from './util';
import { isDefined } from '../AggregateResults/DataFunctions';

const Dynamic = ({ patients, situation, supplies, decision, dmName, actions, scenes, explanation, showModal, updateActionLogs }) => {
    const [visiblePatients, setVisiblePatients] = useState({});
    const [showPatientModal, setShowPatientModal] = useState(false);
    const [activeImage, setActiveImage] = useState(null);
    const [activeTitle, setActiveTitle] = useState('');
    const [activeDescription, setActiveDescription] = useState('');
    const [showSituationModal, setShowSituationModal] = useState(showModal);
    const [actionLogs, setActionLogs] = useState([]);

    // log actions
    const logAction = (actionName) => {
        const newLog = { dmName, actionName, timestamp: new Date().toISOString() };
        const updatedLogs = [...actionLogs, newLog];
        if (updateActionLogs) {
            updateActionLogs(newLog);
        }
        setActionLogs(updatedLogs);
    };

    const togglePatientVisibility = (patientName) => {
        setVisiblePatients(prev => ({
            ...prev,
            [patientName]: !prev[patientName]
        }));
        logAction(`Toggle patient visibility: ${patientName}`);
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
    const handleAccordionSelect = (eventKey) => {
        logAction(`Accordion toggle: ${eventKey !== null ? "expanded" : "collapsed"} Medic Actions`);
    };


    function Scene({ sceneId, sceneSupplies, sceneActions, sceneCharacters }) {
        const patientButtons = patients.map(patient => (
            <>{
                sceneCharacters.includes(patient.name) &&
                < Button
                    key={patient.name}
                    variant={visiblePatients[patient.name] ? "primary" : "secondary"}
                    onClick={() => togglePatientVisibility(patient.name)}
                    className="me-1"
                >
                    {patient.name} {visiblePatients[patient.name] && <CheckCircleIcon />}
                </Button >
            }</>
        ));

        const patientCards = patients.map(patient => {
            if (visiblePatients[patient.name] && sceneCharacters.includes(patient.name)) {
                return (
                    <Card key={patient.name} className="patient-card" style={{ display: 'inline-block' }}>
                        <Card.Header>
                            <div>{patient.name} <Card.Text>{patient.description}</Card.Text></div>
                        </Card.Header>
                        <Row className="g-0">
                            <Col md={8} className="mr-4">
                                <div style={{ position: 'relative' }}>
                                    <img src={`data:image/jpeg;base64,${patient.imgUrl}`} alt={patient.name} className="patient-image" />
                                    <ZoomInIcon className="magnifying-glass" onClick={() => toggleImageModal(patient.imgUrl, patient.name, patient.description)} />
                                </div>
                            </Col>
                            <Col md={4}>
                                <VitalsDropdown vitals={patient.vitals} logAction={logAction} patientName={patient.name} />
                            </Col>
                        </Row>
                    </Card>
                );
            } else {
                return null;
            }
        });
        return (
            <Accordion className='sceneAccordion' defaultActiveKey="0">
                <Accordion.Item eventKey="0">
                    <Accordion.Header><strong>{sceneId}</strong></Accordion.Header>
                    <Accordion.Body className='scene'>
                        <Col md={3}>
                            <Card>
                                <Card.Header>Constraints / Resources</Card.Header>
                                <Card.Body className='overflow-auto' style={{ maxHeight: '200px' }}>
                                    {sceneSupplies && sceneSupplies.map((supply, index) => (
                                        <>
                                            {!isDefined(supply.quantity) || (isDefined(supply.quantity) && supply.quantity > 0) &&
                                                <Card.Text key={supply.type}>
                                                    {supply.quantity ? supply.quantity : ""} {supply.type}
                                                </Card.Text>}
                                        </>
                                    ))}
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={9} style={{ 'marginLeft': '12px' }}>
                            <Accordion onSelect={handleAccordionSelect} defaultActiveKey="0">
                                <Accordion.Item eventKey="0">
                                    <Accordion.Header><strong>Medic Actions</strong></Accordion.Header>
                                    <Accordion.Body>
                                        <ListGroup>
                                            {sceneActions && sceneActions.map((action, index) => (
                                                <ListGroup.Item key={"action-" + index} style={{
                                                    "fontWeight": action.includes('Update:') || action.includes('Note:') || action.includes('Question:') ? "700" : "500",
                                                    "backgroundColor": action.includes('Update:') || action.includes('Note:') || action.includes('Question:') ? "#eee" : "#fff"
                                                }}>{action}</ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    </Accordion.Body>
                                </Accordion.Item>
                            </Accordion>

                            <div style={{ marginBottom: '10px', marginTop: '10px' }}>
                                {patientButtons}
                            </div>
                            <div className="card-container">
                                {patientCards}
                            </div>
                        </Col>
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>);
    };

    return (
        <div>
            {showSituationModal &&
                <SituationModal
                    show={showSituationModal}
                    handleClose={handleCloseSituationModal}
                    situation={situation} />
            }
            <Card className="mb-3">
                <Card.Header>Situation <ZoomInIcon className="magnifying-glass-icon" onClick={handleShowSituationModal} /></Card.Header>
                <Card.Body className='overflow-auto' style={{ maxHeight: '200px' }}>
                    {renderSituation(situation)}
                </Card.Body>
            </Card>
            {isDefined(scenes) ?
                scenes.map((scene) => {
                    return <Scene key={scene.id} sceneId={scene.id} sceneActions={scene.actions} sceneSupplies={scene.supplies} sceneCharacters={scene.char_ids} />
                })
                : <Scene sceneId='Scene 1' sceneActions={actions} sceneSupplies={supplies} sceneCharacters={patients.map((p) => p.name)} />}

            <Modal show={showPatientModal} onHide={() => toggleImageModal("", activeTitle, "")}>
                <Modal.Header closeButton>
                    <Modal.Title>{activeTitle}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {activeDescription}
                    <img src={`data:image/jpeg;base64,${activeImage}`} alt="Enlarged view" style={{ width: '100%' }} />
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default Dynamic;

