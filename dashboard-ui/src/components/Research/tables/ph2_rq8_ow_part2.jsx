import React from "react";
import '../../../css/resultsTable.css';
import { useQuery } from 'react-apollo';
import gql from "graphql-tag";
import { Autocomplete, TextField, Modal } from "@mui/material";
import { isDefined } from "../../AggregateResults/DataFunctions";
import { DownloadButtons } from "./download-buttons";
import { RQDefinitionTable } from "../variables/rq-variables";
import CloseIcon from '@material-ui/icons/Close';
import owPart2Defs from '../variables/Variable Definitions RQ8_OW_Part2.xlsx';

const getAdmData = gql`
    query getAllOWData($evalNumber: Float!, $scenarioIDs: [ID]){
        getAllOWData(evalNumber: $evalNumber, scenarioIDs: $scenarioIDs)
    }`;

const OW_EVALS = [8, 15, 16]

const ADMS = ['ALIGN-ADM-OutlinesBaseline-Mistral-7B-Instruct-v0.3__82cd6afc-958b-4bda-b0d2-68ea2983f3fd',
'ALIGN-ADM-OutlinesBaseline-Mistral-7B-Instruct-v0.3__a99adfbe-1a99-43a9-ae68-cc1f60a5e625',
'ALIGN-ADM-OutlinesBaseline-Mistral-7B-Instruct-v0.3__20d46e91-cd3b-49bc-b7e7-f4d4c8e8151f',
'ALIGN-ADM-Ph2-ComparativeRegression-Zeroshot-Mistral-7B-Instruct-v0.3__fb83ce00-3e39-4eb8-9832-fd01332ac387',
'ALIGN-ADM-Ph2-ComparativeRegression-Zeroshot-Mistral-7B-Instruct-v0.3__8c01ff99-b1ad-4489-98fe-a85d2b76657f',
'ALIGN-ADM-Ph2-ComparativeRegression-Zeroshot-Mistral-7B-Instruct-v0.3__ecdfd1cc-0f03-4c87-a82b-fc05205fa5fa',
'ALIGN-ADM-Ph2-DirectRegression-Mistral-7B-Instruct-v0.3__93c4095c-6880-4132-ade7-85cae2097ed3',
'ALIGN-ADM-Ph2-DirectRegression-Mistral-7B-Instruct-v0.3__aa033d7b-25cb-450a-aaea-57105cbbc0e7',
'ALIGN-ADM-Ph2-DirectRegression-Mistral-7B-Instruct-v0.3__be21e5a4-410c-4052-a15b-12dbbc10b0e3',
'ALIGN-ADM-Ph2-ComparativeRegression-Mistral-7B-Instruct-v0.3__b8756c48-f485-4307-892f-a4e4ef622a87',
'ALIGN-ADM-Ph2-ComparativeRegression-Mistral-7B-Instruct-v0.3__23f4f6f0-b1c5-45e8-8887-61b41d22f4fe',
'ALIGN-ADM-Ph2-ComparativeRegression-Mistral-7B-Instruct-v0.3__4c804b13-6e49-4d79-8d1c-271bb0426c32'
]

const KDMA_SHORT = { affiliation: 'AF', merit: 'MF', personal_safety: 'PS', search: 'SS' };

function roundIfNumber(value) {
    if (typeof value === 'number' && !isNaN(value)) return Math.round(value * 100) / 100;
    return value;
}
function getKdmaParam(parameters, paramName) {
    return parameters?.find(p => p?.name === paramName)?.value;
}

const EVAL_LABEL = { 8: 'June2025', 15: 'Feb2026', 16: 'April2026' };

function getOWScenario(scenarioId, evalNum) {
    const env = scenarioId.split('OW_')[1] || scenarioId;
    return `${EVAL_LABEL[evalNum]} ${env}`;
}

export function PH2RQ8OWPart2() {
    const { loading: loading8, error: error8, data: data8 } = useQuery(getAdmData, { variables: { evalNumber: 8, scenarioIDs: ["June2025-OW_desert2", "June2025-OW_urban2"] } });
    const { loading: loading15, error: error15, data: data15 } = useQuery(getAdmData, { variables: { evalNumber: 15, scenarioIDs: ["Feb2026-OW_desert2", "Feb2026-OW_urban2"] } });
    const { loading: loading16, error: error16, data: data16 } = useQuery(getAdmData, { variables: { evalNumber: 16, scenarioIDs: ["April2026-OW_desert2", "April2026-OW_urban2"] } });

    const [formattedData, setFormattedData] = React.useState([]);
    const [filteredData, setFilteredData] = React.useState([]);
    const [owScenarios, setOwScenarios] = React.useState([]);
    const [targets, setTargets] = React.useState([]);
    const [admNames, setAdmNames] = React.useState([]);
    const [owScenarioFilters, setOwScenarioFilters] = React.useState([]);
    const [targetFilters, setTargetFilters] = React.useState([]);
    const [admNameFilters, setAdmNameFilters] = React.useState([]);

    React.useEffect(() => {
        if (!data8?.getAllOWData || !data15?.getAllOWData || !data16?.getAllOWData) return;

        const allObjs = [];
        const allOwScenarios = [];
        const allTargets = [];
        const allAdmNames = [];
        const dataByEval = {
            8: data8.getAllOWData,
            15: data15.getAllOWData,
            16: data16.getAllOWData,
        };

        for (const currentEvalNum of OW_EVALS) {
            for (const adm of dataByEval[currentEvalNum]) {
                const admName = adm.evaluation.adm_name;
                const scenario = adm.evaluation.scenario_id;
                const target = adm.evaluation.alignment_target_id;
                const alignment = adm.results?.alignment_score;

                if (!isDefined(alignment)) continue;
                if (!ADMS.includes(admName)) continue;

                const owScenario = getOWScenario(scenario, currentEvalNum);
                const cleanTarget = (target || '')
                    .replace(/^Feb2026-/, '').replace(/^June2025-/, '').replace(/^April2026-/, '');

                const row = {
                    'OW Scenario': owScenario,
                    'Target': cleanTarget,
                    'ADM Name': admName,
                    'Server Session ID': adm.results?.ta1_session_id ?? '-',
                    'Alignment score (ADM|target)': roundIfNumber(alignment),
                };

                for (const k of (adm.results?.kdmas || [])) {
                    const short = KDMA_SHORT[k.kdma];
                    if (!short) continue;
                    row[`${short}_intercept`] = roundIfNumber(getKdmaParam(k.parameters, 'intercept'));
                    row[`${short}_attribute`] = roundIfNumber(getKdmaParam(k.parameters, 'attr_weight'));
                    row[`${short}_medical`]   = roundIfNumber(getKdmaParam(k.parameters, 'medical_weight'));
                }

                Object.assign(row, adm.actionAnalysis ?? {})
                allObjs.push(row);
                allOwScenarios.push(owScenario);
                allTargets.push(cleanTarget);
                allAdmNames.push(admName);
            }
        }

        allObjs.sort((a, b) => {
            if (a['OW Scenario'] < b['OW Scenario']) return -1;
            if (a['OW Scenario'] > b['OW Scenario']) return 1;
            return a['Target'].localeCompare(b['Target']);
        });
        const scenarioCounters = {};
        for (const obj of allObjs) {
            const key = obj['OW Scenario'];
            scenarioCounters[key] = (scenarioCounters[key] || 0) + 1;
            obj['Trial_ID'] = scenarioCounters[key];
        }

        if (allObjs.length > 0) {
            setFormattedData(allObjs);
            setFilteredData(allObjs);
        } else {
            setFormattedData([{ 'Trial_ID': '-' }]);
            setFilteredData([{ 'Trial_ID': '-' }]);
        }
        setOwScenarios(Array.from(new Set(allOwScenarios)));
        setTargets(Array.from(new Set(allTargets)));
        setAdmNames(Array.from(new Set(allAdmNames)));
    }, [data8, data15, data16]);

    const [showDefinitions, setShowDefinitions] = React.useState(false);
    const openModal = () => setShowDefinitions(true);
    const closeModal = () => setShowDefinitions(false);

    const HEADERS = React.useMemo(() => {
        const LEAD = ['Trial_ID', 'OW Scenario', 'Target', 'ADM Name',
                    'Server Session ID', 'Alignment score (ADM|target)'];
        const leadSet = new Set(LEAD);
        const extra = new Set();
        for (const row of formattedData) {
            for (const key of Object.keys(row)) {
                if (!leadSet.has(key)) extra.add(key);
            }
        }
        const kdmaKeys = [...extra]
            .filter(k => /_(intercept|attribute|medical)$/.test(k))
            .sort();
        const actionKeys = [...extra]
            .filter(k => !/_(intercept|attribute|medical)$/.test(k))
        return [...LEAD, ...kdmaKeys, ...actionKeys];
    }, [formattedData]);

    React.useEffect(() => {
        if (formattedData.length > 0) {
            setFilteredData(formattedData.filter(x =>
                (owScenarioFilters.length === 0 || owScenarioFilters.includes(x['OW Scenario'])) &&
                (targetFilters.length === 0 || targetFilters.includes(x['Target'])) &&
                (admNameFilters.length === 0 || admNameFilters.includes(x['ADM Name']))
            ));
        }
    }, [formattedData, owScenarioFilters, targetFilters, admNameFilters]);

    if (loading8 || loading15 || loading16) return <p>Loading...</p>;
    if (error8) return <p>Error: {error8.message}</p>;
    if (error15) return <p>Error: {error15.message}</p>;
    if (error16) return <p>Error: {error16.message}</p>;

    return (
        <>
            {filteredData.length < formattedData.length &&
                <p className='filteredText'>
                    Showing {filteredData.length} of {formattedData.length} rows based on filters
                </p>
            }
            <section className='tableHeader'>
                <div className="filters">
                    <Autocomplete
                        multiple
                        options={owScenarios}
                        value={owScenarioFilters}
                        filterSelectedOptions
                        size="small"
                        renderInput={(params) => <TextField {...params} label="OW Scenario" />}
                        onChange={(_, newVal) => setOwScenarioFilters(newVal)}
                    />
                    <Autocomplete
                        multiple
                        options={targets}
                        value={targetFilters}
                        filterSelectedOptions
                        size="small"
                        renderInput={(params) => <TextField {...params} label="Target" />}
                        onChange={(_, newVal) => setTargetFilters(newVal)}
                    />
                </div>
                <DownloadButtons
                    formattedData={formattedData}
                    filteredData={filteredData}
                    HEADERS={HEADERS}
                    fileName={'RQ8_OW_Part2_data'}
                    extraAction={openModal}
                />
            </section>

            <div className='resultTableSection'>
                <table className='itm-table'>
                    <thead>
                        <tr>
                            {HEADERS.map((val, index) => (
                                <th key={'header-' + index}>{val}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((dataSet, index) => (
                            <tr key={`row-${index}`} className={index % 2 === 0 ? 'row-even' : 'row-odd'}>
                                {HEADERS.map((val) => (
                                    <td key={`cell-${index}-${val}`}>
                                        {(dataSet[val] == null || dataSet[val] === '-') ? '' : dataSet[val]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal className='table-modal' open={showDefinitions} onClose={closeModal}>
                <div className='modal-body'>
                    <span className='close-icon' onClick={closeModal}><CloseIcon /></span>
                    <RQDefinitionTable
                        downloadName={`Definitions_RQ8_OW_Part2.xlsx`}
                        xlFile={owPart2Defs}
                    />
                </div>
            </Modal>
        </>
    );
}