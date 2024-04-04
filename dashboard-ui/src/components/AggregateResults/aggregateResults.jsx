import React from 'react';
import gql from "graphql-tag";
import { useQuery } from '@apollo/react-hooks';
import { getAggregatedData, populateDataSet, getChartData } from './DataFunctions';
import * as FileSaver from 'file-saver';
import XLSX from 'sheetjs-style';
import './aggregateResults.css';
import ProgramQuestions from './programQuestions';


// turn to true for better dev experience
const SHOW_BY_PARTICIPANT = false;

const GET_SURVEY_RESULTS = gql`
    query GetAllResults{
        getAllSurveyResults,
        getAllScenarioResults,
        getAllSimAlignment
    }`;

const HEADER = [
    'ParticipantID',
    'Date',
    'Gender',
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
]

export default function AggregateResults({ type }) {
    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const fileExtension = '.xlsx';
    const { loading, error, data } = useQuery(GET_SURVEY_RESULTS, {
        // only pulls from network, never cached
        fetchPolicy: 'network-only',
    });

    const [fullData, setFullData] = React.useState([]);
    const [aggregateData, setAggregateData] = React.useState(null);
    const [kdmaScatter, setKdmaScatter] = React.useState(null);
    const [chartData, setChartData] = React.useState(null);

    React.useEffect(() => {
        // only get survey version 2!!
        if (!loading && !error && data?.getAllSurveyResults && data?.getAllScenarioResults) {
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

    return (
        <div className='aggregatePage'>
            {type === 'Aggregate' && <button onClick={exportToExcel} className='aggregateDownloadBtn'>Download Participant Data</button>}
            {type === 'Aggregate' && <div className='resultTableSection'>
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
            </div>}

            {type === 'Program' && <ProgramQuestions chartData={chartData} kdmaScatter={kdmaScatter} allData={fullData} />}
        </div>
    );
}
