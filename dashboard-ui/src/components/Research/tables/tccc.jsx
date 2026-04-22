import gql from "graphql-tag";
import React from "react";
import { DownloadButtons } from "./download-buttons";
import { useQuery } from "react-apollo";
import '../../../css/resultsTable.css';
import tcccDefinitionXLFile from '../variables/Variable Definitions TCCC.xlsx';
import { RQDefinitionTable } from "../variables/rq-variables";
import { Modal } from "@mui/material";
import CloseIcon from '@material-ui/icons/Close';

export const GET_TCCC_RESULTS = gql`
    query getTcccResults($eval: String) {
        getTcccResults(eval: $eval)
    }
`;

export function TCCC({ evalDate }) {
    const { loading: loadingfilteredTcccData , error: errorfilteredTcccData , data: filteredTcccData } = useQuery(GET_TCCC_RESULTS, {variables: {eval: evalDate}})
    const { loading: loadingallTcccData, error: errorallTcccData, data: allTcccData } = useQuery(GET_TCCC_RESULTS)
    
    const [formattedData, setFormattedData] = React.useState([]);
    const [filteredData, setFilteredData] = React.useState([]);
    const [HEADERS, setHeaders] = React.useState([]);
    const [showDefinitions, setShowDefinitions] = React.useState(false);

    const openModal = () => setShowDefinitions(true);
    const closeModal = () => setShowDefinitions(false);

    React.useEffect(() => {
        if (!filteredTcccData || !allTcccData) {
            return
        }

        const allDataResults = allTcccData.getTcccResults.map(doc => {
            const row = { 'pid': doc.pid }
            if (doc.tccc_analysis) {
                for (const [key, val] of Object.entries(doc.tccc_analysis)) {
                    if (key === 'File Name' || key === 'PID') {
                        continue
                    }
                    row[`tccc_analysis: ${key}`] = val == '' || val == '-'|| val == 'N/A' || val == 'None' ? null : val
                
                }
            }

            if (doc.ordered_tagging) {
                for (const [key, val] of Object.entries(doc.ordered_tagging)) {
                    if (key === 'Participant') {
                        continue
                    }
                    row[`ordered_tagging: ${key}`] = val == '' || val == '-'|| val == 'N/A' || val == 'None' ? null : val
                }
            }
            
           
            if (doc.interaction_time) {
                for (const [key, val] of Object.entries(doc.interaction_time)) {
                    if (key === 'PID') {
                        continue
                    }
                    row[`interaction_time: ${key}`] = val == '' || val == '-'|| val == 'N/A' || val == 'None' ? null : val
                
                }
            }

            if (doc.patient_hc_times) {
                for (const [key, val] of Object.entries(doc.patient_hc_times)) {
                    if (key === 'PID') {
                        continue
                    }
                    row[`patient_hc_times: ${key}`] = val == '' || val == '-'|| val == 'N/A' || val == 'None' ? null : val

                }
            }

            return row
        })

        const filteredDataResults = filteredTcccData.getTcccResults.map(doc => {
            const row = { 'pid': doc.pid }
            if (doc.tccc_analysis) {
                for (const [key, val] of Object.entries(doc.tccc_analysis)) {
                    if (key === 'File Name' || key === 'PID') {
                        continue
                    }
                    row[`tccc_analysis: ${key}`] = val == '' || val == '-'|| val == 'N/A' || val == 'None' ? null : val
                
                    }
            }

            if (doc.ordered_tagging) {
                for (const [key, val] of Object.entries(doc.ordered_tagging)) {
                    if (key === 'Participant') {
                        continue
                    }
                    row[`ordered_tagging: ${key}`] = val == '' || val == '-'|| val == 'N/A' || val == 'None' ? null : val
                    }
            }
            
           
            if (doc.interaction_time) {
                for (const [key, val] of Object.entries(doc.interaction_time)) {
                    if (key === 'PID') {
                        continue
                    }
                    row[`interaction_time: ${key}`] = val == '' || val == '-'|| val == 'N/A' || val == 'None' ? null : val
                
                }
            }

            if (doc.patient_hc_times) {
                for (const [key, val] of Object.entries(doc.patient_hc_times)) {
                    if (key === 'PID') {
                        continue
                    }
                    row[`patient_hc_times: ${key}`] = val == '' || val == '-'|| val == 'N/A' || val == 'None' ? null : val

                }
            }

            return row
        })

        if (filteredDataResults.length > 0 || allDataResults.length > 0) {
            console.log(filteredData.length, formattedData.length)
            setFormattedData(allDataResults)
            setFilteredData(filteredDataResults)
            setHeaders(Array.from(new Set(allDataResults.map(row => Object.keys(row)).flat())))
        }
    }, [filteredTcccData, allTcccData]);

    if (loadingallTcccData) return <p>Loading...</p>;
    if (errorallTcccData) return <p>Error :</p>;

    return (
        <>
            <section className="tableHeader">
                <h2 className="rq134-header">TCCC Data</h2>
                <div className="filters"></div>
                <DownloadButtons
                    formattedData={formattedData}
                    filteredData={filteredData}
                    HEADERS={HEADERS}
                    fileName={evalDate ? `tccc_${evalDate}` : 'tccc'}
                    extraAction={openModal}
                />
            </section>
        
            <div className="resultTableSection">
                <table className="itm-table">
                    <thead>
                        <tr>
                            {HEADERS.map(header => <th key={header}>{header}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map(row => (
                            <tr key={row.pid}>
                                {HEADERS.map(header => <td key={header}>{row[header]}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Modal className='table-modal' open={showDefinitions} onClose={closeModal}>
                <div className='modal-body'>
                    <span className='close-icon' onClick={closeModal}><CloseIcon /></span>
                    <RQDefinitionTable
                        downloadName={`Definitions_TCCC.xlsx`}
                        xlFile={tcccDefinitionXLFile}
                    />
                </div>
            </Modal>
        </>
    )
}