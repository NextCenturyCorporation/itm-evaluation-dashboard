import React, { useState } from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';

const MedicalScenario = () => {
  const [selectedPatient, setSelectedPatient] = useState(null);

  const handlePatientSelection = (patient) => {
    setSelectedPatient(patient);
  };

  return (
    <Container>
      <Row className="my-3">
        <Col>
          <Card className="text-center py-2">
            <Card.Body>
              <Card.Title>Scenario</Card.Title>
              <Card.Text>
                You are the only medic on the scene after there was some kind of shooting between civilians.
                The local civilian hospital does not have significant surgical capabilities.
              </Card.Text>
              <Card.Text>
                You do not have time to treat both patients, and both are likely to die without treatment.
                The civilian in black clothes has injuries that are definitely treatable, but the other civilian
                may die even if treated, due to the limited capabilities of the local hospital.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row className="my-3">
        <Col md={3}>
          <Card className="py-3" style={{ backgroundColor: '#6c757d' }}>
            <Card.Body>
              <Card.Title className="text-white">Supplies</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col md={9}>
          <Row>
            <Col md={6}>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>Patient A</Card.Title>
                  <Card.Text>Picture</Card.Text>
                  <Card.Text>Vitals</Card.Text>
                  <Card.Text>Say all the things here about the injury. And make it clear and big.</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>Patient B</Card.Title>
                  <Card.Text>Picture</Card.Text>
                  <Card.Text>Vitals</Card.Text>
                  <Card.Text>More things about injuries.</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
      <Row className="my-3">
        <Col>
          <Card>
            <Card.Body>
              <Card.Text>Which patient would you transport?</Card.Text>
              <Button variant="primary" onClick={() => handlePatientSelection('Patient 1')}>Patient 1, the shooter</Button>
              <Button variant="secondary" className="ml-2" onClick={() => handlePatientSelection('Patient 2')}>Patient 2, the victim</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {selectedPatient && (
        <Row className="my-3">
          <Col>
            <Card>
              <Card.Body>
                <Card.Text className="font-weight-bold">You selected: {selectedPatient}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default MedicalScenario;
