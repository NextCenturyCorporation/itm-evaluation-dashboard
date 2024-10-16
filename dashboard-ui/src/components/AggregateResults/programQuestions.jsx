import React from 'react';
import './aggregateResults.css';
import { populateDataSet } from './DataFunctions';
import gql from "graphql-tag";
import { useQuery } from '@apollo/react-hooks';
import Select from 'react-select';
import MreHomePage from './MRE_homePage';


const get_eval_name_numbers = gql`
    query getEvalIdsForSimAlignment{
        getEvalIdsForSimAlignment
  }`;
let evalOptions = [];

const GET_ADM_DATA = gql`
    query getAllHistoryByEvalNumber($evalNumber: Float!) {
        getAllHistoryByEvalNumber(evalNumber: $evalNumber)
    }`;

const GET_SURVEY_RESULTS = gql`
    query GetAllResults($evalNumber: Float!){
        getAllSurveyResultsByEval(evalNumber: $evalNumber),
        getAllScenarioResultsByEval(evalNumber: $evalNumber),
        getAllSimAlignmentByEval(evalNumber: $evalNumber),
        getParticipantLog
    }`;



export default function ProgramQuestions() {
    const { data: evalIdOptionsRaw } = useQuery(get_eval_name_numbers);
    const [selectedEval, setSelectedEval] = React.useState(3);
    const [fullData, setFullData] = React.useState(null);
    const [admKdmas, setAdmKdmas] = React.useState(null);
    const [admAlignment, setAdmAlignment] = React.useState(null);

    const { data } = useQuery(GET_ADM_DATA, {
        variables: {"evalNumber": selectedEval},
    });
    const { loading, error, data: allData } = useQuery(GET_SURVEY_RESULTS, { variables: { "evalNumber": selectedEval } });

    React.useEffect(() => {
        evalOptions = [];
        if (evalIdOptionsRaw?.getEvalIdsForSimAlignment) {
            for (const result of evalIdOptionsRaw.getEvalIdsForSimAlignment) {
                evalOptions.push({ value: result._id.evalNumber, label: result._id.evalName })
            }
        }

    }, [evalIdOptionsRaw]);

    React.useEffect(() => {
        if (!loading && !error && allData?.getAllSurveyResultsByEval && allData?.getAllScenarioResultsByEval) {
            const full = populateDataSet(allData);
            setFullData(full);
        }
    }, [loading, error, allData]);

    React.useEffect(() => {
        const admKdmas = {};
        const admAlign = {};
        if (data?.getAllHistoryByEvalNumber) {
            for (const x of data.getAllHistoryByEvalNumber) {
                if (x.history.length > 0) {
                    const admName = x.history[0].parameters.adm_name;
                    let scenario;
                    if (!x.history[0].hasOwnProperty('response'))
                        scenario = false;
                    else
                        scenario = x.history[0].response.id;
                    if (!scenario) {
                        scenario = x.history[1].response.id;
                    }
                    const target = x.history[x.history.length - 1].parameters.target_id;
                    const kdma = x.history[x.history.length - 1].response.kdma_values[0].value;
                    if (Object.keys(admKdmas).includes(admName)) {
                        if (Object.keys(admKdmas[admName]).includes(target)) {
                            admKdmas[admName][target][scenario] = kdma;
                            admAlign[admName][target].push(x.history[x.history.length - 1].response.score);
                        }
                        else {
                            admKdmas[admName][target] = {};
                            admKdmas[admName][target][scenario] = kdma;
                            admAlign[admName][target] = [x.history[x.history.length - 1].response.score];
                        }
                    } else {
                        admKdmas[admName] = {};
                        admKdmas[admName][target] = {};
                        admKdmas[admName][target][scenario] = kdma;
                        admAlign[admName] = {};
                        admAlign[admName][target] = [x.history[x.history.length - 1].response.score];
                    }
                }
            }
            setAdmAlignment(admAlign);
            setAdmKdmas(admKdmas);
        }
    }, [data]);

    function selectEvaluation(target){
        setSelectedEval(target.value);
    }    
    
    return (
        <div className="home-container">
            <div className="selection-section">
                <Select
                    onChange={selectEvaluation}
                    options={evalOptions}
                    defaultValue={evalOptions[0]}
                    placeholder="Select Evaluation"
                    value={evalOptions.find(option => option.value === selectedEval)}
                    styles={{
                        // Fixes the overlapping problem of the component
                        menu: provided => ({ ...provided, zIndex: 9999 })
                    }}
                />

            </div>   
            {selectedEval == 3 ? <MreHomePage fullData={fullData} admKdmas={admKdmas} admAlignment={admAlignment} /> : <></>}
        </div>
    );
}



