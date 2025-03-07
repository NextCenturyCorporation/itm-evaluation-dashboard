import React from 'react';
import { Card, Badge } from 'react-bootstrap';

const Supplies = ({ supplies }) => {
  return (
    <Card className="border-0 shadow-sm mb-4 supplies-card">
      <Card.Header>
        <h5>Supplies</h5>
      </Card.Header>
      <Card.Body className="pt-3 pb-4">
        <div className="d-flex flex-wrap gap-3 justify-content-center">
          {supplies
            .filter(supply => !('quantity' in supply) || supply.quantity > 0)
            .map((supply, index) => (
              <div 
                key={index} 
                className="d-flex align-items-center supply-item rounded px-3 py-2"
              >
                <span className="supply-name">
                  {supply.type}
                </span>
                {supply.quantity && (
                  <Badge 
                    bg={supply.reusable ? "success" : "primary"}
                    pill 
                    className="ms-2 supply-badge"
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