import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@apollo/react-hooks';
import { Query } from 'react-apollo';
import gql from "graphql-tag";
import { List, ListItem, ListItemText } from '@mui/material';
import * as XLSX from 'sheetjs-style';
import { saveAs } from 'file-saver';
import '../../css/results-page.css';
import '../../css/aggregateResults.css';
import { multiSort } from '../Results/utils';
import { PAGES, getEvalOptionsForPage } from '../Research/utils';

const scenario_names_aggregation = gql`
    query getScenarioNamesByEval($evalNumber: Float!) {
        getScenarioNamesByEval(evalNumber: $evalNumber)
    }
`;

const performer_adm_by_scenario = gql`
    query getPerformerADMsForScenario($admQueryStr: String, $scenarioID: ID, $evalNumber: Float){
        getPerformerADMsForScenario(admQueryStr: $admQueryStr, scenarioID: $scenarioID, evalNumber: $evalNumber)
    }`;
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

const parseProbeId = (probeId) => {

    const dotFormat = probeId.match(/^(\d+)\.(\d+)$/);
    if (dotFormat) {
        return {
            type: 'dotted',
            major: parseInt(dotFormat[1]),
            minor: parseInt(dotFormat[2]),
            raw: parseInt(dotFormat[1]) + (parseInt(dotFormat[2]) / 100)
        };
    }


    const trainProbeFormat = probeId.match(/.*?Probe-(\d+)$/);
    if (trainProbeFormat) {
        const number = parseInt(trainProbeFormat[1]);
        return {
            type: 'train',
            number: number,
            raw: 4 + (number / 100)
        };
    }

    const wordFormat = probeId.match(/^Probe\s+(\d+)\s+\w+$/);
    if (wordFormat) {
        const number = parseInt(wordFormat[1]);
        return {
            type: 'word',
            raw: number
        };
    }

    const simpleProbeFormat = probeId.match(/^Probe\s+(\d+)$/);
    if (simpleProbeFormat) {
        const number = parseInt(simpleProbeFormat[1]);
        return {
            type: 'simple',
            raw: number
        };
    }

    const singleLetterFormat = probeId.match(/^Probe\s+(\d+)([A-Z])-(\d+)$/);
    if (singleLetterFormat) {
        const baseNumber = parseInt(singleLetterFormat[1]);
        const letter = singleLetterFormat[2];
        const subNumber = parseInt(singleLetterFormat[3]);

        return {
            type: 'single-letter',
            raw: baseNumber + (letter.charCodeAt(0) - 64) / 100 + subNumber / 10000
        };
    }

    const hierarchicalFormat = probeId.match(/^Probe\s+(\d+)(-[A-Z]\.?\d+)*$/);
    if (hierarchicalFormat) {
        const parts = probeId.split('-');
        const baseNumber = parseInt(parts[0].match(/\d+/)[0]);

        let sortValue = baseNumber;

        for (let i = 1; i < parts.length; i++) {
            const part = parts[i];
            const letter = part.charAt(0);
            const number = parseFloat(part.match(/\d+\.?\d*/)?.[0] || '0');

            sortValue += (letter.charCodeAt(0) - 64) / 100 + number / 10000;
        }

        return {
            type: 'hierarchical',
            raw: sortValue
        };
    }

    return {
        type: 'other',
        raw: probeId
    };
};

const compareProbeIds = (a, b) => {
    const parsedA = parseProbeId(a);
    const parsedB = parseProbeId(b);

    return parsedA.raw - parsedB.raw;
};

const getKdmaTargets = (doc) => {
    const alignmentCommand = doc['history'].find((entry) => entry.command === 'Alignment Target');
    const mj = alignmentCommand?.response?.kdma_values?.find((value) => value.kdma === 'Moral judgement')?.value || '-';
    const io = alignmentCommand?.response?.kdma_values?.find((value) => value.kdma === 'Ingroup Bias')?.value || '-';

    return { mj, io };
}

export const ADMProbeResponses = (props) => {
    const evalOptions = getEvalOptionsForPage(PAGES.ADM_PROBE_RESPONSES);

    const [currentEval, setCurrentEval] = useState(evalOptions[0].value);
    const [currentScenario, setCurrentScenario] = useState("");
    const [queryString, setQueryString] = useState("adm_name");
    const [queryData, setQueryData] = useState({});
    const [alignmentTargets, setAlignmentTargets] = useState([]);
    const [allTableData, setAllTableData] = useState({});
    const processedDataRef = useRef({});

    const { loading: scenarioLoading, error: scenarioError, data: scenarioData } = useQuery(scenario_names_aggregation, {
        variables: { evalNumber: [14, 11].includes(currentEval) ? 9 : currentEval },
        skip: !currentEval
    });

    const { data: alignmentData } = useQuery(alignment_target_by_scenario, {
        variables: { evalNumber: currentEval, scenarioID: currentScenario },
        skip: !currentScenario
    });

    const { loading: admLoading, error: admError, data: admData } = useQuery(performer_adm_by_scenario, {
        variables: { admQueryStr: queryString, scenarioID: currentScenario, evalNumber: currentEval },
        skip: !currentScenario,
        fetchPolicy: "network-only"
    });

    useEffect(() => {
        if (alignmentData?.getAlignmentTargetsPerScenario) {
            const sortedTargets = [...alignmentData.getAlignmentTargetsPerScenario].sort(multiSort);
            setAlignmentTargets(sortedTargets);
        }
    }, [alignmentData]);

    useEffect(() => {

        if (admData?.getPerformerADMsForScenario && currentScenario) {
            const newQueryData = {};

            admData.getPerformerADMsForScenario.forEach(adm => {
                newQueryData[adm] = {
                    alignmentTargets: alignmentTargets,
                    data: {}
                };
            });

            setQueryData(newQueryData);
            setAllTableData({});
            processedDataRef.current = {};
        }
    }, [admData, currentScenario, currentEval, alignmentTargets]);

    useEffect(() => {
        setCurrentScenario("");
        setQueryString("adm_name");
        setQueryData({});
        setAlignmentTargets([]);
        setAllTableData({});
        processedDataRef.current = {};
    }, [currentEval]);

    const getChoiceForProbe = (history, probeId, probeResponses = null) => {

        if (probeResponses) {
            const probeResponse = probeResponses.find(pr => pr[probeId] !== undefined);
            return probeResponse?.[probeId] || '-';
        }

        const probeResponsesHistory = history
            .filter(entry => entry.command === 'Respond to TA1 Probe')
            .filter(entry => entry.parameters?.probe_id === probeId);

        // no response found
        if (probeResponsesHistory.length === 0) {
            return '-';
        }

        // more than response, include all of them
        if (probeResponsesHistory.length > 1) {
            return probeResponsesHistory
                .map(response => response.parameters?.choice || '-')
                .join(', ');
        }

        // normal case, one response
        return probeResponsesHistory[0].parameters?.choice || '-';
    };

    const getKdma = (data, alignmentTarget) => {
        if (currentEval >= 8) {
            const kdmas = data?.results?.kdmas;
            if (!kdmas || kdmas.length === 0) return '-';

            if (alignmentTarget.includes('affiliation_merit')) {
                // label multi kdma
                return kdmas.map(kdma => {
                    const capitalizedKdma = kdma.kdma.charAt(0).toUpperCase() + kdma.kdma.slice(1);
                    return `${capitalizedKdma}: ${kdma.value || '-'}`;
                }).join(', ');
            }

            const matchingKdma = kdmas.find(kdma => alignmentTarget.includes(kdma.kdma));
            return matchingKdma?.value || '-';

        }

        const attribute = alignmentTarget.includes('Moral') ? 'Moral judgement' : 'Ingroup Bias';
        return data.history.find(entry => entry.command === 'TA1 Session Alignment')?.response?.kdma_values?.find((kdma) => kdma.kdma === attribute)?.value;
    }


    const setEval = (target) => {
        setCurrentEval(target);
        setCurrentScenario("");
        setQueryString("adm_name");
    };

    const formatScenarioString = (id) => {
        if (currentEval === 3) {
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

    const sortedScenarios = scenarioData?.getScenarioNamesByEval
        ?.filter(s => ![14, 11].includes(currentEval) || !s._id.id.toLowerCase().includes('af-mf'))
        ?.sort((a, b) => formatScenarioString(a._id.id).localeCompare(formatScenarioString(b._id.id)));

    const getCurrentScenarioName = () => {
        const currentScenarioObj = sortedScenarios?.find(s => s._id.id === currentScenario);
        return currentScenarioObj ? formatScenarioString(currentScenarioObj._id.id) : '';
    };

    const getSessionId = (data) => {

        if (currentEval === 11 && data?.pid) {
            return data.pid;
        }

        if (data?.results?.ta1_session_id) {
            return data.results.ta1_session_id;
        }

        const sessionEntry = data?.history?.find(entry => entry.command === 'TA1 Session ID');
        return sessionEntry?.response || '-';
    };

    const downloadAsExcel = (tableData, adm = null, isAllTables = false) => {
        const excelData = isAllTables ?
            Object.values(tableData).flat() :
            formatTableData(tableData, adm);

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

    const formatTableData = (testDataArray, adm = null) => {
        // First, collect all probe columns from the entire array
        const probeColumns = new Set();
        testDataArray.forEach(({ data, probe_ids }) => {
            if ([14, 11].includes(currentEval) && probe_ids) {
                probe_ids.forEach(probeId => probeColumns.add(probeId));
            } else {
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
            }
        });
        const sortedProbeColumns = Array.from(probeColumns).sort(compareProbeIds);

        return testDataArray.map(({ alignmentTarget, data, probe_responses }) => {
            const sessionIdLabel = currentEval === 11 ? 'Participant ID' : 'TA1 Session ID';
            const row = adm ?
                {
                    'ADM': formatADMString(adm),
                    'Alignment Target': alignmentTarget,
                    [sessionIdLabel]: getSessionId(data)
                } :
                {
                    'Alignment Target': alignmentTarget,
                    [sessionIdLabel]: getSessionId(data)
                };
            if (currentEval === 7) {
                const kdmaValues = getKdmaTargets(data);
                row['MJ KDMA'] = kdmaValues.mj;
                row['IO KDMA'] = kdmaValues.io;
            } else if (getCurrentScenarioName().includes('Adept')) {
                row['KDMA'] = getKdma(data, alignmentTarget);
            }

            sortedProbeColumns.forEach(probeId => {
                row[probeId] = [14, 11].includes(currentEval)
                    ? getChoiceForProbe(data.history, probeId, probe_responses)
                    : getChoiceForProbe(data.history, probeId) || '-';
            });

            return row;
        });
    };

    // helper to avoid infinite loop by updating unnecessarily inside query 
    const handleDataUpdate = (data, adm) => {
        if (!data?.getAllTestDataForADM) return;

        const dataKey = `${currentScenario}_${adm}_${currentEval}`;
        const dataString = JSON.stringify(data.getAllTestDataForADM);
        if (processedDataRef.current[dataKey] !== dataString) {
            processedDataRef.current[dataKey] = dataString;
            const formattedData = formatTableData(data.getAllTestDataForADM, adm);
            setAllTableData(prev => ({
                ...prev,
                [adm]: formattedData
            }));
        }
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
                {!currentScenario && currentEval && (
                    <div className="test-overview-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ textAlign: 'center', color: '#666' }}>
                            <h3>Please select a scenario to view probe responses</h3>
                            <p>Choose from the available scenarios in the left panel</p>
                        </div>
                    </div>
                )}
                {currentScenario && (
                    <div className="test-overview-area">
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                            <button
                                className='aggregateDownloadBtn'
                                onClick={() => downloadAsExcel(allTableData, null, true)}
                                disabled={Object.keys(allTableData).length === 0}
                            >
                                Download All
                            </button>
                        </div>
                        {!admLoading && !admError && admData?.getPerformerADMsForScenario?.map((adm, index) => (
                            <div className='chart-home-container' key={index}>
                                <div className='probe-chart-header'>
                                    <div className='chart-header-label'>
                                        <h4>
                                            {getCurrentScenarioName()}, {formatADMString(adm)}
                                        </h4>
                                    </div>
                                    <div className='chart-header-download'>
                                        <Query
                                            query={get_all_test_data}
                                            variables={{
                                                admQueryStr: queryString,
                                                scenarioID: currentScenario,
                                                admName: adm,
                                                alignmentTargets: queryData[adm]?.alignmentTargets || [],
                                                evalNumber: currentEval
                                            }}
                                            onCompleted={(data) => handleDataUpdate(data, adm)}
                                        >
                                            {({ loading, error, data }) => {
                                                if (loading || error || !data?.getAllTestDataForADM) return null;
                                                return (
                                                    <button
                                                        className="aggregateDownloadBtn"
                                                        onClick={() => downloadAsExcel(data?.getAllTestDataForADM || [], adm)}
                                                    >
                                                        Download
                                                    </button>
                                                );
                                            }}
                                        </Query>
                                    </div>
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
                                            testDataArray.forEach(({ data, probe_ids }) => {
                                                if ([14, 11].includes(currentEval) && probe_ids) {
                                                    probe_ids.forEach(probeId => probeColumns.add(probeId));
                                                } else {
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
                                                }
                                            });

                                            const sortedProbeColumns = Array.from(probeColumns).sort(compareProbeIds);

                                            return (
                                                <>
                                                    <table className="itm-table">
                                                        <thead>
                                                            <tr>
                                                                {currentEval >= 3 && (
                                                                    <>
                                                                        <th>Alignment Target</th>
                                                                        {currentEval === 7 ? (
                                                                            <>
                                                                                <th>MJ KDMA Target</th>
                                                                                <th>IO KDMA Target</th>
                                                                            </>
                                                                        ) : (
                                                                            getCurrentScenarioName().includes('Adept') && <th>KDMA</th>
                                                                        )}
                                                                        <th>{currentEval === 11 ? 'Participant ID' : 'TA1 Session ID'}</th>
                                                                    </>
                                                                )}
                                                                {sortedProbeColumns.map(probeId => (
                                                                    <th key={probeId}>{probeId}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {testDataArray.map(({ alignmentTarget, data, probe_responses }) => (
                                                                <tr key={`${adm}-${alignmentTarget || 'default'}`}>
                                                                    {currentEval >= 3 && (
                                                                        <>
                                                                            <td>{alignmentTarget}</td>
                                                                            {currentEval === 7 ? (
                                                                                <>
                                                                                    <td>{getKdmaTargets(data).mj}</td>
                                                                                    <td>{getKdmaTargets(data).io}</td>
                                                                                </>
                                                                            ) : (
                                                                                getCurrentScenarioName().includes('Adept') &&
                                                                                <td>{getKdma(data, alignmentTarget)}</td>
                                                                            )}
                                                                            <td>{getSessionId(data)}</td>
                                                                        </>
                                                                    )}
                                                                    {sortedProbeColumns.map(probeId => (
                                                                        <td key={`${alignmentTarget}-${probeId}`}>
                                                                            {[14, 11].includes(currentEval)
                                                                                ? getChoiceForProbe(data.history, probeId, probe_responses)
                                                                                : getChoiceForProbe(data.history, probeId) || '-'}
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