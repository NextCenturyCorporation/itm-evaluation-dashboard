import React from "react";
import { useMutation, useQuery } from '@apollo/react-hooks';
import gql from "graphql-tag";
import { useHistory, useLocation } from 'react-router-dom';
import { useSelector } from "react-redux";
import '../../css/scenario-page.css';
import { evalNameToNumber, phase1ParticipantData, juneJulyParticipantData, septemberParticipantData, ukParticipantData, octoberParticipantData, febParticipantData, aprilParticipantData } from "./config";

const GET_PARTICIPANT_LOG = gql`
    query GetParticipantLog {
        getParticipantLog
    }`;

const ADD_PARTICIPANT = gql`
    mutation addNewParticipantToLog($participantData: JSON!) {
        addNewParticipantToLog(participantData: $participantData) 
    }`;

export default function StartOnline() {
    const currentTextEval = useSelector(state => state.configs.currentTextEval)
    const pidBounds = useSelector(state => state.configs.pidBounds);
    const { refetch } = useQuery(GET_PARTICIPANT_LOG, { fetchPolicy: 'no-cache' });
    const [addParticipant] = useMutation(ADD_PARTICIPANT);
    const history = useHistory();
    const location = useLocation();

    React.useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const adeptQualtrix = queryParams.get('adeptQualtrix');
        const caciProlific = queryParams.get('caciProlific');

        if (adeptQualtrix === 'true' || caciProlific === 'true') {
            createParticipantAndRedirect();
        } else {
            history.push('/login');
        }
    }, [history]);

    const createParticipantAndRedirect = async () => {
        const result = await refetch();
        const currentSearchParams = new URLSearchParams(location.search);
        const existingPid = currentSearchParams.get('pid');

        // reached using survey link from progress table
        if (existingPid) {
            const matchedLog = result.data.getParticipantLog.find(
                log => String(log['ParticipantID']) === existingPid
            );
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

        const lowPid = pidBounds.lowPid;
        const highPid = pidBounds.highPid;

        // calculate new pid
        let newPid = Math.max(...result.data.getParticipantLog.filter((x) =>
            !["202409113A", "202409113B"].includes(x['ParticipantID']) &&
            x.ParticipantID >= lowPid && x.ParticipantID <= highPid
        ).map((x) => Number(x['ParticipantID'])), lowPid - 1) + 1;
        
        const participantDataFunctions = {
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
            <p>Setting up your session...</p>
        </div>
    );
}