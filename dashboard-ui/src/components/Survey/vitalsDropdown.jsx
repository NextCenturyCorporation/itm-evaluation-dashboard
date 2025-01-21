import React from 'react';
import { ListGroup } from 'react-bootstrap';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import '../../css/template.css';

const VitalsDropdown = ({ vitals, patientName, isVisible, toggleVisibility }) => {
    return (
        <ListGroup className="ms-1 vitals-list-group">
            <ListGroup.Item action variant="light" onClick={toggleVisibility}>
                <strong>
                Vitals
                </strong>
                {isVisible ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </ListGroup.Item>

            {isVisible && (
                vitals.map((vital, index) => (
                    <ListGroup.Item key={index}>
                        <strong>{vital.name}:</strong> {vital.value}
                    </ListGroup.Item>
                ))
            )}
        </ListGroup>
    );
};

export default VitalsDropdown;