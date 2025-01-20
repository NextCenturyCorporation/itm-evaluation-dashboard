import React from "react";
import { getAlignmentsByAdmTypeForTA12 } from "../../DataFunctions";
import CanvasJSReact from '@canvasjs/react-charts';
import { calculateBestFitLine, getBoxWhiskerData, getMeanAcrossAll, getMeanAcrossAllWithoutOutliers, getSeAcrossAll } from "../../statistics";

const CanvasJSChart = CanvasJSReact.CanvasJSChart;

export function RQ1Graphs({ data, evalNumber, alignmentsByAdmType, alignVsTrust, trustVsAlignStatus }) {

    const generateTrustRatingsByAttributePlots = (att) => {
        return (<div key={att + 'trust/align'} className="boxWhisker outlinedPlot">
            <h4>Trust Ratings predicted by Alignment Score on {att}</h4>
            <CanvasJSChart options={{
                maintainAspectRatio: false,
                height: "250",
                width: "700",
                axisX: {
                    gridThickness: 0,
                    title: "Alignment score (Delegator|Observed_ADM (target))",
                    minimum: -0.05,
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

        </div>);
    };

    const generateAlignmentDistributions = () => {
        return <>
            <div className="outlinedPlot">
                <h4>Alignment scores between delegator and targets (expected distribution of alignment scores by ADM classification)</h4>
                <CanvasJSChart options={{
                    axisX: {
                        gridThickness: 0,
                        title: "Observed ADM (Aligned/Baseline/Misaligned)",
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
                                { x: 0, y: getMeanAcrossAllWithoutOutliers(alignmentsByAdmType.aligned, 'targets'), l: "aligned" },
                                { x: 1, y: getMeanAcrossAllWithoutOutliers(alignmentsByAdmType.baseline, 'targets'), l: "baseline" },
                                { x: 2, y: getMeanAcrossAllWithoutOutliers(alignmentsByAdmType.misaligned, 'targets'), l: "misaligned" }
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
                        title: "Observed ADM (Aligned/Baseline/Misaligned)",
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
                            { x: 0, y: getMeanAcrossAllWithoutOutliers(alignmentsByAdmType.aligned, 'adms'), l: "aligned" },
                            { x: 1, y: getMeanAcrossAllWithoutOutliers(alignmentsByAdmType.baseline, 'adms'), l: "baseline" },
                            { x: 2, y: getMeanAcrossAllWithoutOutliers(alignmentsByAdmType.misaligned, 'adms'), l: "misaligned" }
                        ]
                    }
                    ]
                }} />
            </div>
        </>;
    };

    const generateDesignImpacts = (ta1, ta2) => {
        const alignments = getAlignmentsByAdmTypeForTA12(data, ta1 == 'ADEPT' ? 'Adept' : 'ST', ta2);
        return (
            <div className='side-by-side-plots'>
                <div className="outlinedPlot">
                    <h4>{ta1} Design Impacts (Delegator|target) - {ta2}</h4>
                    <CanvasJSChart options={{
                        axisX: {
                            gridThickness: 0,
                            title: "Observed ADM (Aligned/Baseline/Misaligned)",
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
                        width: "650",
                        dataPointMaxWidth: 25,
                        data: [
                            {
                                type: "boxAndWhisker", dataPoints: [
                                    { label: "aligned", y: getBoxWhiskerData(alignments.aligned.targets) },
                                    { label: "baseline", y: getBoxWhiskerData(alignments.baseline.targets) },
                                    { label: "misaligned", y: getBoxWhiskerData(alignments.misaligned.targets) }
                                ],
                                upperBoxColor: "#78a1e3",
                                lowerBoxColor: "#78a1e3",
                                color: "black",
                            },
                            {
                                type: 'scatter',
                                axisXType: 'secondary',
                                dataPoints: [...alignments.aligned.targetPoints,
                                ...alignments.baseline.targetPoints,
                                ...alignments.misaligned.targetPoints],
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
                                    { x: 0, y: getMeanAcrossAllWithoutOutliers(alignments.aligned, 'targets'), l: "aligned" },
                                    { x: 1, y: getMeanAcrossAllWithoutOutliers(alignments.baseline, 'targets'), l: "baseline" },
                                    { x: 2, y: getMeanAcrossAllWithoutOutliers(alignments.misaligned, 'targets'), l: "misaligned" }
                                ]
                            }
                        ]
                    }} />
                </div>
                <div className="outlinedPlot">
                    <h4>{ta1} Design Impacts (Delegator|Observed_ADM) - {ta2}</h4>
                    <CanvasJSChart options={{
                        axisX: {
                            gridThickness: 0,
                            title: "Observed ADM (Aligned/Baseline/Misaligned)",
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
                        width: "650",
                        dataPointMaxWidth: 25,
                        data: [{
                            type: "boxAndWhisker", dataPoints: [
                                { label: "aligned", y: getBoxWhiskerData(alignments.aligned.adms) },
                                { label: "baseline", y: getBoxWhiskerData(alignments.baseline.adms) },
                                { label: "misaligned", y: getBoxWhiskerData(alignments.misaligned.adms) }
                            ],
                            upperBoxColor: "#78a1e3",
                            lowerBoxColor: "#78a1e3",
                            color: "black",
                        },
                        {
                            type: 'scatter',
                            axisXType: 'secondary',
                            dataPoints: [...alignments.aligned.admPoints,
                            ...alignments.baseline.admPoints,
                            ...alignments.misaligned.admPoints],
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
                                { x: 0, y: getMeanAcrossAllWithoutOutliers(alignments.aligned, 'adms'), l: "aligned" },
                                { x: 1, y: getMeanAcrossAllWithoutOutliers(alignments.baseline, 'adms'), l: "baseline" },
                                { x: 2, y: getMeanAcrossAllWithoutOutliers(alignments.misaligned, 'adms'), l: "misaligned" }
                            ]
                        }
                        ]
                    }} />
                </div>
            </div>
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

    return (
        <div className='chart-header-label q1'>
            {alignVsTrust &&
                <div className='rq1-lines'>
                    {Object.keys(alignVsTrust).map((att) => {
                        return generateTrustRatingsByAttributePlots(att);
                    })}
                </div>
            }

            {alignmentsByAdmType && evalNumber == 5 &&
                <div className='q2-adms'>
                    {generateAlignmentDistributions()}
                    {generateDesignImpacts('ADEPT', 'Kitware')}
                    {generateDesignImpacts('ADEPT', 'Parallax')}
                    {generateDesignImpacts('ADEPT', 'Overall')}
                    {generateDesignImpacts('SoarTech', 'Kitware')}
                    {generateDesignImpacts('SoarTech', 'Parallax')}
                    {generateDesignImpacts('SoarTech', 'Overall')}
                </div>

            }

            {trustVsAlignStatus && <div className="rq1-lines">
                {generateTrustVsAlignedStatusChart('ADEPT')}
                {generateTrustVsAlignedStatusChart('SoarTech')}
            </div>}
        </div>
    )
}