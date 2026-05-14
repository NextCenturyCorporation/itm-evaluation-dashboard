import React from 'react';
import { Table, Container } from 'react-bootstrap';
import '../../css/dynamicPhase2.css';

const trailingTextMap = {
    'You are currently in a location with cover. Do you move to treat the casualty now, or wait in your current location?':
        'You are currently in a location with cover. Do you move to treat the casualty now, or wait in your current location?',
    'Which patient do you treat?':
        'There are two patients, Patient A and Patient B, and you only have time to treat one of them. Which patient do you treat?',
    'Do you stay with your current patient, or do you leave?':
        'You arrive at the scene where you know there may be multiple casualties. Do you stay with your current patient, or do you leave?',
};

const TARGET_PROMPT = 'You are currently in a location with cover. Do you move to treat the casualty now, or wait in your current location?';
const WARFIGHTER_TEXT = 'They are a warfighter in the same military unit as you.';

const transformRowText = (text, groupPrompt) => {
    if (groupPrompt === TARGET_PROMPT) {
        return text
            .replace(WARFIGHTER_TEXT, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    return text;
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

    // grid stays consistent whether scenarios have 2 or 3 choices.
    const maxChoices = orderedRows.reduce((max, row) => {
        const rowOptions = row.options || options || [];
        return Math.max(max, rowOptions.length);
    }, 2);

    //row number + description + choice columns
    const totalColumns = 2 + maxChoices;

    const choiceLabels = Array.from({ length: maxChoices }, (_, i) =>
        `Choice ${String.fromCharCode(65 + i)}`
    );

    const isNewGroup = (index) => {
        if (index === 0) return true;
        const currentOptions = JSON.stringify(orderedRows[index].options || options);
        const prevOptions = JSON.stringify(orderedRows[index - 1].options || options);
        return currentOptions !== prevOptions;
    };

    const scenarioStripTexts = [
        'There are two patients, Patient A and Patient B, and you only have time to treat one of them.',
    ];

    const renderInstructions = () => {
        if (!scenarioDescription) return null;

        let cleanedDescription = scenarioDescription;
        for (const text of scenarioStripTexts) {
            cleanedDescription = cleanedDescription.replace(text, '').trim();
        }

        return (
            <div className="instruction-section">
                <h4 className="instruction-title">
                    Consider a decision-maker who made the highlighted choices in a series of scenarios.
                </h4>
                {cleanedDescription && (
                    <p className="instruction-subtitle">
                        {cleanedDescription}
                    </p>
                )}
            </div>
        );
    };

    const isChoiceSelected = (rowChoice, optionIndex, opts) => {
        return rowChoice === opts[optionIndex];
    };

    const numberColumnWidth = 4;
    const descriptionColumnWidth = maxChoices === 2 ? 56 : 40;
    const choiceColumnWidth = (100 - numberColumnWidth - descriptionColumnWidth) / maxChoices;

    return (
        <Container className="py-4" style={{ maxWidth: '1200px', width: '100%' }}>
            {renderInstructions()}

            <Table className="table-borderless decision-table">
                <thead>
                    <tr>
                        <th className="table-header table-header-number" style={{ width: `${numberColumnWidth}%` }}></th>
                        <th className='table-header table-header-description' style={{ width: `${descriptionColumnWidth}%` }}></th>
                        {choiceLabels.map((label, i) => (
                            <th key={i} className="table-header table-header-patient" style={{ width: `${choiceColumnWidth}%` }}>
                                {label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {orderedRows.map((row, index) => {
                        const optionsToUse = row.options || options;
                        const showGroupHeader = isNewGroup(index);
                        const groupPrompt = row.trailingKey ? trailingTextMap[row.trailingKey] : null;
                        const cleanedRowText = transformRowText(row.strippedDescription, groupPrompt);

                        // fewer choices than the table's max (keeps grid aligned).
                        const fillerCount = maxChoices - optionsToUse.length;

                        return (
                            <React.Fragment key={index}>
                                {showGroupHeader && index !== 0 && (
                                    <tr className="group-divider-row">
                                        <td colSpan={totalColumns}>
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
                                        <td colSpan={totalColumns}>
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
                                    <td className="patient-cell">{cleanedRowText}</td>
                                    {optionsToUse.map((optionText, optionIndex) => {
                                        const selected = isChoiceSelected(row['choice'], optionIndex, optionsToUse);
                                        return (
                                            <td
                                                key={optionIndex}
                                                className={`patient-cell ${selected ? 'patient-cell-selected' : 'patient-cell-default'}`}
                                            >
                                                <div className="badge-container">
                                                    {selected ? (
                                                        <div className="selected-badge">
                                                            ✓ SELECTED
                                                        </div>
                                                    ) : (
                                                        <div className="badge-spacer"></div>
                                                    )}
                                                </div>
                                                <div className="patient-description">
                                                    {optionText}
                                                </div>
                                            </td>
                                        );
                                    })}
                                    {/* Filler cells for rows with fewer choices than the table max,
                                        keeps the table grid aligned across mixed-choice-count groups */}
                                    {Array.from({ length: fillerCount }).map((_, i) => (
                                        <td key={`filler-${i}`} className="patient-cell patient-cell-filler" />
                                    ))}
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