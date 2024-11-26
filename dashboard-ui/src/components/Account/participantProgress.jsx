import React from "react";
import '../SurveyResults/resultsTable.css';
import { Autocomplete, TextField } from "@mui/material";
import { useQuery } from 'react-apollo'
import gql from "graphql-tag";
import { DownloadButtons } from "../DRE-Research/tables/download-buttons";

const GET_PARTICIPANT_LOG = gql`
    query GetParticipantLog {
        getParticipantLog
    }`;

const HEADERS = ['Participant ID', 'Participant Type', 'Text Responses', 'Survey Responses', 'Sim Entries'];
// const HEADERS = ['Participant ID', 'Participant Type', 'Sim Date', 'Sim-1', 'Sim-2', 'Sim-3', 'Sim-4', 'Text Date', 'Text', 'Del Date', 'Delegation', 'IO1', 'MJ1', 'MJ2', 'MJ4', 'MJ5', 'QOL1', 'QOL2', 'QOL3', 'QOL4', 'VOL1', 'VOL2', 'VOL3', 'VOL4'];


export function ParticipantProgressTable() {
    const { loading: loadingParticipantLog, error: errorParticipantLog, data: dataParticipantLog } = useQuery(GET_PARTICIPANT_LOG);
    const [formattedData, setFormattedData] = React.useState([]);
    const [types, setTypes] = React.useState([]);
    const [typeFilters, setTypeFilters] = React.useState([]);
    const [filteredData, setFilteredData] = React.useState([]);

    React.useEffect(() => {
        if (dataParticipantLog?.getParticipantLog) {
            const participantLog = dataParticipantLog.getParticipantLog;
            const allObjs = [];
            const allTypes = [];

            for (const res of participantLog) {
                console.log(res);
                const obj = {};
                const pid = res['ParticipantID'];
                obj['Participant ID'] = pid;
                obj['Participant Type'] = res['Type'];
                allTypes.push(res['Type']);
                obj['Text Responses'] = res['textEntryCount'];
                obj['Survey Responses'] = res['surveyEntryCount'];
                obj['Sim Entries'] = res['simEntryCount'];
                allObjs.push(obj);
            }
            // // sort
            allObjs.sort((a, b) => {
                // Compare PID
                if (Number(a['Participant_ID']) < Number(b['Participant_ID'])) return -1;
                if (Number(a['Participant_ID']) > Number(b['Participant_ID'])) return 1;
            });
            setFormattedData(allObjs);
            setFilteredData(allObjs);
            setTypes(Array.from(new Set(allTypes)));
        }
    }, [dataParticipantLog]);

    React.useEffect(() => {
        if (formattedData.length > 0) {
            setFilteredData(formattedData.filter((x) =>
                (typeFilters.length == 0 || typeFilters.includes(x['Participant Type']))
            ));
        }
    }, [formattedData, typeFilters]);

    if (loadingParticipantLog) return <p>Loading...</p>;
    if (errorParticipantLog) return <p>Error :</p>;

    return (<>
        <h2 className='progress-header'>Participant Progress</h2>
        {filteredData.length < formattedData.length && <p className='filteredText'>Showing {filteredData.length} of {formattedData.length} rows based on filters</p>}
        <section className='tableHeader'>
            <div className="filters">
                <Autocomplete
                    multiple
                    options={types}
                    filterSelectedOptions
                    size="small"
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Type"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setTypeFilters(newVal)}
                />
            </div>
            <DownloadButtons formattedData={formattedData} filteredData={filteredData} HEADERS={HEADERS} fileName={'Participant_Progress'} openModal={null} />
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
                        return (<tr key={dataSet['Participant_ID'] + '-' + index}>
                            {HEADERS.map((val) => {
                                return (<td key={dataSet['Participant_ID'] + '-' + val}>
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
