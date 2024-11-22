import React from 'react';
import { Modal } from 'react-bootstrap';
import { renderSituation } from './surveyUtils';
const SituationModal = ({ show, situation, handleClose }) => (
    <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
            <Modal.Title>Situation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            {renderSituation(situation)}
        </Modal.Body>
    </Modal>
);

export default SituationModal;