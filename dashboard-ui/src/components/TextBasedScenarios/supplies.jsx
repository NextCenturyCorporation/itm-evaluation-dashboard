import React from 'react';
import { Card, Badge } from 'react-bootstrap';

const Supplies = ({ supplies }) => {
  return (
    <Card className="mb-3 supplies-card border border-light shadow-sm">
      <Card.Header className="bg-light border">
        <h5 className="text-center mb-0">Supplies</h5>
      </Card.Header>
      <Card.Body className="py-3">
        <div className="d-flex flex-wrap gap-2 justify-content-center">
          {supplies
            .filter(supply => !('quantity' in supply) || supply.quantity > 0)
            .map((supply, index) => (
              <div 
                key={index} 
                className="d-flex align-items-center supply-item rounded py-2 px-3"
                style={{
                  border: '1px solid #dee2e6',
                  backgroundColor: '#f8f9fa'
                }}
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