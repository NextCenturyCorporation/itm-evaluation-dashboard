import React from 'react';
import { Table, Container } from 'react-bootstrap';
import '../../css/dynamicPhase2.css';

const DynamicPhase2 = ({rows, scenarioDescription}) => {
    const parsePatientData = (text) => {
        const sentences = text.split(/\.\s+(?=[A-Z])|\.$/);
        
        const cleanSentences = sentences.filter(sentence => sentence.trim().length > 0);
        
        if (cleanSentences.length >= 2) {
            return {
                injury: cleanSentences[0].trim() + '.',
                role: cleanSentences[1].trim() + (cleanSentences[1].trim().endsWith('.') ? '' : '.')
            };
        } else {
            return {
                injury: text,
                role: ''
            };
        }
    };

    return (
        <Container className="py-4" style={{maxWidth: '1200px', width: '100%'}}>
            <div className="instruction-section">
                <h4 className="instruction-title">
                    Consider a decision maker who chose to treat the highlighted patients first, when given the following choices.
                </h4>
                <p className="instruction-subtitle">
                    {scenarioDescription}
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
                    {rows.map((row, index) => {
                        const patientAData = parsePatientData(row['Patient A']);
                        const patientBData = parsePatientData(row['Patient B']);
                        
                        return (
                            <tr key={index} className="border-bottom">
                                <td className="row-number">
                                    {index + 1}
                                </td>
                                <td className={`patient-cell ${row['choice'] === 'Patient A' ? 'patient-cell-selected' : 'patient-cell-default'}`}>
                                    <div className="badge-container">
                                        {row['choice'] === 'Patient A' ? (
                                            <div className="selected-badge">
                                                ✓ SELECTED
                                            </div>
                                        ) : (
                                            <div className="badge-spacer"></div>
                                        )}
                                    </div>
                                    <div className="patient-description">
                                        <div className="patient-info-section">
                                            <span className="info-label">Injury:</span>
                                            <span className="info-text">{patientAData.injury}</span>
                                        </div>
                                        {patientAData.role && (
                                            <div className="patient-info-section">
                                                <span className="info-label">Role:</span>
                                                <span className="info-text">{patientAData.role}</span>
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className={`patient-cell ${row['choice'] === 'Patient B' ? 'patient-cell-selected' : 'patient-cell-default'}`}>
                                    <div className="badge-container">
                                        {row['choice'] === 'Patient B' ? (
                                            <div className="selected-badge">
                                                ✓ SELECTED
                                            </div>
                                        ) : (
                                            <div className="badge-spacer"></div>
                                        )}
                                    </div>
                                    <div className="patient-description">
                                        <div className="patient-info-section">
                                            <span className="info-label">Injury:</span>
                                            <span className="info-text">{patientBData.injury}</span>
                                        </div>
                                        {patientBData.role && (
                                            <div className="patient-info-section">
                                                <span className="info-label">Role:</span>
                                                <span className="info-text">{patientBData.role}</span>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </Table>
        </Container>
    );
};

export default DynamicPhase2;