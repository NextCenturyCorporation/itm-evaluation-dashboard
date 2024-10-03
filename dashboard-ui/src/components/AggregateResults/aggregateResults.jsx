import React from 'react';
import gql from "graphql-tag";
import { useQuery } from '@apollo/react-hooks';
import { getAggregatedData, populateDataSet, isDefined } from './DataFunctions';
import * as FileSaver from 'file-saver';
import XLSX from 'sheetjs-style';
import './aggregateResults.css';
import ProgramQuestions from './programQuestions';
import { Modal } from "@mui/material";
import { DefinitionTable } from './definitionTable';
import CloseIcon from '@material-ui/icons/Close';
import Select from 'react-select';

const get_eval_name_numbers = gql`
    query getEvalIdsForSimAlignment{
        getEvalIdsForSimAlignment
  }`;
let evalOptions = [];

const GET_SURVEY_RESULTS = gql`
    query GetAllResults($evalNumber: Float!){
        getAllSurveyResultsByEval(evalNumber: $evalNumber),
        getAllScenarioResultsByEval(evalNumber: $evalNumber),
        getAllSimAlignmentByEval(evalNumber: $evalNumber),
        getParticipantLog
    }`;


const HEADER = {
    3: [
        'ParticipantID',
        'MedRole',
        'MedExp',
        'MilitaryExp',
        'YrsMilExp',
        'PropTrust',
        'Delegation',
        'Trust',
        'PostVRstate',
        'TextOrder',
        'Sim1',
        'Sim2',
        'SimOrder',
        'TextSimDiff',
        'ST_KDMA_Text',
        'ST_KDMA_Sim',
        'ST_AttribGrp_Text',
        'ST_AttribGrp_Sim',
        'AD_KDMA_Text',
        'AD_KDMA_Sim',
        'AD_AttribGrp_Text',
        'AD_AttribGrp_Sim',
        'ST_Del_Text',
        'ST_ConfFC_Text',
        'ST_Del_Omni_Text',
        'ST_ConfFC_Omni_Text',
        'ST_Align_DelC_Text',
        'ST_Align_DelFC_Text',
        'ST_Align_DelC_Omni_Text',
        'ST_Align_DelFC_Omni_Text',
        'ST_Align_Trust_Text',
        'ST_Misalign_Trust_Text',
        'ST_Align_Agree_Text',
        'ST_Misalign_Agree_Text',
        'ST_Align_Trustworthy_Text',
        'ST_Misalign_Trustworthy_Text',
        'ST_Align_AlignSR_Text',
        'ST_Misalign_AlignSR_Text',
        'ST_Align_Trust_Omni_Text',
        'ST_Misalign_Trust_Omni_Text',
        'ST_Align_Agree_Omni_Text',
        'ST_Misalign_Agree_Omni_Text',
        'ST_Align_Trustworthy_Omni_Text',
        'ST_Misalign_Trustworthy_Omni_Text',
        'ST_Align_AlignSR_Omni_Text',
        'ST_Misalign_AlignSR_Omni_Text',
        'AD_Del_Text',
        'AD_ConfFC_Text',
        'AD_Del_Omni_Text',
        'AD_ConfFC_Omni_Text',
        'AD_Align_DelC_Text',
        'AD_Align_DelFC_Text',
        'AD_Align_DelC_Omni_Text',
        'AD_Align_DelFC_Omni_Text',
        'AD_Align_Trust_Text',
        'AD_Misalign_Trust_Text',
        'AD_Align_Agree_Text',
        'AD_Misalign_Agree_Text',
        'AD_Align_Trustworthy_Text',
        'AD_Misalign_Trustworthy_Text',
        'AD_Align_AlignSR_Text',
        'AD_Misalign_AlignSR_Text',
        'AD_Align_Trust_Omni_Text',
        'AD_Misalign_Trust_Omni_Text',
        'AD_Align_Agree_Omni_Text',
        'AD_Misalign_Agree_Omni_Text',
        'AD_Align_Trustworthy_Omni_Text',
        'AD_Misalign_Trustworthy_Omni_Text',
        'AD_Align_AlignSR_Omni_Text',
        'AD_Misalign_AlignSR_Omni_Text',
        'ST_Del_Sim',
        'ST_ConfFC_Sim',
        'ST_Del_Omni_Sim',
        'ST_ConfFC_Omni_Sim',
        'ST_Align_DelC_Sim',
        'ST_Align_DelFC_Sim',
        'ST_Align_DelC_Omni_Sim',
        'ST_Align_DelFC_Omni_Sim',
        'ST_Align_Trust_Sim',
        'ST_Misalign_Trust_Sim',
        'ST_Align_Agree_Sim',
        'ST_Misalign_Agree_Sim',
        'ST_Align_Trustworthy_Sim',
        'ST_Misalign_Trustworthy_Sim',
        'ST_Align_AlignSR_Sim',
        'ST_Misalign_AlignSR_Sim',
        'ST_Align_Trust_Omni_Sim',
        'ST_Misalign_Trust_Omni_Sim',
        'ST_Align_Agree_Omni_Sim',
        'ST_Misalign_Agree_Omni_Sim',
        'ST_Align_Trustworthy_Omni_Sim',
        'ST_Misalign_Trustworthy_Omni_Sim',
        'ST_Align_AlignSR_Omni_Sim',
        'ST_Misalign_AlignSR_Omni_Sim',
        'AD_Del_Sim',
        'AD_ConfFC_Sim',
        'AD_Del_Omni_Sim',
        'AD_ConfFC_Omni_Sim',
        'AD_Align_DelC_Sim',
        'AD_Align_DelFC_Sim',
        'AD_Align_DelC_Omni_Sim',
        'AD_Align_DelFC_Omni_Sim',
        'AD_Align_Trust_Sim',
        'AD_Misalign_Trust_Sim',
        'AD_Align_Agree_Sim',
        'AD_Misalign_Agree_Sim',
        'AD_Align_Trustworthy_Sim',
        'AD_Misalign_Trustworthy_Sim',
        'AD_Align_AlignSR_Sim',
        'AD_Misalign_AlignSR_Sim',
        'AD_Align_Trust_Omni_Sim',
        'AD_Misalign_Trust_Omni_Sim',
        'AD_Align_Agree_Omni_Sim',
        'AD_Misalign_Agree_Omni_Sim',
        'AD_Align_Trustworthy_Omni_Sim',
        'AD_Misalign_Trustworthy_Omni_Sim',
        'AD_Align_AlignSR_Omni_Sim',
        'AD_Misalign_AlignSR_Omni_Sim',
        "ST_High_Trust",
        "ST_High_Agree",
        "ST_High_Trustworthy",
        'ST_High_AlignSR',
        'ST_Low_Trust',
        'ST_Low_Agree',
        'ST_Low_Trustworthy',
        'ST_Low_AlignSR',
        'ST_AlignScore_High',
        'ST_AlignScore_Low',
        "ST_High_Trust_Omni",
        "ST_High_Agree_Omni",
        "ST_High_Trustworthy_Omni",
        'ST_High_AlignSR_Omni',
        'ST_Low_Trust_Omni',
        'ST_Low_Agree_Omni',
        'ST_Low_Trustworthy_Omni',
        'ST_Low_AlignSR_Omni',
        "AD_High_Trust",
        "AD_High_Agree",
        "AD_High_Trustworthy",
        'AD_High_AlignSR',
        'AD_Low_Trust',
        'AD_Low_Agree',
        'AD_Low_Trustworthy',
        'AD_Low_AlignSR',
        'AD_AlignScore_High',
        'AD_AlignScore_Low',
        "AD_High_Trust_Omni",
        "AD_High_Agree_Omni",
        "AD_High_Trustworthy_Omni",
        'AD_High_AlignSR_Omni',
        'AD_Low_Trust_Omni',
        'AD_Low_Agree_Omni',
        'AD_Low_Trustworthy_Omni',
        'AD_Low_AlignSR_Omni'
    ],
    4: [
        "ParticipantID",
        "Date",
        "MedRole",
        "MedExp",
        "MilitaryExp",
        "YrsMilExp",
        "PropTrust",
        "Delegation",
        "Trust",
        "PostVRstate",
        "AD_Scenario_Text",
        "AD_Scenario_Sim",
        "QOL_Scenario_Text",
        "QOL_Scenario_Sim",
        "VOL_Scenario_Text",
        "VOL_Scenario_Sim",
        "QOL_KDMA_Text",
        "QOL_KDMA_Sim",
        "VOL_KDMA_Text",
        "VOL_KDMA_Sim",
        "MJ_KDMA_Text",
        "MJ_KDMA_Sim",
        "IO_KDMA_Text",
        "IO_KDMA_Sim"
    ]
};

const ADEPT_HEADERS_DRE = {
    'DryRunEval-MJ2-eval': ["MJ_2", "IO_2", "MJ_2A-1", "IO_2A-1", "MJ_2B-1", "IO_2B-1", "MJ_3-B.2", "IO_3-B.2", "MJ_4", "IO_4", "MJ_4-B.1", "IO_4-B.1", "MJ_4-B.1-B.1", "IO_4-B.1-B.1", "MJ_5", "IO_5", "MJ_5-A.1", "IO_5-A.1", "MJ_5-B.1", "IO_5-B.1", "MJ_6", "IO_6", "MJ_7", "IO_7", "MJ_8", "IO_8", "MJ_9", "IO_9", "MJ_9-A.1", "IO_9-A.1", "MJ_9-B.1", "IO_9-B.1", "MJ_10", "IO_10",],
    'DryRunEval-MJ4-eval': ["MJ_1", "IO_1", "MJ_2_kicker", "IO_2_kicker", "MJ_2_passerby", "IO_2_passerby", "MJ_2-A.1", "IO_2-A.1", "MJ_2-D.1", "IO_2-D.1", "MJ_2-D.1-B.1", "IO_2-D.1-B.1", "MJ_3", "IO_3", "MJ_3-A.1", "IO_3-A.1", "MJ_3-B.1", "IO_3-B.1", "MJ_6", "IO_6", "MJ_7", "IO_7", "MJ_8", "IO_8", "MJ_9", "IO_9", "MJ_10", "IO_10", "MJ_10-A.1", "IO_10-A.1", "MJ_10-A.1-B.1", "IO_10-A.1-B.1", "MJ_10-B.1", "IO_10-B.1", "MJ_10-C.1", "IO_10-C.1",],
    'DryRunEval-MJ5-eval': ["MJ_1", "IO_1", "MJ_1-A.1", "IO_1-A.1", "MJ_1-B.1", "IO_1-B.1", "MJ_2", "IO_2", "MJ_2-A.1", "IO_2-A.1", "MJ_2-A.1-A.1", "IO_2-A.1-A.1", "MJ_2-A.1-B.1", "IO_2-A.1-B.1", "MJ_2-A.1-B.1-A.1", "IO_2-A.1-B.1-A.1", "MJ_2-B.1", "IO_2-B.1", "MJ_2-B.1-A.1", "IO_2-B.1-A.1", "MJ_2-B.1-B.1", "IO_2-B.1-B.1", "MJ_2-B.1-B.1-A.1", "IO_2-B.1-B.1-A.1", "MJ_3", "IO_3", "MJ_4", "IO_4", "MJ_4.5", "IO_4.5", "MJ_7", "IO_7", "MJ_8", "IO_8", "MJ_8-A.1", "IO_8-A.1", "MJ_8-A.1-A.1", "IO_8-A.1-A.1", "MJ_9", "IO_9", "MJ_9-A.1", "IO_9-A.1", "MJ_9-B.1", "IO_9-B.1", "MJ_9-C.1", "IO_9-C.1"]
}

const HEADER_SIM_DATA = {
    3: [
    "Participant",
    "SimEnv",
    "SimOrder",
    "AD_P1",
    "AD_P2",
    "AD_P3",
    "ST_1.1",
    "ST_1.2",
    "ST_1.3",
    "ST_2.2", 
    "ST_2.3",
    "ST_3.1",
    "ST_3.2",
    "ST_4.1",
    "ST_4.2",
    "ST_4.3",
    "ST_5.1",
    "ST_5.2",
    "ST_5.3",
    "ST_6.1",
    "ST_6.2",
    "ST_8.1",
    "ST_8.2",
    "AD_KDMA_Env",
    "ST_KDMA_Env",
    "AD_KDMA",
    "ST_KDMA"
    ],
    4: [
        "Participant",
        "ADEPT_Scenario",
        "ST_Scenario",
        "QOL_1",
        "QOL_2",
        "QOL_3",
        "QOL_4",
        "QOL_5",
        "QOL_6",
        "QOL_7",
        "QOL_8",
        "QOL_9",
        "QOL_10",
        "QOL_11",
        "QOL_12",
        "QOL_Session_Id",
        "ADEPT_Session_Id",
        "VOL_1",
        "VOL_2",
        "VOL_3",
        "VOL_4",
        "VOL_5",
        "VOL_6",
        "VOL_7",
        "VOL_8",
        "VOL_9",
        "VOL_10",
        "VOL_11",
        "VOL_12",
        "VOL_Session_Id"
    ]
};

export default function AggregateResults({ type }) {
    const { data: evalIdOptionsRaw } = useQuery(get_eval_name_numbers);
    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const fileExtension = '.xlsx';

    const [fullData, setFullData] = React.useState([]);
    const [aggregateData, setAggregateData] = React.useState(null);
    const [showDefinitions, setShowDefinitions] = React.useState(false);
    const [selectedEval, setSelectedEval] = React.useState(4);
    const [iframeLink, setIframeLink] = React.useState(null);
    const [showIframe, setShowIframe] = React.useState(false);
    const [iframeTitle, setIframeTitle] = React.useState(null);

    const { loading, error, data } = useQuery(GET_SURVEY_RESULTS, {
        variables: {"evalNumber": selectedEval}
        // only pulls from network, never cached
        //fetchPolicy: 'network-only',
    });

    React.useEffect(() => {
        evalOptions = [];
        if (evalIdOptionsRaw?.getEvalIdsForSimAlignment) { 
            for (const result of evalIdOptionsRaw.getEvalIdsForSimAlignment) {
                evalOptions.push({value: result._id.evalNumber, label:  result._id.evalName})

            }
        }
         
    }, [evalIdOptionsRaw, evalOptions]);

    const getGroupKey = (row) => {
        return `${row.ADEPT_Scenario}_${row.ST_Scenario}`;
    }

    React.useEffect(() => {
        if (!loading && !error && data?.getAllSurveyResultsByEval && data?.getAllScenarioResultsByEval && data?.getParticipantLog) {
            const full = populateDataSet(data);
            full.sort((a, b) => a['ParticipantID'] - b['ParticipantID']);
            setFullData(full);
            
            const grouped = getAggregatedData();
            if (grouped.groupedSim) {
                const newGroupedSim = {};
                Object.values(grouped.groupedSim).flat().forEach(row => {
                    const key = getGroupKey(row);
                    if (!newGroupedSim[key]) {
                        newGroupedSim[key] = [];
                    }
                    newGroupedSim[key].push(row);
                });
                grouped.groupedSim = newGroupedSim;
            }
            setAggregateData(grouped);
        }
    }, [data, error, loading]);

    const exportToExcel = async () => {
        const dataCopy = structuredClone(fullData);
        for (let pid of Object.keys(dataCopy)) {
            for (let k of Object.keys(dataCopy[pid])) {
                if (typeof dataCopy[pid][k] === 'string' && dataCopy[pid][k].includes('link:')) {
                    dataCopy[pid][k] = dataCopy[pid][k].split('link:')[1];
                }
            }

        }
        const ws = XLSX.utils.json_to_sheet(dataCopy);
        const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: fileType });
        FileSaver.saveAs(data, (selectedEval == 3 ? 'mre_' : 'dre_') + 'participant_data' + fileExtension);
    };

    const exportHumanSimToExcel = async () => {
        if (selectedEval !== 4) {
            let humanSimData = [];
            for (var objkey in aggregateData["groupedSim"]) {
                humanSimData = humanSimData.concat(aggregateData["groupedSim"][objkey]);
            }
            const ws = XLSX.utils.json_to_sheet(humanSimData);
            const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const data = new Blob([excelBuffer], { type: fileType });
            FileSaver.saveAs(data, (selectedEval == 3 ? 'mre_' : 'dre_') + 'human_sim_data' + fileExtension);
        }
        else {
            // create a different sheet for each ADEPT_Scenario and ST_Scenario combination
            const sheets = {};
            const names = [];
            for (const objKey in aggregateData['groupedSim']) {
                const [adeptScenario, stScenario] = objKey.split('_');
                const data = [];
                for (const origObj of aggregateData['groupedSim'][objKey]) {
                    const newObj = {};
                    for (let x of getHeadersEval4(HEADER_SIM_DATA[selectedEval], adeptScenario)) {
                        newObj[x] = origObj[x];
                    }
                    data.push(newObj);
                }
                const ws = XLSX.utils.json_to_sheet(data);
                names.push(objKey);
                sheets[objKey] = ws;
            }
            const wb = { Sheets: sheets, SheetNames: names };
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const data = new Blob([excelBuffer], { type: fileType });
            FileSaver.saveAs(data, 'human_sim_data_dre' + fileExtension);
        }
    };

    const closeModal = () => {
        setShowDefinitions(false);
    }

    function selectEvaluation(target){
        setSelectedEval(target.value);
    }    

    const getHeadersEval4 = (headers, adeptScenario) => {
        const splitPoint = headers.indexOf('ADEPT_Session_Id');
        return [...headers.slice(0, splitPoint), ...ADEPT_HEADERS_DRE[adeptScenario] ?? [], ...headers.slice(splitPoint)];
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
                return <a onClick={() => showGraph(v.split('link:')[1], dataSet['ParticipantID'] + ' ' + key)}>View Graph</a>
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

    return (
        <div className='aggregatePage'>
            {type === 'HumanSimParticipant' && 
                <div className="home-container">
                    <Modal className='table-modal' open={showIframe} onClose={closeIframe}>
                        <div className='modal-body'>
                            <span className='close-icon' onClick={closeIframe}><CloseIcon /></span>
                            <div className='graph-popup'>
                                <h3>{iframeTitle ?? 'KDMA Graph'}</h3>
                                <iframe src={iframeLink} />
                            </div>
                        </div>
                    </Modal>
                    <div className="home-navigation-container">
                        <div className="evaluation-selector-container">
                            <div className="evaluation-selector-label"><h2>{selectedEval == 3 ? "Human Participant Data: Within-Subjects Analysis" : "Participant-Level Data"}</h2></div>
                        </div>
                        <div className="aggregate-button-holder">
                            <button onClick={exportToExcel} className='aggregateDownloadBtn'>Download Participant Data</button>
                            <button className='aggregateDownloadBtn' onClick={() => setShowDefinitions(true)}>View Definitions</button>
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
                                    {HEADER[selectedEval]?.map((val, index) => {
                                        return (<th key={'header-' + index}>
                                            {val}
                                        </th>);
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {fullData.map((dataSet, index) => {
                                    return (<tr key={dataSet['ParticipantID'] + '-' + index}>
                                        {HEADER[selectedEval]?.map((val) => {
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
                            <div className="evaluation-selector-label sim-probe-title"><h2>Human Simulator Probe {selectedEval == 3 ? "by Environment" : "Data"}</h2></div>
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
                
                    {aggregateData["groupedSim"]!== undefined && Object.keys(aggregateData["groupedSim"]).map((objectKey, key) =>
                    {
                        const headers = selectedEval == 3 ? HEADER_SIM_DATA[selectedEval] : getHeadersEval4(HEADER_SIM_DATA[selectedEval], objectKey.split('_')[0]);
                        console.log(objectKey)
                        console.log(key)
                        return (<div className='chart-home-container' key={"container_" + key}>
                            <div className='chart-header'>
                                <div className='chart-header-label'>
                                    <h4 key={"header_" + objectKey}>ADEPT: {objectKey.split('_')[0]}, SoarTech: {objectKey.split('_')[1]}</h4>
                                </div>
                            </div>
                            <div key={"container_" + key} className='resultTableSection result-table-section-override'>
                                
                                <table key={"table_" + objectKey} className="itm-table">
                                    <thead>
                                        <tr>
                                            {
                                                headers?.map((item) => (<th key={"header_" + item}>{item}</th>))
                                            }
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {aggregateData["groupedSim"][objectKey].map((rowObj, rowKey) => (
                                            <tr key={"tr_" + rowKey}>
                                                {headers?.map((item, itemKey) => (<td key={"row_" + item + itemKey}>{rowObj !== undefined ? rowObj[item] : ""}</td>))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>);
                    }
                    )}

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
