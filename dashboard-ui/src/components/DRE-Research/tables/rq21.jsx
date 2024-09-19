import React from "react";
import * as FileSaver from 'file-saver';
import XLSX from 'sheetjs-style';
import '../../SurveyResults/resultsTable.css';



const HEADERS = ['TA1_Name', 'TA2_Name', 'Attribute', 'Scenario', 'Group_Target', 'Participant_ID', 'Decision_Maker', 'Alignment score (Individual|Group_target) or (ADM|group_target)']


export function RQ21() {

    const [formattedData, setFormattedData] = React.useState([{ 'TA1_Name': '-', 'TA2_Name': '-', 'Attribute': '-', 'Scenario': '-', 'Group_Target': '-', 'Participant_ID': '-', 'Decision_Maker': '-', 'Alignment score (Individual|Group_target) or (ADM|group_target)': '-' }]);
    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const fileExtension = '.xlsx';


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
