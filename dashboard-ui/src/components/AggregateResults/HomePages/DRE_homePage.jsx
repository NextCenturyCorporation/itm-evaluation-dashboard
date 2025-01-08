import React from "react";
import { useQuery } from 'react-apollo'
import gql from "graphql-tag";
import { getRQ134Data } from "../../Research/utils";
import { getAlignmentComparisonVsTrustRatings, getAlignmentsByAdmType, getAlignmentsByAttribute, getDelegationPreferences, getDelegationVsAlignment, getRatingsBySelectionStatus } from "../DataFunctions";
import CanvasJSReact from '@canvasjs/react-charts';
import { calculateBestFitLine, getBoxWhiskerData, getMean, getMeanAcrossAll, getSeAcrossAll, getStandardError } from "../statistics";
import Accordion from 'react-bootstrap/Accordion';
import MenuIcon from '@material-ui/icons/Menu';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

const CanvasJSChart = CanvasJSReact.CanvasJSChart;

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
    const [delVsAlignment, setDelVsAlignment] = React.useState(null);
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
            setData(origData.allObjs.filter((x) => x['Competence Error'] == 0));
            if (evalNumber == 5) {
                const dreData = getRQ134Data(4, dataSurveyResults, dataParticipantLog, dataTextResults, dreAdms, comparisonData, dreSim, true);
                setDreDataForPh1(dreData.allObjs);
            }
            const tmpGroupTargets = {};
            for (const x of dataTextResults.getAllScenarioResults.filter((x) => x.evalNumber == evalNumber)) {
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
            if (evalNumber == 5) {
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
            setDelegationPreferences(evalNumber == 4 ? delPrefs : delPrefs['combined']);
            if (evalNumber == 5) {
                setTeamDelegation(delPrefs);
            }
            setDelVsAlignment(getDelegationVsAlignment(data));
            setRatingBySelection(getRatingsBySelectionStatus(data));
        }
    }, [data, fullData, dreDataForPh1]);


    const generateAlignedBaselineChart = (alignedAdmName, baselineAdmName, targets, alignColor = '#5B89C1', baselineColor = '#C15B5B') => {
        return (
            <CanvasJSChart options={{
                width: "1200",
                dataPointWidth: 80,
                toolTip: {
                    shared: true
                },
                axisX: {
                    interval: 1
                },
                axisY: {
                    minimum: 0,
                    maximum: 1
                },
                legend: {
                    verticalAlign: "top",
                    horizontalAlign: "center",
                    cursor: "pointer"
                },
                data: [{
                    type: "column",
                    name: "Aligned",
                    color: alignColor,
                    showInLegend: true,
                    toolTipContent: "<b>{label}</b> <br> <span style=\"color:#4F81BC\">{name}</span>: {y}",
                    dataPoints: targets.map((t) => { return { y: getMeanAcrossAll(admAlignment[alignedAdmName], t.target), label: t.label } })
                },
                {
                    type: "error",
                    color: "#555",
                    name: "Variability Range",
                    toolTipContent: "<span style=\"color:#C0504E\">{name}</span>: {y[0]} - {y[1]}",
                    dataPoints: targets.map((t) => { return { y: getSeAcrossAll(admAlignment[alignedAdmName], t.target), label: t.label } })
                },
                {
                    type: "column",
                    name: "Baseline",
                    color: baselineColor,
                    showInLegend: true,
                    toolTipContent: "<b>{label}</b> <br> <span style=\"color:#4F81BC\">{name}</span>: {y}",
                    dataPoints: targets.map((t) => { return { y: getMeanAcrossAll(admAlignment[baselineAdmName], t.target), label: t.label } })
                },
                {
                    type: "error",
                    name: "Variability Range",
                    color: '#555',
                    toolTipContent: "<span style=\"color:#C0504E\">{name}</span>: {y[0]} - {y[1]}",
                    dataPoints: targets.map((t) => { return { y: getSeAcrossAll(admAlignment[baselineAdmName], t.target), label: t.label } })
                    }]
            }} />
        );
    };

    const generateTrustVsAlignedStatusChart = (ta1) => {
        const att1 = ta1 == 'ADEPT' ? 'IO' : 'QOL';
        const att2 = ta1 == 'ADEPT' ? 'MJ' : 'VOL';
        return (
            <div className="boxWhisker outlinedPlot">
                <h4>Trust Ratings predicted by ADM alignment classification ({ta1})</h4>
                <CanvasJSChart options={{
                    maintainAspectRatio: false,
                    height: "500",
                    width: "700",
                    dataPointWidth: 20,
                    legend: {
                        verticalAlign: "top",
                        horizontalAlign: "center",
                        cursor: "pointer"
                    },
                    axisX: {
                        gridThickness: 0,
                        title: "Alignment score (Delegator|Observed_ADM (target))",
                        tickLength: 0,
                        minimum: -0.5,
                        maximum: 2.5,
                        titleFontSize: 20
                    },
                    axisY: {
                        gridThickness: 0,
                        title: "Trust_Rating",
                        maximum: 5.25,
                        minimum: 0.8,
                        titleFontSize: 20
                    },
                    axisX2: {
                        gridThickness: 0,
                        tickLength: 0,
                        labelFormatter: () => "",
                        minimum: -0.5,
                        maximum: 2.5
                    },
                    data: [
                        {
                            color: "#00000000",
                            type: "scatter", dataPoints: [
                                { x: 0, label: 'aligned', y: 0 },
                                { x: 1, label: 'baseline', y: 0 },
                                { x: 2, label: 'misaligned', y: 0 }
                            ]
                        },
                        {
                            color: '#5B89C130',
                            axisXType: 'secondary',
                            type: "scatter", dataPoints: trustVsAlignStatus[att1]
                        },
                        {
                            color: '#5B89C1',
                            markerBorderColor: '#5B89C1',
                            markerColor: '#00000000',
                            markerType: 'circle',
                            markerBorderThickness: 3,
                            markerSize: 15,
                            axisXType: 'secondary',
                            name: att1,
                            showInLegend: true,
                            type: "line", dataPoints: [
                                { x: -0.1, label: 'aligned', y: getMeanAcrossAll({ 'data': trustVsAlignStatus[att1].filter((x) => x.label === 'aligned').map((x) => x.y) }) },
                                { x: 0.9, label: 'baseline', y: getMeanAcrossAll({ 'data': trustVsAlignStatus[att1].filter((x) => x.label === 'baseline').map((x) => x.y) }) },
                                { x: 1.9, label: 'misaligned', y: getMeanAcrossAll({ 'data': trustVsAlignStatus[att1].filter((x) => x.label === 'misaligned').map((x) => x.y) }) }
                            ]
                        },
                        {
                            type: "error",
                            color: "#5B89C1",
                            name: "Variability Range",
                            axisXType: 'secondary',
                            dataPoints: [
                                { x: -0.1, y: getSeAcrossAll({ 'data': trustVsAlignStatus[att1].filter((x) => x.label === 'aligned').map((x) => x.y) }), label: 'aligned' },
                                { x: 0.9, y: getSeAcrossAll({ 'data': trustVsAlignStatus[att1].filter((x) => x.label === 'baseline').map((x) => x.y) }), label: 'baseline' },
                                { x: 1.9, y: getSeAcrossAll({ 'data': trustVsAlignStatus[att1].filter((x) => x.label === 'misaligned').map((x) => x.y) }), label: 'misaligned' }]
                        },
                        {
                            color: '#fcba0330',
                            axisXType: 'secondary',
                            type: "scatter", dataPoints: trustVsAlignStatus[att2]
                        },
                        {
                            color: '#fcba03',
                            markerBorderColor: '#fcba03',
                            markerColor: '#00000000',
                            markerType: 'circle',
                            markerBorderThickness: 3,
                            markerSize: 15,
                            axisXType: 'secondary',
                            name: att2,
                            showInLegend: true,
                            type: "line", dataPoints: [
                                { x: 0.1, label: 'aligned', y: getMeanAcrossAll({ 'data': trustVsAlignStatus[att2].filter((x) => x.label === 'aligned').map((x) => x.y) }) },
                                { x: 1.1, label: 'baseline', y: getMeanAcrossAll({ 'data': trustVsAlignStatus[att2].filter((x) => x.label === 'baseline').map((x) => x.y) }) },
                                { x: 2.1, label: 'misaligned', y: getMeanAcrossAll({ 'data': trustVsAlignStatus[att2].filter((x) => x.label === 'misaligned').map((x) => x.y) }) }
                            ]
                        },
                        {
                            type: "error",
                            color: "#fcba03",
                            name: "Variability Range",
                            axisXType: 'secondary',
                            dataPoints: [
                                { x: 0.1, y: getSeAcrossAll({ 'data': trustVsAlignStatus[att2].filter((x) => x.label === 'aligned').map((x) => x.y) }), label: 'aligned' },
                                { x: 1.1, y: getSeAcrossAll({ 'data': trustVsAlignStatus[att2].filter((x) => x.label === 'baseline').map((x) => x.y) }), label: 'baseline' },
                                { x: 2.1, y: getSeAcrossAll({ 'data': trustVsAlignStatus[att2].filter((x) => x.label === 'misaligned').map((x) => x.y) }), label: 'misaligned' }]
                        }
                    ]
                }} />
            </div>)
    };

    const generateAlignmentScatter = (ta2, att) => {
        const admAccessMap = {
            'Parallax': {
                'baseline': 'TAD-severity-baseline',
                'aligned': 'TAD-aligned'
            },
            'Kitware': {
                'baseline': 'ALIGN-ADM-OutlinesBaseline',
                'aligned': 'ALIGN-ADM-ComparativeRegression-ICL-Template'
            }
        };
        const targetMap = evalNumber == 4 ? {
            'MJ': { 'high': 'ADEPT-DryRun-Moral judgement-Group-High', 'low': 'ADEPT-DryRun-Moral judgement-Group-Low' },
            'IO': { 'high': 'ADEPT-DryRun-Ingroup Bias-Group-High', 'low': 'ADEPT-DryRun-Ingroup Bias-Group-Low' },
            'QOL': { 'high': 'qol-group-target-dre-1', 'low': 'qol-group-target-dre-2' },
            'VOL': { 'high': 'vol-group-target-dre-1', 'low': 'vol-group-target-dre-2' },
        } : {
            'MJ': { 'high': 'ADEPT-Phase1Eval-Moral judgement-Group-High', 'low': 'ADEPT-Phase1Eval-Moral judgement-Group-Low' },
            'IO': { 'high': 'ADEPT-Phase1Eval-Ingroup Bias-Group-High', 'low': 'ADEPT-Phase1Eval-Ingroup Bias-Group-Low' },
            'QOL': { 'high': 'qol-group-target-1-final-eval', 'low': 'qol-group-target-2-final-eval' },
            'VOL': { 'high': 'vol-group-target-1-final-eval', 'low': 'vol-group-target-2-final-eval' },
        };
        if (!Object.keys(targetMap).includes(att) || !Object.keys(groupTargets).includes(targetMap[att]['high'])) {
            return <></>;
        }
        return (
            <CanvasJSChart options={{
                width: "700",
                dataPointWidth: 80,
                toolTip: {
                    shared: true
                },
                axisX: {
                    tickLength: 0
                },
                axisX2: {
                    tickLength: 0,
                    minimum: -0.5,
                    maximum: 1.5
                },
                axisY: {
                    maximum: 1,
                    minimum: 0.5,
                    title: "Alignment score"
                },
                legend: {
                    verticalAlign: "top",
                    horizontalAlign: "center",
                    cursor: "pointer"
                },
                data: [
                    {
                        type: 'scatter',
                        showInLegend: true,
                        markerType: 'circle',
                        markerSize: 8,
                        name: 'Human',
                        color: '#4287f5',
                        dataPoints: [
                            ...(groupTargets[targetMap[att]['high']]?.map((x) => { return { x: 0, y: x, label: ['MJ', 'IO'].includes(att) ? 'High Target' : 'Target 1' } }) ?? []),
                            ...(groupTargets[targetMap[att]['low']]?.map((x) => { return { x: 1, y: x, label: ['MJ', 'IO'].includes(att) ? 'Low Target' : 'Target 2' } }) ?? [])
                        ]
                    },
                    {
                        type: 'scatter',
                        showInLegend: true,
                        name: 'Baseline ADM',
                        markerType: 'square',
                        markerSize: 12,
                        color: '#fcba03',
                        dataPoints: [
                            { x: 0, y: getMean(admAlignment[admAccessMap[ta2]['baseline']][targetMap[att]['high']]), label: ['MJ', 'IO'].includes(att) ? 'High Target' : 'Target 1' },
                            { x: 1, y: getMean(admAlignment[admAccessMap[ta2]['baseline']][targetMap[att]['low']]), label: ['MJ', 'IO'].includes(att) ? 'Low Target' : 'Target 2' }
                        ]
                    },
                    {
                        type: 'scatter',
                        showInLegend: true,
                        markerType: 'triangle',
                        markerSize: 14,
                        name: 'Aligned ADM',
                        color: '#32a852',
                        dataPoints: [
                            { x: 0, y: getMean(admAlignment[admAccessMap[ta2]['aligned']][targetMap[att]['high']]), label: ['MJ', 'IO'].includes(att) ? 'High Target' : 'Target 1' },
                            { x: 1, y: getMean(admAlignment[admAccessMap[ta2]['aligned']][targetMap[att]['low']]), label: ['MJ', 'IO'].includes(att) ? 'Low Target' : 'Target 2' }
                        ]
                    },
                    {
                        type: 'line',
                        color: '#bf1515',
                        showInLegend: true,
                        lineDashType: "dash",
                        axisXType: 'secondary',
                        lineThickness: 4,
                        markerSize: 0,
                        name: 'Lowest human alignment score to group target',
                        dataPoints: [
                            { x: -0.5, y: Math.min(...groupTargets[targetMap[att]['high']]) },
                            { x: 0, y: Math.min(...groupTargets[targetMap[att]['high']]) }
                        ]
                    },
                    {
                        type: 'line',
                        color: '#bf1515',
                        lineDashType: "dash",
                        axisXType: 'secondary',
                        lineThickness: 4,
                        markerSize: 0,
                        dataPoints: [
                            { x: 1, y: Math.min(...groupTargets[targetMap[att]['low']]) },
                            { x: 1.5, y: Math.min(...groupTargets[targetMap[att]['low']]) }
                        ]
                    }
                ]
            }} />
        );
    };

    const generateAlignmentByTargetLineGraph = (ta2, att) => {
        const admAccessMap = {
            'Parallax': {
                'baseline': 'TAD-severity-baseline',
                'aligned': 'TAD-aligned'
            },
            'Kitware': {
                'baseline': 'ALIGN-ADM-OutlinesBaseline',
                'aligned': 'ALIGN-ADM-ComparativeRegression-ICL-Template'
            }
        };
        const targetMap = evalNumber == 4 ? {
            'MJ': ['ADEPT-DryRun-Moral judgement-0.0', 'ADEPT-DryRun-Moral judgement-0.1', 'ADEPT-DryRun-Moral judgement-0.2', 'ADEPT-DryRun-Moral judgement-0.3',
                'ADEPT-DryRun-Moral judgement-0.4', 'ADEPT-DryRun-Moral judgement-0.5', 'ADEPT-DryRun-Moral judgement-0.6', 'ADEPT-DryRun-Moral judgement-0.7',
                'ADEPT-DryRun-Moral judgement-0.8', 'ADEPT-DryRun-Moral judgement-0.9', 'ADEPT-DryRun-Moral judgement-1.0'],
            'IO': ['ADEPT-DryRun-Ingroup Bias-0.0', 'ADEPT-DryRun-Ingroup Bias-0.1', 'ADEPT-DryRun-Ingroup Bias-0.2', 'ADEPT-DryRun-Ingroup Bias-0.3',
                'ADEPT-DryRun-Ingroup Bias-0.4', 'ADEPT-DryRun-Ingroup Bias-0.5', 'ADEPT-DryRun-Ingroup Bias-0.6', 'ADEPT-DryRun-Ingroup Bias-0.7',
                'ADEPT-DryRun-Ingroup Bias-0.8', 'ADEPT-DryRun-Ingroup Bias-0.9', 'ADEPT-DryRun-Ingroup Bias-1.0'],
            'QOL': ['qol-synth-LowExtreme', 'qol-synth-LowCluster', 'qol-human-5032922-SplitLowMulti', 'qol-human-8022671-SplitLowMulti',
                'qol-synth-SplitLowBinary', 'qol-human-0000001-SplitEvenMulti', 'qol-human-1774519-SplitEvenBinary', 'qol-human-9157688-SplitEvenBinary',
                'qol-human-3043871-SplitHighBinary', 'qol-human-6403274-SplitHighBinary', 'qol-human-3447902-SplitHighMulti', 'qol-human-6349649-SplitHighMulti',
                'qol-human-7040555-SplitHighMulti', 'qol-synth-HighCluster', 'qol-human-2932740-HighExtreme', 'qol-synth-HighExtreme'],
            'VOL': ['vol-synth-LowExtreme', 'vol-synth-LowCluster', 'vol-human-3043871-SplitLowMulti', 'vol-human-5032922-SplitLowMulti', 'vol-human-8478698-SplitLowMulti',
                'vol-synth-SplitLowBinary', 'vol-human-2637411-SplitEvenMulti', 'vol-human-2932740-SplitEvenMulti', 'vol-human-6403274-SplitEvenBinary',
                'vol-human-7040555-SplitEvenBinary', 'vol-human-1774519-SplitHighMulti', 'vol-human-8022671-SplitHighMulti', 'vol-synth-HighCluster', 'vol-synth-HighExtreme']
        } : {
            'MJ': ['ADEPT-DryRun-Moral judgement-0.2', 'ADEPT-DryRun-Moral judgement-0.3', 'ADEPT-DryRun-Moral judgement-0.4', 'ADEPT-DryRun-Moral judgement-0.5',
                'ADEPT-DryRun-Moral judgement-0.6', 'ADEPT-DryRun-Moral judgement-0.7', 'ADEPT-DryRun-Moral judgement-0.8'],
            'IO': ['ADEPT-DryRun-Ingroup Bias-0.2', 'ADEPT-DryRun-Ingroup Bias-0.3', 'ADEPT-DryRun-Ingroup Bias-0.4', 'ADEPT-DryRun-Ingroup Bias-0.5',
                'ADEPT-DryRun-Ingroup Bias-0.6', 'ADEPT-DryRun-Ingroup Bias-0.7', 'ADEPT-DryRun-Ingroup Bias-0.8'],
            'QOL': ["qol-synth-LowExtreme-ph1", "qol-synth-LowCluster-ph1", "qol-human-5032922-SplitLowMulti-ph1", "qol-human-8022671-SplitLowMulti-ph1",
                "qol-human-0000001-SplitEvenMulti-ph1", "qol-human-3043871-SplitHighBinary-ph1", "qol-human-6403274-SplitHighBinary-ph1",
                "qol-human-7040555-SplitHighMulti-ph1", "qol-synth-HighCluster-ph1", "qol-synth-HighExtreme-ph1"],
            'VOL': ["vol-synth-LowExtreme-ph1", "vol-synth-LowCluster-ph1", "vol-human-5032922-SplitLowMulti-ph1", "vol-human-8478698-SplitLowMulti-ph1",
                "vol-human-6403274-SplitEvenBinary-ph1", "vol-human-1774519-SplitHighMulti-ph1", "vol-human-8022671-SplitHighMulti-ph1",
                "vol-synth-HighCluster-ph1"]
        };

        return (
            <CanvasJSChart options={{
                width: "1200",
                dataPointWidth: 15,
                toolTip: {
                    shared: true
                },
                axisX: {
                    minimum: evalNumber == 5 ? (['MJ', 'IO'].includes(att) ? 0.17 : -1) : (['MJ', 'IO'].includes(att) ? -0.03 : -1),
                    title: att + ' Targets',
                    interval: ['MJ', 'IO'].includes(att) ? 0.1 : 1
                },
                axisY: {
                    maximum: 1.05,
                    minimum: 0,
                    title: "Alignment score"
                },
                legend: {
                    verticalAlign: "top",
                    horizontalAlign: "center",
                    cursor: "pointer"
                },
                data: [
                    {
                        type: 'spline',
                        showInLegend: true,
                        name: 'Aligned',
                        color: '#5B89C1',
                        dataPoints: targetMap[att].map((target) => { return { y: getMean(admAlignment[admAccessMap[ta2]['aligned']][target] ?? []), x: ['MJ', 'IO'].includes(att) ? Number(target.slice(-3)) : targetMap[att].indexOf(target), label: ['MJ', 'IO'].includes(att) ? '' : target } })
                    },
                    {
                        type: 'spline',
                        showInLegend: true,
                        name: 'Baseline',
                        color: '#C15B5B',
                        dataPoints: targetMap[att].map((target) => { return { y: getMean(admAlignment[admAccessMap[ta2]['baseline']][target] ?? []), x: ['MJ', 'IO'].includes(att) ? Number(target.slice(-3)) : targetMap[att].indexOf(target), label: ['MJ', 'IO'].includes(att) ? '' : target } })
                    },
                    {
                        type: 'error',
                        name: 'Variability Range (aligned)',
                        color: '#555',
                        dataPoints: targetMap[att].map((target) => { return { y: getStandardError(admAlignment[admAccessMap[ta2]['aligned']][target] ?? []), x: ['MJ', 'IO'].includes(att) ? Number(target.slice(-3)) : targetMap[att].indexOf(target) } })
                    },
                    {
                        type: 'error',
                        name: 'Variability Range (baseline)',
                        color: '#555',
                        dataPoints: targetMap[att].map((target) => { return { y: getStandardError(admAlignment[admAccessMap[ta2]['baseline']][target] ?? []), x: ['MJ', 'IO'].includes(att) ? Number(target.slice(-3)) : targetMap[att].indexOf(target) } })

                    }
                ]
            }} />
        );
    };

    const generateDelPrefByTeamChart = () => {
        return <CanvasJSChart options={{
            width: "1200",
            dataPointWidth: 40,
            toolTip: {
                shared: true
            },
            axisX: {
                interval: 1
            },
            axisY: {
                minimum: 0,
                maximum: 1
            },
            legend: {
                verticalAlign: "top",
                horizontalAlign: "center",
                cursor: "pointer"
            },
            data: Object.keys(teamDelegation).filter((t) => t != 'combined').map((t) => {
                return {
                    type: "column",
                    name: t,
                    // color: alignColor,
                    showInLegend: true,
                    toolTipContent: "<b>{label}</b> <br> <span style=\"color:#4F81BC\">{name}</span>: {y}",
                    dataPoints: [{ y: teamDelegation[t]['baseline'], label: 'vs. Baseline ADM' }, { y: teamDelegation[t]['misaligned'], label: 'vs. Misaligned ADM' }]
                }
            })
        }} />
    }

    if (loadingParticipantLog || loadingSurveyResults || loadingTextResults || loadingADMs || loadingComparisonData || loadingSim) return <p>Loading...</p>;
    if (errorParticipantLog || errorSurveyResults || errorTextResults || errorADMs || errorComparisonData || errorSim) return <p>Error :</p>;

    return (<div className='accordion-homepage'>
        <Accordion defaultActiveKey={["1", "2", "3"]} alwaysOpen>
            <Accordion.Item eventKey="1" id='rq1'>
                <Accordion.Header className='accordion-header-homepage'>1. Does alignment score predict measures of trust?</Accordion.Header>
                <Accordion.Body>
                    <div className='chart-header-label q1'>
                        {alignVsTrust &&
                            <div className='rq1-lines'>
                                {Object.keys(alignVsTrust).map((att) => {
                                    return <div key={att + 'trust/align'} className="boxWhisker outlinedPlot">
                                        <h4>Trust Ratings predicted by  Alignment Score on {att}</h4>
                                        <CanvasJSChart options={{
                                            maintainAspectRatio: false,
                                            height: "250",
                                            width: "700",
                                            axisX: {
                                                gridThickness: 0,
                                                title: "Alignment score (Delegator|Observed_ADM (target))",
                                                maximum: 1.04
                                            },
                                            axisY: {
                                                gridThickness: 0,
                                                title: "Trust_Rating",
                                                maximum: 5.25,
                                                minimum: 0.8
                                            },
                                            data: [
                                                {
                                                    color: '#5B89C130',
                                                    type: "scatter", dataPoints: alignVsTrust[att]
                                                },
                                                {
                                                    color: '#000',
                                                    lineThickness: 4,
                                                    markerSize: 0,
                                                    type: "line", dataPoints: calculateBestFitLine(alignVsTrust[att])
                                                }
                                            ]
                                        }} />

                                    </div>
                                })}
                            </div>
                        }

                        {alignmentsByAdmType && evalNumber == 5 &&
                        <div className='q2-adms'>
                            <div className="outlinedPlot">
                                <h4>Alignment scores between delegator and targets (expected distribution of alignment scores by ADM classification)</h4>
                                <CanvasJSChart options={{
                                    axisX: {
                                        gridThickness: 0,
                                        title: "ADM Status (Aligned/Baseline/Misaligned)",
                                        minimum: -0.5,
                                        maximum: 2.5,
                                        tickLength: 0,
                                    },
                                    axisY: {
                                        gridThickness: 0,
                                        title: "Alignment score (Delegator|Target)",
                                        maximum: 1.01,
                                        minimum: 0.15
                                    },
                                    axisX2: {
                                        gridThickness: 0,
                                        minimum: -0.5,
                                        maximum: 2.5,
                                        tickLength: 0,
                                        labelFormatter: () => ""
                                    },
                                    maintainAspectRatio: false,
                                    height: "400",
                                    width: "1200",
                                    dataPointMaxWidth: 25,
                                    data: [
                                        {
                                            type: "boxAndWhisker", dataPoints: [
                                                { label: "aligned", y: getBoxWhiskerData(alignmentsByAdmType.aligned.targets) },
                                                { label: "baseline", y: getBoxWhiskerData(alignmentsByAdmType.baseline.targets) },
                                                { label: "misaligned", y: getBoxWhiskerData(alignmentsByAdmType.misaligned.targets) }
                                            ],
                                            upperBoxColor: "#78a1e3",
                                            lowerBoxColor: "#78a1e3",
                                            color: "black",
                                        },
                                        {
                                            type: 'scatter',
                                            axisXType: 'secondary',
                                            dataPoints: [...alignmentsByAdmType.aligned.targetPoints,
                                            ...alignmentsByAdmType.baseline.targetPoints,
                                            ...alignmentsByAdmType.misaligned.targetPoints],
                                            markerSize: 5,
                                            color: '#55555530'
                                        },
                                        {
                                            type: "scatter",
                                            color: '#555',
                                            markerType: "square",
                                            markerSize: 12,
                                            axisXType: 'secondary',
                                            dataPoints: [
                                                { x: 0, y: getMeanAcrossAll(alignmentsByAdmType.aligned, 'targets'), l: "aligned" },
                                                { x: 1, y: getMeanAcrossAll(alignmentsByAdmType.baseline, 'targets'), l: "baseline" },
                                                { x: 2, y: getMeanAcrossAll(alignmentsByAdmType.misaligned, 'targets'), l: "misaligned" }
                                            ]
                                        }
                                    ]
                                }} />
                            </div>
                            <div className="outlinedPlot">
                                <h4>Alignment scores between delegator and observed ADMs by ADM classification</h4>
                                <CanvasJSChart options={{
                                    axisX: {
                                        gridThickness: 0,
                                        title: "ADM Status (Aligned/Baseline/Misaligned)",
                                        minimum: -0.5,
                                        maximum: 2.5,
                                        tickLength: 0,
                                    },
                                    axisY: {
                                        gridThickness: 0,
                                        title: "Alignment score (Delegator|Observed_ADM)",
                                        maximum: 1.01,
                                        minimum: 0.15
                                    },
                                    axisX2: {
                                        gridThickness: 0,
                                        minimum: -0.5,
                                        maximum: 2.5,
                                        tickLength: 0,
                                        labelFormatter: () => ""
                                    },
                                    maintainAspectRatio: false,
                                    height: "400",
                                    width: "1200",
                                    dataPointMaxWidth: 25,
                                    data: [{
                                        type: "boxAndWhisker", dataPoints: [
                                            { label: "aligned", y: getBoxWhiskerData(alignmentsByAdmType.aligned.adms) },
                                            { label: "baseline", y: getBoxWhiskerData(alignmentsByAdmType.baseline.adms) },
                                            { label: "misaligned", y: getBoxWhiskerData(alignmentsByAdmType.misaligned.adms) }
                                        ],
                                        upperBoxColor: "#78a1e3",
                                        lowerBoxColor: "#78a1e3",
                                        color: "black",
                                    },
                                    {
                                        type: 'scatter',
                                        axisXType: 'secondary',
                                        dataPoints: [...alignmentsByAdmType.aligned.admPoints,
                                        ...alignmentsByAdmType.baseline.admPoints,
                                        ...alignmentsByAdmType.misaligned.admPoints],
                                        markerSize: 5,
                                        color: '#55555530'
                                    },
                                    {
                                        type: "scatter",
                                        color: '#555',
                                        markerType: "square",
                                        markerSize: 12,
                                        axisXType: 'secondary',
                                        dataPoints: [
                                            { x: 0, y: getMeanAcrossAll(alignmentsByAdmType.aligned, 'adms'), l: "aligned" },
                                            { x: 1, y: getMeanAcrossAll(alignmentsByAdmType.baseline, 'adms'), l: "baseline" },
                                            { x: 2, y: getMeanAcrossAll(alignmentsByAdmType.misaligned, 'adms'), l: "misaligned" }
                                        ]
                                    }
                                    ]
                                }} />
                            </div>
                        </div>
                        }

                        {trustVsAlignStatus && <div className="rq1-lines">
                            {generateTrustVsAlignedStatusChart('ADEPT')}
                            {generateTrustVsAlignedStatusChart('SoarTech')}
                        </div>
                        }
                    </div>
                </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="2" id='rq2'>
                <Accordion.Header className='accordion-header-homepage spaced-header'>2. Do aligned ADMs have the ability to tune to a subset of the attribute space?</Accordion.Header>
                <Accordion.Body>
                    <div className='chart-header-label q2'>
                        {admAlignment && groupTargets && <div className='q2-scatters'>
                            <div className='outlinedPlot'>
                                <h3>Parallax ADMs and Human DMs on Group MJ Attributes</h3>
                                {generateAlignmentScatter('Parallax', 'MJ')}
                            </div>
                            <div className='outlinedPlot'>
                                <h3>Parallax ADMs and Human DMs on Group IO Attributes</h3>
                                {generateAlignmentScatter('Parallax', 'IO')}
                            </div>
                            <div className='outlinedPlot'>
                                <h3>Parallax ADMs and Human DMs on Group QOL Attributes</h3>
                                {generateAlignmentScatter('Parallax', 'QOL')}
                            </div>
                            <div className='outlinedPlot'>
                                <h3>Parallax ADMs and Human DMs on Group VOL Attributes</h3>
                                {generateAlignmentScatter('Parallax', 'VOL')}
                            </div>
                            <div className='outlinedPlot'>
                                <h3>Kitware ADMs and Human DMs on Group MJ Attributes</h3>
                                {generateAlignmentScatter('Kitware', 'MJ')}
                            </div>
                            <div className='outlinedPlot'>
                                <h3>Kitware ADMs and Human DMs on Group IO Attributes</h3>
                                {generateAlignmentScatter('Kitware', 'IO')}
                            </div>
                            <div className='outlinedPlot'>
                                <h3>Kitware ADMs and Human DMs on Group QOL Attributes</h3>
                                {generateAlignmentScatter('Kitware', 'QOL')}
                            </div>
                            <div className='outlinedPlot'>
                                <h3>Kitware ADMs and Human DMs on Group VOL Attributes</h3>
                                {generateAlignmentScatter('Kitware', 'VOL')}
                            </div>
                        </div>}

                        {admAlignment &&
                            <div className='q2-adms'>
                                <div>
                                    <h3>Parallax Aligned and Baseline ADM Alignment Scores on Group Targets across ADEPT group-aligned targets</h3>
                                    {generateAlignedBaselineChart('TAD-aligned', 'TAD-severity-baseline',
                                        [{ 'target': evalNumber == 4 ? 'ADEPT-DryRun-Ingroup Bias-Group-High' : 'ADEPT-Phase1Eval-Ingroup Bias-Group-High', 'label': 'IO Group High' },
                                            { 'target': evalNumber == 4 ? 'ADEPT-DryRun-Moral judgement-Group-High' : 'ADEPT-Phase1Eval-Moral judgement-Group-High', 'label': 'MJ Group High' },
                                            { 'target': evalNumber == 4 ? 'ADEPT-DryRun-Ingroup Bias-Group-Low' : 'ADEPT-Phase1Eval-Ingroup Bias-Group-Low', 'label': 'IO Group Low' },
                                            { 'target': evalNumber == 4 ? 'ADEPT-DryRun-Moral judgement-Group-Low' : 'ADEPT-Phase1Eval-Moral judgement-Group-Low', 'label': 'MJ Group Low' }])}
                                </div>

                                <div>
                                    <h3>Parallax Aligned and Baseline ADM Alignment Scores on Group Targets across SoarTech group-aligned targets</h3>
                                    {generateAlignedBaselineChart('TAD-aligned', 'TAD-severity-baseline',
                                        [{ 'target': evalNumber == 4 ? 'qol-group-target-dre-1' : 'qol-group-target-1-final-eval', 'label': 'QOL Group 1' },
                                            { 'target': evalNumber == 4 ? 'qol-group-target-dre-2' : 'qol-group-target-2-final-eval', 'label': 'QOL Group 2' },
                                            { 'target': evalNumber == 4 ? 'vol-group-target-dre-1' : 'vol-group-target-1-final-eval', 'label': 'VOL Group 1' },
                                            { 'target': evalNumber == 4 ? 'vol-group-target-dre-2' : 'vol-group-target-2-final-eval', 'label': 'VOL Group 2' }], '#5B89C1', '#edc24c')}
                                </div>

                                <div>
                                    <h3>Kitware Aligned and Baseline ADM Alignment Scores on Group Targets across ADEPT group-aligned targets</h3>
                                    {generateAlignedBaselineChart('ALIGN-ADM-ComparativeRegression-ICL-Template', 'ALIGN-ADM-OutlinesBaseline',
                                        [{ 'target': evalNumber == 4 ? 'ADEPT-DryRun-Ingroup Bias-Group-High' : 'ADEPT-Phase1Eval-Ingroup Bias-Group-High', 'label': 'IO Group High' },
                                            { 'target': evalNumber == 4 ? 'ADEPT-DryRun-Moral judgement-Group-High' : 'ADEPT-Phase1Eval-Moral judgement-Group-High', 'label': 'MJ Group High' },
                                            { 'target': evalNumber == 4 ? 'ADEPT-DryRun-Ingroup Bias-Group-Low' : 'ADEPT-Phase1Eval-Ingroup Bias-Group-Low', 'label': 'IO Group Low' },
                                            { 'target': evalNumber == 4 ? 'ADEPT-DryRun-Moral judgement-Group-Low' : 'ADEPT-Phase1Eval-Moral judgement-Group-Low', 'label': 'MJ Group Low' }])}
                                </div>

                                <div>
                                    <h3>Kitware Aligned and Baseline ADM Alignment Scores on Group Targets across SoarTech group-aligned targets</h3>
                                    {generateAlignedBaselineChart('ALIGN-ADM-ComparativeRegression-ICL-Template', 'ALIGN-ADM-OutlinesBaseline',
                                        [{ 'target': evalNumber == 4 ? 'qol-group-target-dre-1' : 'qol-group-target-1-final-eval', 'label': 'QOL Group 1' },
                                            { 'target': evalNumber == 4 ? 'qol-group-target-dre-2' : 'qol-group-target-2-final-eval', 'label': 'QOL Group 2' },
                                            { 'target': evalNumber == 4 ? 'vol-group-target-dre-1' : 'vol-group-target-1-final-eval', 'label': 'VOL Group 1' },
                                            { 'target': evalNumber == 4 ? 'vol-group-target-dre-2' : 'vol-group-target-2-final-eval', 'label': 'VOL Group 2' }], '#5B89C1', '#edc24c')}
                                </div>

                                <div>
                                    <h3>Parallax Aligned and Baseline ADM Alignment Scores on Individual Targets across Attributes</h3>
                                    {generateAlignedBaselineChart('TAD-aligned', 'TAD-severity-baseline',
                                        [{ 'target': Object.keys(admAlignment['TAD-aligned']).filter((x) => x.includes('Moral judgement') && !x.includes('Group')), 'label': 'MJ' },
                                        { 'target': Object.keys(admAlignment['TAD-aligned']).filter((x) => x.includes('Ingroup Bias') && !x.includes('Group')), 'label': 'IO' },
                                        { 'target': Object.keys(admAlignment['TAD-aligned']).filter((x) => x.includes('qol') && !x.includes('group')), 'label': 'QOL' },
                                        { 'target': Object.keys(admAlignment['TAD-aligned']).filter((x) => x.includes('vol') && !x.includes('group')), 'label': 'VOL' }])}
                                </div>

                                <div>
                                    <h3>Parallax ADMs Alignment by Target on Moral Judgments</h3>
                                    {generateAlignmentByTargetLineGraph('Parallax', 'MJ')}
                                </div>

                                <div>
                                    <h3>Parallax ADMs Alignment by Target on Ingroup/Outgroup Bias</h3>
                                    {generateAlignmentByTargetLineGraph('Parallax', 'IO')}
                                </div>

                                <div>
                                    <h3>Parallax ADMs Alignment by Target on Quality of Life</h3>
                                    {generateAlignmentByTargetLineGraph('Parallax', 'QOL')}
                                </div>

                                <div>
                                    <h3>Parallax ADMs Alignment by Target on Value of Life</h3>
                                    {generateAlignmentByTargetLineGraph('Parallax', 'VOL')}
                                </div>

                                <div>
                                    <h3>Kitware Aligned and Baseline ADM Alignment Scores on Individual Targets across Attributes</h3>
                                    {generateAlignedBaselineChart('ALIGN-ADM-ComparativeRegression-ICL-Template', 'ALIGN-ADM-OutlinesBaseline',
                                        [{ 'target': Object.keys(admAlignment['ALIGN-ADM-OutlinesBaseline']).filter((x) => x.includes('Moral judgement') && !x.includes('Group')), 'label': 'MJ' },
                                        { 'target': Object.keys(admAlignment['ALIGN-ADM-OutlinesBaseline']).filter((x) => x.includes('Ingroup Bias') && !x.includes('Group')), 'label': 'IO' },
                                        { 'target': Object.keys(admAlignment['ALIGN-ADM-OutlinesBaseline']).filter((x) => x.includes('qol') && !x.includes('group')), 'label': 'QOL' },
                                        { 'target': Object.keys(admAlignment['ALIGN-ADM-OutlinesBaseline']).filter((x) => x.includes('vol') && !x.includes('group')), 'label': 'VOL' }])}
                                </div>

                                <div>
                                    <h3>Kitware ADMs Alignment by Target on Moral Judgments</h3>
                                    {generateAlignmentByTargetLineGraph('Kitware', 'MJ')}
                                </div>

                                <div>
                                    <h3>Kitware ADMs Alignment by Target on Ingroup/Outgroup Bias</h3>
                                    {generateAlignmentByTargetLineGraph('Kitware', 'IO')}
                                </div>

                                <div>
                                    <h3>Kitware ADMs Alignment by Target on Quality of Life</h3>
                                    {generateAlignmentByTargetLineGraph('Kitware', 'QOL')}
                                </div>

                                <div>
                                    <h3>Kitware ADMs Alignment by Target on Value of Life</h3>
                                    {generateAlignmentByTargetLineGraph('Kitware', 'VOL')}
                                </div>

                            </div>}
                    </div>
                </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="3" id='rq3'>
                <Accordion.Header className='accordion-header-homepage spaced-header'>3. Does alignment affect delegation preference for ADMs?</Accordion.Header>
                <Accordion.Body>
                    <div className='chart-header-label q3'>
                        {delegationPreferences &&
                            <div className='q2-adms'>
                                <div className='outlinedPlot'>
                                    <h4>Delegation (%) to Aligned DM on Forced Choice</h4>
                                    <CanvasJSChart options={{
                                        width: "1200",
                                        dataPointWidth: 80,
                                        toolTip: {
                                            shared: true
                                        },
                                        axisX: {
                                            interval: 1
                                        },
                                        axisY: {
                                            minimum: 0,
                                            maximum: 1,
                                            title: '% delegation preference for Aligned ADM',
                                            titleFontSize: 15
                                        },
                                        legend: {
                                            verticalAlign: "top",
                                            horizontalAlign: "center",
                                            cursor: "pointer"
                                        },
                                        data: [{
                                            type: "column",
                                            name: "Aligned",
                                            color: '#5B89C1',
                                            toolTipContent: "<b>{label}</b> <br> <span style=\"color:#4F81BC\">{name}</span>: {y}",
                                            dataPoints: [{ y: getMeanAcrossAll(delegationPreferences, 'baseline'), label: 'vs. Baseline ADM' }, { y: getMeanAcrossAll(delegationPreferences, 'misaligned'), label: 'vs. Misaligned ADM' }]
                                        },
                                        {
                                            type: "error",
                                            color: "#555",
                                            name: "Variability Range",
                                            toolTipContent: "<span style=\"color:#C0504E\">{name}</span>: {y[0]} - {y[1]}",
                                            dataPoints: [{ y: getSeAcrossAll(delegationPreferences, 'baseline'), label: 'vs. Baseline ADM' }, { y: getSeAcrossAll(delegationPreferences, 'misaligned'), label: 'vs. Misaligned ADM' }]
                                        }
                                        ]
                                    }} />
                                </div>
                            </div>}
                        {evalNumber == 5 && teamDelegation &&
                            <div className='q2-adms'>
                                <div className='outlinedPlot'>
                                    <h4>Proportion of Delegation Preference By Teams</h4>
                                    {generateDelPrefByTeamChart()}
                                </div>
                            </div>}
                        {alignmentsByAttribute && <div className='q2-adms'>
                            <div className="outlinedPlot">
                                <h4>Alignment scores between delegator and observed ADMs by Attribute</h4>
                                <CanvasJSChart options={{
                                    axisX: {
                                        gridThickness: 0,
                                        title: "Attribute",
                                        minimum: -0.5,
                                        maximum: 3.5,
                                        tickLength: 0
                                    },
                                    axisY: {
                                        gridThickness: 0,
                                        title: "Alignment score (Delegator|Observed_ADM)",
                                        maximum: 1.01,
                                        minimum: 0.15
                                    },
                                    axisX2: {
                                        gridThickness: 0,
                                        minimum: -0.5,
                                        maximum: 3.5,
                                        tickLength: 0,
                                        labelFormatter: () => ""
                                    },
                                    maintainAspectRatio: false,
                                    height: "400",
                                    width: "1200",
                                    dataPointMaxWidth: 25,
                                    data: [{
                                        type: "boxAndWhisker", dataPoints: [
                                            { label: "IO", y: getBoxWhiskerData(alignmentsByAttribute.IO.adms) },
                                            { label: "MJ", y: getBoxWhiskerData(alignmentsByAttribute.MJ.adms) },
                                            { label: "QOL", y: getBoxWhiskerData(alignmentsByAttribute.QOL.adms) },
                                            { label: "VOL", y: getBoxWhiskerData(alignmentsByAttribute.VOL.adms) }
                                        ],
                                        upperBoxColor: "#78a1e3",
                                        lowerBoxColor: "#78a1e3",
                                        color: "black",
                                    },
                                    {
                                        type: 'scatter',
                                        axisXType: 'secondary',
                                        dataPoints: [...alignmentsByAttribute.IO.admPoints,
                                        ...alignmentsByAttribute.MJ.admPoints,
                                        ...alignmentsByAttribute.QOL.admPoints,
                                        ...alignmentsByAttribute.VOL.admPoints],
                                        markerSize: 5,
                                        color: '#55555530'
                                    },
                                    {
                                        type: "scatter",
                                        color: '#555',
                                        markerType: "square",
                                        markerSize: 12,
                                        axisXType: 'secondary',
                                        dataPoints: [
                                            { x: 0, y: getMeanAcrossAll(alignmentsByAttribute.IO, 'adms'), l: "IO" },
                                            { x: 1, y: getMeanAcrossAll(alignmentsByAttribute.MJ, 'adms'), l: "MJ" },
                                            { x: 2, y: getMeanAcrossAll(alignmentsByAttribute.QOL, 'adms'), l: "QOL" },
                                            { x: 3, y: getMeanAcrossAll(alignmentsByAttribute.VOL, 'adms'), l: "VOL" }
                                        ]
                                    }
                                    ]
                                }} />
                            </div>
                            {evalNumber == 4 && <div className="outlinedPlot">
                                <h4>Rescaled alignment scores between delegator and observed ADMs by Attribute</h4>
                                <CanvasJSChart options={{
                                    axisX: {
                                        gridThickness: 0,
                                        title: "Attribute",
                                        minimum: -0.5,
                                        maximum: 3.5,
                                        tickLength: 0
                                    },
                                    axisY: {
                                        gridThickness: 0,
                                        title: "Alignment score (Delegator|Observed_ADM)",
                                        maximum: 1.01,
                                        minimum: -0.01
                                    },
                                    axisX2: {
                                        gridThickness: 0,
                                        minimum: -0.5,
                                        maximum: 3.5,
                                        tickLength: 0,
                                        labelFormatter: () => ""
                                    },
                                    maintainAspectRatio: false,
                                    height: "400",
                                    width: "1200",
                                    dataPointMaxWidth: 25,
                                    data: [{
                                        type: "boxAndWhisker", dataPoints: [
                                            { label: "IO", y: getBoxWhiskerData(alignmentsByAttribute.IO.rescaledAdms) },
                                            { label: "MJ", y: getBoxWhiskerData(alignmentsByAttribute.MJ.rescaledAdms) },
                                            { label: "QOL", y: getBoxWhiskerData(alignmentsByAttribute.QOL.rescaledAdms) },
                                            { label: "VOL", y: getBoxWhiskerData(alignmentsByAttribute.VOL.rescaledAdms) }
                                        ],
                                        upperBoxColor: "#78a1e3",
                                        lowerBoxColor: "#78a1e3",
                                        color: "black",
                                    },
                                    {
                                        type: 'scatter',
                                        axisXType: 'secondary',
                                        dataPoints: [...alignmentsByAttribute.IO.rescaledAdmPoints,
                                        ...alignmentsByAttribute.MJ.rescaledAdmPoints,
                                        ...alignmentsByAttribute.QOL.rescaledAdmPoints,
                                        ...alignmentsByAttribute.VOL.rescaledAdmPoints],
                                        markerSize: 5,
                                        color: '#55555530'
                                    },
                                    {
                                        type: "scatter",
                                        color: '#555',
                                        markerType: "square",
                                        markerSize: 12,
                                        axisXType: 'secondary',
                                        dataPoints: [
                                            { x: 0, y: getMeanAcrossAll(alignmentsByAttribute.IO, 'rescaledAdms'), l: "IO" },
                                            { x: 1, y: getMeanAcrossAll(alignmentsByAttribute.MJ, 'rescaledAdms'), l: "MJ" },
                                            { x: 2, y: getMeanAcrossAll(alignmentsByAttribute.QOL, 'rescaledAdms'), l: "QOL" },
                                            { x: 3, y: getMeanAcrossAll(alignmentsByAttribute.VOL, 'rescaledAdms'), l: "VOL" }
                                        ]
                                    }]
                                }} />
                            </div>}
                        </div>}
                        {ratingBySelection &&
                            <div className='q2-adms'>
                                <div>
                                    <h3>Individual DM Ratings by Delegation Selection Status</h3>
                                    <CanvasJSChart options={{
                                        width: "1200",
                                        dataPointWidth: 80,
                                        toolTip: {
                                            shared: true
                                        },
                                        axisX: {
                                            interval: 1
                                        },
                                        axisY: {
                                            minimum: 0
                                        },
                                        legend: {
                                            verticalAlign: "top",
                                            horizontalAlign: "center",
                                            cursor: "pointer"
                                        },
                                        data: [{
                                            type: "column",
                                            name: "Not Selected",
                                            color: '#5B89C1',
                                            showInLegend: true,
                                            toolTipContent: "<b>{label}</b> <br> <span style=\"color:#4F81BC\">{name}</span>: {y}",
                                            dataPoints: [{ y: getMeanAcrossAll(ratingBySelection['Not Selected'], 'Trust'), label: 'Trust' }, { y: getMeanAcrossAll(ratingBySelection['Not Selected'], 'Agree'), label: 'Agree' },
                                            { y: getMeanAcrossAll(ratingBySelection['Not Selected'], 'Trustworthy'), label: 'Trustworthy' }, { y: getMeanAcrossAll(ratingBySelection['Not Selected'], 'SRAlign'), label: 'SRAlign' }]
                                        },
                                        {
                                            type: "error",
                                            color: "#555",
                                            name: "Variability Range",
                                            toolTipContent: "<span style=\"color:#C0504E\">{name}</span>: {y[0]} - {y[1]}",
                                            dataPoints: [{ y: getSeAcrossAll(ratingBySelection['Not Selected'], 'Trust'), label: 'Trust' }, { y: getSeAcrossAll(ratingBySelection['Not Selected'], 'Agree'), label: 'Agree' },
                                            { y: getSeAcrossAll(ratingBySelection['Not Selected'], 'Trustworthy'), label: 'Trustworthy' }, { y: getSeAcrossAll(ratingBySelection['Not Selected'], 'SRAlign'), label: 'SRAlign' }]
                                        },
                                        {
                                            type: "column",
                                            name: "Selected",
                                            color: '#edc24c',
                                            showInLegend: true,
                                            toolTipContent: "<b>{label}</b> <br> <span style=\"color:#4F81BC\">{name}</span>: {y}",
                                            dataPoints: [{ y: getMeanAcrossAll(ratingBySelection['Selected'], 'Trust'), label: 'Trust' }, { y: getMeanAcrossAll(ratingBySelection['Selected'], 'Agree'), label: 'Agree' },
                                            { y: getMeanAcrossAll(ratingBySelection['Selected'], 'Trustworthy'), label: 'Trustworthy' }, { y: getMeanAcrossAll(ratingBySelection['Selected'], 'SRAlign'), label: 'SRAlign' }]
                                        },
                                        {
                                            type: "error",
                                            name: "Variability Range",
                                            color: '#555',
                                            toolTipContent: "<span style=\"color:#C0504E\">{name}</span>: {y[0]} - {y[1]}",
                                            dataPoints: [{ y: getSeAcrossAll(ratingBySelection['Selected'], 'Trust'), label: 'Trust' }, { y: getSeAcrossAll(ratingBySelection['Selected'], 'Agree'), label: 'Agree' },
                                            { y: getSeAcrossAll(ratingBySelection['Selected'], 'Trustworthy'), label: 'Trustworthy' }, { y: getSeAcrossAll(ratingBySelection['Selected'], 'SRAlign'), label: 'SRAlign' }]
                                        }
                                        ]
                                    }} />
                                </div>
                            </div>}
                    </div>
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