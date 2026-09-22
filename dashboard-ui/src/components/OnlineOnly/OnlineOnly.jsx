import React from "react";
import { useMutation } from '@apollo/react-hooks';
import gql from "graphql-tag";
import { useHistory, useLocation } from 'react-router-dom';
import { useSelector } from "react-redux";
import { findParticipantByPid, getNextParticipantId } from '../../services/participantService';
import '../../css/scenario-page.css';
import { evalNameToNumber, phase1ParticipantData, juneJulyParticipantData, septemberParticipantData, ukParticipantData, octoberParticipantData, febParticipantData, aprilParticipantData, juneParticipantData, canadaParticipantData } from "./config";

const ADD_PARTICIPANT = gql`
    mutation addNewParticipantToLog($participantData: JSON!) {
        addNewParticipantToLog(participantData: $participantData) 
    }`;

export default function StartOnline() {
    const currentTextEval = useSelector(state => state.configs.currentTextEval)
    const [addParticipant] = useMutation(ADD_PARTICIPANT);
    const [error, setError] = React.useState(null);
    const history = useHistory();
    const location = useLocation();

    React.useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const adeptQualtrix = queryParams.get('adeptQualtrix');
        const caciProlific = queryParams.get('caciProlific');

        if (adeptQualtrix === 'true' || caciProlific === 'true') {
            createParticipantAndRedirect().catch(error => setError(error.message));
        } else {
            history.push('/login');
        }
    }, [history]);

    const createParticipantAndRedirect = async () => {
        const currentSearchParams = new URLSearchParams(location.search);
        const existingPid = currentSearchParams.get('pid');

        // reached using survey link from progress table
        if (existingPid) {
            const matchedLog = await findParticipantByPid(existingPid);
            if (matchedLog) {
                currentSearchParams.set('class', 'Online');
                history.push({
                    pathname: '/text-based',
                    search: `?${currentSearchParams.toString()}`,
                });
                return;
            }
        }
        const evalNumber = evalNameToNumber[currentTextEval]
        if (!Number.isFinite(evalNumber)) {
            throw new Error('The current evaluation is not configured');
        }

        let newPid = await getNextParticipantId();
        
        const participantDataFunctions = {
            19: canadaParticipantData,
            18: canadaParticipantData,
            17: juneParticipantData,
            16: aprilParticipantData,
            15: febParticipantData,
            13: octoberParticipantData,
            12: ukParticipantData,
            10: septemberParticipantData,
            8: juneJulyParticipantData,
            9: juneJulyParticipantData,
            5: phase1ParticipantData
        };

        const getParticipantDataFn = participantDataFunctions[evalNumber] || phase1ParticipantData;
        const participantData = getParticipantDataFn(currentSearchParams, null, newPid, 'Online', evalNumber);

        // update database
        const addRes = await addParticipant({ variables: { participantData } });
        // extra step to prevent duplicate pids
        newPid = addRes?.data?.addNewParticipantToLog?.ops?.[0]?.ParticipantID;

        currentSearchParams.set('pid', newPid);
        currentSearchParams.set('class', 'Online');
        
        history.push({
            pathname: '/text-based',
            search: `?${currentSearchParams.toString()}`,
        });
    }

    return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
            {error ? <p role="alert">Unable to set up your session: {error}. Please reload to try again.</p>
                : <p>Setting up your session...</p>}
        </div>
    );
}
