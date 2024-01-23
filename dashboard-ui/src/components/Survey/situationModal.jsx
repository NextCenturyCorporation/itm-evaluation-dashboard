import React from 'react';
import { Modal } from 'react-bootstrap';
const SituationModal = ({ show, situation, handleClose }) => (
    <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
            <Modal.Title>Situation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            {situation.map((detail, index) => (
                <p key={index}>{detail}</p>
            ))}
        
        </Modal.Body>
    </Modal>
);

export default SituationModal;