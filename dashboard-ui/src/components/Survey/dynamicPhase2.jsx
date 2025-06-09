import React from 'react';
import { Table, Container, Row, Col } from 'react-bootstrap';
import '../../css/dynamicPhase2.css';

const DynamicPhase2 = ({ rows, scenarioDescription, supplies, options }) => {
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
                    Consider a decision-maker who made the highlighted choices. 
                </h4>
                <p className="instruction-subtitle">
                    {scenarioDescription}
                </p>
            </div>
        );
    };

    const isChoiceSelected = (rowChoice, optionIndex, options) => {
        return rowChoice === options[optionIndex];
    };

    return (
        <Container className="py-4" style={{ maxWidth: '1200px', width: '100%' }}>
            {renderInstructions()}
            {renderSupplies()}

            <Table className="table-borderless decision-table">
                <thead>
                    <tr>
                        <th className="table-header table-header-number"></th>
                        <th className='table-header table-header-description'></th>
                        <th className="table-header table-header-patient">Choice A</th>
                        <th className="table-header table-header-patient">Choice B</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => {
                        const isChoiceASelected = isChoiceSelected(row['choice'], 0, options);
                        const isChoiceBSelected = isChoiceSelected(row['choice'], 1, options);
                        
                        return (
                            <tr key={index} className="border-bottom">
                                <td className="row-number">
                                    {index + 1}
                                </td>
                                <td className={`patient-cell`}>{row['probe_unstructured']}</td>
                                <td className={`patient-cell ${isChoiceASelected ? 'patient-cell-selected' : 'patient-cell-default'}`}>
                                    <div className="badge-container">
                                        {isChoiceASelected ? (
                                            <div className="selected-badge">
                                                ✓ SELECTED
                                            </div>
                                        ) : (
                                            <div className="badge-spacer"></div>
                                        )}
                                    </div>
                                    <div className="patient-description">
                                        {options[0]}
                                    </div>
                                </td>
                                <td className={`patient-cell ${isChoiceBSelected ? 'patient-cell-selected' : 'patient-cell-default'}`}>
                                    <div className="badge-container">
                                        {isChoiceBSelected ? (
                                            <div className="selected-badge">
                                                ✓ SELECTED
                                            </div>
                                        ) : (
                                            <div className="badge-spacer"></div>
                                        )}
                                    </div>
                                    <div className="patient-description">
                                        {options[1]}
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