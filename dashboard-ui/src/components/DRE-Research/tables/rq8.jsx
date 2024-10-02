import React from "react";
import * as FileSaver from 'file-saver';
import XLSX from 'sheetjs-style';
import '../../SurveyResults/resultsTable.css';
import { RQDefinitionTable } from "../variables/rq-variables";
import CloseIcon from '@material-ui/icons/Close';
import { Modal, Autocomplete, TextField } from "@mui/material";
import definitionXLFile from '../variables/Variable Definitions RQ8.xlsx';
import definitionPDFFile from '../variables/Variable Definitions RQ8.pdf';


const HEADERS = ['Delegator_ID', 'TA1_Name', 'Attribute', 'Scenario', 'Delegator KDMA', 'Alignment score (Delegator|selected target)', 'Assess_patient', 'Assess_total', 'Treat_patient', 'Treat_total', 'Triage_time',
    'Triage_time_patient', 'Engage_patient', 'Tag_ACC', 'Tag_Expectant',
    'Patient1_time', 'Patient1_order', 'Patient1_evac', 'Patient1_assess', 'Patient1_treat', 'Patient1_evac', 'Patient1_tag',
    'Patient2_time', 'Patient2_order', 'Patient2_evac', 'Patient2_assess', 'Patient2_treat', 'Patient2_evac', 'Patient2_tag',
    'Patient3_time', 'Patient3_order', 'Patient3_evac', 'Patient3_assess', 'Patient3_treat', 'Patient3_evac', 'Patient3_tag',
    'Patient4_time', 'Patient4_order', 'Patient4_evac', 'Patient4_assess', 'Patient4_treat', 'Patient4_evac', 'Patient4_tag',
    'Patient5_time', 'Patient5_order', 'Patient5_evac', 'Patient5_assess', 'Patient5_treat', 'Patient5_evac', 'Patient5_tag',
    'Patient6_time', 'Patient6_order', 'Patient6_evac', 'Patient6_assess', 'Patient6_treat', 'Patient6_evac', 'Patient6_tag',
    'Patient7_time', 'Patient7_order', 'Patient7_evac', 'Patient7_assess', 'Patient7_treat', 'Patient7_evac', 'Patient7_tag',
    'Patient8_time', 'Patient8_order', 'Patient8_evac', 'Patient8_assess', 'Patient8_treat', 'Patient8_evac', 'Patient8_tag'
]


export function RQ8() {

    const [formattedData, setFormattedData] = React.useState([]);
    const [ta1s, setTA1s] = React.useState([]);
    const [attributes, setAttributes] = React.useState([]);
    const [scenarios, setScenarios] = React.useState([]);
    const [showDefinitions, setShowDefinitions] = React.useState(false);
    const [ta1Filters, setTA1Filters] = React.useState([]);
    const [scenarioFilters, setScenarioFilters] = React.useState([]);
    const [attributeFilters, setAttributeFilters] = React.useState([]);
    const [filteredData, setFilteredData] = React.useState([]);
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
        FileSaver.saveAs(data, 'RQ-8 data' + fileExtension);
    };

    const openModal = () => {
        setShowDefinitions(true);
    }

    const closeModal = () => {
        setShowDefinitions(false);
    }

    React.useEffect(() => {
        setFilteredData(formattedData.filter((x) =>
            (ta1Filters.length == 0 || ta1Filters.includes(x['TA1_Name'])) &&
            (scenarioFilters.length == 0 || scenarioFilters.includes(x['Scenario'])) &&
            (attributeFilters.length == 0 || attributeFilters.includes(x['Attribute']))
        ));
    }, [ta1Filters, scenarioFilters, attributeFilters]);

    return (<>
        {filteredData.length < formattedData.length && <p className='filteredText'>Showing {filteredData.length} of {formattedData.length} rows based on filters</p>}
        <section className='tableHeader'>
            <div className="filters">
                <Autocomplete
                    multiple
                    options={ta1s}
                    filterSelectedOptions
                    size="small"
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="TA1"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setTA1Filters(newVal)}
                />
                <Autocomplete
                    multiple
                    options={attributes}
                    filterSelectedOptions
                    size="small"
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Attributes"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setAttributeFilters(newVal)}
                />
                <Autocomplete
                    multiple
                    options={scenarios}
                    filterSelectedOptions
                    size="small"
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Scenarios"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setScenarioFilters(newVal)}
                />
            </div>
            <div className="option-section">
                <button className='downloadBtn' onClick={exportToExcel}>Download All Data</button>
                <button className='downloadBtn' onClick={openModal}>View Variable Definitions</button>
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
                    {filteredData.map((dataSet, index) => {
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
        <Modal className='table-modal' open={showDefinitions} onClose={closeModal}>
            <div className='modal-body'>
                <span className='close-icon' onClick={closeModal}><CloseIcon /></span>
                <RQDefinitionTable downloadName={'Definitions_RQ8.pdf'} xlFile={definitionXLFile} pdfFile={definitionPDFFile} />
            </div>
        </Modal>
    </>);
}
