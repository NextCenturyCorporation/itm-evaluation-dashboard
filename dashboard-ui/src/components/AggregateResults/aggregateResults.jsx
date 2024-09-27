import React from 'react';
import gql from "graphql-tag";
import { useQuery } from '@apollo/react-hooks';
import { getAggregatedData, populateDataSet, getChartData } from './DataFunctions';
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
        getAllSimAlignmentByEval(evalNumber: $evalNumber)
    }`;

const HEADER = [
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
];

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
    const { loading: loadingEvalNames, error: errorEvalNames, data: evalIdOptionsRaw } = useQuery(get_eval_name_numbers);
    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const fileExtension = '.xlsx';

    const [fullData, setFullData] = React.useState([]);
    const [aggregateData, setAggregateData] = React.useState(null);
    const [kdmaScatter, setKdmaScatter] = React.useState(null);
    const [chartData, setChartData] = React.useState(null);
    const [showDefinitions, setShowDefinitions] = React.useState(false);
    const [selectedEval, setSelectedEval] = React.useState(4);

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

    React.useEffect(() => {
        // only get survey version 2!!
        if (!loading && !error && data?.getAllSurveyResultsByEval && data?.getAllScenarioResultsByEval) {
            const full = populateDataSet(data);
            setFullData(full);
            setAggregateData(getAggregatedData());
            const xtraData = getChartData(full);
            setChartData(xtraData);
            setKdmaScatter(xtraData.scatter);
        }
        
    }, [data, error, loading]);

    const exportToExcel = async () => {
        const ws = XLSX.utils.json_to_sheet(fullData);
        const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: fileType });
        FileSaver.saveAs(data, 'participant_data' + fileExtension);
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
            FileSaver.saveAs(data, 'human_sim_data' + fileExtension);
        }
        else {
            // because of different headers, create a different sheet for each adept environment
            const sheets = {};
            const names = []
            for (const objKey in aggregateData['groupedSim']) {
                // recreate object based on header so that excel sheet is organized (this is important if you don't want a crazy excel doc!)
                const data = [];
                for (const origObj of aggregateData['groupedSim'][objKey]) {
                    const newObj = {};
                    for (let x of getHeadersEval4(HEADER_SIM_DATA[selectedEval], objKey)) {
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
            FileSaver.saveAs(data, 'human_sim_data_' + (selectedEval == 3 ? 'mre' : 'dre') + fileExtension);
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

    return (
        <div className='aggregatePage'>
            {type === 'HumanSimParticipant' && 
                <div className="home-container">
                    <div className="home-navigation-container">
                        <div className="evaluation-selector-container">
                            <div className="evaluation-selector-label"><h2>Human Participant Data: Within-Subjects Analysis</h2></div>
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
                                    {HEADER.map((val, index) => {
                                        return (<th key={'header-' + index}>
                                            {val}
                                        </th>);
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {fullData.map((dataSet, index) => {
                                    return (<tr key={dataSet['ParticipantID'] + '-' + index}>
                                        {HEADER.map((val) => {
                                            return (<td key={dataSet['ParticipantID'] + '-' + val}>
                                                {dataSet[val] ?? '-'}
                                            </td>);
                                        })}
                                    </tr>);
                                })}

                            </tbody>
                        </table>
                    </div>
                </div>
            }

            {type === 'Program' && <ProgramQuestions chartData={chartData} kdmaScatter={kdmaScatter} allData={fullData} />}
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
                        const headers = selectedEval == 3 ? HEADER_SIM_DATA[selectedEval] : getHeadersEval4(HEADER_SIM_DATA[selectedEval], objectKey);
                        return (<div className='chart-home-container' key={"container_" + key}>
                            <div className='chart-header'>
                                <div className='chart-header-label'>
                                    <h4 key={"header_" + objectKey}>{objectKey[0].toUpperCase() + objectKey.slice(1)}</h4>
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
                    <DefinitionTable />
                </div>
            </Modal>}
        </div>
    );
}
