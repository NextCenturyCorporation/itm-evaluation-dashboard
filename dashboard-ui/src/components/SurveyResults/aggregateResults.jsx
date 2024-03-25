import React from 'react';
import gql from "graphql-tag";
import { useQuery } from '@apollo/react-hooks';
import { populateDataSet } from './DataFunctions';
import * as FileSaver from 'file-saver';
import XLSX from 'sheetjs-style';

const GET_SURVEY_RESULTS = gql`
    query GetSurveyResults{
        getAllSurveyResults
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
    'ST_AlignText',
    'ST_AlignSim',
    'ST_AttribGrp',
    'AD_AlignText',
    'AD_AlignSim',
    'AD_AttribGrp',
    'ST_Del',
    'ST_ConfFC',
    'ST_Del_Omni',
    'ST_ConfFC_Omni',
    'ST_Align_DelC',
    'ST_Align_DelFC',
    'ST_Align_DelC_Omni',
    'ST_Align_DelFC_Omni',
    'ST_Align_Trust',
    'ST_Misalign_Trust',
    'ST_Align_Agree',
    'ST_Misalign_Agree',
    'ST_Align_Trustworthy',
    'ST_Misalign_Trustworthy',
    'ST_Align_AlignSR',
    'ST_Misalign_AlignSR',
    'ST_Align_Trust_Omni',
    'ST_Misalign_Trust_Omni',
    'ST_Align_Agree_Omni',
    'ST_Misalign_Agree_Omni',
    'ST_Align_Trustworthy_Omni',
    'ST_Misalign_Trustworthy_Omni',
    'ST_Align_AlignSR_Omni',
    'ST_Misalign_AlignSR_Omni',
    'AD_Del',
    'AD_ConfFC',
    'AD_Del_Omni',
    'AD_ConfFC_Omni',
    'AD_Align_DelC',
    'AD_Align_DelFC',
    'AD_Align_DelC_Omni',
    'AD_Align_DelFC_Omni',
    'AD_Align_Trust',
    'AD_Misalign_Trust',
    'AD_Align_Agree',
    'AD_Misalign_Agree',
    'AD_Align_Trustworthy',
    'AD_Misalign_Trustworthy',
    'AD_Align_AlignSR',
    'AD_Misalign_AlignSR',
    'AD_Align_Trust_Omni',
    'AD_Misalign_Trust_Omni',
    'AD_Align_Agree_Omni',
    'AD_Misalign_Agree_Omni',
    'AD_Align_Trustworthy_Omni',
    'AD_Misalign_Trustworthy_Omni',
    'AD_Align_AlignSR_Omni',
    'AD_Misalign_AlignSR_Omni'
]


export default function AggregateResults() {
    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const fileExtension = '.xlsx';
    const { loading, error, data } = useQuery(GET_SURVEY_RESULTS, {
        // only pulls from network, never cached
        fetchPolicy: 'network-only',
    });

    const [fullData, setFullData] = React.useState([]);

    React.useEffect(() => {
        // only get survey version 2!!
        if (data?.getAllSurveyResults) {
            setFullData(populateDataSet(data));
        }
    }, [data]);

    const exportToExcel = async () => {
        const ws = XLSX.utils.json_to_sheet(fullData);
        const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: fileType });
        FileSaver.saveAs(data, 'participant_data' + fileExtension);
    };

    return (
        <>
            <button onClick={exportToExcel}>Download</button>
            <div className='resultTableSection'>
                <table>
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
            </div></>
    );
}