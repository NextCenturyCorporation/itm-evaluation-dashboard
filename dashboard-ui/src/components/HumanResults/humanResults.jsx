import React from "react";
import gql from "graphql-tag";
import { useQuery } from '@apollo/react-hooks';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { ToggleButton, ToggleButtonGroup } from 'react-bootstrap';
import './humanResults.css';

const GET_HUMAN_RESULTS = gql`
    query getAllRawSimData {
        getAllRawSimData
        getAllSimAlignment
  }`;

const ENV_MAP = {
    "sim-sub": "Submarine",
    "sim-urban-sanitized": "Urban",
    "sim-jungle": "Jungle",
    "sim-desert": "Desert"
}

export default function HumanResults() {
    const { data } = useQuery(GET_HUMAN_RESULTS, {
        // only pulls from network, never cached
        fetchPolicy: 'network-only',
    });
    const [dataByScene, setDataByScene] = React.useState(null);
    const [selectedScene, setSelectedScene] = React.useState(null);
    const [selectedPID, setSelectedPID] = React.useState(null);
    const [teamSelected, setSelectedTeam] = React.useState('adept');

    React.useEffect(() => {
        if (data?.getAllRawSimData && data?.getAllSimAlignment) {
            const organized = {};
            for (const entry of data.getAllRawSimData) {
                const scene = entry.data?.configData?.scene;
                const pid = entry.data?.participantId;
                if (scene && pid && entry.data?.actionList) {
                    const probes = data.getAllSimAlignment.filter((x) => pid === x.pid && ENV_MAP[scene].toLowerCase() === x.env);
                    // go through the scene to find where each scenario starts/ends
                    entry['adept'] = [];
                    entry['soartech'] = [];
                    entry['freeform'] = [];
                    let adept_start = -1;
                    let adept_end = -1;
                    let soartech_start = -1;
                    let soartech_end = -1;
                    let freeform_start = -1;
                    let last_action = null;
                    let probes_matched = [];
                    for (const action of entry.data.actionList) {
                        if (soartech_start === -1 && (action.question?.toLowerCase().includes('soartech') || action.casualty.includes('atient U') || action.casualty.includes('atient V') || action.casualty.includes('atient W') || action.casualty.includes('atient X'))) {
                            // soartech!!
                            soartech_start = entry.data.actionList.indexOf(action);
                            if (adept_start !== -1) {
                                adept_end = soartech_start - 1;
                            }
                        }
                        if (adept_start === -1 && (action.question?.toLowerCase().includes('adept') || action.casualty.includes('Adept') || action.casualty.includes('NPC') || action.casualty.includes('Soldier') || action.casualty.includes('electrician') || action.casualty.includes('bystander') || (action.casualty.includes('Civilian 1') && !action.casualty.toLowerCase().includes('male')) || action.casualty.includes('Civilian 2'))) {
                            // adept!! adept shooter/victim, npcs sometimes end up in the data, local soldier and us soldier, electrician and bystander, and jungle civilians
                            adept_start = entry.data.actionList.indexOf(action);
                            if (soartech_start !== -1) {
                                soartech_end = adept_start - 1;
                            }
                        }
                        if ((adept_start !== -1 && soartech_start !== -1 && freeform_start === -1) && (action.casualty.includes('Navy') || action.casualty.includes('Open World') || action.casualty.includes('Marine') || action.casualty.includes('Civilian 1 Female'))) {
                            freeform_start = entry.data.actionList.indexOf(action);
                            if (adept_end === -1) {
                                adept_end = freeform_start - 1;
                            }
                            if (soartech_end === -1) {
                                soartech_end = freeform_start - 1;
                            }
                        }
                        if (last_action && last_action.actionType === 'Pulse' && last_action.actionType === action.actionType && last_action.casualty === action.casualty) {
                            continue;
                        }
                        // see if the action matches a probe
                        let probeFound = false;
                        for (const probe of probes) {
                            for (const match of probe.data.data) {
                                if (!probes_matched.includes(match.probe_id) && match.found_match && match.user_action && match.user_action.actionType === action.actionType && match.user_action.casualty === action.casualty &&
                                    match.user_action.treatment === action.treatment && match.user_action.treatmentLocation === action.treatmentLocation && match.user_action.tagColor === action.tagColor
                                    && match.user_action.tagType === action.tagType && match.user_action.question === action.question && match.user_action.answer === action.answer) {
                                    probeFound = true;
                                    action.probe = match.probe;
                                    probes_matched.push(match.probe_id);
                                    break;
                                }
                            }
                            if (probeFound) {
                                break;
                            }
                        }
                        if (soartech_start !== -1 && soartech_end === -1) {
                            entry['soartech'].push(action);
                        }
                        if (adept_start !== -1 && adept_end === -1) {
                            entry['adept'].push(action);
                        }
                        if (freeform_start !== -1) {
                            entry['freeform'].push(action);
                        }
                        last_action = action;
                    }
                    if (Object.keys(organized).includes(scene)) {
                        organized[scene][pid] = entry;
                    } else {
                        organized[scene] = {};
                        organized[scene][pid] = entry;
                    }
                }
            }
            setDataByScene(organized);
        }
    }, [data]);

    const handleTeamChange = (selected) => {
        if (selected.length === 2) {
            setSelectedTeam(selected[1]);
        }
    };

    return (<div className="human-results">
        <div className="hr-nav">
            {dataByScene &&
                <div className="selection-section">
                    <div className="nav-header">
                        <span className="nav-header-text">Environment</span>
                    </div>
                    <List component="nav" className="nav-list" aria-label="secondary mailbox folder">
                        {Object.keys(dataByScene).map((item) =>
                            <ListItem id={"scene_" + item} key={"scene_" + item}
                                button
                                selected={selectedScene === item}
                                onClick={() => { setSelectedScene(item); setSelectedPID(null); }}>
                                <ListItemText primary={ENV_MAP[item]} />
                            </ListItem>
                        )}
                    </List>
                </div>}
            {selectedScene &&
                <div className="selection-section">
                    <div className="nav-header">
                        <span className="nav-header-text">Participant ID</span>
                    </div>
                    <List component="nav" className="nav-list" aria-label="secondary mailbox folder">
                        {Object.keys(dataByScene[selectedScene]).map((item) =>
                            <ListItem id={"pid_" + item} key={"pid_" + item}
                                button
                                selected={selectedPID === item}
                                onClick={() => setSelectedPID(item)}>
                                <ListItemText primary={item} />
                            </ListItem>
                        )}
                    </List>
                </div>}
        </div>
        {selectedPID ?
            <div className="sim-participant">
                <ToggleButtonGroup className="team-chooser" type="checkbox" value={teamSelected} onChange={handleTeamChange}>
                    <ToggleButton variant="secondary" id='choose-adept' value={"adept"}>ADEPT</ToggleButton>
                    <ToggleButton variant="secondary" id='choose-soartech' value={"soartech"}>SoarTech</ToggleButton>
                    <ToggleButton variant="secondary" id='choose-freeform' value={"freeform"}>Freeform</ToggleButton>
                </ToggleButtonGroup>
                <div className="table-container">
                    <table className="action-list">
                        <thead>
                            <tr>
                                <th>Action Type</th>
                                <th>Action Details</th>
                                {teamSelected !== 'freeform' && <th>Probe</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {
                                (dataByScene[selectedScene][selectedPID][teamSelected]).map((action, index) =>
                                    < tr key={action + '_' + index}>
                                        <td className="action-type-cell">{action.actionType}</td>
                                        <td>
                                            <table className="sub-table">
                                                <tbody>
                                                    {isStringDefined(action.casualty) && <tr><td>Character:</td><td>{action.casualty}</td></tr>}
                                                    {isStringDefined(action.injuryType) && <tr><td>Injury Type:</td><td>{action.injuryType}</td></tr>}
                                                    {isStringDefined(action.treatment) && <tr><td>Treatment:</td><td>{action.treatment}</td></tr>}
                                                    {isStringDefined(action.treatmentLocation) && <tr><td>Treatment Location:</td><td>{action.treatmentLocation}</td></tr>}
                                                    {isStringDefined(action.question) && <tr><td>Question:</td><td>{action.question}</td></tr>}
                                                    {isStringDefined(action.answer) && <tr><td>Answer:</td><td>{action.answer}</td></tr>}
                                                    {isStringDefined(action.breathing) && <tr><td>Breathing:</td><td>{action.breathing}</td></tr>}
                                                    {isStringDefined(action.pulse) && <tr><td>Pulse:</td><td>{action.pulse}</td></tr>}
                                                    {isStringDefined(action.SpO2) && <tr><td>SpO2:</td><td>{action.SpO2}</td></tr>}
                                                    {isStringDefined(action.successfulTreatment) && action.actionType === 'Treatment' && <tr><td>Successful Treatment:</td><td>{action.successfulTreatment.toString()}</td></tr>}
                                                    {isStringDefined(action.tagColor) && <tr><td>Tag Color:</td><td>{action.tagColor}</td></tr>}
                                                    {isStringDefined(action.tagType) && <tr><td>Tag Type:</td><td>{action.tagType}</td></tr>}
                                                </tbody>
                                            </table>

                                        </td>
                                        {teamSelected !== 'freeform' && <td className='probe-cell'>
                                            {action.probe && <table className="sub-table">
                                                <tbody>
                                                    {isStringDefined(action.probe.probe_id) && <tr><td>Probe ID:</td><td>{action.probe.probe_id}</td></tr>}
                                                    {isStringDefined(action.probe.unstructured) && <tr><td>Details:</td><td>{action.probe.unstructured}</td></tr>}
                                                    {isStringDefined(action.probe.action_id) && <tr><td>Action ID:</td><td>{action.probe.action_id}</td></tr>}
                                                    {isStringDefined(action.probe.action_type) && <tr><td>Action Type:</td><td>{action.probe.action_type}</td></tr>}
                                                    {isStringDefined(action.probe.character_id) && <tr><td>Character ID:</td><td>{action.probe.character_id}</td></tr>}
                                                    {isStringDefined(action.probe.choice) && <tr><td>Choice:</td><td>{action.probe.choice}</td></tr>}
                                                    {isStringDefined(action.probe.kdma_association) && <tr><td>KDMA:</td><td>{action.probe.kdma_association[Object.keys(action.probe.kdma_association)[0]]}</td></tr>}
                                                </tbody>
                                            </table>}
                                        </td>}
                                    </tr>
                                )
                            }
                        </tbody>
                    </table>
                </div>
            </div>
            : <h2 className="not-found">Please select an environment and participant to view results</h2>
        }
    </div >);
}

function isStringDefined(str) {
    return str !== '' && str !== undefined && str !== null;
}
