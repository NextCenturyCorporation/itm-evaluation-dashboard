import React from 'react';
import { Modal, Row, Col, Card, ListGroup } from 'react-bootstrap';
import { FaInfoCircle, FaBook, FaMedkit, FaClipboardList, FaMapMarkedAlt } from 'react-icons/fa';

const MoreDetailsModal = ({ show, onHide, mission }) => {
  const renderMedicalPolicies = () => {
    if (!mission.medical_policies) return null;

    if (typeof mission.medical_policies === 'string') {
      return (
        <ListGroup.Item className="border-0 ps-0">
          <FaClipboardList className="me-2 text-muted" />
          {mission.medical_policies}
        </ListGroup.Item>
      );
    }

    if (Array.isArray(mission.medical_policies)) {
      return mission.medical_policies.map((policy, index) => (
        <ListGroup.Item key={index} className="border-0 ps-0">
          <FaClipboardList className="me-2 text-muted" />
          {policy}
        </ListGroup.Item>
      ));
    }

    return null;
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      className="scenario-info-modal"
    >
      <Modal.Header closeButton className="border-0 bg-primary text-white">
        <Modal.Title>
          <FaInfoCircle className="me-2" />
          Additional Mission Information
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        {mission ? (
          <Row>
            {mission.roe && (
              <Col md={12} className="mb-4">
                <Card className="border-0 shadow-sm h-100 info-card">
                  <Card.Body>
                    <h5 className="card-title">
                      <FaBook className="me-2 text-primary" />
                      Rules of Engagement
                    </h5>
                    <p className="card-text">{mission.roe}</p>
                  </Card.Body>
                </Card>
              </Col>
            )}
            {mission.medical_policies && (
              <Col md={6} className="mb-4">
                <Card className="border-0 shadow-sm h-100 info-card">
                  <Card.Body>
                    <h5 className="card-title">
                      <FaMedkit className="me-2 text-danger" />
                      Medical Policies
                    </h5>
                    <ListGroup variant="flush">
                      {renderMedicalPolicies()}
                    </ListGroup>
                  </Card.Body>
                </Card>
              </Col>
            )}
            {mission.unstructured && (
              <Col md={mission.medical_policies ? 6 : 12} className="mb-4">
                <Card className="border-0 shadow-sm h-100 info-card">
                  <Card.Body>
                    <h5 className="card-title">
                      <FaMapMarkedAlt className="me-2 text-success" />
                      Mission Details
                    </h5>
                    <p className="card-text">{mission.unstructured}</p>
                  </Card.Body>
                </Card>
              </Col>
            )}
          </Row>
        ) : (
          <p className="text-center text-muted">No additional mission information available.</p>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default MoreDetailsModal;