import React from 'react';
import { Table, Container } from 'react-bootstrap';
import '../../css/dynamicPhase2.css';

const trailingTextMap = {
    'You are currently in a location with cover. Do you move to treat the casualty now, or wait in your current location?':
        'You are currently in a location with cover. Do you move to treat the casualty now, or wait in your current location?',
    'Which patient do you treat?':
        'There are two patients, Patient A and Patient B, and you only have time to treat one of them. Which patient do you treat?',
    'Do you stay with your current patient, or do you leave?':
        'Do you stay with your current patient, or do you leave?',
};

const DynamicPhase2 = ({ rows, scenarioDescription, supplies, options }) => {

    const stripTrailingText = (text) => {
        for (const key of Object.keys(trailingTextMap)) {
            if (text.endsWith(key)) {
                return {
                    description: text.slice(0, text.length - key.length).trim(),
                    trailingKey: key,
                };
            }
        }
        return { description: text, trailingKey: null };
    };

    const getOrderedRows = () => {
        const processedRows = rows.map((row) => {
            const { description, trailingKey } = stripTrailingText(row['probe_unstructured']);
            return {
                ...row,
                strippedDescription: description,
                trailingKey,
            };
        });

        const hasRowSpecificOptions = processedRows.some(row => row.options);

        if (!hasRowSpecificOptions) {
            return processedRows;
        }

        const grouped = {};
        processedRows.forEach((row) => {
            const rowOptions = row.options || options;
            const key = JSON.stringify(rowOptions);
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(row);
        });

        return Object.values(grouped).flat();
    };

    const orderedRows = getOrderedRows();

    const isNewGroup = (index) => {
        if (index === 0) return true;
        const currentOptions = JSON.stringify(orderedRows[index].options || options);
        const prevOptions = JSON.stringify(orderedRows[index - 1].options || options);
        return currentOptions !== prevOptions;
    };

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
                    Consider a decision-maker who made the highlighted choices in a series of scenarios.
                </h4>
                <p className="instruction-subtitle">
                    {scenarioDescription}
                </p>
            </div>
        );
    };

    const isChoiceSelected = (rowChoice, optionIndex, opts) => {
        return rowChoice === opts[optionIndex];
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
                    {orderedRows.map((row, index) => {
                        const optionsToUse = row.options || options;
                        const isChoiceASelected = isChoiceSelected(row['choice'], 0, optionsToUse);
                        const isChoiceBSelected = isChoiceSelected(row['choice'], 1, optionsToUse);
                        const showGroupHeader = isNewGroup(index);
                        const groupPrompt = row.trailingKey ? trailingTextMap[row.trailingKey] : null;

                        return (
                            <React.Fragment key={index}>
                                {showGroupHeader && index !== 0 && (
                                    <tr className="group-divider-row">
                                        <td colSpan={4}>
                                            <div className="group-divider">
                                                <div className="group-divider-line"></div>
                                                <div className="group-divider-dot"></div>
                                                <div className="group-divider-line"></div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {showGroupHeader && groupPrompt && (
                                    <tr className="group-prompt-row">
                                        <td colSpan={4}>
                                            <div className="group-prompt">
                                                <span className="group-prompt-text">{groupPrompt}</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                <tr className="border-bottom">
                                    <td className="row-number">
                                        {index + 1}
                                    </td>
                                    <td className="patient-cell">{row.strippedDescription}</td>
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
                                            {optionsToUse[0]}
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
                                            {optionsToUse[1]}
                                        </div>
                                    </td>
                                </tr>
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </Table>
        </Container>
    );
};

export default DynamicPhase2;