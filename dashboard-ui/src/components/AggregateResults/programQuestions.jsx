import React from 'react';
import './aggregateResults.css';
import { ScatterChart } from '@mui/x-charts';
import CanvasJSReact from '@canvasjs/react-charts';
import { getBoxWhiskerData, getMean, getMedian, getStandDev, getStandardError } from './statistics';
import { isDefined } from './DataFunctions';
import gql from "graphql-tag";
import { useQuery } from '@apollo/react-hooks';
import Select from 'react-select';

const get_eval_name_numbers = gql`
    query getEvalIds{
        getEvalIds
  }`;
let evalOptions = [];

const GET_ADM_DATA = gql`
    query getAllHistoryByEvalNumber($evalNumber: Float!) {
        getAllHistoryByEvalNumber(evalNumber: $evalNumber)
    }`;

const CanvasJSChart = CanvasJSReact.CanvasJSChart;

const AXIS_CONVERSION = {
    1: 'Jungle',
    2: 'Submarine',
    3: 'Desert',
    4: 'Urban',
    5: 'Average'
}

// initial scatter plot data with targets and bounds
const BASE_DATA_MAX = [
    {
        type: "scatter",
        name: "",
        showInLegend: false,
        markerType: "none",
        dataPoints: [
            { x: 0, y: 1 },
            { x: 1, y: 1 },
        ]
    },
    {
        type: "scatter",
        name: "Low Target",
        markerType: "square",
        showInLegend: true,
        color: '#555',
        toolTipContent: "<span style=\"color:#555 \">{name}<br/><span>{l}: {x}</span></span>",
        markerSize: 14,
        dataPoints: [
            { x: 0.1, y: 1, l: "Jungle" },
            { x: 0.1, y: 2, l: "Submarine" },
            { x: 0.1, y: 3, l: "Desert" },
            { x: 0.1, y: 4, l: "Urban" },
            { x: 0.1, y: 5, l: "Average" }
        ]
    },
    {
        type: "scatter",
        name: "High Target",
        showInLegend: true,
        color: '#555',
        toolTipContent: "<span style=\"color:#555 \">{name}<br/><span>{l}: {x}</span></span>",
        markerType: "square",
        markerSize: 14,
        dataPoints: [
            { x: 0.9, y: 1, l: "Jungle" },
            { x: 0.9, y: 2, l: "Submarine" },
            { x: 0.9, y: 3, l: "Desert" },
            { x: 0.9, y: 4, l: "Urban" },
            { x: 0.9, y: 5, l: "Average" }
        ]
    }
]
const BASE_DATA_MD = [
    {
        type: "scatter",
        name: "",
        showInLegend: false,
        markerType: "none",
        dataPoints: [
            { x: 0, y: 1 },
            { x: 1, y: 1 },
        ]
    },
    {
        type: "scatter",
        name: "Low Target",
        markerType: "square",
        showInLegend: true,
        color: '#555',
        toolTipContent: "<span style=\"color:#555 \">{name}<br/><span>{l}: {x}</span></span>",
        markerSize: 14,
        dataPoints: [
            { x: 0.22, y: 1, l: "Jungle" },
            { x: 0.22, y: 2, l: "Submarine" },
            { x: 0.22, y: 3, l: "Desert" },
            { x: 0.22, y: 4, l: "Urban" },
            { x: 0.22, y: 5, l: "Average" }
        ]
    },
    {
        type: "scatter",
        name: "High Target",
        showInLegend: true,
        color: '#555',
        toolTipContent: "<span style=\"color:#555 \">{name}<br/><span>{l}: {x}</span></span>",
        markerType: "square",
        markerSize: 14,
        dataPoints: [
            { x: 0.84, y: 1, l: "Jungle" },
            { x: 0.84, y: 2, l: "Submarine" },
            { x: 0.84, y: 3, l: "Desert" },
            { x: 0.84, y: 4, l: "Urban" },
            { x: 0.84, y: 5, l: "Average" }
        ]
    }
]

export default function ProgramQuestions({ allData, kdmaScatter, chartData }) {
    const { loading: loadingEvalNames, error: errorEvalNames, data: evalIdOptionsRaw } = useQuery(get_eval_name_numbers);
    const [selectedEval, setSelectedEval] = React.useState(3);
    const [admKdmas, setAdmKdmas] = React.useState(null);
    const [admAlignment, setAdmAlignment] = React.useState(null);

    const { data } = useQuery(GET_ADM_DATA, {
        variables: {"evalNumber": selectedEval},
    });

    React.useEffect(() => {
        evalOptions = [];
        if (evalIdOptionsRaw?.getEvalIds) { 
            for (const result of evalIdOptionsRaw.getEvalIds) {
                if (result.showMainPage )
                    evalOptions.push({value: result.evalNumber, label:  result.evalName})
            }
        }
         
    }, [evalIdOptionsRaw, evalOptions]);

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

    const getMeanAtt = (att) => {
        const data = allData.map((x) => x[att]);
        return getMean(data);
    };

    const getSeAtt = (att) => {
        const data = allData.map((x) => x[att]);
        return getStandardError(data);
    };

    const setYAxis = (e) => {
        return AXIS_CONVERSION[e.value] || '';
    };

    const getMeanAcrossAll = (obj, keys = 'all') => {
        const data = [];
        if (obj != undefined) {
           for (const key of Object.keys(obj)) {
                if (keys === 'all' || keys.includes(key)) {
                    data.push(...obj[key]);
                }
            }
        }
        return getMean(data);
    };

    const getSeAcrossAll = (obj, keys = 'all') => {
        const data = [];
        if (obj != undefined) {
            for (const key of Object.keys(obj)) {
                if (keys === 'all' || keys.includes(key)) {
                    data.push(...obj[key]);
                }
            }
        }
        return getStandardError(data);
    };

    const   getN = (obj, keys = 'all') => {
        const data = [];
        if (obj != undefined) {
            for (const key of Object.keys(obj)) {
                if (keys === 'all' || keys.includes(key)) {
                    data.push(...obj[key]);
                }
            }
        }
        return data.length;
    };

    const getDataPoints = (admName, att, ta1, yOffset = 0) => {
        const target = ta1 === 'A' ? ('ADEPT-metrics_eval-alignment-target-eval-' + (att === 1 ? 'HIGH' : 'LOW')) : ('maximization_' + (att === 1 ? 'high' : 'low'));
        const j = admKdmas[admName][target][ta1 === 'A' ? 'MetricsEval.MD4-Jungle' : 'jungle-1'];
        const s = admKdmas[admName][target][ta1 === 'A' ? 'MetricsEval.MD6-Submarine' : 'submarine-1'];
        const d = admKdmas[admName][target][ta1 === 'A' ? 'MetricsEval.MD5-Desert' : 'desert-1'];
        const u = admKdmas[admName][target][ta1 === 'A' ? 'MetricsEval.MD1-Urban' : 'urban-1'];
        const x = [
            { x: j, y: 1 + yOffset, l: "Jungle" },
            { x: s, y: 2 + yOffset, l: "Submarine" },
            { x: d, y: 3 + yOffset, l: "Desert" },
            { x: u, y: 4 + yOffset, l: "Urban" },
            { x: ((j + s + d + u) / 4).toFixed(2), y: 5 + yOffset, l: "Average" }
        ];
        return x;
    };

    function selectEvaluation(target){
        setSelectedEval(target.value);
    }    
    
    return (
        <div className="home-container">
            <div className='chart-home-container'>
                <div className="selection-section">
                    <Select
                        onChange={selectEvaluation}
                        options={evalOptions}
                        placeholder="Select Evaluation"
                        defaultValue={evalOptions[0]}
                        value={evalOptions[0]}
                        styles={{
                            // Fixes the overlapping problem of the component
                            menu: provided => ({ ...provided, zIndex: 9999 })
                        }}
                    />
                </div>                
                <div className='chart-header'>
                    <div className='chart-header-label'>
                        <h4>1. Does alignment score correlate with trust?</h4>
                    </div>
                </div>

                {chartData && <div className="kdma-section">
                    <div className="boxWhisker outlinedPlot">
                        <CanvasJSChart options={{
                            maintainAspectRatio: false,
                            height: "250",
                            width: "700",
                            data: [{
                                type: "boxAndWhisker", dataPoints: [
                                    { label: "ST_KDMA_Text", y: getBoxWhiskerData(chartData.stt) },
                                    { label: "ST_KDMA_Sim", y: getBoxWhiskerData(chartData.sts) },
                                    { label: "AD_KDMA_Text", y: getBoxWhiskerData(chartData.adt) },
                                    { label: "AD_KDMA_Sim", y: getBoxWhiskerData(chartData.ads) },
                                ]
                            }]
                        }} />
                    </div>
                    <table className='itm-table miniTable kdmaTable'>
                        <thead >
                            <tr>
                                <th></th>
                                <th>Mean</th>
                                <th>Median</th>
                                <th>Standard Deviation</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>ST_KDMA_Text</td>
                                <td>{getMean(chartData.stt).toFixed(2)}</td>
                                <td>{getMedian(chartData.stt).toFixed(2)}</td>
                                <td>{getStandDev(chartData.stt).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td>ST_KDMA_Sim</td>
                                <td>{getMean(chartData.sts).toFixed(2)}</td>
                                <td>{getMedian(chartData.sts).toFixed(2)}</td>
                                <td>{getStandDev(chartData.sts).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td>AD_KDMA_Text</td>
                                <td>{getMean(chartData.adt).toFixed(2)}</td>
                                <td>{getMedian(chartData.adt).toFixed(2)}</td>
                                <td>{getStandDev(chartData.adt).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td>AD_KDMA_Sim</td>
                                <td>{getMean(chartData.ads).toFixed(2)}</td>
                                <td>{getMedian(chartData.ads).toFixed(2)}</td>
                                <td>{getStandDev(chartData.ads).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>

                </div>}

                <CorrelationTables ta1="ADEPT" data={allData} />
                <CorrelationTables ta1="SoarTech" data={allData} />

                {kdmaScatter &&
                    <div className="scatters">
                        <div className="outlinedPlot scatter">
                            <ScatterChart
                                width={700}
                                height={300}
                                xAxis={[{ label: "ST_Align_Trust_Text" }]}
                                series={[
                                    {
                                        label: 'ST_KDMA_Text',
                                        data: kdmaScatter.map((v) => ({ x: v.st_trust, y: v.stt, id: v.id })),
                                    },
                                    {
                                        label: 'ST_KDMA_Sim',
                                        data: kdmaScatter.map((v) => ({ x: v.st_trust, y: v.sts, id: v.id })),
                                    }
                                ]}
                            />
                        </div>
                        <div className="outlinedPlot scatter">
                            <ScatterChart
                                width={700}
                                height={300}
                                xAxis={[{ label: "AD_Align_Trust_Text" }]}
                                series={[
                                    {
                                        label: 'AD_KDMA_Text',
                                        data: kdmaScatter.map((v) => ({ x: v.ad_trust, y: v.adt, id: v.id })),
                                    },
                                    {
                                        label: 'AD_KDMA_Sim',
                                        data: kdmaScatter.map((v) => ({ x: v.ad_trust, y: v.ads, id: v.id })),
                                    }
                                ]}
                            />
                        </div>
                    </div>}
            </div>
            <div className='chart-home-container'>
                <div className='chart-header'>
                    <div className='chart-header-label'>
                        <h4>2. Does aligned ADM have a higher alignment score than baseline ADM?</h4>
                    </div>
                </div>
                <h2 className='subtitle'>Alignment</h2>
                {admAlignment && <><div className='q2-adms'>
                    <div>
                        <h3>Average Alignment Scores for Aligned and Baseline ADMs across Attributes and Alignment Targets (N={getN(admAlignment['TAD aligned'])})</h3>
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
                                color: '#5B89C1',
                                showInLegend: true,
                                toolTipContent: "<b>{label}</b> <br> <span style=\"color:#4F81BC\">{name}</span>: {y}",
                                dataPoints: [
                                    { y: getMeanAcrossAll(admAlignment['TAD aligned']), label: "Parallax" },
                                    { y: getMeanAcrossAll(admAlignment['kitware-single-kdma-adm-aligned-no-negatives']), label: "Kitware" }
                                ]
                            },
                            {
                                type: "error",
                                color: "#555",
                                name: "Variability Range",
                                toolTipContent: "<span style=\"color:#C0504E\">{name}</span>: {y[0]} - {y[1]}",
                                dataPoints: [
                                    { y: getSeAcrossAll(admAlignment['TAD aligned']), label: "Parallax" },
                                    { y: getSeAcrossAll(admAlignment['kitware-single-kdma-adm-aligned-no-negatives']), label: "Kitware" }
                                ]
                            },
                            {
                                type: "column",
                                name: "Baseline",
                                color: '#C15B5B',
                                showInLegend: true,
                                toolTipContent: "<b>{label}</b> <br> <span style=\"color:#4F81BC\">{name}</span>: {y}",
                                dataPoints: [
                                    { y: getMeanAcrossAll(admAlignment['TAD baseline']), label: "Parallax" },
                                    { y: getMeanAcrossAll(admAlignment['kitware-single-kdma-adm-baseline']), label: "Kitware" }
                                ]
                            },
                            {
                                type: "error",
                                name: "Variability Range",
                                color: '#555',
                                toolTipContent: "<span style=\"color:#C0504E\">{name}</span>: {y[0]} - {y[1]}",
                                dataPoints: [
                                    { y: getSeAcrossAll(admAlignment['TAD baseline']), label: "Parallax" },
                                    { y: getSeAcrossAll(admAlignment['kitware-single-kdma-adm-baseline']), label: "Kitware" }
                                ]
                            }
                            ]
                        }} />
                    </div>
                    <div>
                        <h3>Average Alignment Scores for Aligned and Baseline ADMs across Attributes for High and Low Alignment Targets (N={getN(admAlignment['TAD aligned'], ['maximization_high', 'ADEPT-metrics_eval-alignment-target-eval-HIGH'])})</h3>
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
                                name: "Aligned High",
                                color: '#85CBD6',
                                showInLegend: true,
                                toolTipContent: "<b>{label}</b> <br> <span style=\"color:#4F81BC\">{name}</span>: {y}",
                                dataPoints: [
                                    { y: getMeanAcrossAll(admAlignment['TAD aligned'], ['maximization_high', 'ADEPT-metrics_eval-alignment-target-eval-HIGH']), label: "Parallax" },
                                    { y: getMeanAcrossAll(admAlignment['kitware-single-kdma-adm-aligned-no-negatives'], ['maximization_high', 'ADEPT-metrics_eval-alignment-target-eval-HIGH']), label: "Kitware" }
                                ]
                            },
                            {
                                type: "error",
                                color: "#555",
                                name: "Variability Range",
                                toolTipContent: "<span style=\"color:#C0504E\">{name}</span>: {y[0]} - {y[1]}",
                                dataPoints: [
                                    { y: getSeAcrossAll(admAlignment['TAD aligned'], ['maximization_high', 'ADEPT-metrics_eval-alignment-target-eval-HIGH']), label: "Parallax" },
                                    { y: getSeAcrossAll(admAlignment['kitware-single-kdma-adm-aligned-no-negatives'], ['maximization_high', 'ADEPT-metrics_eval-alignment-target-eval-HIGH']), label: "Kitware" }
                                ]
                            },
                            {
                                type: "column",
                                name: "Baseline High",
                                color: '#475684',
                                showInLegend: true,
                                toolTipContent: "<b>{label}</b> <br> <span style=\"color:#4F81BC\">{name}</span>: {y}",
                                dataPoints: [
                                    { y: getMeanAcrossAll(admAlignment['TAD baseline'], ['maximization_high', 'ADEPT-metrics_eval-alignment-target-eval-HIGH']), label: "Parallax" },
                                    { y: getMeanAcrossAll(admAlignment['kitware-single-kdma-adm-baseline'], ['maximization_high', 'ADEPT-metrics_eval-alignment-target-eval-HIGH']), label: "Kitware" }
                                ]
                            },
                            {
                                type: "error",
                                name: "Variability Range",
                                color: '#555',
                                toolTipContent: "<span style=\"color:#C0504E\">{name}</span>: {y[0]} - {y[1]}",
                                dataPoints: [
                                    { y: getSeAcrossAll(admAlignment['TAD baseline'], ['maximization_high', 'ADEPT-metrics_eval-alignment-target-eval-HIGH']), label: "Parallax" },
                                    { y: getSeAcrossAll(admAlignment['kitware-single-kdma-adm-baseline'], ['maximization_high', 'ADEPT-metrics_eval-alignment-target-eval-HIGH']), label: "Kitware" }
                                ]
                            },
                            {
                                type: "column",
                                name: "Aligned Low",
                                color: '#779D86',
                                showInLegend: true,
                                toolTipContent: "<b>{label}</b> <br> <span style=\"color:#4F81BC\">{name}</span>: {y}",
                                dataPoints: [
                                    { y: getMeanAcrossAll(admAlignment['TAD aligned'], ['maximization_low', 'ADEPT-metrics_eval-alignment-target-eval-LOW']), label: "Parallax" },
                                    { y: getMeanAcrossAll(admAlignment['kitware-single-kdma-adm-aligned-no-negatives'], ['maximization_low', 'ADEPT-metrics_eval-alignment-target-eval-LOW']), label: "Kitware" }
                                ]
                            },
                            {
                                type: "error",
                                color: "#555",
                                name: "Variability Range",
                                toolTipContent: "<span style=\"color:#C0504E\">{name}</span>: {y[0]} - {y[1]}",
                                dataPoints: [
                                    { y: getSeAcrossAll(admAlignment['TAD aligned'], ['maximization_low', 'ADEPT-metrics_eval-alignment-target-eval-LOW']), label: "Parallax" },
                                    { y: getSeAcrossAll(admAlignment['kitware-single-kdma-adm-aligned-no-negatives'], ['maximization_low', 'ADEPT-metrics_eval-alignment-target-eval-LOW']), label: "Kitware" }
                                ]
                            },
                            {
                                type: "column",
                                name: "Baseline Low",
                                color: '#489C9A',
                                showInLegend: true,
                                toolTipContent: "<b>{label}</b> <br> <span style=\"color:#4F81BC\">{name}</span>: {y}",
                                dataPoints: [
                                    { y: getMeanAcrossAll(admAlignment['TAD baseline'], ['maximization_low', 'ADEPT-metrics_eval-alignment-target-eval-LOW']), label: "Parallax" },
                                    { y: getMeanAcrossAll(admAlignment['kitware-single-kdma-adm-baseline'], ['maximization_low', 'ADEPT-metrics_eval-alignment-target-eval-LOW']), label: "Kitware" }
                                ]
                            },
                            {
                                type: "error",
                                name: "Variability Range",
                                color: '#555',
                                toolTipContent: "<span style=\"color:#C0504E\">{name}</span>: {y[0]} - {y[1]}",
                                dataPoints: [
                                    { y: getSeAcrossAll(admAlignment['TAD baseline'], ['maximization_low', 'ADEPT-metrics_eval-alignment-target-eval-LOW']), label: "Parallax" },
                                    { y: getSeAcrossAll(admAlignment['kitware-single-kdma-adm-baseline'], ['maximization_low', 'ADEPT-metrics_eval-alignment-target-eval-LOW']), label: "Kitware" }
                                ]
                            }
                            ]
                        }} />
                    </div>
                    <div>
                        <h3>Average Alignment Scores for Aligned and Baseline ADMs across Alignment Targets (N={getN(admAlignment['TAD aligned'], ['maximization_high', 'maximization_low'])})</h3>
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
                                color: '#5B89C1',
                                showInLegend: true,
                                toolTipContent: "<b>{tooltip}</b> <br> <span style=\"color:#4F81BC\">{name}</span>: {y}",
                                dataPoints: [
                                    { y: getMeanAcrossAll(admAlignment['TAD aligned'], ['maximization_high', 'maximization_low']), label: "Parallax - Max", tooltip: "Parallax - Maximization" },
                                    { y: getMeanAcrossAll(admAlignment['TAD aligned'], ['ADEPT-metrics_eval-alignment-target-eval-HIGH', 'ADEPT-metrics_eval-alignment-target-eval-LOW']), label: "Parallax - MD", tooltip: "Parallax - Moral Desert" },
                                    { y: getMeanAcrossAll(admAlignment['kitware-single-kdma-adm-aligned-no-negatives'], ['maximization_high', 'maximization_low']), label: "Kitware - Max", tooltip: "Kitware -  Maximization" },
                                    { y: getMeanAcrossAll(admAlignment['kitware-single-kdma-adm-aligned-no-negatives'], ['ADEPT-metrics_eval-alignment-target-eval-HIGH', 'ADEPT-metrics_eval-alignment-target-eval-LOW']), label: "Kitware - MD", tooltip: "Kitware - Moral Desert" }
                                ]
                            },
                            {
                                type: "error",
                                color: "#555",
                                name: "Variability Range",
                                toolTipContent: "<span style=\"color:#C0504E\">{name}</span>: {y[0]} - {y[1]}",
                                dataPoints: [
                                    { y: getSeAcrossAll(admAlignment['TAD aligned'], ['maximization_high', 'maximization_low']), label: "Parallax - Max" },
                                    { y: getSeAcrossAll(admAlignment['TAD aligned'], ['ADEPT-metrics_eval-alignment-target-eval-HIGH', 'ADEPT-metrics_eval-alignment-target-eval-LOW']), label: "Parallax - MD" },
                                    { y: getSeAcrossAll(admAlignment['kitware-single-kdma-adm-aligned-no-negatives'], ['maximization_high', 'maximization_low']), label: "Kitware - Max" },
                                    { y: getSeAcrossAll(admAlignment['kitware-single-kdma-adm-aligned-no-negatives'], ['ADEPT-metrics_eval-alignment-target-eval-HIGH', 'ADEPT-metrics_eval-alignment-target-eval-LOW']), label: "Kitware - MD" }
                                ]
                            },
                            {
                                type: "column",
                                name: "Baseline",
                                color: '#C15B5B',
                                showInLegend: true,
                                toolTipContent: "<b>{tooltip}</b> <br> <span style=\"color:#4F81BC\">{name}</span>: {y}",
                                dataPoints: [
                                    { y: getMeanAcrossAll(admAlignment['TAD baseline'], ['maximization_high', 'maximization_low']), label: "Parallax - Max", tooltip: "Parallax - Maximization" },
                                    { y: getMeanAcrossAll(admAlignment['TAD baseline'], ['ADEPT-metrics_eval-alignment-target-eval-HIGH', 'ADEPT-metrics_eval-alignment-target-eval-LOW']), label: "Parallax - MD", tooltip: "Parallax - Moral Desert" },
                                    { y: getMeanAcrossAll(admAlignment['kitware-single-kdma-adm-baseline'], ['maximization_high', 'maximization_low']), label: "Kitware - Max", tooltip: "Kitware - Maximization" },
                                    { y: getMeanAcrossAll(admAlignment['kitware-single-kdma-adm-baseline'], ['ADEPT-metrics_eval-alignment-target-eval-HIGH', 'ADEPT-metrics_eval-alignment-target-eval-LOW']), label: "Kitware - MD", tooltip: "Kitware - Moral Desert" }
                                ]
                            },
                            {
                                type: "error",
                                name: "Variability Range",
                                color: '#555',
                                toolTipContent: "<span style=\"color:#C0504E\">{name}</span>: {y[0]} - {y[1]}",
                                dataPoints: [
                                    { y: getSeAcrossAll(admAlignment['TAD baseline'], ['maximization_high', 'maximization_low']), label: "Parallax - Max" },
                                    { y: getSeAcrossAll(admAlignment['TAD baseline'], ['ADEPT-metrics_eval-alignment-target-eval-HIGH', 'ADEPT-metrics_eval-alignment-target-eval-LOW']), label: "Parallax - MD" },
                                    { y: getSeAcrossAll(admAlignment['kitware-single-kdma-adm-baseline'], ['maximization_high', 'maximization_low']), label: "Kitware - Max" },
                                    { y: getSeAcrossAll(admAlignment['kitware-single-kdma-adm-baseline'], ['ADEPT-metrics_eval-alignment-target-eval-HIGH', 'ADEPT-metrics_eval-alignment-target-eval-LOW']), label: "Kitware - MD" }
                                ]
                            }
                            ]
                        }} />
                    </div>

                </div>
                    <div className='side-by-side'>
                        <div>
                            <h3>Average Alignment Scores for Aligned and Baseline ADMs by Attributes and Alignment Targets <br /> -- Parallax (N={getN(admAlignment['TAD aligned'], ['maximization_high'])}) --</h3>
                            <CanvasJSChart options={{
                                width: "700",
                                dataPointWidth: 50,
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
                                    color: '#5B89C1',
                                    showInLegend: true,
                                    toolTipContent: "<b>{tooltip}</b> <br> <span style=\"color:#4F81BC\">{name}</span>: {y}",
                                    dataPoints: [
                                        { y: getMeanAcrossAll(admAlignment['TAD aligned'], ['maximization_high']), label: "Max - High", tooltip: "Maximization - High" },
                                        { y: getMeanAcrossAll(admAlignment['TAD aligned'], ['maximization_low']), label: "Max - Low", tooltip: "Maximization - Low" },
                                        { y: getMeanAcrossAll(admAlignment['TAD aligned'], ['ADEPT-metrics_eval-alignment-target-eval-HIGH']), label: "MD - High", tooltip: "Moral Desert - High" },
                                        { y: getMeanAcrossAll(admAlignment['TAD aligned'], ['ADEPT-metrics_eval-alignment-target-eval-LOW']), label: "MD - Low", tooltip: "Moral Desert - Low" }
                                    ]
                                },
                                {
                                    type: "error",
                                    color: "#555",
                                    name: "Variability Range",
                                    toolTipContent: "<span style=\"color:#C0504E\">{name}</span>: {y[0]} - {y[1]}",
                                    dataPoints: [
                                        { y: getSeAcrossAll(admAlignment['TAD aligned'], ['maximization_high']), label: "Max - High" },
                                        { y: getSeAcrossAll(admAlignment['TAD aligned'], ['maximization_low']), label: "Max - Low" },
                                        { y: getSeAcrossAll(admAlignment['TAD aligned'], ['ADEPT-metrics_eval-alignment-target-eval-HIGH']), label: "MD - High" },
                                        { y: getSeAcrossAll(admAlignment['TAD aligned'], ['ADEPT-metrics_eval-alignment-target-eval-LOW']), label: "MD - Low" }
                                    ]
                                },
                                {
                                    type: "column",
                                    name: "Baseline",
                                    color: '#C15B5B',
                                    showInLegend: true,
                                    toolTipContent: "<b>{tooltip}</b> <br> <span style=\"color:#4F81BC\">{name}</span>: {y}",
                                    dataPoints: [
                                        { y: getMeanAcrossAll(admAlignment['TAD baseline'], ['maximization_high']), label: "Max - High", tooltip: "Maximization - High" },
                                        { y: getMeanAcrossAll(admAlignment['TAD baseline'], ['maximization_low']), label: "Max - Low", tooltip: "Maximization - Low" },
                                        { y: getMeanAcrossAll(admAlignment['TAD baseline'], ['ADEPT-metrics_eval-alignment-target-eval-HIGH']), label: "MD - High", tooltip: "Moral Desert - High" },
                                        { y: getMeanAcrossAll(admAlignment['TAD baseline'], ['ADEPT-metrics_eval-alignment-target-eval-LOW']), label: "MD - Low", tooltip: "Moral Desert - Low" }
                                    ]
                                },
                                {
                                    type: "error",
                                    color: "#555",
                                    name: "Variability Range",
                                    toolTipContent: "<span style=\"color:#C0504E\">{name}</span>: {y[0]} - {y[1]}",
                                    dataPoints: [
                                        { y: getSeAcrossAll(admAlignment['TAD baseline'], ['maximization_high']), label: "Max - High" },
                                        { y: getSeAcrossAll(admAlignment['TAD baseline'], ['maximization_low']), label: "Max - Low" },
                                        { y: getSeAcrossAll(admAlignment['TAD baseline'], ['ADEPT-metrics_eval-alignment-target-eval-HIGH']), label: "MD - High" },
                                        { y: getSeAcrossAll(admAlignment['TAD baseline'], ['ADEPT-metrics_eval-alignment-target-eval-LOW']), label: "MD - Low" }
                                    ]
                                }
                                ]
                            }} />
                        </div>
                        <div>
                            <h3>Average Alignment Scores for Aligned and Baseline ADMs by Attributes and Alignment Targets <br /> -- Kitware (N={getN(admAlignment['kitware-single-kdma-adm-aligned-no-negatives'], ['maximization_high'])}) --</h3>
                            <CanvasJSChart options={{
                                width: "700",
                                dataPointWidth: 50,
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
                                    color: '#5B89C1',
                                    showInLegend: true,
                                    toolTipContent: "<b>{tooltip}</b> <br> <span style=\"color:#4F81BC\">{name}</span>: {y}",
                                    dataPoints: [
                                        { y: getMeanAcrossAll(admAlignment['kitware-single-kdma-adm-aligned-no-negatives'], ['maximization_high']), label: "Max - High", tooltip: "Maximization - High" },
                                        { y: getMeanAcrossAll(admAlignment['kitware-single-kdma-adm-aligned-no-negatives'], ['maximization_low']), label: "Max - Low", tooltip: "Maximization - Low" },
                                        { y: getMeanAcrossAll(admAlignment['kitware-single-kdma-adm-aligned-no-negatives'], ['ADEPT-metrics_eval-alignment-target-eval-HIGH']), label: "MD - High", tooltip: "Moral Desert - High" },
                                        { y: getMeanAcrossAll(admAlignment['kitware-single-kdma-adm-aligned-no-negatives'], ['ADEPT-metrics_eval-alignment-target-eval-LOW']), label: "MD - Low", tooltip: "Moral Desert - Low" }
                                    ]
                                },
                                {
                                    type: "error",
                                    color: "#555",
                                    name: "Variability Range",
                                    toolTipContent: "<span style=\"color:#C0504E\">{name}</span>: {y[0]} - {y[1]}",
                                    dataPoints: [
                                        { y: getSeAcrossAll(admAlignment['kitware-single-kdma-adm-aligned-no-negatives'], ['maximization_high']), label: "Max - High" },
                                        { y: getSeAcrossAll(admAlignment['kitware-single-kdma-adm-aligned-no-negatives'], ['maximization_low']), label: "Max - Low" },
                                        { y: getSeAcrossAll(admAlignment['kitware-single-kdma-adm-aligned-no-negatives'], ['ADEPT-metrics_eval-alignment-target-eval-HIGH']), label: "MD - High" },
                                        { y: getSeAcrossAll(admAlignment['kitware-single-kdma-adm-aligned-no-negatives'], ['ADEPT-metrics_eval-alignment-target-eval-LOW']), label: "MD - Low" }
                                    ]
                                },
                                {
                                    type: "column",
                                    name: "Baseline",
                                    color: '#C15B5B',
                                    showInLegend: true,
                                    toolTipContent: "<b>{tooltip}</b> <br> <span style=\"color:#4F81BC\">{name}</span>: {y}",
                                    dataPoints: [
                                        { y: getMeanAcrossAll(admAlignment['kitware-single-kdma-adm-baseline'], ['maximization_high']), label: "Max - High", tooltip: "Maximization - High" },
                                        { y: getMeanAcrossAll(admAlignment['kitware-single-kdma-adm-baseline'], ['maximization_low']), label: "Max - Low", tooltip: "Maximization - Low" },
                                        { y: getMeanAcrossAll(admAlignment['kitware-single-kdma-adm-baseline'], ['ADEPT-metrics_eval-alignment-target-eval-HIGH']), label: "MD - High", tooltip: "Moral Desert - High" },
                                        { y: getMeanAcrossAll(admAlignment['kitware-single-kdma-adm-baseline'], ['ADEPT-metrics_eval-alignment-target-eval-LOW']), label: "MD - Low", tooltip: "Moral Desert - Low" }
                                    ]
                                },
                                {
                                    type: "error",
                                    color: "#555",
                                    name: "Variability Range",
                                    toolTipContent: "<span style=\"color:#C0504E\">{name}</span>: {y[0]} - {y[1]}",
                                    dataPoints: [
                                        { y: getSeAcrossAll(admAlignment['kitware-single-kdma-adm-baseline'], ['maximization_high']), label: "Max - High" },
                                        { y: getSeAcrossAll(admAlignment['kitware-single-kdma-adm-baseline'], ['maximization_low']), label: "Max - Low" },
                                        { y: getSeAcrossAll(admAlignment['kitware-single-kdma-adm-baseline'], ['ADEPT-metrics_eval-alignment-target-eval-HIGH']), label: "MD - High" },
                                        { y: getSeAcrossAll(admAlignment['kitware-single-kdma-adm-baseline'], ['ADEPT-metrics_eval-alignment-target-eval-LOW']), label: "MD - Low" }
                                    ]
                                }
                                ]
                            }} />
                        </div>
                    </div>
                </>}
                <h2 className='subtitle'>KDMAs</h2>
                {admKdmas && <div className='q2-adms'>
                    <div>
                        <h3>Parallax - Maximization</h3>
                        <CanvasJSChart options={{
                            width: "1200",
                            height: "380",
                            axisY: {
                                labelFormatter: setYAxis
                            },
                            data: [
                                ...BASE_DATA_MAX,
                                {
                                    type: "scatter",
                                    name: "Aligned Low",
                                    showInLegend: true,
                                    color: '#9ed483',
                                    toolTipContent: "<span style=\"color:#9ed483 \">{name}<br/><span>{l}: {x}</span></span>",
                                    markerType: "cross",
                                    markerBorderColor: '#9ed483',
                                    markerBorderThickness: 3,
                                    markerSize: 16,
                                    dataPoints: getDataPoints('TAD aligned', 0, 'S', 0.2)
                                },
                                {
                                    type: "scatter",
                                    name: "Aligned High",
                                    showInLegend: true,
                                    color: '#4f994e',
                                    toolTipContent: "<span style=\"color:#4f994e \">{name}<br/><span>{l}: {x}</span></span>",
                                    markerType: "cross",
                                    markerBorderColor: '#4f994e',
                                    markerBorderThickness: 3,
                                    markerSize: 16,
                                    dataPoints: getDataPoints('TAD aligned', 1, 'S', 0.2)
                                },
                                {
                                    type: "scatter",
                                    name: "Misaligned Low",
                                    showInLegend: true,
                                    color: '#76b3c2',
                                    toolTipContent: "<span style=\"color:#76b3c2 \">{name}<br/><span>{l}: {x}</span></span>",
                                    markerType: "circle",
                                    markerSize: 10,
                                    dataPoints: getDataPoints('TAD misaligned', 0, 'S', -0.1)
                                },
                                {
                                    type: "scatter",
                                    name: "Misaligned High",
                                    showInLegend: true,
                                    color: '#367d8f',
                                    toolTipContent: "<span style=\"color:#367d8f \">{name}<br/><span>{l}: {x}</span></span>",
                                    markerType: "circle",
                                    markerSize: 10,
                                    dataPoints: getDataPoints('TAD misaligned', 1, 'S', -0.1)
                                },
                                {
                                    type: "scatter",
                                    name: "Severity Baseline Low",
                                    showInLegend: true,
                                    color: '#db9239',
                                    toolTipContent: "<span style=\"color:#db9239 \">{name}<br/><span>{l}: {x}</span></span>",
                                    markerType: "triangle",
                                    markerSize: 11,
                                    dataPoints: getDataPoints('TAD severity-baseline', 0, 'S', 0.09)
                                },
                                {
                                    type: "scatter",
                                    name: "Severity Baseline High",
                                    showInLegend: true,
                                    color: '#995e17',
                                    toolTipContent: "<span style=\"color:#995e17 \">{name}<br/><span>{l}: {x}</span></span>",
                                    markerType: "triangle",
                                    markerSize: 11,
                                    dataPoints: getDataPoints('TAD severity-baseline', 1, 'S', 0.09)
                                },
                                {
                                    type: "scatter",
                                    name: "Baseline Low",
                                    showInLegend: true,
                                    color: '#aba41b',
                                    toolTipContent: "<span style=\"color:#aba41b \">{name}<br/><span>{l}: {x}</span></span>",
                                    markerType: "triangle",
                                    markerBorderColor: '#aaa',
                                    markerBorderThickness: 1,
                                    markerSize: 12,
                                    dataPoints: getDataPoints('TAD baseline', 0, 'S', -0.09)
                                },
                                {
                                    type: "scatter",
                                    name: "Baseline High",
                                    showInLegend: true,
                                    color: '#f0e513',
                                    toolTipContent: "<span style=\"color:#f0e513 \">{name}<br/><span>{l}: {x}</span></span>",
                                    markerType: "triangle",
                                    markerBorderColor: '#aaa',
                                    markerBorderThickness: 1,
                                    markerSize: 12,
                                    dataPoints: getDataPoints('TAD baseline', 1, 'S', -0.09)
                                }]
                        }}
                        />
                    </div>

                    <div>
                        <h3>Parallax - Moral Desert</h3>
                        <CanvasJSChart options={{
                            width: "1200",
                            height: "380",
                            axisY: {
                                labelFormatter: setYAxis
                            },
                            data: [
                                ...BASE_DATA_MD,
                                {
                                    type: "scatter",
                                    name: "Aligned Low",
                                    showInLegend: true,
                                    color: '#9ed483',
                                    toolTipContent: "<span style=\"color:#9ed483 \">{name}<br/><span>{l}: {x}</span></span>",
                                    markerType: "cross",
                                    markerBorderColor: '#9ed483',
                                    markerBorderThickness: 3,
                                    markerSize: 16,
                                    dataPoints: getDataPoints('TAD aligned', 0, 'A', 0.23)
                                },
                                {
                                    type: "scatter",
                                    name: "Aligned High",
                                    showInLegend: true,
                                    color: '#4f994e',
                                    toolTipContent: "<span style=\"color:#4f994e \">{name}<br/><span>{l}: {x}</span></span>",
                                    markerType: "cross",
                                    markerBorderColor: '#4f994e',
                                    markerBorderThickness: 3,
                                    markerSize: 16,
                                    dataPoints: getDataPoints('TAD aligned', 1, 'A', 0.23)
                                },
                                {
                                    type: "scatter",
                                    name: "Misaligned Low",
                                    showInLegend: true,
                                    color: '#76b3c2',
                                    toolTipContent: "<span style=\"color:#76b3c2 \">{name}<br/><span>{l}: {x}</span></span>",
                                    markerType: "circle",
                                    markerSize: 10,
                                    dataPoints: getDataPoints('TAD misaligned', 0, 'A', 0.07)
                                },
                                {
                                    type: "scatter",
                                    name: "Misaligned High",
                                    showInLegend: true,
                                    color: '#367d8f',
                                    toolTipContent: "<span style=\"color:#367d8f \">{name}<br/><span>{l}: {x}</span></span>",
                                    markerType: "circle",
                                    markerSize: 10,
                                    dataPoints: getDataPoints('TAD misaligned', 1, 'A', 0.07)
                                },
                                {
                                    type: "scatter",
                                    name: "Baseline Low",
                                    showInLegend: true,
                                    color: '#aba41b',
                                    toolTipContent: "<span style=\"color:#aba41b \">{name}<br/><span>{l}: {x}</span></span>",
                                    markerType: "triangle",
                                    markerBorderColor: '#aaa',
                                    markerBorderThickness: 1,
                                    markerSize: 12,
                                    dataPoints: getDataPoints('TAD baseline', 0, 'A', -0.06)
                                },
                                {
                                    type: "scatter",
                                    name: "Baseline High",
                                    showInLegend: true,
                                    color: '#f0e513',
                                    toolTipContent: "<span style=\"color:#f0e513 \">{name}<br/><span>{l}: {x}</span></span>",
                                    markerType: "triangle",
                                    markerBorderColor: '#aaa',
                                    markerBorderThickness: 1,
                                    markerSize: 12,
                                    dataPoints: getDataPoints('TAD baseline', 1, 'A', 0.16)
                                },
                                {
                                    type: "scatter",
                                    name: "Severity Baseline Low",
                                    showInLegend: true,
                                    color: '#db9239',
                                    toolTipContent: "<span style=\"color:#db9239 \">{name}<br/><span>{l}: {x}</span></span>",
                                    markerType: "triangle",
                                    markerSize: 11,
                                    dataPoints: getDataPoints('TAD severity-baseline', 0, 'A', 0.04)
                                },
                                {
                                    type: "scatter",
                                    name: "Severity Baseline High",
                                    showInLegend: true,
                                    color: '#995e17',
                                    toolTipContent: "<span style=\"color:#995e17 \">{name}<br/><span>{l}: {x}</span></span>",
                                    markerType: "triangle",
                                    markerSize: 11,
                                    dataPoints: getDataPoints('TAD severity-baseline', 1, 'A', -0.17)
                                }]
                        }}
                        />
                    </div>
                    <div>
                        <h3>Kitware - Maximization</h3>
                        <CanvasJSChart options={{
                            width: "1200",
                            height: "380",
                            axisY: {
                                labelFormatter: setYAxis
                            },
                            data: [
                                ...BASE_DATA_MAX,
                                {
                                    type: "scatter",
                                    name: "Hybrid Aligned Low",
                                    showInLegend: true,
                                    color: '#9ed483',
                                    toolTipContent: "<span style=\"color:#9ed483 \">{name}<br/><span>{l}: {x}</span></span>",
                                    markerType: "cross",
                                    markerBorderColor: '#9ed483',
                                    markerBorderThickness: 3,
                                    markerSize: 16,
                                    dataPoints: getDataPoints('kitware-hybrid-kaleido-aligned', 0, 'S', 0.2)
                                },
                                {
                                    type: "scatter",
                                    name: "Hybrid Aligned High",
                                    showInLegend: true,
                                    color: '#4f994e',
                                    toolTipContent: "<span style=\"color:#4f994e \">{name}<br/><span>{l}: {x}</span></span>",
                                    markerType: "cross",
                                    markerBorderColor: '#4f994e',
                                    markerBorderThickness: 3,
                                    markerSize: 16,
                                    dataPoints: getDataPoints('kitware-hybrid-kaleido-aligned', 1, 'S', 0.2)
                                },
                                {
                                    type: "scatter",
                                    name: "Single Aligned Low",
                                    showInLegend: true,
                                    color: '#76b3c2',
                                    toolTipContent: "<span style=\"color:#76b3c2 \">{name}<br/><span>{l}: {x}</span></span>",
                                    markerType: "circle",
                                    markerSize: 10,
                                    dataPoints: getDataPoints('kitware-single-kdma-adm-aligned-no-negatives', 0, 'S', -0.1)
                                },
                                {
                                    type: "scatter",
                                    name: "Single Aligned High",
                                    showInLegend: true,
                                    color: '#367d8f',
                                    toolTipContent: "<span style=\"color:#367d8f \">{name}<br/><span>{l}: {x}</span></span>",
                                    markerType: "circle",
                                    markerSize: 10,
                                    dataPoints: getDataPoints('kitware-single-kdma-adm-aligned-no-negatives', 1, 'S', -0.1)
                                },
                                {
                                    type: "scatter",
                                    name: "Baseline Low",
                                    showInLegend: true,
                                    color: '#aba41b',
                                    toolTipContent: "<span style=\"color:#aba41b \">{name}<br/><span>{l}: {x}</span></span>",
                                    markerType: "triangle",
                                    markerBorderColor: '#aaa',
                                    markerBorderThickness: 1,
                                    markerSize: 12,
                                    dataPoints: getDataPoints('kitware-single-kdma-adm-baseline', 0, 'S', 0.1)
                                },
                                {
                                    type: "scatter",
                                    name: "Baseline High",
                                    showInLegend: true,
                                    color: '#f0e513',
                                    toolTipContent: "<span style=\"color:#f0e513 \">{name}<br/><span>{l}: {x}</span></span>",
                                    markerType: "triangle",
                                    markerBorderColor: '#aaa',
                                    markerBorderThickness: 1,
                                    markerSize: 12,
                                    dataPoints: getDataPoints('kitware-single-kdma-adm-baseline', 1, 'S', 0.1)
                                }]
                        }}
                        />
                    </div>
                    <div>
                        <h3>Kitware - Moral Desert</h3>
                        <CanvasJSChart options={{
                            width: "1200",
                            height: "380",
                            axisY: {
                                labelFormatter: setYAxis
                            },
                            data: [
                                ...BASE_DATA_MD,
                                {
                                    type: "scatter",
                                    name: "Hybrid Aligned Low",
                                    showInLegend: true,
                                    color: '#9ed483',
                                    toolTipContent: "<span style=\"color:#9ed483 \">{name}<br/><span>{l}: {x}</span></span>",
                                    markerType: "cross",
                                    markerBorderColor: '#9ed483',
                                    markerBorderThickness: 3,
                                    markerSize: 16,
                                    dataPoints: getDataPoints('kitware-hybrid-kaleido-aligned', 0, 'A', 0.25)
                                },
                                {
                                    type: "scatter",
                                    name: "Hybrid Aligned High",
                                    showInLegend: true,
                                    color: '#4f994e',
                                    toolTipContent: "<span style=\"color:#4f994e \">{name}<br/><span>{l}: {x}</span></span>",
                                    markerType: "cross",
                                    markerBorderColor: '#4f994e',
                                    markerBorderThickness: 3,
                                    markerSize: 16,
                                    dataPoints: getDataPoints('kitware-hybrid-kaleido-aligned', 1, 'A', 0.3)
                                },
                                {
                                    type: "scatter",
                                    name: "Single Aligned Low",
                                    showInLegend: true,
                                    color: '#76b3c2',
                                    toolTipContent: "<span style=\"color:#76b3c2 \">{name}<br/><span>{l}: {x}</span></span>",
                                    markerType: "circle",
                                    markerSize: 10,
                                    dataPoints: getDataPoints('kitware-single-kdma-adm-aligned-no-negatives', 0, 'A')
                                },
                                {
                                    type: "scatter",
                                    name: "Single Aligned High",
                                    showInLegend: true,
                                    color: '#367d8f',
                                    toolTipContent: "<span style=\"color:#367d8f \">{name}<br/><span>{l}: {x}</span></span>",
                                    markerType: "circle",
                                    markerSize: 10,
                                    dataPoints: getDataPoints('kitware-single-kdma-adm-aligned-no-negatives', 1, 'A', 0.15)
                                },
                                {
                                    type: "scatter",
                                    name: "Baseline Low",
                                    showInLegend: true,
                                    color: '#aba41b',
                                    toolTipContent: "<span style=\"color:#aba41b \">{name}<br/><span>{l}: {x}</span></span>",
                                    markerType: "triangle",
                                    markerBorderColor: '#aaa',
                                    markerBorderThickness: 1,
                                    markerSize: 12,
                                    dataPoints: getDataPoints('kitware-single-kdma-adm-baseline', 0, 'A', -0.23)
                                },
                                {
                                    type: "scatter",
                                    name: "Baseline High",
                                    showInLegend: true,
                                    color: '#f0e513',
                                    toolTipContent: "<span style=\"color:#f0e513 \">{name}<br/><span>{l}: {x}</span></span>",
                                    markerType: "triangle",
                                    markerBorderColor: '#aaa',
                                    markerBorderThickness: 1,
                                    markerSize: 12,
                                    dataPoints: getDataPoints('kitware-single-kdma-adm-baseline', 1, 'A', -0.1)
                                }]
                        }}
                        />
                    </div>
                </div>}

            </div>
            <div className='chart-home-container'>
                <div className='chart-header'>
                    <div className='chart-header-label'>
                        <h4>3. Does alignment affect delegation?</h4>
                    </div>
                </div>


                <div className='delegationChoices'>
                    <div>
                        <h3>Forced Choice Delegation</h3>
                        <CanvasJSChart options={{
                            width: "700",
                            dataPointWidth: 100,
                            toolTip: {
                                shared: true
                            },
                            axisX: {
                                interval: 1
                            },
                            legend: {
                                verticalAlign: "top",
                                horizontalAlign: "center",
                                cursor: "pointer"
                            },
                            data: [{
                                type: "column",
                                name: "Delegation Text Grouping",
                                color: 'grey',
                                showInLegend: true,
                                toolTipContent: "<b>{label}</b> <br> <span style=\"color:#4F81BC\">{name}</span>: {y}",
                                dataPoints: [
                                    { y: getMeanAtt('ST_Align_DelFC_Text'), label: "SoarTech" },
                                    { y: getMeanAtt('AD_Align_DelFC_Text'), label: "ADEPT" }
                                ]
                            },
                            {
                                type: "error",
                                color: "#555",
                                name: "Variability Range",
                                toolTipContent: "<span style=\"color:#C0504E\">{name}</span>: {y[0]} - {y[1]}",
                                dataPoints: [
                                    { y: getSeAtt('ST_Align_DelFC_Text'), label: "SoarTech" },
                                    { y: getSeAtt('AD_Align_DelFC_Text'), label: "ADEPT" }
                                ]
                            },
                            {
                                type: "column",
                                name: "Delegation Sim Grouping",
                                color: '#cc9999',
                                showInLegend: true,
                                toolTipContent: "<b>{label}</b> <br> <span style=\"color:#4F81BC\">{name}</span>: {y}",
                                dataPoints: [
                                    { y: getMeanAtt('ST_Align_DelFC_Sim'), label: "SoarTech" },
                                    { y: getMeanAtt('AD_Align_DelFC_Sim'), label: "ADEPT" }
                                ]
                            },
                            {
                                type: "error",
                                name: "Variability Range",
                                color: '#555',
                                toolTipContent: "<span style=\"color:#C0504E\">{name}</span>: {y[0]} - {y[1]}",
                                dataPoints: [
                                    { y: getSeAtt('ST_Align_DelFC_Sim'), label: "SoarTech" },
                                    { y: getSeAtt('AD_Align_DelFC_Sim'), label: "ADEPT" }
                                ]
                            }
                            ]
                        }} />
                    </div>

                    <div>
                        <h3>Full Choice Delegation</h3>
                        <CanvasJSChart options={{
                            width: "700",
                            dataPointWidth: 100,
                            toolTip: {
                                shared: true
                            },
                            legend: {
                                verticalAlign: "top",
                                horizontalAlign: "center",
                                cursor: "pointer"
                            },
                            data: [{
                                type: "column",
                                name: "Delegation Text Grouping",
                                color: 'grey',
                                showInLegend: true,
                                toolTipContent: "<b>{label}</b> <br> <span style=\"color:#4F81BC\">{name}</span>: {y}",
                                dataPoints: [
                                    { y: getMeanAtt('ST_Align_DelC_Text'), label: "SoarTech" },
                                    { y: getMeanAtt('AD_Align_DelC_Text'), label: "ADEPT" }
                                ]
                            },
                            {
                                type: "error",
                                color: "#555",
                                name: "Variability Range",
                                toolTipContent: "<span style=\"color:#C0504E\">{name}</span>: {y[0]} - {y[1]}",
                                dataPoints: [
                                    { y: getSeAtt('ST_Align_DelC_Text'), label: "SoarTech" },
                                    { y: getSeAtt('AD_Align_DelC_Text'), label: "ADEPT" }
                                ]
                            },
                            {
                                type: "column",
                                name: "Delegation Sim Grouping",
                                color: '#cc9999',
                                showInLegend: true,
                                toolTipContent: "<b>{label}</b> <br> <span style=\"color:#4F81BC\">{name}</span>: {y}",
                                dataPoints: [
                                    { y: getMeanAtt('ST_Align_DelC_Sim'), label: "SoarTech" },
                                    { y: getMeanAtt('AD_Align_DelC_Sim'), label: "ADEPT" }
                                ]
                            },
                            {
                                type: "error",
                                name: "Variability Range",
                                color: '#555',
                                toolTipContent: "<span style=\"color:#C0504E\">{name}</span>: {y[0]} - {y[1]}",
                                dataPoints: [
                                    { y: getSeAtt('ST_Align_DelC_Sim'), label: "SoarTech" },
                                    { y: getSeAtt('AD_Align_DelC_Sim'), label: "ADEPT" }
                                ]
                            }
                            ]
                        }} />
                    </div>
                </div>

                <div className="center-text"><h2>ADEPT</h2></div>
                <div className="relatedResults">
                    <CanvasJSChart options={{
                        width: "1200",
                        toolTip: {
                            shared: true
                        },
                        legend: {
                            verticalAlign: "top",
                            horizontalAlign: "center",
                            cursor: "pointer"
                        },
                        data: [{
                            type: "column",
                            name: "ADEPT_Text",
                            color: 'grey',
                            showInLegend: true,
                            toolTipContent: "<b>{label}</b> <br> <span style=\"color:#4F81BC\">{name}</span>: {y}",
                            dataPoints: [
                                { y: getMeanAtt('AD_Align_Trust_Text'), label: "Trust - Align" },
                                { y: getMeanAtt('AD_Misalign_Trust_Text'), label: "Trust - Misalign" },
                                { y: getMeanAtt('AD_Align_Agree_Text'), label: "Agree - Align" },
                                { y: getMeanAtt('AD_Misalign_Agree_Text'), label: "Agree - Miaslign" },
                                { y: getMeanAtt('AD_Align_Trustworthy_Text'), label: "Trustworthy - Align" },
                                { y: getMeanAtt('AD_Misalign_Trustworthy_Text'), label: "Trustworthy - Misalign" },
                                { y: getMeanAtt('AD_Align_AlignSR_Text'), label: "AlignSelfReport - Align" },
                                { y: getMeanAtt('AD_Misalign_AlignSR_Text'), label: "AlignSelfReport - Miaslign" }
                            ]
                        },
                        {
                            type: "error",
                            color: "#555",
                            name: "Variability Range",
                            toolTipContent: "<span style=\"color:#C0504E\">{name}</span>: {y[0]} - {y[1]}",
                            dataPoints: [
                                { y: getSeAtt('AD_Align_Trust_Text'), label: "Trust - Align" },
                                { y: getSeAtt('AD_Misalign_Trust_Text'), label: "Trust - Misalign" },
                                { y: getSeAtt('AD_Align_Agree_Text'), label: "Agree - Align" },
                                { y: getSeAtt('AD_Misalign_Agree_Text'), label: "Agree - Miaslign" },
                                { y: getSeAtt('AD_Align_Trustworthy_Text'), label: "Trustworthy - Align" },
                                { y: getSeAtt('AD_Misalign_Trustworthy_Text'), label: "Trustworthy - Misalign" },
                                { y: getSeAtt('AD_Align_AlignSR_Text'), label: "AlignSelfReport - Align" },
                                { y: getSeAtt('AD_Misalign_AlignSR_Text'), label: "AlignSelfReport - Miaslign" }
                            ]
                        },
                        {
                            type: "column",
                            name: "ADEPT_Sim",
                            color: '#cc9999',
                            showInLegend: true,
                            toolTipContent: "<b>{label}</b> <br> <span style=\"color:#4F81BC\">{name}</span>: {y}",
                            dataPoints: [
                                { y: getMeanAtt('AD_Align_Trust_Sim'), label: "Trust - Align" },
                                { y: getMeanAtt('AD_Misalign_Trust_Sim'), label: "Trust - Misalign" },
                                { y: getMeanAtt('AD_Align_Agree_Sim'), label: "Agree - Align" },
                                { y: getMeanAtt('AD_Misalign_Agree_Sim'), label: "Agree - Miaslign" },
                                { y: getMeanAtt('AD_Align_Trustworthy_Sim'), label: "Trustworthy - Align" },
                                { y: getMeanAtt('AD_Misalign_Trustworthy_Sim'), label: "Trustworthy - Misalign" },
                                { y: getMeanAtt('AD_Align_AlignSR_Sim'), label: "AlignSelfReport - Align" },
                                { y: getMeanAtt('AD_Misalign_AlignSR_Sim'), label: "AlignSelfReport - Miaslign" }
                            ]
                        },
                        {
                            type: "error",
                            name: "Variability Range",
                            color: '#555',
                            toolTipContent: "<span style=\"color:#C0504E\">{name}</span>: {y[0]} - {y[1]}",
                            dataPoints: [
                                { y: getSeAtt('AD_Align_Trust_Sim'), label: "Trust - Align" },
                                { y: getSeAtt('AD_Misalign_Trust_Sim'), label: "Trust - Misalign" },
                                { y: getSeAtt('AD_Align_Agree_Sim'), label: "Agree - Align" },
                                { y: getSeAtt('AD_Misalign_Agree_Sim'), label: "Agree - Miaslign" },
                                { y: getSeAtt('AD_Align_Trustworthy_Sim'), label: "Trustworthy - Align" },
                                { y: getSeAtt('AD_Misalign_Trustworthy_Sim'), label: "Trustworthy - Misalign" },
                                { y: getSeAtt('AD_Align_AlignSR_Sim'), label: "AlignSelfReport - Align" },
                                { y: getSeAtt('AD_Misalign_AlignSR_Sim'), label: "AlignSelfReport - Miaslign" }
                            ]
                        }
                        ]
                    }} />
                </div>

                <div className="center-text"><h2>SoarTech</h2></div>
                <div className="relatedResults">
                    <CanvasJSChart options={{
                        width: "1200",
                        toolTip: {
                            shared: true
                        },
                        legend: {
                            verticalAlign: "top",
                            horizontalAlign: "center",
                            cursor: "pointer"
                        },
                        data: [{
                            type: "column",
                            name: "SoarTech_Text",
                            color: 'grey',
                            showInLegend: true,
                            toolTipContent: "<b>{label}</b> <br> <span style=\"color:#4F81BC\">{name}</span>: {y}",
                            dataPoints: [
                                { y: getMeanAtt('ST_Align_Trust_Text'), label: "Trust - Align" },
                                { y: getMeanAtt('ST_Misalign_Trust_Text'), label: "Trust - Misalign" },
                                { y: getMeanAtt('ST_Align_Agree_Text'), label: "Agree - Align" },
                                { y: getMeanAtt('ST_Misalign_Agree_Text'), label: "Agree - Miaslign" },
                                { y: getMeanAtt('ST_Align_Trustworthy_Text'), label: "Trustworthy - Align" },
                                { y: getMeanAtt('ST_Misalign_Trustworthy_Text'), label: "Trustworthy - Misalign" },
                                { y: getMeanAtt('ST_Align_AlignSR_Text'), label: "AlignSelfReport - Align" },
                                { y: getMeanAtt('ST_Misalign_AlignSR_Text'), label: "AlignSelfReport - Miaslign" }
                            ]
                        },
                        {
                            type: "error",
                            color: "#555",
                            name: "Variability Range",
                            toolTipContent: "<span style=\"color:#C0504E\">{name}</span>: {y[0]} - {y[1]}",
                            dataPoints: [
                                { y: getSeAtt('ST_Align_Trust_Text'), label: "Trust - Align" },
                                { y: getSeAtt('ST_Misalign_Trust_Text'), label: "Trust - Misalign" },
                                { y: getSeAtt('ST_Align_Agree_Text'), label: "Agree - Align" },
                                { y: getSeAtt('ST_Misalign_Agree_Text'), label: "Agree - Miaslign" },
                                { y: getSeAtt('ST_Align_Trustworthy_Text'), label: "Trustworthy - Align" },
                                { y: getSeAtt('ST_Misalign_Trustworthy_Text'), label: "Trustworthy - Misalign" },
                                { y: getSeAtt('ST_Align_AlignSR_Text'), label: "AlignSelfReport - Align" },
                                { y: getSeAtt('ST_Misalign_AlignSR_Text'), label: "AlignSelfReport - Miaslign" }
                            ]
                        },
                        {
                            type: "column",
                            name: "SoarTech_Sim",
                            color: '#cc9999',
                            showInLegend: true,
                            toolTipContent: "<b>{label}</b> <br> <span style=\"color:#4F81BC\">{name}</span>: {y}",
                            dataPoints: [
                                { y: getMeanAtt('ST_Align_Trust_Sim'), label: "Trust - Align" },
                                { y: getMeanAtt('ST_Misalign_Trust_Sim'), label: "Trust - Misalign" },
                                { y: getMeanAtt('ST_Align_Agree_Sim'), label: "Agree - Align" },
                                { y: getMeanAtt('ST_Misalign_Agree_Sim'), label: "Agree - Miaslign" },
                                { y: getMeanAtt('ST_Align_Trustworthy_Sim'), label: "Trustworthy - Align" },
                                { y: getMeanAtt('ST_Misalign_Trustworthy_Sim'), label: "Trustworthy - Misalign" },
                                { y: getMeanAtt('ST_Align_AlignSR_Sim'), label: "AlignSelfReport - Align" },
                                { y: getMeanAtt('ST_Misalign_AlignSR_Sim'), label: "AlignSelfReport - Miaslign" }
                            ]
                        },
                        {
                            type: "error",
                            name: "Variability Range",
                            color: '#555',
                            toolTipContent: "<span style=\"color:#C0504E\">{name}</span>: {y[0]} - {y[1]}",
                            dataPoints: [
                                { y: getSeAtt('ST_Align_Trust_Sim'), label: "Trust - Align" },
                                { y: getSeAtt('ST_Misalign_Trust_Sim'), label: "Trust - Misalign" },
                                { y: getSeAtt('ST_Align_Agree_Sim'), label: "Agree - Align" },
                                { y: getSeAtt('ST_Misalign_Agree_Sim'), label: "Agree - Miaslign" },
                                { y: getSeAtt('ST_Align_Trustworthy_Sim'), label: "Trustworthy - Align" },
                                { y: getSeAtt('ST_Misalign_Trustworthy_Sim'), label: "Trustworthy - Misalign" },
                                { y: getSeAtt('ST_Align_AlignSR_Sim'), label: "AlignSelfReport - Align" },
                                { y: getSeAtt('ST_Misalign_AlignSR_Sim'), label: "AlignSelfReport - Miaslign" }
                            ]
                        }
                        ]
                    }} />
                </div>
            </div>
        </div>
    );
}

function CorrelationTables({ ta1, data }) {
    const prefix = ta1 === 'SoarTech' ? 'ST' : 'AD';
    const cols = {
        'Alignment Score': '_AlignScore_',
        'Trust': '_Trust',
        'Trustworthy': '_Trustworthy',
        'Agreement': '_Agree',
        'Self-reported Alignment': '_AlignSR'
    };
    // not all rows have valid survey/alignment data
    const validDataPoints = data.map((el) => el[prefix + '_AlignScore_High']).filter((x) => isDefined(x)).length;

    function SingleRow({ rowName }) {
        const double_cols = [];
        for (const x of Object.keys(cols)) {
            double_cols.push(x);
            double_cols.push(x);
        }

        const getCell = (el, prefix, rowName, att) => {
            return el[prefix + (cols[rowName].slice(-1) === '_' ? (cols[rowName] + (att === 1 ? 'High' : 'Low')) : ((att === 1 ? '_High' : '_Low') + cols[rowName]))];
        }

        const highData = data.map((el) => getCell(el, prefix, rowName, 1));
        const lowData = data.map((el) => getCell(el, prefix, rowName, 0));

        const findCorrelation = (c1, c2, att) => {
            // need to make sure if data is missing in either column, that data is not included
            const xs = [];
            const ys = [];
            for (const row of data) {
                const x = getCell(row, prefix, c1, att);
                const y = getCell(row, prefix, c2, att);
                if (isDefined(x) && isDefined(y)) {
                    xs.push(x);
                    ys.push(y);
                }
            }
            const meanX = getMean(xs);
            const meanY = getMean(ys);
            let sum = 0;
            let xSum = 0;
            let ySum = 0;
            for (let i = 0; i < xs.length; i++) {
                sum += (xs[i] - meanX) * (ys[i] - meanY);
                xSum += (xs[i] - meanX) ** 2;
                ySum += (ys[i] - meanY) ** 2;
            }
            return sum / Math.sqrt(xSum * ySum);
        };

        return <tr>
            <td>{rowName}</td>
            {double_cols.map((c, ind) => {
                if (c === rowName)
                    return <td key={prefix + "_" + c + "_" + ind}>M={getMean(ind % 2 === 0 ? highData : lowData).toFixed(2)},<br /> SD={getStandDev(ind % 2 === 0 ? highData : lowData).toFixed(2)}</td>
                else
                    return <td key={prefix + "_" + c + "_" + ind}>{findCorrelation(c, rowName, ind % 2 === 0 ? 1 : 0).toFixed(2)}</td>
            })}
        </tr>
    }

    return <div className='centeredTable'>
        {data && <table className='itm-table miniTable'>
            <thead>
                <tr>
                    <th>{ta1} (N={validDataPoints})</th>
                    {Object.keys(cols).map((c) => <th colSpan="2" key={ta1 + "_" + c}>{c}</th>)}
                </tr>
                <tr>
                    <th></th>
                    <th>High</th>
                    <th>Low</th>
                    <th>High</th>
                    <th>Low</th>
                    <th>High</th>
                    <th>Low</th>
                    <th>High</th>
                    <th>Low</th>
                    <th>High</th>
                    <th>Low</th>
                </tr>
            </thead>
            <tbody>
                {Object.keys(cols).map((c) => <SingleRow rowName={c} key={c + '_' + prefix} />)}
            </tbody>
        </table>}
    </div>
}

