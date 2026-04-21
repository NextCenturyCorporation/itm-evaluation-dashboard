import gql from "graphql-tag";
import React from "react";
import { DownloadButtons } from "./download-buttons";
import { useQuery } from "react-apollo";
import '../../../css/resultsTable.css';


export const GET_TCCC_RESULTS = gql`
    query getTcccResults($eval: String) {
        getTcccResults(eval: $eval)
    }
`;

export function TCCC({ evalDate }) {
    const { loading: loadingTcccResults, error: errorTcccResults, data: dataTcccResults } = useQuery(GET_TCCC_RESULTS, {variables: {eval: evalDate}})

    const [formattedData, setFormattedData] = React.useState([]);
    const [filteredData, setFilteredData] = React.useState([]);
    const [HEADERS, setHeaders] = React.useState([]);

    React.useEffect(() => {
        if (!dataTcccResults) {
            return
        }

        const dataResults = dataTcccResults.getTcccResults.map(doc => {
            const row = { 'pid': doc.pid }
            if (doc.tccc_analysis) {
                for (const [key, val] of Object.entries(doc.tccc_analysis)) {
                    if (key === 'File Name' || key === 'PID') {
                        continue
                    }
                    row[`tccc_analysis: ${key}`] = val
                }
            }

            if (doc.ordered_tagging) {
                for (const [key, val] of Object.entries(doc.ordered_tagging)) {
                    if (key === 'Participant') {
                        continue
                    }
                    row[`ordered_tagging: ${key}`] = val
                }
            }
           
            if (doc.interaction_time) {
                for (const [key, val] of Object.entries(doc.interaction_time)) {
                    if (key === 'PID') {
                        continue
                    }
                    row[`interaction_time: ${key}`] = val
                }
            }

            if (doc.patient_hc_times) {
                for (const [key, val] of Object.entries(doc.patient_hc_times)) {
                    if (key === 'PID') {
                        continue
                    }
                    row[`patient_hc_times: ${key}`] = val
                }
            }

            return row
        })

        if (dataResults.length > 0) {
            setFormattedData(dataResults)
            setFilteredData(dataResults)
            setHeaders(Array.from(new Set(dataResults.map(row => Object.keys(row)).flat())))
        }
    }, [dataTcccResults]);

    if (loadingTcccResults) return <p>Loading...</p>;
    if (errorTcccResults) return <p>Error :</p>;

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
        </>
    )
}