import React from 'react';
import { Table, Container, Row, Col } from 'react-bootstrap';
import '../../css/dynamicPhase2.css';

const DynamicPhase2 = ({ rows, scenarioDescription, supplies }) => {
    const renderSupplies = () => {
        if (!supplies || supplies.length === 0) return null;

        return (
            <div className="supplies-section">
                <h5 className="supplies-title">Supplies</h5>
                <div className="supplies-grid">
                    {supplies.map((supply, index) => (
                        <div key={index} className="supply-item">
                            <span className="supply-name">{supply.type}</span>
                            <span className="supply-quantity">Qty: {supply.quantity}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderInstructions = () => {
        if (!scenarioDescription) return null;

        return (
            <div className="instruction-section">
                <h4 className="instruction-title">
                    Consider a decision maker who chose to treat the highlighted patients first, when given the following choices.
                </h4>
                <p className="instruction-subtitle">
                    {scenarioDescription}
                </p>
            </div>
        );
    };

    return (
        <Container className="py-4" style={{ maxWidth: '1200px', width: '100%' }}>
            {renderInstructions()}
            {renderSupplies()}

            <Table className="table-borderless decision-table">
                <thead>
                    <tr>
                        <th className="table-header table-header-number"></th>
                        <th className="table-header table-header-patient">Choice A</th>
                        <th className="table-header table-header-patient">Choice B</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => (
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
                                    {row['Patient A']}
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