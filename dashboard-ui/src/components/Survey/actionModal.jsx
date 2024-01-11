import React from 'react';
import { Modal } from 'react-bootstrap';
const ActionModal = ({ show, title, body, handleClose }) => (
    <Modal show={show} onHide={handleClose} size="lg" style={{ maxWidth: "100%" }}>
        <Modal.Header closeButton>
            <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body
            style={{ maxHeight: 'calc(100vh - 210px)', overflowY: 'auto' }}
            dangerouslySetInnerHTML={{ __html: body }} />
    </Modal>
);

export default ActionModal;