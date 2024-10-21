import React from "react";
import { useQuery } from 'react-apollo'
import gql from "graphql-tag";
import { getRQ134Data } from "../../DRE-Research/utils";
import { cleanDreData, getAlignmentComparisonVsTrustRatings, getAlignmentsByAdmType, getAlignmentsByAttribute, getDelegationPreferences, getDelegationVsAlignment, getRatingsBySelectionStatus, isDefined } from "../DataFunctions";
import CanvasJSReact from '@canvasjs/react-charts';
import { calculateBestFitLine, getBoxWhiskerData, getMeanAcrossAll, getSeAcrossAll } from "../statistics";

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

export default function DreHomePage({ fullData, admAlignment }) {

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

    const [data, setData] = React.useState(null);
    const [alignVsTrust, setAlignVsTrust] = React.useState(null);
    const [trustVsAlignStatus, setTrustVsAlignStatus] = React.useState(null);
    const [alignmentsByAdmType, setAlignmentsByAdmType] = React.useState(null);
    const [alignmentsByAttribute, setAlignmentsByAttribute] = React.useState(null);
    const [delegationPreferences, setDelegationPreferences] = React.useState(null);
    const [delVsAlignment, setDelVsAlignment] = React.useState(null);
    const [ratingBySelection, setRatingBySelection] = React.useState(null);

    React.useEffect(() => {
        if (dataSurveyResults?.getAllSurveyResults && dataParticipantLog?.getParticipantLog && dataTextResults?.getAllScenarioResults && dataADMs?.getAllHistoryByEvalNumber && comparisonData?.getHumanToADMComparison && dataSim?.getAllSimAlignmentByEval) {
            const origData = getRQ134Data(dataSurveyResults, dataParticipantLog, dataTextResults, dataADMs, comparisonData, dataSim);
            const cleanData = cleanDreData(origData.allObjs);
            setData(cleanData);
        }
    }, [dataParticipantLog, dataSurveyResults, dataTextResults, dataADMs, comparisonData, fullData]);

    React.useEffect(() => {
        if (data) {
            const trustData = getAlignmentComparisonVsTrustRatings(data);
            setAlignVsTrust(trustData.byAttribute);
            setTrustVsAlignStatus(trustData.byAlignment);
            setAlignmentsByAdmType(getAlignmentsByAdmType(data));
            setAlignmentsByAttribute(getAlignmentsByAttribute(data));
            setDelegationPreferences(getDelegationPreferences(data));
            setDelVsAlignment(getDelegationVsAlignment(data));
            setRatingBySelection(getRatingsBySelectionStatus(data));
        }
    }, [data, fullData]);

    React.useEffect(() => {
        console.log(delVsAlignment);
    }, [delVsAlignment]);

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
                }
                ]
            }} />
        );
    }

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
    }

    if (loadingParticipantLog || loadingSurveyResults || loadingTextResults || loadingADMs || loadingComparisonData || loadingSim) return <p>Loading...</p>;
    if (errorParticipantLog || errorSurveyResults || errorTextResults || errorADMs || errorComparisonData || errorSim) return <p>Error :</p>;

    return (<>
        <div className='chart-home-container'>
            <div className='chart-header q1'>
                <div className='chart-header-label q1'>
                    <h4>1. Does alignment score predict measures of trust?</h4>
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

                    {alignmentsByAdmType &&
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
            </div>
        </div>


        <div className='chart-home-container'>
            <div className='chart-header q2'>
                <div className='chart-header-label q2'>
                    <h4>2. Do aligned ADMs have the ability to tune to a subset of the attribute space?</h4>

                    {admAlignment &&
                        <div className='q2-adms'>
                            <div>
                                <h3>Parallax Aligned and Baseline ADM Alignment Scores on Group Targets across ADEPT group-aligned targets</h3>
                                {generateAlignedBaselineChart('TAD-aligned', 'TAD-severity-baseline',
                                    [{ 'target': 'ADEPT-DryRun-Ingroup Bias-Group-High', 'label': 'IO Group High' },
                                    { 'target': 'ADEPT-DryRun-Moral judgement-Group-High', 'label': 'MJ Group High' },
                                    { 'target': 'ADEPT-DryRun-Ingroup Bias-Group-Low', 'label': 'IO Group Low' },
                                    { 'target': 'ADEPT-DryRun-Moral judgement-Group-Low', 'label': 'MJ Group Low' }])}
                            </div>

                            <div>
                                <h3>Parallax Aligned and Baseline ADM Alignment Scores on Group Targets across SoarTech group-aligned targets</h3>
                                {generateAlignedBaselineChart('TAD-aligned', 'TAD-severity-baseline',
                                    [{ 'target': 'qol-group-target-dre-1', 'label': 'QOL Group 1' },
                                    { 'target': 'qol-group-target-dre-2', 'label': 'QOL Group 2' },
                                    { 'target': 'vol-group-target-dre-1', 'label': 'VOL Group 1' },
                                    { 'target': 'vol-group-target-dre-2', 'label': 'VOL Group 2' }], '#5B89C1', '#edc24c')}
                            </div>

                            <div>
                                <h3>Kitware Aligned and Baseline ADM Alignment Scores on Group Targets across ADEPT group-aligned targets</h3>
                                {generateAlignedBaselineChart('ALIGN-ADM-ComparativeRegression-ICL-Template', 'ALIGN-ADM-OutlinesBaseline',
                                    [{ 'target': 'ADEPT-DryRun-Ingroup Bias-Group-High', 'label': 'IO Group High' },
                                    { 'target': 'ADEPT-DryRun-Moral judgement-Group-High', 'label': 'MJ Group High' },
                                    { 'target': 'ADEPT-DryRun-Ingroup Bias-Group-Low', 'label': 'IO Group Low' },
                                    { 'target': 'ADEPT-DryRun-Moral judgement-Group-Low', 'label': 'MJ Group Low' }])}
                            </div>

                            <div>
                                <h3>Kitware Aligned and Baseline ADM Alignment Scores on Group Targets across SoarTech group-aligned targets</h3>
                                {generateAlignedBaselineChart('ALIGN-ADM-ComparativeRegression-ICL-Template', 'ALIGN-ADM-OutlinesBaseline',
                                    [{ 'target': 'qol-group-target-dre-1', 'label': 'QOL Group 1' },
                                    { 'target': 'qol-group-target-dre-2', 'label': 'QOL Group 2' },
                                    { 'target': 'vol-group-target-dre-1', 'label': 'VOL Group 1' },
                                    { 'target': 'vol-group-target-dre-2', 'label': 'VOL Group 2' }], '#5B89C1', '#edc24c')}
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
                                <h3>Kitware Aligned and Baseline ADM Alignment Scores on Individual Targets across Attributes</h3>
                                {generateAlignedBaselineChart('ALIGN-ADM-ComparativeRegression-ICL-Template', 'ALIGN-ADM-OutlinesBaseline',
                                    [{ 'target': Object.keys(admAlignment['ALIGN-ADM-OutlinesBaseline']).filter((x) => x.includes('Moral judgement') && !x.includes('Group')), 'label': 'MJ' },
                                    { 'target': Object.keys(admAlignment['ALIGN-ADM-OutlinesBaseline']).filter((x) => x.includes('Ingroup Bias') && !x.includes('Group')), 'label': 'IO' },
                                    { 'target': Object.keys(admAlignment['ALIGN-ADM-OutlinesBaseline']).filter((x) => x.includes('qol') && !x.includes('group')), 'label': 'QOL' },
                                    { 'target': Object.keys(admAlignment['ALIGN-ADM-OutlinesBaseline']).filter((x) => x.includes('vol') && !x.includes('group')), 'label': 'VOL' }])}
                            </div>
                        </div>}
                </div>
            </div>
        </div>

        <div className='chart-home-container'>
            <div className='chart-header q3'>
                <div className='chart-header-label q3'>
                    <h4>3. Does alignment affect delegation preference for ADMs?</h4>
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
                        <div className="outlinedPlot">
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
                        </div>
                    </div>}
                    {delVsAlignment && <div className='rq3-lines'>
                        {['IO', 'MJ', 'QOL', 'VOL'].map((att) => {
                            return <div key={att + 'delegation/align'} className='rq1-lines'>
                                <div className="outlinedPlot">
                                    <h4>Delegation preference (aligned vs. baseline) predicted by Alignment Score on {att}</h4>
                                    <CanvasJSChart options={{
                                        maintainAspectRatio: false,
                                        height: "250",
                                        width: "700",
                                        axisX: {
                                            gridThickness: 0,
                                            title: "Alignment score (Delegator|Observed_ADM (target))",
                                            minimum: Math.min(...delVsAlignment?.delegationVsAlignmentBaseline?.[att].map((x) => x.x)) - 0.02,
                                            maximum: 1.02
                                        },
                                        axisY: {
                                            gridThickness: 0,
                                            title: "Delegation preference (A/B)",
                                            maximum: 1.05,
                                            minimum: -0.05
                                        },
                                        data: [
                                            {
                                                color: '#5B89C150',
                                                type: "scatter", dataPoints: delVsAlignment?.delegationVsAlignmentBaseline?.[att]
                                            },
                                            {
                                                color: '#000',
                                                lineThickness: 4,
                                                markerSize: 0,
                                                type: "line", dataPoints: calculateBestFitLine(delVsAlignment?.delegationVsAlignmentBaseline?.[att])
                                            }
                                        ]
                                    }} />

                                </div>
                                <div className="outlinedPlot">
                                    <h4>Delegation preference (aligned vs. misaligned) predicted by Alignment Score on {att}</h4>
                                    <CanvasJSChart options={{
                                        maintainAspectRatio: false,
                                        height: "250",
                                        width: "700",
                                        axisX: {
                                            gridThickness: 0,
                                            title: "Alignment score (Delegator|Observed_ADM (target))",
                                            minimum: Math.min(...delVsAlignment?.delegationVsAlignmentMisaligned?.[att].map((x) => x.x)) - 0.02,
                                            maximum: 1.02
                                        },
                                        axisY: {
                                            gridThickness: 0,
                                            title: "Delegation preference (A/M)",
                                            maximum: 1.05,
                                            minimum: -0.05
                                        },
                                        data: [
                                            {
                                                color: '#5B89C150',
                                                type: "scatter", dataPoints: delVsAlignment?.delegationVsAlignmentMisaligned?.[att]
                                            },
                                            {
                                                color: '#000',
                                                lineThickness: 4,
                                                markerSize: 0,
                                                type: "line", dataPoints: calculateBestFitLine(delVsAlignment?.delegationVsAlignmentMisaligned?.[att])
                                            }
                                        ]
                                    }} />

                                </div>
                            </div>
                        })}
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
            </div>
        </div>
    </>);

}