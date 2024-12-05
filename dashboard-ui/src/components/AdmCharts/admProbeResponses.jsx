import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/react-hooks';
import { Query } from 'react-apollo';
import gql from "graphql-tag";
import { List, ListItem, ListItemText } from '@mui/material';
import * as XLSX from 'sheetjs-style';
import { saveAs } from 'file-saver';
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

const get_all_test_data = gql`
    query getAllTestDataForADM($admQueryStr: String, $scenarioID: ID, $admName: ID, $alignmentTargets: [String], $evalNumber: Int) {
        getAllTestDataForADM(
            admQueryStr: $admQueryStr,
            scenarioID: $scenarioID,
            admName: $admName,
            alignmentTargets: $alignmentTargets,
            evalNumber: $evalNumber
        )
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

    const getChoiceForProbe = (history, probeId) => {
        const probeResponse = history
            .filter(entry => entry.command === 'Respond to TA1 Probe')
            .find(entry => entry.parameters?.probe_id === probeId);
        return probeResponse?.parameters?.choice || '-';
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

    const getSessionId = (history) => {
        const sessionEntry = history.find(entry => entry.command === 'TA1 Session ID');
        return sessionEntry?.response || '-';
    };

    const downloadAsExcel = (tableData, adm = null, isAllTables = false) => {
        console.log(tableData)
        console.log(adm)
        console.log(isAllTables)
        const excelData = isAllTables ? tableData : formatTableData(tableData);

        console.log(excelData)
        // Create and save workbook
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Probe Responses");

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const fileName = isAllTables ?
            `${getCurrentScenarioName()}_all_adm_probe_responses.xlsx` :
            `${getCurrentScenarioName()}_${formatADMString(adm)}_probe_responses.xlsx`;

        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        saveAs(data, fileName);
    };
    // Helper function to format table data
    const formatTableData = (testDataArray, adm = null) => {
        return testDataArray.map(({ alignmentTarget, data }) => {
            const row = adm ?
                {
                    'ADM': formatADMString(adm),
                    'Alignment Target': alignmentTarget,
                    'TA1 Session ID': getSessionId(data.history)
                } :
                {
                    'Alignment Target': alignmentTarget,
                    'TA1 Session ID': getSessionId(data.history)
                };

            // Get and sort probe columns
            const probeColumns = new Set();
            testDataArray.forEach(({ data }) => {
                const history = data?.history || [];
                const probeResponses = history.filter(entry =>
                    entry.command === 'Respond to TA1 Probe' &&
                    entry.parameters?.probe_id !== 'n/a'
                );
                probeResponses.forEach(response => {
                    if (response.parameters?.probe_id) {
                        probeColumns.add(response.parameters.probe_id);
                    }
                });
            });

            const sortedProbeColumns = Array.from(probeColumns).sort((a, b) => {
                const aMatch = a.match(/\d+/);
                const bMatch = b.match(/\d+/);
                if (aMatch && bMatch) {
                    const aNum = parseInt(aMatch[0]);
                    const bNum = parseInt(bMatch[0]);
                    if (aNum === bNum) {
                        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
                    }
                    return aNum - bNum;
                }
                return a.localeCompare(b);
            });

            // Add probe responses to row
            sortedProbeColumns.forEach(probeId => {
                row[probeId] = getChoiceForProbe(data.history, probeId) || '-';
            });

            return row;
        });
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
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                            <Query
                                query={get_all_test_data}
                                variables={{
                                    admQueryStr: queryString,
                                    scenarioID: currentScenario,
                                    admName: admData?.getPerformerADMsForScenario[0],
                                    alignmentTargets: queryData[admData?.getPerformerADMsForScenario[0]]?.alignmentTargets || [],
                                    evalNumber: currentEval
                                }}
                            >
                                {({ loading, error, data }) => {
                                    if (loading || error || !admData?.getPerformerADMsForScenario) return null;

                                    return (
                                        <button
                                            className='aggregateDownloadBtn'
                                            onClick={() => {
                                                const allData = admData.getPerformerADMsForScenario.map(adm => (
                                                    formatTableData(data?.getAllTestDataForADM || [], adm)
                                                )).flat();
                                                downloadAsExcel(allData, null, true);
                                            }}
                                        >
                                            Download All as Excel
                                        </button>
                                    );
                                }}
                            </Query>
                        </div>
                        {!admLoading && !admError && admData?.getPerformerADMsForScenario?.map((adm, index) => (
                            <div className='chart-home-container' key={index}>
                                <div className='chart-header'>
                                    <div className='chart-header-label'>
                                        <h4>
                                            {getCurrentScenarioName()}, {formatADMString(adm)}
                                        </h4>
                                    </div>
                                    <Query
                                        query={get_all_test_data}
                                        variables={{
                                            admQueryStr: queryString,
                                            scenarioID: currentScenario,
                                            admName: adm,
                                            alignmentTargets: queryData[adm]?.alignmentTargets || [],
                                            evalNumber: currentEval
                                        }}
                                    >
                                        {({ loading, error, data }) => {
                                            if (loading || error || !data?.getAllTestDataForADM) return null;

                                            return (
                                                <button 
                                                    className="aggregateDownloadBtn"
                                                    onClick={() => downloadAsExcel(data?.getAllTestDataForADM || [], adm)}
                                                >
                                                    Download Table as Excel
                                                </button>
                                            );
                                        }}
                                    </Query>
                                </div>
                                <div className='resultTableSection result-table-section-override'>
                                    <Query
                                        query={get_all_test_data}
                                        variables={{
                                            admQueryStr: queryString,
                                            scenarioID: currentScenario,
                                            admName: adm,
                                            alignmentTargets: queryData[adm]?.alignmentTargets || [],
                                            evalNumber: currentEval
                                        }}
                                    >
                                        {({ loading, error, data }) => {
                                            if (loading) return <div>Loading...</div>;
                                            if (error) return <div>Error loading test data</div>;

                                            const testDataArray = data?.getAllTestDataForADM || [];
                                            if (testDataArray.length === 0) return <div>No data available</div>;


                                            const probeColumns = new Set();
                                            testDataArray.forEach(({ data }) => {
                                                const history = data?.history || [];
                                                const probeResponses = history.filter(entry =>
                                                    entry.command === 'Respond to TA1 Probe' &&
                                                    entry.parameters?.probe_id !== 'n/a'
                                                );
                                                probeResponses.forEach(response => {
                                                    if (response.parameters?.probe_id) {
                                                        probeColumns.add(response.parameters.probe_id);
                                                    }
                                                });
                                            });

                                            const sortedProbeColumns = Array.from(probeColumns).sort((a, b) => {
                                                const aMatch = a.match(/\d+/);
                                                const bMatch = b.match(/\d+/);

                                                if (aMatch && bMatch) {
                                                    const aNum = parseInt(aMatch[0]);
                                                    const bNum = parseInt(bMatch[0]);

                                                    if (aNum === bNum) {
                                                        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
                                                    }
                                                    return aNum - bNum;
                                                }
                                                return a.localeCompare(b);
                                            });

                                            return (
                                                <>
                                                    <table className="itm-table">
                                                        <thead>
                                                            <tr>
                                                                {currentEval >= 3 && (
                                                                    <>
                                                                        <th>Alignment Target</th>
                                                                        <th>TA1 Session ID</th>
                                                                    </>
                                                                )}
                                                                {sortedProbeColumns.map(probeId => (
                                                                    <th key={probeId}>{probeId}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {testDataArray.map(({ alignmentTarget, data }) => (
                                                                <tr key={`${adm}-${alignmentTarget || 'default'}`}>
                                                                    {currentEval >= 3 && (
                                                                        <>
                                                                            <td>{alignmentTarget}</td>
                                                                            <td>{getSessionId(data.history)}</td>
                                                                        </>
                                                                    )}
                                                                    {sortedProbeColumns.map(probeId => (
                                                                        <td key={`${alignmentTarget}-${probeId}`}>
                                                                            {getChoiceForProbe(data.history, probeId) || '-'}
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </>
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