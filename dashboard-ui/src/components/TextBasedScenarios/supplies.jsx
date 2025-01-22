import React from 'react';
import { Card, Badge } from 'react-bootstrap';

const Supplies = ({ supplies }) => {
  return (
    <Card className="border-0 shadow-sm mb-4">
      <Card.Body>
        <Card.Title className="mb-3">Supplies</Card.Title>
        <div className="d-flex flex-wrap gap-3 justify-content-center">
          {supplies
            .filter(supply => !('quantity' in supply) || supply.quantity > 0)
            .map((supply, index) => (
              <div 
                key={index} 
                className="d-flex align-items-center bg-light rounded px-3 py-2"
              >
                <span style={{ fontSize: '1rem' }}>
                  {supply.type}
                </span>
                {supply.quantity && (
                  <Badge 
                    bg="primary" 
                    pill 
                    className="ms-2"
                    style={{ fontSize: '0.9rem' }}
                  >
                    {supply.quantity} {supply.reusable ? "(Reusable)" : ""}
                  </Badge>
                )}
              </div>
            ))}
        </div>
      </Card.Body>
    </Card>
  );
};

export default Supplies;