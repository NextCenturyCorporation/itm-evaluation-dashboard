import React from 'react';
import gql from "graphql-tag";
import { useQuery } from '@apollo/react-hooks';
import { getAggregatedData, populateDataSet, isDefined, getGroupKey, formatCellData, sortedObjectKeys, populateDataSetP2 } from './DataFunctions';
import * as FileSaver from 'file-saver';
import XLSX from 'sheetjs-style';
import '../../css/aggregateResults.css';
import ProgramQuestions from './HomePages/programQuestions';
import { Modal } from "@mui/material";
import { DefinitionTable } from './definitionTable';
import CloseIcon from '@material-ui/icons/Close';
import Select from 'react-select';
import { HEADER, HEADER_SIM_DATA, ADEPT_HEADERS_DRE } from './aggregateHeaders';
import { PAGES, getEvalOptionsForPage } from '../Research/utils';


const EXCLUDED_EVALS_HUMAN_PROBES = [8, 9, 10];

const GET_SURVEY_RESULTS = gql`
    query GetAllResults($evalNumber: Float!){
        getAllSurveyResultsByEval(evalNumber: $evalNumber),
        getAllScenarioResultsByEval(evalNumber: $evalNumber),
        getAllSimAlignmentByEval(evalNumber: $evalNumber),
        getParticipantLog
    }`;


export default function AggregateResults({ type }) {
    let evalOptions = type == 'HumanProbeData' ? getEvalOptionsForPage(PAGES.HUMAN_SIM_PROBES) : getEvalOptionsForPage(PAGES.PARTICIPANT_LEVEL_DATA);
    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const fileExtension = '.xlsx';

    const [fullData, setFullData] = React.useState([]);
    const [aggregateData, setAggregateData] = React.useState(null);
    const [showDefinitions, setShowDefinitions] = React.useState(false);
    const [selectedEval, setSelectedEval] = React.useState(evalOptions[0].value);
    const [iframeLink, setIframeLink] = React.useState(null);
    const [showIframe, setShowIframe] = React.useState(false);
    const [iframeTitle, setIframeTitle] = React.useState(null);

    const { loading, error, data } = useQuery(GET_SURVEY_RESULTS, {
        variables: { "evalNumber": selectedEval }
        // only pulls from network, never cached
        //fetchPolicy: 'network-only',
    });

    React.useEffect(() => {
        evalOptions = type == 'HumanProbeData' ? getEvalOptionsForPage(PAGES.HUMAN_SIM_PROBES) : getEvalOptionsForPage(PAGES.PARTICIPANT_LEVEL_DATA);
        setSelectedEval(evalOptions[0].value);
    }, [type]);


    React.useEffect(() => {
        if (!loading && !error && data?.getAllSurveyResultsByEval && data?.getAllScenarioResultsByEval && data?.getParticipantLog) {

            let full;
            if (selectedEval >= 8) {
                full = populateDataSetP2(data);
            } else {
                full = populateDataSet(data);
            }
            full.sort((a, b) => a['ParticipantID'] - b['ParticipantID']);
            setFullData(full);

            const grouped = getAggregatedData();
            if (grouped.groupedSim) {
                const newGroupedSim = {};
                Object.values(grouped.groupedSim).flat().forEach(row => {
                    const key = getGroupKey(row, selectedEval);
                    if (!newGroupedSim[key]) {
                        newGroupedSim[key] = [];
                    }
                    newGroupedSim[key].push(row);
                });
                grouped.groupedSim = newGroupedSim;
            }
            setAggregateData(grouped);
        }
    }, [data, error, loading, selectedEval]);

    const exportToExcel = async () => {
        const dataCopy = structuredClone(fullData);
        for (let pid of Object.keys(dataCopy)) {
            for (let k of Object.keys(dataCopy[pid])) {
                if (typeof dataCopy[pid][k] === 'string' && dataCopy[pid][k].includes('link:')) {
                    dataCopy[pid][k] = dataCopy[pid][k].split('link:')[1];
                }
                if (String(dataCopy[pid][k]) === '-') {
                    dataCopy[pid][k] = '';
                }
            }
        }
        const ws = XLSX.utils.json_to_sheet(dataCopy);
        const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: fileType });
        FileSaver.saveAs(data, (selectedEval >= 8 ? 'ph2_' : selectedEval === 3 ? 'mre_' : selectedEval === 4 ? 'dre_' : 'ph1_') + 'participant_data' + fileExtension);
    };

    const exportHumanSimToExcel = async () => {
        if (selectedEval !== 4 && selectedEval !== 5 && selectedEval !== 6) {
            let humanSimData = [];
            for (var objkey in aggregateData["groupedSim"]) {
                humanSimData = humanSimData.concat(aggregateData["groupedSim"][objkey]);
            }
            const ws = XLSX.utils.json_to_sheet(humanSimData);
            const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const data = new Blob([excelBuffer], { type: fileType });
            FileSaver.saveAs(data, (selectedEval === 3 ? 'mre_' : selectedEval === 4 ? 'dre_' : 'ph1_') + 'human_sim_data' + fileExtension);
        }
        else {
            const sheets = {};
            const names = [];
            for (const objKey in aggregateData['groupedSim']) {
                const [adeptPart, stPart] = objKey.split('_');
                // if undefined for one, just name the sheet for the one scenario that was completed
                const sheetName = [
                    adeptPart !== 'undefined' ? adeptPart : '',
                    stPart !== 'undefined' ? stPart : ''
                ].filter(Boolean).join('_');

                const rawData = aggregateData['groupedSim'][objKey];
                const allHeaders = getHeadersEval4(HEADER_SIM_DATA[selectedEval === 6 ? 5 : selectedEval], objKey.split('_')[0]);
                // columns that have data in at least one row
                const filteredHeaders = allHeaders.filter(header => hasDataInColumn(rawData, header));

                const data = rawData.map(origObj => {
                    const newObj = {};
                    filteredHeaders.forEach(header => {
                        newObj[header] = origObj[header] === '-' ? '' : origObj[header];
                    });
                    return newObj;
                });

                const ws = XLSX.utils.json_to_sheet(data);
                names.push(sheetName);
                sheets[sheetName] = ws;
            }
            const wb = { Sheets: sheets, SheetNames: names };
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const data = new Blob([excelBuffer], { type: fileType });
            FileSaver.saveAs(data, 'human_sim_data' + (selectedEval === 4 ? '_dre' : '_ph1') + fileExtension);
        }
    };

    const closeModal = () => {
        setShowDefinitions(false);
    }

    function selectEvaluation(target) {
        setSelectedEval(target.value);
    }

    const getHeadersEval4 = (headers, adeptScenario) => {
        if (type == 'HumanProbeData' && EXCLUDED_EVALS_HUMAN_PROBES.includes(selectedEval)) {
            return [];
        }
        const splitPoint = headers?.indexOf('ADEPT_Session_Id');
        return [...headers?.slice(0, splitPoint), ...ADEPT_HEADERS_DRE[adeptScenario] ?? [], ...headers?.slice(splitPoint)];
    }

    const showGraph = (url, name) => {
        setIframeLink(url);
        setShowIframe(true);
        setIframeTitle(name);
    }

    const closeIframe = () => {
        setShowIframe(false);
    }

    const formatData = (dataSet, key) => {
        const v = dataSet[key];
        if (isDefined(v)) {
            if (typeof v === 'string' && v.includes('link:')) {
                // show View Graph link that opens up iframe
                return <button onClick={() => showGraph(v.split('link:')[1], dataSet['ParticipantID'] + ' ' + key)}>View Graph</button>
            }
            else if (typeof v === 'number') {
                // round to 4 decimals when displaying (full value will still show in download)
                return Math.floor(v * 10000) / 10000;
            }
            else {
                return v;
            }
        }
        else {
            return '-';
        }
    }

    const capitalizeFirstLetter = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    const formatScenarioTitle = (objectKey, evalNumber) => {
        if (evalNumber === 3) {
            return capitalizeFirstLetter(objectKey);
        }

        const [adeptPart, stPart] = objectKey.split('_');
        let adeptScenario = adeptPart === 'undefined' ? 'Incomplete' : adeptPart;
        let stScenario = stPart === 'undefined' ? 'Incomplete' : stPart;

        if (adeptPart.includes('DryRunEval')) {
            adeptScenario = evalNumber === 4 ? adeptScenario : adeptScenario.replace('DryRunEval', 'Phase1');
        }

        let transformedStPart = stScenario;
        if (stPart && evalNumber === 5) {
            transformedStPart = stScenario
                .replace(/3/g, '4')
                .replace(/2/g, '3')
                .replace(/1/g, '2')
        }

        return `ADEPT: ${adeptScenario}, SoarTech: ${transformedStPart}`;
    };

    const hasDataInColumn = (data, columnName) => {
        return data.some(row => {
            const value = row[columnName];
            return value !== undefined && value !== null && value !== '' && value !== '-';
        });
    };

    return (
        <div className='aggregatePage'>
            {type === 'HumanSimParticipant' &&
                <div className="home-container">
                    <Modal className='table-modal' open={showIframe} onClose={closeIframe}>
                        <div className='modal-body'>
                            <span className='close-icon' onClick={closeIframe}><CloseIcon /></span>
                            <div className='graph-popup'>
                                <h3>{iframeTitle ?? 'KDMA Graph'}</h3>
                                <iframe 
                                src={iframeLink}
                                title={iframeTitle ?? 'KDMA Graph'}
                                />
                            </div>
                        </div>
                    </Modal>
                    <div className="home-navigation-container">
                        <div className="evaluation-selector-container">
                            <div className="evaluation-selector-label"><h2>{selectedEval === 3 ? "Human Participant Data: Within-Subjects Analysis" : "Participant-Level Data"}</h2></div>
                        </div>
                        <div className="aggregate-button-holder">
                            <button className='aggregateDownloadBtn' onClick={() => setShowDefinitions(true)}>View Definitions</button>
                            <button onClick={exportToExcel} className='aggregateDownloadBtn'>Download Participant Data</button>
                        </div>
                    </div>
                    <div className="selection-section">
                        <Select
                            onChange={selectEvaluation}
                            options={evalOptions}
                            placeholder="Select Evaluation"
                            defaultValue={evalOptions[0]}
                            value={evalOptions.find(option => option.value === selectedEval)}
                            styles={{
                                // Fixes the overlapping problem of the component
                                menu: provided => ({ ...provided, zIndex: 9999 })
                            }}
                        />
                    </div>
                    <div className='resultTableSection'>
                        <table className='itm-table'>
                            <thead>
                                <tr>
                                    {HEADER[selectedEval === 6 ? 5 : selectedEval === 9 ? 8 : selectedEval]?.map((val, index) => {
                                        return (<th key={'header-' + index}>
                                            {val}
                                        </th>);
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {fullData.map((dataSet, index) => {
                                    return (<tr key={dataSet['ParticipantID'] + '-' + index}>
                                        {HEADER[selectedEval === 6 ? 5 : selectedEval === 9 ? 8 : selectedEval]?.map((val) => {
                                            return (<td key={dataSet['ParticipantID'] + '-' + val}>
                                                {formatData(dataSet, val)}
                                            </td>);
                                        })}
                                    </tr>);
                                })}

                            </tbody>
                        </table>
                    </div>
                </div>
            }

            {type === 'Program' && <ProgramQuestions />}
            {(type === 'HumanProbeData' && aggregateData) &&
                <div className="home-container">
                    <div className="home-navigation-container">
                        <div className="evaluation-selector-container">
                            <div className="evaluation-selector-label sim-probe-title"><h2>Human Simulator Probe {selectedEval === 3 ? "by Environment" : "Data"}</h2></div>
                        </div>
                        <div className="aggregate-button-holder">
                            <button onClick={exportHumanSimToExcel} className='aggregateDownloadBtn'>Download Human Sim Data</button>
                        </div>

                    </div>

                    <div className="selection-section-probes">
                        <Select
                            onChange={selectEvaluation}
                            options={evalOptions}
                            defaultValue={evalOptions[0]}
                            placeholder="Select Evaluation"
                            value={evalOptions.find(option => option.value === selectedEval)}
                            styles={{
                                // Fixes the overlapping problem of the component
                                menu: provided => ({ ...provided, zIndex: 9999 })
                            }}
                        />
                    </div>

                    {aggregateData["groupedSim"] !== undefined && sortedObjectKeys(Object.keys(aggregateData["groupedSim"]), selectedEval).map((objectKey, key) => {
                        const headers = selectedEval === 3 ? HEADER_SIM_DATA[selectedEval === 6 ? 5 : selectedEval] : getHeadersEval4(HEADER_SIM_DATA[selectedEval === 6 ? 5 : selectedEval], objectKey.split('_')[0]);
                        const filteredHeaders = headers?.filter(header => hasDataInColumn(aggregateData["groupedSim"][objectKey], header));

                        return (
                            <div className='chart-home-container' key={"container_" + key}>
                                <div className='chart-header'>
                                    <div className='chart-header-label'>
                                        <h4 key={"header_" + objectKey}>
                                            {formatScenarioTitle(objectKey, selectedEval)}
                                        </h4>
                                    </div>
                                </div>
                                <div key={"container_" + key} className='resultTableSection result-table-section-override'>
                                    <table key={"table_" + objectKey} className="itm-table">
                                        <thead>
                                            <tr>
                                                {filteredHeaders?.map((item) => (
                                                    <th key={"header_" + item}>{item}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {aggregateData["groupedSim"][objectKey].map((rowObj, rowKey) => (
                                                <tr key={"tr_" + rowKey}>
                                                    {filteredHeaders?.map((item, itemKey) => (
                                                        <td key={"row_" + item + itemKey}>
                                                            {rowObj !== undefined ? formatCellData(rowObj[item]) : ""}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}

                </div>
            }
            {type === 'HumanSimParticipant' && <Modal className='table-modal' open={showDefinitions} onClose={closeModal}>
                <div className='modal-body'>
                    <span className='close-icon' onClick={closeModal}><CloseIcon /></span>
                    <DefinitionTable evalNumber={selectedEval} />
                </div>
            </Modal>}
        </div>
    );
}
