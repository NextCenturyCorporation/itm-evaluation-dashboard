import React from 'react';
import { Card, Container, Row, Col, ListGroup } from 'react-bootstrap';

const NoSelection = () => (
  <Container className="mt-5">
    <Row className="justify-content-center">
      <Col md={10}>
        <Card>
        <Card.Header 
            as="h2" 
            className="text-center text-white" 
            style={{ backgroundColor: '#592610' }}
          >
            Text-Based Scenario Results
          </Card.Header>
          <Card.Body>
            <Card.Text>
              To view results, follow these steps:
            </Card.Text>
            <ListGroup variant="flush" as="ol" numbered>
              <ListGroup.Item as="li">Select an evaluation from the dropdown menu on the left.</ListGroup.Item>
              <ListGroup.Item as="li">Choose a scenario from the list that appears below the evaluation selector.</ListGroup.Item>
              <ListGroup.Item as="li">
                Use the toggle buttons at the top right to switch between different views:
                <ListGroup variant="flush" className="mt-2">
                  <ListGroup.Item><strong>Text:</strong> View results in a tabular format</ListGroup.Item>
                  <ListGroup.Item><strong>Charts:</strong> See graphical representations of the data</ListGroup.Item>
                  <ListGroup.Item><strong>Participants:</strong> Examine individual participant responses</ListGroup.Item>
                </ListGroup>
              </ListGroup.Item>
            </ListGroup>
            <Card.Text className="mt-3">
              If you need to export the data, a download button will be available in the Participants view.
            </Card.Text>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  </Container>
);

export default NoSelection;