import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/react-hooks';
import { Query } from 'react-apollo';
import gql from "graphql-tag";
import { List, ListItem, ListItemText } from '@mui/material';
import '../../css/results-page.css';
import '../../css/aggregateResults.css';

const get_eval_name_numbers = gql`
    query getEvalNameNumbers {
        getEvalNameNumbers
    }
`;

const scenario_names_aggregation = gql`
    query getScenarioNamesByEval($evalNumber: Float!) {
        getScenarioNamesByEval(evalNumber: $evalNumber)
    }
`;

const performer_adm_by_scenario = gql`
    query getPerformerADMsForScenario($admQueryStr: String, $scenarioID: ID){
        getPerformerADMsForScenario(admQueryStr: $admQueryStr, scenarioID: $scenarioID)
    }
`;

const alignment_target_by_scenario = gql`
    query getAlignmentTargetsPerScenario($evalNumber: Float!, $scenarioID: ID) {
        getAlignmentTargetsPerScenario(evalNumber: $evalNumber, scenarioID: $scenarioID)
    }
`;

const test_by_adm_and_scenario = gql`
    query getTestByADMandScenario($admQueryStr: String, $scenarioID: ID, $admName: ID, $alignmentTarget: String, $evalNumber: Int){
        getTestByADMandScenario(admQueryStr: $admQueryStr, scenarioID: $scenarioID, admName: $admName, alignmentTarget: $alignmentTarget, evalNumber: $evalNumber)
    }
`;

export const ADMProbeResponses = (props) => {
    const [currentEval, setCurrentEval] = useState(5);
    const [currentScenario, setCurrentScenario] = useState("");
    const [queryString, setQueryString] = useState("history.parameters.adm_name");
    const [queryData, setQueryData] = useState({});
    const [alignmentTargets, setAlignmentTargets] = useState([]);

    const { loading: evalNameLoading, error: evalNameError, data: evalNameData } = useQuery(get_eval_name_numbers);
    const { loading: scenarioLoading, error: scenarioError, data: scenarioData } = useQuery(scenario_names_aggregation, {
        variables: { evalNumber: currentEval },
        skip: !currentEval
    });
    const { loading: alignmentLoading, error: alignmentError, data: alignmentData } = useQuery(alignment_target_by_scenario, {
        variables: { evalNumber: currentEval, scenarioID: currentScenario },
        skip: !currentScenario
    });
    const { loading: admLoading, error: admError, data: admData } = useQuery(performer_adm_by_scenario, {
        variables: { admQueryStr: queryString, scenarioID: currentScenario },
        skip: !currentScenario
    });

    useEffect(() => {
        if (alignmentData?.getAlignmentTargetsPerScenario) {
            setAlignmentTargets(alignmentData.getAlignmentTargetsPerScenario);
        }
    }, [alignmentData]);

    useEffect(() => {
        if (admData?.getPerformerADMsForScenario && currentScenario) {
            const newQueryData = {};
            
            admData.getPerformerADMsForScenario.forEach(adm => {
                newQueryData[adm] = {
                    alignmentTargets: currentEval >= 3 ? alignmentTargets : [null],
                    data: {}
                };
            });
            
            setQueryData(newQueryData);
        }
    }, [admData, currentScenario, currentEval, alignmentTargets]);

    const getProbeColumns = (history) => {
        const probeResponses = history.filter(entry => entry.command === 'Respond to TA1 Probe');
        const columns = new Set();
        probeResponses.forEach(response => {
            if (response.parameters?.probe_id) {
                columns.add(response.parameters.probe_id);
            }
        });
        return Array.from(columns).sort();
    };

    const getChoiceForProbe = (history, probeId) => {
        const probeResponse = history
            .filter(entry => entry.command === 'Respond to TA1 Probe')
            .find(entry => entry.parameters?.probe_id === probeId);
        return probeResponse?.parameters?.choice || 'N/A';
    };

    if (evalNameLoading) return <div>Loading...</div>;
    if (evalNameError) return <div>Error loading evals</div>;

    const evalOptionsRaw = evalNameData.getEvalNameNumbers;
    const evalOptions = evalOptionsRaw
        .map(opt => ({
            value: opt._id.evalNumber,
            label: opt._id.evalName
        }))
        .sort((a, b) => (a.value < b.value) ? 1 : -1);

    const setEval = (target) => {
        setCurrentEval(target);
        setCurrentScenario("");
        setQueryString(target < 3 ? "history.parameters.ADM Name" : "history.parameters.adm_name");
    };

    const formatScenarioString = (id) => {
        if (currentEval < 3) {
            if (id.toLowerCase().indexOf("adept") > -1) {
                return ("BBN: " + id);
            } else {
                return ("Soartech: " + id);
            }
        } else if (currentEval == 3) {
            if (id.toLowerCase().indexOf("metricseval") > -1) {
                return ("ADEPT: " + id);
            } else {
                return ("Soartech: " + id);
            }
        } else {
            if (id.toLowerCase().includes("qol") || id.toLowerCase().includes("vol")) {
                return ("Soartech: " + id);
            } else {
                return ("Adept: " + id);
            }
        }
    };

    const formatADMString = (performerADMString) => {
        if (performerADMString.indexOf("ALIGN-ADM") > -1) {
            return ("Kitware: " + performerADMString);
        } else if (performerADMString.indexOf("TAD") > -1) {
            return ("Parallax: " + performerADMString);
        } else {
            return performerADMString;
        }
    };

    const sortedScenarios = scenarioData?.getScenarioNamesByEval?.sort((a, b) => {
        const aString = formatScenarioString(a._id.id);
        const bString = formatScenarioString(b._id.id);
        return aString.localeCompare(bString);
    });

    const getCurrentScenarioName = () => {
        const currentScenarioObj = sortedScenarios?.find(s => s._id.id === currentScenario);
        return currentScenarioObj ? formatScenarioString(currentScenarioObj._id.id) : '';
    };

    return (
        <div className="layout">
            <div className="layout-board">
                <div className="nav-section">
                    <div className="nav-header">
                        <span className="nav-header-text">Evaluation</span>
                    </div>
                    <div className="nav-menu">
                        <List className="nav-list" component="nav" aria-label="secondary mailbox folder">
                            {evalOptions.map((item, key) => (
                                <ListItem
                                    className="nav-list-item"
                                    id={`eval_${key}`}
                                    key={`eval_${key}`}
                                    button
                                    selected={currentEval === item.value}
                                    onClick={() => setEval(item.value)}
                                >
                                    <ListItemText primary={item.label} />
                                </ListItem>
                            ))}
                        </List>
                    </div>
                    {currentEval && (
                        <>
                            <div className="nav-header">
                                <span className="nav-header-text">Scenario</span>
                            </div>
                            <div className="nav-menu">
                                {scenarioLoading ? (
                                    <div>Loading scenarios...</div>
                                ) : scenarioError ? (
                                    <div>Error loading scenarios</div>
                                ) : (
                                    <List className="nav-list" component="nav">
                                        {sortedScenarios?.map((scenario, key) => (
                                            <ListItem
                                                className="nav-list-item"
                                                id={`scenario_${key}`}
                                                key={`scenario_${key}`}
                                                button
                                                selected={currentScenario === scenario._id.id}
                                                onClick={() => setCurrentScenario(scenario._id.id)}
                                            >
                                                <ListItemText primary={formatScenarioString(scenario._id.id)} />
                                            </ListItem>
                                        ))}
                                    </List>
                                )}
                            </div>
                        </>
                    )}
                </div>
                {currentScenario && (
                    <div className="test-overview-area">
                        {!admLoading && !admError && admData?.getPerformerADMsForScenario?.map((adm, index) => (
                            <div className='chart-home-container' key={index}>
                                <div className='chart-header'>
                                    <div className='chart-header-label'>
                                        <h4>
                                            {getCurrentScenarioName()}: {formatADMString(adm)}
                                        </h4>
                                    </div>
                                </div>
                                <div className='resultTableSection result-table-section-override'>
                                    <Query 
                                        query={test_by_adm_and_scenario}
                                        variables={{
                                            admQueryStr: queryString,
                                            scenarioID: currentScenario,
                                            admName: adm,
                                            alignmentTarget: queryData[adm]?.alignmentTargets[0],  // Get first target to determine columns
                                            evalNumber: currentEval
                                        }}
                                    >
                                        {({ loading, error, data }) => {
                                            if (loading) return <div>Loading...</div>;
                                            if (error) return <div>Error loading test data</div>;
                                            
                                            const testData = data?.getTestByADMandScenario;
                                            if (!testData?.history) return <div>No data available</div>;

                                            // Get all possible probe IDs for column headers
                                            const probeColumns = getProbeColumns(testData.history);

                                            return (
                                                <table className="itm-table">
                                                    <thead>
                                                        <tr>
                                                            {currentEval >= 3 && <th>Alignment Target</th>}
                                                            {probeColumns.map(probeId => (
                                                                <th key={probeId}>{probeId}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {queryData[adm]?.alignmentTargets.map(target => (
                                                            <Query 
                                                                key={`${adm}-${target || 'default'}`}
                                                                query={test_by_adm_and_scenario}
                                                                variables={{
                                                                    admQueryStr: queryString,
                                                                    scenarioID: currentScenario,
                                                                    admName: adm,
                                                                    alignmentTarget: target,
                                                                    evalNumber: currentEval
                                                                }}
                                                            >
                                                                {({ loading: rowLoading, error: rowError, data: rowData }) => {
                                                                    if (rowLoading) return <tr><td colSpan={probeColumns.length + 1}>Loading...</td></tr>;
                                                                    if (rowError) return <tr><td colSpan={probeColumns.length + 1}>Error loading data</td></tr>;

                                                                    const rowTestData = rowData?.getTestByADMandScenario;
                                                                    if (!rowTestData?.history) return <tr><td colSpan={probeColumns.length + 1}>No data available</td></tr>;

                                                                    return (
                                                                        <tr key={`${adm}-${target || 'default'}`}>
                                                                            {currentEval >= 3 && <td>{target}</td>}
                                                                            {probeColumns.map(probeId => (
                                                                                <td key={`${target}-${probeId}`}>
                                                                                    {getChoiceForProbe(rowTestData.history, probeId) || '-'}
                                                                                </td>
                                                                            ))}
                                                                        </tr>
                                                                    );
                                                                }}
                                                            </Query>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            );
                                        }}
                                    </Query>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};