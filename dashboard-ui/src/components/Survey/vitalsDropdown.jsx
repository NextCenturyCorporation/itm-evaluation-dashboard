import React, { useState } from 'react';
import { ListGroup } from 'react-bootstrap';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import './template.css';

const VitalsDropdown = ({ vitals }) => {
    const [visible, setVisible] = useState(false);

    const toggleVisibility = () => {
        setVisible(!visible);
    };

    return (
        <ListGroup className="ms-1 vitals-list-group">
            <ListGroup.Item action variant="light" onClick={toggleVisibility}>
                <strong>
                Vitals
                </strong>
                {visible ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </ListGroup.Item>

            {visible && (
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
