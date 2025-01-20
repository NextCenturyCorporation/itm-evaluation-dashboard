import React from "react";
import CanvasJSReact from '@canvasjs/react-charts';
import { getBoxWhiskerData, getMeanAcrossAll, getSeAcrossAll } from "../../statistics";

const CanvasJSChart = CanvasJSReact.CanvasJSChart;

export default function RQ3Graphs({ delegationPreferences, evalNumber, teamDelegation, alignmentsByAttribute, ratingBySelection }) {

    const generateForcedChoiceChart = () => {
        return <div className='outlinedPlot'>
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
        </div>;
    };

    const generateDelPrefByTeamOrAttributeChart = (teamOrAttribute) => {
        const attributes = ['IO', 'MJ', 'QOL', 'VOL'];
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
            data: Object.keys(teamDelegation).filter((t) => t != 'combined' && ((teamOrAttribute == 'team' ? !attributes.includes(t) : attributes.includes(t)))).map((t) => {
                return {
                    type: "column",
                    name: t,
                    showInLegend: true,
                    toolTipContent: "<b>{label}</b> <br> <span style=\"color:#4F81BC\">{name}</span>: {y}",
                    dataPoints: [{ y: teamDelegation[t]['baseline'], label: 'vs. Baseline ADM' }, { y: teamDelegation[t]['misaligned'], label: 'vs. Misaligned ADM' }]
                }
            })
        }} />
    };

    const generateAlignmentByAttributePlot = () => {
        return <>
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
        </>;
    };

    const generateSelectionStatusChart = () => {
        return <div>
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
        </div>;
    };

    return (<div className='chart-header-label q3'>
        {delegationPreferences &&
            <div className='q2-adms'>
                {generateForcedChoiceChart()}
            </div>}
        {evalNumber == 5 && teamDelegation &&
            <div className='q2-adms'>
                <div className='outlinedPlot'>
                    <h4>Proportion of Delegation Preference By Attribute</h4>
                    {generateDelPrefByTeamOrAttributeChart('attribute')}
                </div>
                <div className='outlinedPlot'>
                    <h4>Proportion of Delegation Preference By Teams</h4>
                    {generateDelPrefByTeamOrAttributeChart('team')}
                </div>
            </div>}
        {alignmentsByAttribute && <div className='q2-adms'>
            {generateAlignmentByAttributePlot()}
        </div>}
        {ratingBySelection &&
            <div className='q2-adms'>
                {generateSelectionStatusChart()}
            </div>}
    </div>);
}