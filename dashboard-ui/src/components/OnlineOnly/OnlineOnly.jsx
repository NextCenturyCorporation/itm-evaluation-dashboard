import React from "react";
import { useMutation, useQuery } from '@apollo/react-hooks';
import gql from "graphql-tag";
import { TextBasedScenariosPageWrapper } from "../TextBasedScenarios/TextBasedScenariosPage";
import { useHistory, useLocation } from 'react-router-dom';
import bcrypt from 'bcryptjs';
import '../../css/scenario-page.css';

const GET_PARTICIPANT_LOG = gql`
    query GetParticipantLog {
        getParticipantLog
    }`;

const ADD_PARTICIPANT = gql`
    mutation addNewParticipantToLog($participantData: JSON!, $lowPid: Int!, $highPid: Int!) {
        addNewParticipantToLog(participantData: $participantData, lowPid: $lowPid, highPid: $highPid) 
    }`;

const LOG_VARIATIONS = [
    { "Text-1": "AD-1", "Text-2": "ST-1", "Sim-1": "AD-2", "Sim-2": "ST-2", "Del-1": "AD-3", "Del-2": "ST-3", "ADMOrder": 1 },
    { "Text-1": "ST-1", "Text-2": "AD-2", "Sim-1": "ST-2", "Sim-2": "AD-3", "Del-1": "ST-3", "Del-2": "AD-1", "ADMOrder": 2 },
    { "Text-1": "AD-2", "Text-2": "ST-2", "Sim-1": "AD-3", "Sim-2": "ST-3", "Del-1": "AD-1", "Del-2": "ST-1", "ADMOrder": 3 },
    { "Text-1": "ST-2", "Text-2": "AD-3", "Sim-1": "ST-3", "Sim-2": "AD-1", "Del-1": "ST-1", "Del-2": "AD-2", "ADMOrder": 4 },
    { "Text-1": "AD-3", "Text-2": "ST-3", "Sim-1": "AD-1", "Sim-2": "ST-1", "Del-1": "AD-2", "Del-2": "ST-2", "ADMOrder": 1 },
    { "Text-1": "ST-3", "Text-2": "AD-1", "Sim-1": "ST-1", "Sim-2": "AD-2", "Del-1": "ST-2", "Del-2": "AD-3", "ADMOrder": 2 },
    { "Text-1": "AD-1", "Text-2": "ST-1", "Sim-1": "AD-2", "Sim-2": "ST-2", "Del-1": "AD-3", "Del-2": "ST-3", "ADMOrder": 3 },
    { "Text-1": "ST-1", "Text-2": "AD-2", "Sim-1": "ST-2", "Sim-2": "AD-3", "Del-1": "ST-3", "Del-2": "AD-1", "ADMOrder": 4 },
    { "Text-1": "AD-2", "Text-2": "ST-2", "Sim-1": "AD-3", "Sim-2": "ST-3", "Del-1": "AD-1", "Del-2": "ST-1", "ADMOrder": 1 },
    { "Text-1": "ST-2", "Text-2": "AD-3", "Sim-1": "ST-3", "Sim-2": "AD-1", "Del-1": "ST-1", "Del-2": "AD-2", "ADMOrder": 2 },
    { "Text-1": "AD-3", "Text-2": "ST-3", "Sim-1": "AD-1", "Sim-2": "ST-1", "Del-1": "AD-2", "Del-2": "ST-2", "ADMOrder": 3 },
    { "Text-1": "ST-3", "Text-2": "AD-1", "Sim-1": "ST-1", "Sim-2": "AD-2", "Del-1": "ST-2", "Del-2": "AD-3", "ADMOrder": 4 },
    { "Text-1": "AD-1", "Text-2": "ST-1", "Sim-1": "AD-2", "Sim-2": "ST-2", "Del-1": "AD-3", "Del-2": "ST-3", "ADMOrder": 3 },
    { "Text-1": "ST-1", "Text-2": "AD-2", "Sim-1": "ST-2", "Sim-2": "AD-3", "Del-1": "ST-3", "Del-2": "AD-1", "ADMOrder": 4 },
    { "Text-1": "AD-2", "Text-2": "ST-2", "Sim-1": "AD-3", "Sim-2": "ST-3", "Del-1": "AD-1", "Del-2": "ST-1", "ADMOrder": 1 },
    { "Text-1": "ST-2", "Text-2": "AD-3", "Sim-1": "ST-3", "Sim-2": "AD-1", "Del-1": "ST-1", "Del-2": "AD-2", "ADMOrder": 2 },
    { "Text-1": "AD-3", "Text-2": "ST-3", "Sim-1": "AD-1", "Sim-2": "ST-1", "Del-1": "AD-2", "Del-2": "ST-2", "ADMOrder": 3 },
    { "Text-1": "ST-3", "Text-2": "AD-1", "Sim-1": "ST-1", "Sim-2": "AD-2", "Del-1": "ST-2", "Del-2": "AD-3", "ADMOrder": 4 },
    { "Text-1": "AD-1", "Text-2": "ST-1", "Sim-1": "AD-2", "Sim-2": "ST-2", "Del-1": "AD-3", "Del-2": "ST-3", "ADMOrder": 1 },
    { "Text-1": "ST-1", "Text-2": "AD-2", "Sim-1": "ST-2", "Sim-2": "AD-3", "Del-1": "ST-3", "Del-2": "AD-1", "ADMOrder": 2 },
    { "Text-1": "AD-2", "Text-2": "ST-2", "Sim-1": "AD-3", "Sim-2": "ST-3", "Del-1": "AD-1", "Del-2": "ST-1", "ADMOrder": 3 },
    { "Text-1": "ST-2", "Text-2": "AD-3", "Sim-1": "ST-3", "Sim-2": "AD-1", "Del-1": "ST-1", "Del-2": "AD-2", "ADMOrder": 4 },
    { "Text-1": "AD-3", "Text-2": "ST-3", "Sim-1": "AD-1", "Sim-2": "ST-1", "Del-1": "AD-2", "Del-2": "ST-2", "ADMOrder": 1 },
    { "Text-1": "ST-3", "Text-2": "AD-1", "Sim-1": "ST-1", "Sim-2": "AD-2", "Del-1": "ST-2", "Del-2": "AD-3", "ADMOrder": 2 }
];

export default function StartOnline() {
    const { refetch } = useQuery(GET_PARTICIPANT_LOG, { fetchPolicy: 'no-cache' });
    const [addParticipant] = useMutation(ADD_PARTICIPANT);
    const [textTime, setTextTime] = React.useState(false);
    const history = useHistory();
    const location = useLocation();


    React.useEffect(() => {
        // make sure adeptQualtrix is true, otherwise send to login
        const queryParams = new URLSearchParams(window.location.search);
        const adeptQualtrix = queryParams.get('adeptQualtrix');
        if (adeptQualtrix != 'true') {
            history.push('/login');
        }
        if (queryParams.get('startSurvey') == 'true') {
            setTextTime(true);
        }
    }, []);

    const startSurvey = async () => {
        // get pid
        // get current plog
        const result = await refetch();
        // calculate new pid
        const lowPid = 202411500;
        const highPid = 202411799;
        let newPid = Math.max(...result.data.getParticipantLog.filter((x) =>
            !["202409113A", "202409113B"].includes(x['ParticipantID']) &&
            x.ParticipantID >= lowPid && x.ParticipantID <= highPid
        ).map((x) => Number(x['ParticipantID'])), lowPid - 1) + 1;
        // get correct plog data
        const setNum = newPid % 24;
        const currentSearchParams = new URLSearchParams(location.search);
        const participantData = {
            ...LOG_VARIATIONS[setNum], "ParticipantID": newPid, "Type": "Online", "prolificId": currentSearchParams.get('PROLIFIC_PID'), "contactId": currentSearchParams.get('ContactID'),
            "claimed": true, "simEntryCount": 0, "surveyEntryCount": 0, "textEntryCount": 0, "hashedEmail": bcrypt.hashSync(newPid.toString(), "$2a$10$" + process.env.REACT_APP_EMAIL_SALT)
        };
        // update database
        const addRes = await addParticipant({ variables: { participantData, lowPid, highPid } });
        // extra step to prevent duplicate pids
        newPid = addRes?.data?.addNewParticipantToLog?.ops?.[0]?.ParticipantID;



        currentSearchParams.set('pid', newPid);
        currentSearchParams.set('class', 'Online');
        history.push({
            pathname: location.pathname,
            search: `?${currentSearchParams.toString()}`,
        });
        setTextTime(true);
    }

    return (
        <>
            {!textTime && <div className="text-instructions">
                <h2>Instructions</h2>
                <p><b>Welcome to the ITM Text Scenario experiment. Thank you for your participation.</b>
                    <br />
                    During this portion of the experiment, you will be presented with several medical triage scenarios. You will be given action options from which to choose. Please consider
                    how you would act if you were placed in this scenario.
                </p>
                <h4>Guidelines:</h4>
                <ul>
                    <li>Choose the option that best matches how you would triage the scenario.</li>
                    <li>Read all details to clearly understand each question before responding.</li>
                </ul>
                <p className='center-text'>Press "Start" to begin.</p>
                <button onClick={startSurvey}>Start</button>
            </div>}
            {textTime && <TextBasedScenariosPageWrapper />}
        </>
    );
}
