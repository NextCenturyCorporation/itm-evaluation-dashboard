import React from "react";
import CanvasJSReact from '@canvasjs/react-charts';
import { getMean, getMeanAcrossAll, getSeAcrossAll, getStandardError } from "../../statistics";

const CanvasJSChart = CanvasJSReact.CanvasJSChart;

export default function RQ2Graphs({ admAlignment, evalNumber, groupTargets }) {
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
                    maximum: 1.5,
                    labelFormatter: function () { return ""; }
                },
                axisY: {
                    maximum: 1,
                    minimum: evalNumber == 4 ? 0.5 : 0,
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

    return (<div className='chart-header-label q2'>
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

        {admAlignment && Object.keys(admAlignment).length > 0 && 
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
    </div>);
}