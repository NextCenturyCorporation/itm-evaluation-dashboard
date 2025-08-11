import React from 'react';
import { ResultsTable } from '../../SurveyResults/resultsTable';
import gql from "graphql-tag";
import { useQuery } from '@apollo/react-hooks';
import { Checkbox, FormControlLabel } from "@material-ui/core";
import '../../SurveyResults/resultsTable.css';

const GET_SURVEY_RESULTS = gql`
    query GetSurveyResults{
        getAllSurveyResults
    }`;

const GET_PARTICIPANT_LOG = gql`
    query GetParticipantLog {
        getParticipantLog
    }`;

const GET_COMPARISON_DATA = gql`
    query getHumanToADMComparison {
        getHumanToADMComparison
    }`;

const EVAL_MAP = {
    4: { 'value': '4', 'label': '4 - DRE' },
    5: { 'value': '5', 'label': '5 - PH1' },
    6: { 'value': '6', 'label': '6 - JAN25' },
    8: { 'value': '8', 'label': '8 - PH2 June' },
    9: { 'value': '9', 'label': '9 - PH2 July' }
};


export function BlockedTable({ evalNum }) {
    const { data: surveyData } = useQuery(GET_SURVEY_RESULTS, { fetchPolicy: 'network-only' });
    const { data: pLogData } = useQuery(GET_PARTICIPANT_LOG);
    const { data: comparisonData } = useQuery(GET_COMPARISON_DATA);
    const [includeDRE, setIncludeDRE] = React.useState(false);
    const [includeJAN, setIncludeJAN] = React.useState(false);
    const [includeJune, setIncludeJune] = React.useState(false);
    const [includeJuly, setIncludeJuly] = React.useState(false);
    const [evalNumbers, setEvalNumbers] = React.useState([EVAL_MAP[evalNum]])

    const updateDREStatus = (event) => {
        setIncludeDRE(event.target.checked);
    };

    const updateJANStatus = (event) => {
        setIncludeJAN(event.target.checked);
    };

    const updateJuneStatus = (event) => {
        setIncludeJune(event.target.checked);
    };

    const updateJulyStatus = (event) => {
        setIncludeJuly(event.target.checked);
    };

    const updateEvalNums = (includeEval, evalObj) => {
        if (evalObj["value"].toString() === evalNum.toString())
            return;
        if (includeEval) {
            const newEvalNumbers = structuredClone(evalNumbers);
            newEvalNumbers.push(evalObj);
            setEvalNumbers(newEvalNumbers);
        }
        else {
            const newEvalNumbers = structuredClone(evalNumbers);
            let index = -1;
            for (let i = 0; i < newEvalNumbers.length; i++) {
                if (newEvalNumbers[i]['value'] === String(evalObj["value"])) {
                    index = i;
                    break;
                }
            }
            if (index > -1) {
                newEvalNumbers.splice(index, 1);
            }
            setEvalNumbers(newEvalNumbers);
        }
    };

    React.useEffect(() => {
        // reset toggles on render
        setIncludeDRE(false);
        setIncludeJAN(false);
        setIncludeJune(false);
        setIncludeJuly(false);
        setEvalNumbers([EVAL_MAP[evalNum]]);
    }, [evalNum]);

    React.useEffect(() => {
        updateEvalNums(includeDRE, EVAL_MAP[4]);
    //updateEvalNums excluded to prevent infinite loop from constant function recreation
    // eslint-disable-next-line
    }, [includeDRE]);

    React.useEffect(() => {
        updateEvalNums(includeJAN, EVAL_MAP[6]);
    //updateEvalNums excluded to prevent infinite loop from constant function recreation
    // eslint-disable-next-line
    }, [includeJAN]);

    React.useEffect(() => {
        updateEvalNums(includeJune, EVAL_MAP[8]);
        //updateEvalNums excluded to prevent infinite loop from constant function recreation
        // eslint-disable-next-line
    }, [includeJune]);

    React.useEffect(() => {
        updateEvalNums(includeJuly, EVAL_MAP[9]);
        //updateEvalNums excluded to prevent infinite loop from constant function recreation
        // eslint-disable-next-line
    }, [includeJuly]);

    return (
        <>
            <h2 className='rq134-header'>Delegation Data by Block
                {evalNum === 5 &&
                    <div className='stacked-checkboxes'>
                        <FormControlLabel className='floating-toggle' control={<Checkbox value={includeDRE} onChange={updateDREStatus} />} label="Include DRE Data" />
                        <FormControlLabel className='floating-toggle' control={<Checkbox value={includeJAN} onChange={updateJANStatus} />} label="Include Jan 2025 Eval Data" />
                    </div>}
                {evalNum === 8 &&
                    <div className='stacked-checkboxes'>
                        <FormControlLabel className='floating-toggle centered-toggle' control={<Checkbox value={includeJuly} onChange={updateJulyStatus} />} label="Include July 2025 Eval Data" />
                    </div>}
                {evalNum === 9 &&
                    <div className='stacked-checkboxes'>
                        <FormControlLabel className='floating-toggle centered-toggle' control={<Checkbox value={includeJune} onChange={updateJuneStatus} />} label="Include June 2025 Eval Data" />
                    </div>}
            </h2>
            {surveyData?.getAllSurveyResults && pLogData?.getParticipantLog && comparisonData?.getHumanToADMComparison &&
                <ResultsTable data={surveyData?.getAllSurveyResults} pLog={pLogData?.getParticipantLog}
                    exploratory={true} comparisonData={comparisonData?.getHumanToADMComparison}
                    evalNumbers={evalNumbers} />}
        </>
    )
}