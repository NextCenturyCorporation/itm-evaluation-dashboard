import React from 'react';
import './aggregateResults.css';
import { ScatterChart, BarChart } from '@mui/x-charts';
import CanvasJSReact from '@canvasjs/react-charts';
import { getBoxWhiskerData, getMean, getMedian, getStandDev, getStandardError } from './statistics';
import { isDefined } from './DataFunctions';

const CanvasJSChart = CanvasJSReact.CanvasJSChart;


export default function ProgramQuestions({ allData, kdmaScatter, chartData }) {

    // const getMeanFromAgg = (att) => {
    //     return aggregateData[att]['count'] > 0 ? aggregateData[att]['total'] / aggregateData[att]['count'] : '-';
    // }

    const getMeanAtt = (att) => {
        const data = allData.map((x) => x[att]);
        return getMean(data);
    };

    const getSeAtt = (att) => {
        const data = allData.map((x) => x[att]);
        return getStandardError(data);
    };


    return (
        <div className='programQuestions'>

            <h2>1. Does alignment score correlate with trust?</h2>
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

            <CorrelationTables ta1="ADEPT" data={allData} />
            <CorrelationTables ta1="SoarTech" data={allData} />

            <h2>2. Does aligned ADM have a higher alignment score than baseline ADM?</h2>
            <p>To be done by not Kaitlyn</p>


            <h2>3. Does alignment affect delegation?</h2>
            <div className='delegationChoices'>
                <div>
                    <h3>Forced Choice Delegation</h3>
                    <BarChart
                        grid={{ horizontal: true }}
                        xAxis={[{ scaleType: 'band', data: ['SoarTech', 'Adept'] }]}
                        series={[{ label: "Delegation Text Grouping", data: [getMeanAtt('ST_Align_DelFC_Text'), getMeanAtt('AD_Align_DelFC_Text')] },
                        { label: "Delegation Sim Grouping", data: [getMeanAtt('ST_Align_DelFC_Sim'), getMeanAtt('AD_Align_DelFC_Sim')] }]}
                        width={700}
                        height={300}
                    />
                </div>

                <div>
                    <h3>Full Choice Delegation</h3>
                    <BarChart
                        grid={{ horizontal: true }}
                        xAxis={[{ scaleType: 'band', data: ['SoarTech', 'Adept'] }]}
                        series={[{ label: "Delegation Text Grouping", data: [getMeanAtt('ST_Align_DelC_Text'), getMeanAtt('AD_Align_DelC_Text')] },
                        { label: "Delegation Sim Grouping", data: [getMeanAtt('ST_Align_DelC_Sim'), getMeanAtt('AD_Align_DelC_Sim')] }]}
                        width={700}
                        height={300}
                    />
                </div>
            </div>

            <h2>4.1 Related Results (Adept)</h2>
            <div className="relatedResults">
                <CanvasJSChart options={{
                    width: "1200",
                    legend: {
                        verticalAlign: "top",
                        horizontalAlign: "center",
                        reversed: true,
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

            <h2>4.2 Related Results (SoarTech)</h2>
            <div className="relatedResults">
                <CanvasJSChart options={{
                    width: "1200",
                    legend: {
                        verticalAlign: "top",
                        horizontalAlign: "center",
                        reversed: true,
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

            {/* {aggregateData && <table className='miniTable'>
                <thead>
                    <tr>
                        <th>Mean Prop Trust</th>
                        <th>Mean Delegation</th>
                        <th>Mean Trust</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{getMeanFromAgg('PropTrust').toFixed(2)}</td>
                        <td>{getMeanFromAgg('Delegation').toFixed(2)}</td>
                        <td>{getMeanFromAgg('Trust').toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>} */}

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

