import { LineChart } from "@mui/x-charts";
import React from "react";
import { useQuery } from 'react-apollo'
import gql from "graphql-tag";
import { getRQ134Data } from "../../DRE-Research/utils";
import { cleanDreData } from "../DataFunctions";

const GET_PARTICIPANT_LOG = gql`
    query GetParticipantLog {
        getParticipantLog
    }`;

const GET_SURVEY_RESULTS = gql`
    query GetAllResults {
        getAllSurveyResults
    }`;

const GET_TEXT_RESULTS = gql`
    query GetAllResults {
        getAllScenarioResults
    }`;

const GET_ADM_DATA = gql`
    query getAllHistoryByEvalNumber($evalNumber: Float!){
        getAllHistoryByEvalNumber(evalNumber: $evalNumber)
    }`;

const GET_COMPARISON_DATA = gql`
    query getHumanToADMComparison {
        getHumanToADMComparison
    }`;

const GET_SIM_DATA = gql`
    query GetSimAlignment($evalNumber: Float!){
        getAllSimAlignmentByEval(evalNumber: $evalNumber)
    }`;

export default function DreHomePage({ fullData }) {

    const { loading: loadingParticipantLog, error: errorParticipantLog, data: dataParticipantLog } = useQuery(GET_PARTICIPANT_LOG);
    const { loading: loadingSurveyResults, error: errorSurveyResults, data: dataSurveyResults } = useQuery(GET_SURVEY_RESULTS);
    const { loading: loadingTextResults, error: errorTextResults, data: dataTextResults } = useQuery(GET_TEXT_RESULTS, {
        fetchPolicy: 'no-cache'
    });
    const { loading: loadingADMs, error: errorADMs, data: dataADMs } = useQuery(GET_ADM_DATA, {
        variables: { "evalNumber": 4 }
    });
    const { loading: loadingComparisonData, error: errorComparisonData, data: comparisonData } = useQuery(GET_COMPARISON_DATA);
    const { loading: loadingSim, error: errorSim, data: dataSim } = useQuery(GET_SIM_DATA, { variables: { "evalNumber": 4 } });

    const [data, setData] = React.useState([]);

    React.useEffect(() => {
        if (dataSurveyResults?.getAllSurveyResults && dataParticipantLog?.getParticipantLog && dataTextResults?.getAllScenarioResults && dataADMs?.getAllHistoryByEvalNumber && comparisonData?.getHumanToADMComparison && dataSim?.getAllSimAlignmentByEval) {
            const data = getRQ134Data(dataSurveyResults, dataParticipantLog, dataTextResults, dataADMs, comparisonData, dataSim);
            setData(cleanDreData(data.allObjs));
        }
    }, [dataParticipantLog, dataSurveyResults, dataTextResults, dataADMs, comparisonData]);


    if (loadingParticipantLog || loadingSurveyResults || loadingTextResults || loadingADMs || loadingComparisonData || loadingSim) return <p>Loading...</p>;
    if (errorParticipantLog || errorSurveyResults || errorTextResults || errorADMs || errorComparisonData || errorSim) return <p>Error :</p>;

    return (<>
        <div className='chart-home-container'>
            <div className='chart-header'>
                <div className='chart-header-label'>
                    <h4>1. Does alignment score predict measures of trust?</h4>
                    <LineChart
                        xAxis={[{ label: 'Alignment score (Delegator|Observed_ADM (target))', data: data.map((x) => x['Alignment score (Delegator|Observed_ADM (target))']) }]}
                        yAxis={[{ label: 'Trust_Rating' }]}
                        series={[
                            {
                                data: data.map((x) => x['Trust_Rating']),
                            },
                        ]}
                        width={500}
                        height={300}
                    />
                </div>
            </div>
        </div>
        <div className='chart-home-container'>
            <div className='chart-header'>
                <div className='chart-header-label'>
                    <h4>2. Do aligned ADMs have the ability to tune to a subset of the attribute space?</h4>
                </div>
            </div>
        </div>
        <div className='chart-home-container'>
            <div className='chart-header'>
                <div className='chart-header-label'>
                    <h4>3. Does alignment affect delegation preference for ADMs?</h4>
                </div>
            </div>
        </div>
    </>);

}