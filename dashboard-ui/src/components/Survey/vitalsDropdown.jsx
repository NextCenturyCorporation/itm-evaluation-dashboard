import React from 'react';
import { ListGroup } from 'react-bootstrap';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import '../../css/template.css';

const VitalsDropdown = ({ vitals, patientName, isVisible, toggleVisibility }) => {
    return (
        <ListGroup className="vitals-list-group" style={{ borderRadius: 0 }}>
            <ListGroup.Item 
                action 
                variant="light" 
                onClick={toggleVisibility}
                style={{ borderRadius: 0 }}
            >
                <strong>
                Vitals
                </strong>
                {isVisible ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </ListGroup.Item>

            {isVisible && (
                vitals.map((vital, index) => (
                    <ListGroup.Item key={index} style={{ borderRadius: 0 }}>
                        <strong>{vital.name}:</strong> {vital.value}
                    </ListGroup.Item>
                ))
            )}
        </ListGroup>
    );
};

export default VitalsDropdown;