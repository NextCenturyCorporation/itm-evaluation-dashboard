import React from "react";
import { useQuery } from 'react-apollo'
import gql from "graphql-tag";
import { getRQ134Data } from "../../Research/utils";
import { getAlignmentComparisonVsTrustRatings, getAlignmentsByAdmType, getAlignmentsByAttribute, getDelegationPreferences, getDelegationVsAlignment, getRatingsBySelectionStatus } from "../DataFunctions";
import Accordion from 'react-bootstrap/Accordion';
import MenuIcon from '@material-ui/icons/Menu';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { RQ1Graphs } from "./Graphs/RQ1_Graphs";
import RQ2Graphs from "./Graphs/RQ2_Graphs";
import RQ3Graphs from "./Graphs/RQ3_Graphs";


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

export default function DreHomePage({ fullData, admAlignment, evalNumber }) {

    const { loading: loadingParticipantLog, error: errorParticipantLog, data: dataParticipantLog } = useQuery(GET_PARTICIPANT_LOG);
    const { loading: loadingSurveyResults, error: errorSurveyResults, data: dataSurveyResults } = useQuery(GET_SURVEY_RESULTS, {
        fetchPolicy: 'no-cache'
    });
    const { loading: loadingTextResults, error: errorTextResults, data: dataTextResults } = useQuery(GET_TEXT_RESULTS, {
        fetchPolicy: 'no-cache'
    });
    const { loading: loadingADMs, error: errorADMs, data: dataADMs } = useQuery(GET_ADM_DATA, {
        variables: { "evalNumber": evalNumber },
        fetchPolicy: 'no-cache'
    });
    const { loading: loadingComparisonData, error: errorComparisonData, data: comparisonData } = useQuery(GET_COMPARISON_DATA, {
        fetchPolicy: 'no-cache'
    });
    const { loading: loadingSim, error: errorSim, data: dataSim } = useQuery(GET_SIM_DATA, { variables: { "evalNumber": evalNumber }, fetchPolicy: 'no-cache' });
    const { data: dreAdms } = useQuery(GET_ADM_DATA, {
        variables: { "evalNumber": 4 }
    });
    const { data: dreSim } = useQuery(GET_SIM_DATA, { variables: { "evalNumber": 4 } });

    const [data, setData] = React.useState(null);
    const [alignVsTrust, setAlignVsTrust] = React.useState(null);
    const [trustVsAlignStatus, setTrustVsAlignStatus] = React.useState(null);
    const [alignmentsByAdmType, setAlignmentsByAdmType] = React.useState(null);
    const [alignmentsByAttribute, setAlignmentsByAttribute] = React.useState(null);
    const [delegationPreferences, setDelegationPreferences] = React.useState(null);
    const [teamDelegation, setTeamDelegation] = React.useState(null);
    const [, setDelVsAlignment] = React.useState(null);
    const [ratingBySelection, setRatingBySelection] = React.useState(null);
    const [groupTargets, setGroupTargets] = React.useState(null);
    const [dreDataForPh1, setDreDataForPh1] = React.useState(null);
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const scrollToElement = (el) => {
        setAnchorEl(null);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    React.useEffect(() => {
        if (dataSurveyResults?.getAllSurveyResults && dataParticipantLog?.getParticipantLog && dataTextResults?.getAllScenarioResults && dataADMs?.getAllHistoryByEvalNumber && comparisonData?.getHumanToADMComparison
            && dataSim?.getAllSimAlignmentByEval && dreAdms?.getAllHistoryByEvalNumber && dreSim?.getAllSimAlignmentByEval) {
            const origData = getRQ134Data(evalNumber, dataSurveyResults, dataParticipantLog, dataTextResults, dataADMs, comparisonData, dataSim);
            setData(origData.allObjs.filter((x) => Number(x['Competence Error']) === 0));
            if (Number(evalNumber) === 5) {
                const dreData = getRQ134Data(4, dataSurveyResults, dataParticipantLog, dataTextResults, dreAdms, comparisonData, dreSim, true, false);
                setDreDataForPh1(dreData.allObjs);
            }
            const tmpGroupTargets = {};
            for (const x of dataTextResults.getAllScenarioResults.filter((x) => Number(x.evalNumber) === Number(evalNumber))) {
                if (Object.keys(x).includes('group_targets')) {
                    for (const k of Object.keys(x['group_targets'])) {
                        if (!Object.keys(tmpGroupTargets).includes(k)) {
                            tmpGroupTargets[k] = [];
                        }
                        tmpGroupTargets[k].push(x['group_targets'][k]);
                    }
                }
            }
            setGroupTargets(tmpGroupTargets);
        }
    }, [dataParticipantLog, dataSurveyResults, dataTextResults, dataADMs, comparisonData, fullData, dreSim, dreAdms]);

    React.useEffect(() => {
        if (data) {
            const trustData = getAlignmentComparisonVsTrustRatings(data);
            if (Number(evalNumber) === 5) {
                const tmpData = structuredClone(data);
                tmpData.push(...dreDataForPh1);
                const trustWithDre = getAlignmentComparisonVsTrustRatings(tmpData);
                setAlignVsTrust(trustWithDre.byAttribute);
            }
            else {
                setAlignVsTrust(trustData.byAttribute);
            }

            setTrustVsAlignStatus(trustData.byAlignment);
            setAlignmentsByAdmType(getAlignmentsByAdmType(data));
            setAlignmentsByAttribute(getAlignmentsByAttribute(data));
            const delPrefs = getDelegationPreferences(data, evalNumber);
            setDelegationPreferences(Number(evalNumber) === 4 ? delPrefs : delPrefs['combined']);
            if (Number(evalNumber) === 5) {
                setTeamDelegation(delPrefs);
            }
            setDelVsAlignment(getDelegationVsAlignment(data));
            setRatingBySelection(getRatingsBySelectionStatus(data));
        }
    }, [data, fullData, dreDataForPh1]);

    if (loadingParticipantLog || loadingSurveyResults || loadingTextResults || loadingADMs || loadingComparisonData || loadingSim) return <p>Loading...</p>;
    if (errorParticipantLog || errorSurveyResults || errorTextResults || errorADMs || errorComparisonData || errorSim) return <p>Error :</p>;

    return (<div className='accordion-homepage'>
        <Accordion defaultActiveKey={["1", "2", "3"]} alwaysOpen>
            <Accordion.Item eventKey="1" id='rq1'>
                <Accordion.Header className='accordion-header-homepage'>1. Does alignment score predict measures of trust?</Accordion.Header>
                <Accordion.Body>
                    <RQ1Graphs data={data} evalNumber={evalNumber} alignmentsByAdmType={alignmentsByAdmType} alignVsTrust={alignVsTrust} trustVsAlignStatus={trustVsAlignStatus} />
                </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="2" id='rq2'>
                <Accordion.Header className='accordion-header-homepage spaced-header'>2. Do aligned ADMs have the ability to tune to a subset of the attribute space?</Accordion.Header>
                <Accordion.Body>
                    <RQ2Graphs admAlignment={admAlignment} evalNumber={evalNumber} groupTargets={groupTargets} />
                </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="3" id='rq3'>
                <Accordion.Header className='accordion-header-homepage spaced-header'>3. Does alignment affect delegation preference for ADMs?</Accordion.Header>
                <Accordion.Body>
                    <RQ3Graphs delegationPreferences={delegationPreferences} evalNumber={evalNumber} teamDelegation={teamDelegation}
                        alignmentsByAttribute={alignmentsByAttribute} ratingBySelection={ratingBySelection} />
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>

        <>
            <button className='floating-menu-btn' title='Navigate' onClick={handleClick}><MenuIcon /></button>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                className='floating-menu'
            >
                <MenuItem onClick={() => scrollToElement(document.getElementById('rq1'))}>RQ1</MenuItem>
                <MenuItem onClick={() => scrollToElement(document.getElementById('rq2'))}>RQ2</MenuItem>
                <MenuItem onClick={() => scrollToElement(document.getElementById('rq3'))}>RQ3</MenuItem>
            </Menu>
        </>
    </div>);

}