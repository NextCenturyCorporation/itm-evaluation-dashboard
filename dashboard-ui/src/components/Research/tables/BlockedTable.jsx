import React, { useCallback } from 'react';
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

const DRE = { 'value': '4', 'label': '4 - DRE' };
const PH1 = { 'value': '5', 'label': '5 - PH1' };
const JAN = { 'value': '6', 'label': '6 - JAN25' };

export function BlockedTable({ evalNum }) {
    const { data: surveyData } = useQuery(GET_SURVEY_RESULTS, { fetchPolicy: 'network-only' });
    const { data: pLogData } = useQuery(GET_PARTICIPANT_LOG);
    const { data: comparisonData } = useQuery(GET_COMPARISON_DATA);
    const [includeDRE, setIncludeDRE] = React.useState(false);
    const [includeJAN, setIncludeJAN] = React.useState(false);
    const [evalNumbers, setEvalNumbers] = React.useState([evalNum === 4 ? DRE : evalNum === 5 ? PH1 : JAN])
    const updateDREStatus = (event) => {
        setIncludeDRE(event.target.checked);
    };

    const updateJANStatus = (event) => {
        setIncludeJAN(event.target.checked);
    };

    const updateEvalNums = useCallback((includeEval, evalObj) => {
    if (includeEval) {
      const newEvalNumbers = structuredClone(evalNumbers);
      newEvalNumbers.push(evalObj);
      setEvalNumbers(newEvalNumbers);
    }
    else {
      const newEvalNumbers = structuredClone(evalNumbers);
      let index = -1;
      for (let i = 0; i < newEvalNumbers.length; i++) {
        if (newEvalNumbers[i]['value'] === evalObj["value"]) {
          index = i;
          break;
        }
      }
      if (index > -1) {
        newEvalNumbers.splice(index, 1);
      }
      setEvalNumbers(newEvalNumbers);
    }
  }, [evalNumbers]);

    React.useEffect(() => {
        // reset toggles on render
        setIncludeDRE(false);
        setIncludeJAN(false);
        setEvalNumbers([evalNum === 4 ? DRE : evalNum === 5 ? PH1 : JAN]);
    }, [evalNum]);

    React.useEffect(() => {
        updateEvalNums(includeDRE, DRE);
    }, [includeDRE, updateEvalNums]);

    React.useEffect(() => {
        updateEvalNums(includeJAN, JAN);
    }, [includeJAN, updateEvalNums]);

    return (
        <>
            <h2 className='rq134-header'>Delegation Data by Block
                {evalNum === 5 &&
                    <div className='stacked-checkboxes'>
                        <FormControlLabel className='floating-toggle' control={<Checkbox value={includeDRE} onChange={updateDREStatus} />} label="Include DRE Data" />
                        <FormControlLabel className='floating-toggle' control={<Checkbox value={includeJAN} onChange={updateJANStatus} />} label="Include Jan 2025 Eval Data" />
                    </div>}
            </h2>
            {surveyData?.getAllSurveyResults && pLogData?.getParticipantLog && comparisonData?.getHumanToADMComparison &&
                <ResultsTable data={surveyData?.getAllSurveyResults} pLog={pLogData?.getParticipantLog}
                    exploratory={true} comparisonData={comparisonData?.getHumanToADMComparison}
                    evalNumbers={evalNumbers} />}
        </>
    )
}