import React from 'react';
import { Table, Container } from 'react-bootstrap';
import '../../css/dynamicPhase2.css';

const DynamicPhase2 = ({ rows }) => {
    return (
        <Container className="py-4" style={{maxWidth: '1200px', width: '100%'}}>
            <div className="instruction-section">
                <h4 className="instruction-title">
                    Consider a decision maker who chose to treat the highlighted patients first, when given the following choices.
                </h4>
                <p className="instruction-subtitle">
                    Imagine that you are deployed as a military medic in a foreign country. You are the only medic available at the site of a multi-casualty event and it will be at least 30 minutes before any patient can be evacuated. Which patient do you treat first?
                </p>
            </div>
            
            <Table className="table-borderless decision-table">
                <thead>
                    <tr>
                        <th className="table-header table-header-number"></th>
                        <th className="table-header table-header-patient">Patient A</th>
                        <th className="table-header table-header-patient">Patient B</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => (
                        <tr key={index} className="border-bottom">
                            <td className="row-number">
                                {index + 1}
                            </td>
                            <td className={`patient-cell ${row['choice'] === 'Patient A' ? 'patient-cell-selected' : 'patient-cell-default'}`}>
                                {row['choice'] === 'Patient A' && (
                                    <div className="selected-badge">
                                        ✓ SELECTED
                                    </div>
                                )}
                                <div className="patient-description">
                                    {row['Patient A']}
                                </div>
                            </td>
                            <td className={`patient-cell ${row['choice'] === 'Patient B' ? 'patient-cell-selected' : 'patient-cell-default'}`}>
                                {row['choice'] === 'Patient B' && (
                                    <div className="selected-badge">
                                        ✓ SELECTED
                                    </div>
                                )}
                                <div className="patient-description">
                                    {row['Patient B']}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </Container>
    );
};

export default DynamicPhase2;