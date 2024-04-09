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
        if (data?.getAllRawSimData) {
            const organized = {};
            for (const entry of data.getAllRawSimData) {
                const scene = entry.data?.configData?.scene;
                const pid = entry.data?.participantId;
                if (scene && pid && entry.data?.actionList) {
                    // TODO: go through the scene to find where each scenario starts/ends
                    entry['adept_start'] = -1;
                    entry['adept_end'] = -1;
                    entry['soartech_start'] = -1;
                    entry['soartech_end'] = -1;
                    entry['freeform_start'] = -1;
                    entry['freeform_end'] = entry.data.actionList.length;
                    for (const action of entry.data.actionList) {
                        if (entry['soartech_start'] === -1 && (action.question?.toLowerCase().includes('soartech') || action.casualty.includes('atient U') || action.casualty.includes('atient V') || action.casualty.includes('atient W') || action.casualty.includes('atient X'))) {
                            // soartech!!
                            entry['soartech_start'] = entry.data.actionList.indexOf(action);
                            if (entry['adept_start'] !== -1) {
                                entry['adept_end'] = entry['soartech_start'] - 1;
                            }
                        }
                        if (entry['adept_start'] === -1 && (action.question?.toLowerCase().includes('adept') || action.casualty.includes('Adept') || action.casualty.includes('NPC') || action.casualty.includes('Soldier') || action.casualty.includes('electrician') || action.casualty.includes('bystander') || (action.casualty.includes('Civilian 1') && !action.casualty.toLowerCase().includes('male')) || action.casualty.includes('Civilian 2'))) {
                            // adept!! adept shooter/victim, npcs sometimes end up in the data, local soldier and us soldier, electrician and bystander, and jungle civilians
                            entry['adept_start'] = entry.data.actionList.indexOf(action);
                            if (entry['soartech_start'] !== -1) {
                                entry['soartech_end'] = entry['adept_start'] - 1;
                            }
                        }
                        if ((entry['adept_start'] !== -1 && entry['soartech_start'] !== -1 && entry['freeform_start'] === -1) && (action.casualty.includes('Navy') || action.casualty.includes('Open World') || action.casualty.includes('Marine') || action.casualty.includes('Civilian 1 Female'))) {
                            entry['freeform_start'] = entry.data.actionList.indexOf(action);
                            if (entry['adept_end'] === -1) {
                                entry['adept_end'] = entry['freeform_start'] - 1;
                            }
                            if (entry['soartech_end'] === -1) {
                                entry['soartech_end'] = entry['freeform_start'] - 1;
                            }
                        }
                    }
                    console.log(entry);
                    if (Object.keys(organized).includes(scene)) {
                        organized[scene][pid] = entry;
                    } else {
                        organized[scene] = {};
                        organized[scene][pid] = entry;
                    }
                }
            }
            // console.log(organized);
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
                <table className="action-list">
                    <thead>
                        <tr>
                            <th>Action Type</th>
                            <th>Action Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            (dataByScene[selectedScene][selectedPID].data.actionList.slice(teamSelected === 'soartech' ? dataByScene[selectedScene][selectedPID]['soartech_start'] : teamSelected === 'adept' ? dataByScene[selectedScene][selectedPID]['adept_start'] : dataByScene[selectedScene][selectedPID]['freeform_start'], teamSelected === 'soartech' ? dataByScene[selectedScene][selectedPID]['soartech_end'] : teamSelected === 'adept' ? dataByScene[selectedScene][selectedPID]['adept_end'] : dataByScene[selectedScene][selectedPID]['freeform_end'])).map((action, index) =>
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
                                </tr>
                            )
                        }
                    </tbody>
                </table>
            </div>
            : <h2 className="not-found">Please select an environment and participant to view results</h2>
        }
    </div >);
}

function isStringDefined(str) {
    return str !== '' && str !== undefined && str !== null;
}
