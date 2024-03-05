import React, { useState } from 'react';
import { Accordion, Card, Row, Col, Button, ListGroup, Modal } from "react-bootstrap";
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ZoomInIcon from '@material-ui/icons/ZoomIn';
import SituationModal from "./situationModal";
import VitalsDropdown from "./vitalsDropdown";
import './template.css';

const Dynamic = ({ patients, situation, supplies, decision, dmName, actions, explanation, showModal, updateActionLogs }) => {
    const [visiblePatients, setVisiblePatients] = useState({});
    const [showPatientModal, setShowPatientModal] = useState(false);
    const [activeImage, setActiveImage] = useState(null);
    const [activeTitle, setActiveTitle] = useState('');
    const [activeDescription, setActiveDescription] = useState('');
    const [showSituationModal, setShowSituationModal] = useState(showModal);
    const [actionLogs, setActionLogs] = useState([]);

    // log actions
    const logAction = (actionName) => {
        const newLog = { actionName, timestamp: new Date().toString() };
        const updatedLogs = [...actionLogs, newLog];
        if (updateActionLogs) {
            updateActionLogs(updatedLogs);
        }
        setActionLogs(updatedLogs);
    };

    const handleAccordionSelect = (eventKey) => {
        logAction(`Accordion toggle: ${eventKey !== null ? "expanded" : "collapsed"} Medic Actions`);
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

    const patientButtons = patients.map(patient => (
        <Button
            key={patient.name}
            variant={visiblePatients[patient.name] ? "primary" : "secondary"}
            onClick={() => togglePatientVisibility(patient.name)}
            className="me-1"
        >
            {patient.name} {visiblePatients[patient.name] && <CheckCircleIcon />}
        </Button>
    ));

    const patientCards = patients.map(patient => {
        if (visiblePatients[patient.name]) {
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
                            <VitalsDropdown vitals={patient.vitals} />
                        </Col>
                    </Row>
                </Card>
            );
        } else {
            return null;
        }
    });


    return (
        <div>
            {showSituationModal &&
                <SituationModal
                    show={showSituationModal}
                    handleClose={handleCloseSituationModal}
                    situation={situation} />
            }
            <Row>
                <Col md={2}>
                    <Card className="mb-3">
                        <Card.Header>Situation <ZoomInIcon className="magnifying-glass-icon" onClick={handleShowSituationModal} /></Card.Header>
                        <Card.Body>
                            {situation.map((detail, index) => (
                                <Card.Text key={"detail-" + index}>{detail}</Card.Text>
                            ))}
                        </Card.Body>
                    </Card>
                    <Card>
                        <Card.Header>Constraints / Resources</Card.Header>
                        <Card.Body>
                            {supplies.map((supplies, index) => (
                                <Card.Text key={supplies.type}>
                                    {supplies.quantity ? supplies.quantity : ""} {supplies.type}
                                </Card.Text>
                            ))}
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={10}>
                    <Card className="mb-3">
                        <Card.Header>Actions</Card.Header>
                        <Card.Body>
                            <Accordion onSelect={handleAccordionSelect} defaultActiveKey="0">
                                <Accordion.Item eventKey="0">
                                    <Accordion.Header><strong>Medic Actions</strong></Accordion.Header>
                                    <Accordion.Body>
                                        <ListGroup>
                                            {actions.map((action, index) => (
                                                <ListGroup.Item key={"action-" + index}>{action}</ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                        <div className="my-2"><strong>Explanation:</strong> {explanation}</div>
                                    </Accordion.Body>
                                </Accordion.Item>
                            </Accordion>
                        </Card.Body>
                    </Card>
                    <div style={{ marginBottom: '10px' }}>
                        {patientButtons}
                    </div>
                    <div className="card-container">
                        {patientCards}
                    </div>
                </Col>
            </Row>
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
