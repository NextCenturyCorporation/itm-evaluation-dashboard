import React from 'react';
import { Card, ListGroup, Badge } from 'react-bootstrap';

const Supplies = ({ supplies }) => {
  console.log(supplies)
  return (
    <Card className="border-0 shadow-sm mb-4">
      <Card.Body>
        <Card.Title className="mb-3">Supplies</Card.Title>
        <ListGroup variant="flush">
          {supplies
            .filter(supply => !('quantity' in supply) || supply.quantity > 0)
            .map((supply, index) => (
              <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center py-2">
                <span style={{ fontSize: '1rem' }}>
                  {supply.type}
                </span>
                {supply.quantity &&
                  <Badge bg="primary" pill style={{ fontSize: '0.9rem', marginLeft: '10px' }}>
                    {supply.quantity} {supply.reusable ? "(Reusable)" : ""}
                  </Badge>
                }
              </ListGroup.Item>
            ))}
        </ListGroup>
      </Card.Body>
    </Card>
  );
};



export default Supplies;