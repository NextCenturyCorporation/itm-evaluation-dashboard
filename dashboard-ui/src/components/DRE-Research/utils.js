import * as FileSaver from 'file-saver';
import XLSX from 'sheetjs-style';

export const ADM_NAME_MAP = {
    "TAD-aligned": "Parallax",
    "TAD-severity-baseline": "Parallax",
    "ALIGN-ADM-ComparativeRegression-ICL-Template": "Kitware",
    "ALIGN-ADM-OutlinesBaseline": "Kitware"
};


const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const fileExtension = '.xlsx';

export const exportToExcel = async (filename, formattedData, headers) => {
    // Create a new workbook and worksheet
    const wb = XLSX.utils.book_new();
    const dataCopy = structuredClone(formattedData);
    for (let pid of Object.keys(dataCopy)) {
        for (let k of Object.keys(dataCopy[pid])) {
            if (dataCopy[pid][k] == '-') {
                dataCopy[pid][k] = '';
            }
        }
    }
    const ws = XLSX.utils.json_to_sheet(dataCopy);

    // Adjust column widths
    const colWidths = headers.map(header => ({ wch: Math.max(header.length, 20) }));
    ws['!cols'] = colWidths;

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'RQ Data');

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: fileType });
    FileSaver.saveAs(data, filename + fileExtension);
};

export function getAlignments(textResults, pid) {
    const textResultsForPID = textResults.filter((data) => data.evalNumber == 4 && data.participantID == pid);
    const alignments = [];
    let addedMJ = false;
    for (const textRes of textResultsForPID) {
        if (Object.keys(textRes).includes("combinedAlignmentData")) {
            if (!addedMJ) {
                alignments.push(...textRes['combinedAlignmentData']);
                addedMJ = true;
            }
        }
        else {
            alignments.push(...textRes['alignmentData'])
        }
    }
    return { textResultsForPID, alignments };
}