import React from "react";
import '../../SurveyResults/resultsTable.css';
import { useQuery } from 'react-apollo'
import gql from "graphql-tag";
import { DownloadButtons } from "./download-buttons";
import CloseIcon from '@material-ui/icons/Close';
import { Modal } from "@mui/material";
import { RQDefinitionTable } from "../variables/rq-variables";
import defs from '../variables/HumanVariability.xlsx';
const headers = [
    "PID",
    "AF_KDMA",
    "AF1_KDMA",
    "AF2_KDMA",
    "AF3_KDMA",
    "AF1_MostAlignedTarget",
    "AF2_MostAlignedTarget",
    "AF3_MostAlignedTarget",
    "AF1_MostAlignedAlignment",
    "AF2_MostAlignedAlignment",
    "AF3_MostAlignedAlignment",
    "MF_KDMA",
    "MF1_KDMA",
    "MF2_KDMA",
    "MF3_KDMA",
    "MF1_MostAlignedTarget",
    "MF2_MostAlignedTarget",
    "MF3_MostAlignedTarget",
    "MF1_MostAlignedAlignment",
    "MF2_MostAlignedAlignment",
    "MF3_MostAlignedAlignment",
    "PS_KDMA",
    "PS1_KDMA",
    "PS2_KDMA",
    "PS3_KDMA",
    "PS1_MostAlignedTarget",
    "PS2_MostAlignedTarget",
    "PS3_MostAlignedTarget",
    "PS1_MostAlignedAlignment",
    "PS2_MostAlignedAlignment",
    "PS3_MostAlignedAlignment",
    "SS_KDMA",
    "SS1_KDMA",
    "SS2_KDMA",
    "SS3_KDMA",
    "SS1_MostAlignedTarget",
    "SS2_MostAlignedTarget",
    "SS3_MostAlignedTarget",
    "SS1_MostAlignedAlignment",
    "SS2_MostAlignedAlignment",
    "SS3_MostAlignedAlignment"
];

const GET_TEXT_RES = gql`
    query getAllScenarioResultsByEval($evalNumber: Float!){
        getAllScenarioResultsByEval(evalNumber: $evalNumber)
    }`;

export function HumanVariability({ evalNum }) {
    const { data, loading, error } = useQuery(GET_TEXT_RES, {
        variables: { "evalNumber": evalNum }
    });

    const [formattedData, setFormattedData] = React.useState([]);
    const [showDefinitions, setShowDefinitions] = React.useState(false);

    const openModal = () => setShowDefinitions(true);
    const closeModal = () => setShowDefinitions(false);

    React.useEffect(() => {
        if (data?.getAllScenarioResultsByEval) {
            const scenarioResults = data.getAllScenarioResultsByEval;

            const participantMap = {};

            scenarioResults.forEach(doc => {
                const pid = doc.participantID;

                if (!participantMap[pid]) {
                    participantMap[pid] = { PID: pid };
                }

                // ( "AF1", "MF2", etc.)
                const scenarioId = doc.scenario_id;
                const match = scenarioId.match(/-(AF\d|MF\d|PS\d|SS\d)-/);

                if (match) {
                    const scenario = match[1];
                    const scenarioType = scenario.substring(0, 2);

                    if (doc.kdmas && doc.kdmas.length > 0) {
                        participantMap[pid][`${scenario}_KDMA`] = doc.kdmas[0].value;
                    }

                    if (doc.combinedKdmas && doc.combinedKdmas.length > 0 && !participantMap[pid][`${scenarioType}_KDMA`]) {
                        participantMap[pid][`${scenarioType}_KDMA`] = doc.combinedKdmas[0].value;
                    }

                    if (doc.mostLeastAligned && doc.mostLeastAligned.length > 0) {
                        const firstEntry = doc.mostLeastAligned[0];
                        if (firstEntry.response && firstEntry.response.length > 0) {
                            // doesn't include 'affiliation_merit'
                            const topAlignment = firstEntry.response.find(item => {
                                const targetKey = Object.keys(item)[0];
                                return !targetKey.includes('affiliation_merit');
                            });

                            if (topAlignment) {
                                const targetKey = Object.keys(topAlignment)[0];
                                const alignmentValue = topAlignment[targetKey];

                                participantMap[pid][`${scenario}_MostAlignedTarget`] = targetKey;
                                participantMap[pid][`${scenario}_MostAlignedAlignment`] = alignmentValue;
                            }
                        }
                    }
                }
            });

            const formattedArray = Object.values(participantMap);
            setFormattedData(formattedArray);
        }
    }, [data]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error.message}</p>;

    return (
        <>
            <h2 className='rq134-header'>Human Variability</h2>

            <section className='tableHeader'>
                <div></div>
                <DownloadButtons
                    formattedData={formattedData}
                    filteredData={formattedData}
                    HEADERS={headers}
                    fileName={'Human_Variability_data'}
                />
            </section>

            <div className='resultTableSection'>
                <table className='itm-table'>
                    <thead>
                        <tr>
                            {headers.map((val, index) => (
                                <th key={'header-' + index}>{val}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {formattedData.length > 0 ? (
                            formattedData.map((dataSet, index) => (
                                <tr key={`row-${index}`}>
                                    {headers.map((val) => (
                                        <td key={`cell-${index}-${val}`}>
                                            {dataSet[val] ?? '-'}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={headers.length}>No data available</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Modal className='table-modal' open={showDefinitions} onClose={closeModal}>
                <div className='modal-body'>
                    <span className='close-icon' onClick={closeModal}><CloseIcon /></span>
                    <RQDefinitionTable
                        downloadName={`Definitions_Human_Variability.xlsx`}
                        xlFile={defs}
                    />
                </div>
            </Modal>
        </>
    );
}