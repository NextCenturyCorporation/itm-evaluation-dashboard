import React from "react";
import * as FileSaver from 'file-saver';
import XLSX from 'sheetjs-style';
import '../../SurveyResults/resultsTable.css';
import { useQuery } from 'react-apollo'
import gql from "graphql-tag";

const getAdmData = gql`
    query getAllHistoryByEvalNumber($evalNumber: Float!){
        getAllHistoryByEvalNumber(evalNumber: $evalNumber)
    }`;

const HEADERS = ['Trial_ID', 'TA2_Name', 'TA1_Name', 'Attribute', 'Target', 'Scenario', 'Target_Type (Group/Individual)', 'Aligned ADM Alignment score (ADM|target)', 'Baseline ADM Alignment score (ADM|target)'];

const ADM_NAME_MAP = {
    "TAD-aligned": "Parallax",
    "TAD-severity-baseline": "Parallax",
    "ALIGN-ADM-ComparativeRegression-ICL-Template": "Kitware",
    "ALIGN-ADM-OutlinesBaseline": "Kitware"
};

export function RQ2223() {
    const { loading: loading, error: error, data: data } = useQuery(getAdmData, {
        variables: { "evalNumber": 4 }
    });

    const [formattedData, setFormattedData] = React.useState([]);
    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const fileExtension = '.xlsx';

    React.useEffect(() => {
        if (data?.getAllHistoryByEvalNumber) {
            const admData = data.getAllHistoryByEvalNumber;
            const organized_adms = {};
            const allObjs = [];
            for (const adm of admData) {
                const admName = adm.history[0].parameters.adm_name;
                const scenario = adm.history[0].response?.id ?? adm.history[1].response?.id;
                const last_entry = adm.history[adm.history.length - 1];
                const target = last_entry.parameters.target_id;
                const alignment = last_entry.response.score;
                if (!Object.keys(ADM_NAME_MAP).includes(admName)) {
                    continue;
                }
                const ta2 = ADM_NAME_MAP[admName];
                if (!Object.keys(organized_adms).includes(ta2)) {
                    organized_adms[ta2] = {};
                }
                if (!Object.keys(organized_adms[ta2]).includes(scenario)) {
                    organized_adms[ta2][scenario] = {};
                }
                if (!Object.keys(organized_adms[ta2][scenario]).includes(target)) {
                    organized_adms[ta2][scenario][target] = {};
                }
                organized_adms[ta2][scenario][target][admName] = alignment;
            }
            for (const ta2 of Object.keys(organized_adms)) {
                for (const scenario of Object.keys(organized_adms[ta2])) {
                    let trial = 1;
                    let last_attribute = '';
                    for (const target of Object.keys(organized_adms[ta2][scenario])) {
                        const entryObj = {};
                        const attribute = scenario.includes('qol') ? 'QOL' : scenario.includes('vol') ? 'VOL' : target.includes('Moral') ? 'MJ' : 'IO';
                        if ((last_attribute == 'MJ' && attribute == 'IO') || last_attribute == 'IO' && attribute == 'MJ') {
                            trial = 1;
                        }
                        last_attribute = attribute;
                        entryObj['Trial_ID'] = trial;
                        trial += 1;
                        entryObj['TA2_Name'] = ta2;
                        entryObj['TA1_Name'] = scenario.includes('qol') || scenario.includes('vol') ? 'SoarTech' : 'Adept';
                        entryObj['Attribute'] = attribute;
                        entryObj['Target'] = target;
                        entryObj['Scenario'] = scenario;
                        entryObj['Target_Type (Group/Individual)'] = 'Individual';
                        entryObj['Aligned ADM Alignment score (ADM|target)'] = organized_adms[ta2][scenario][target][ta2 == 'Parallax' ? 'TAD-aligned' : "ALIGN-ADM-ComparativeRegression-ICL-Template"];
                        entryObj['Baseline ADM Alignment score (ADM|target)'] = organized_adms[ta2][scenario][target][ta2 == 'Parallax' ? 'TAD-severity-baseline' : "ALIGN-ADM-OutlinesBaseline"];
                        allObjs.push(entryObj);
                    }

                }
            }
            setFormattedData(allObjs);
        }
    }, [data]);

    const exportToExcel = async () => {
        // Create a new workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(formattedData);

        // Adjust column widths
        const colWidths = HEADERS.map(header => ({ wch: Math.max(header.length, 20) }));
        ws['!cols'] = colWidths;

        // Add the worksheet to the workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Survey Data');

        // Generate Excel file
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: fileType });
        FileSaver.saveAs(data, 'RQ-22_and_RQ-23 data' + fileExtension);
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error :</p>;

    return (<>
        <section className='tableHeader'>
            <div className="option-section">
                <button className='downloadBtn' onClick={exportToExcel}>Download Data</button>
            </div>
        </section>
        <div className='resultTableSection'>
            <table className='itm-table'>
                <thead>
                    <tr>
                        {HEADERS.map((val, index) => {
                            return (<th key={'header-' + index}>
                                {val}
                            </th>);
                        })}
                    </tr>
                </thead>
                <tbody>
                    {formattedData.map((dataSet, index) => {
                        return (<tr key={dataSet['ParticipantId'] + '-' + index}>
                            {HEADERS.map((val) => {
                                return (<td key={dataSet['ParticipantId'] + '-' + val}>
                                    {dataSet[val]}
                                </td>);
                            })}
                        </tr>);
                    })}
                </tbody>
            </table>
        </div>
    </>);
}
