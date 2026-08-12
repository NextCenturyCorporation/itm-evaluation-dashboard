import React from "react";
import '../../../css/resultsTable.css';
import { useQuery } from 'react-apollo';
import gql from "graphql-tag";
import { Autocomplete, TextField, Modal, FormControlLabel, Switch } from "@mui/material";
import { isDefined } from "../../AggregateResults/DataFunctions";
import { DownloadButtons } from "./download-buttons";
import { RQDefinitionTable } from "../variables/rq-variables";
import CloseIcon from '@material-ui/icons/Close';
import owPart1Defs from '../variables/Variable Definitions RQ8_OW_Part1.xlsx';
import { QueryErrorMessage } from "../../ErrorHandling/QueryErrorMessage";

const getAdmData = gql`
    query getAllOWData($evalNumber: Float!, $scenarioIDs: [ID]){
        getAllOWData(evalNumber: $evalNumber, scenarioIDs: $scenarioIDs)
    }`;

const OW_SCENARIOS = [
    'April2026-OW_desert', 'April2026-OW_urban',
    'Feb2026-OW_desert', 'Feb2026-OW_urban',
    'June2025-OW_desert', 'June2025-OW_urban'
];

const isBaselineAdm = (admName) => admName.includes('OutlinesBaseline');
const isAlignedAdm = (admName) => admName.includes('Regression');

const HEADERS = [
    'Trial_ID', 'OW Scenario', 'Target', 'ADM Name', 'Aligned Server Session ID', 'Aligned ADM Alignment score (ADM|target)',

    'Baseline ADM Alignment score (ADM|target)', 'Baseline Server Session ID'
];
const KDMA_ORDER = ['affiliation', 'merit', 'personal_safety', 'search'];
const KDMA_LABELS = {
    affiliation: 'Affiliation',
    merit: 'Merit',
    personal_safety: 'Personal Safety',
    search: 'Search'
};
const PARAM_ORDER = ['intercept', 'medical_weight', 'attr_weight'];
const PARAM_LABELS = {
    intercept: 'Intercept',
    medical_weight: 'Medical Weight',
    attr_weight: 'Attribute Weight'
};
const kdmaColLabel = (kdma, param) => `${KDMA_LABELS[kdma]} ${PARAM_LABELS[param]}`;
const valueColLabel = (kdma) => `${KDMA_LABELS[kdma]} Value`;

const OW_EVALS = [8, 15, 16];
export const EVAL_LABEL = { 8: 'June2025', 15: 'Feb2026', 16: 'April2026' };

const getOWScenario = (scenarioId, evalNum) => {
    const env = scenarioId.split('OW_')[1] || scenarioId;
    return `${EVAL_LABEL[evalNum]} ${env}`;
};

export function PH2RQ8OWPart1() {
    const { loading: loading8, error: error8, data: data8 } = useQuery(getAdmData, { variables: { evalNumber: 8, scenarioIDs: ["June2025-OW_desert", "June2025-OW_urban"] } });
    const { loading: loading15, error: error15, data: data15 } = useQuery(getAdmData, { variables: { evalNumber: 15, scenarioIDs: ["Feb2026-OW_desert", "Feb2026-OW_urban"] } });
    const { loading: loading16, error: error16, data: data16 } = useQuery(getAdmData, { variables: { evalNumber: 16, scenarioIDs: ["April2026-OW_desert", "April2026-OW_urban"] } });
    const [formattedData, setFormattedData] = React.useState([]);
    const [filteredData, setFilteredData] = React.useState([]);
    const [showDefinitions, setShowDefinitions] = React.useState(false);
    const [owScenarios, setOwScenarios] = React.useState([]);
    const [targets, setTargets] = React.useState([]);
    const [owScenarioFilters, setOwScenarioFilters] = React.useState([]);
    const [targetFilters, setTargetFilters] = React.useState([]);
    const [includeRegression, setIncludeRegression] = React.useState(false);

    const openModal = () => setShowDefinitions(true);
    const closeModal = () => setShowDefinitions(false);

    React.useEffect(() => {
        if (!data8?.getAllOWData || !data15?.getAllOWData || !data16?.getAllOWData) return;
        const allObjs = [];
        const allOwScenarios = [];
        const allTargets = [];
        const dataByEval = {
            8: data8.getAllOWData,
            15: data15.getAllOWData,
            16: data16.getAllOWData
        };
        for (const currentEvalNum of OW_EVALS) {
            const rawData = dataByEval[currentEvalNum];
            const alignedByKey = {}; 
            const baselineByST = {};
            for (const adm of rawData) {
                const admName = adm.evaluation.adm_name;
                const scenario = adm.evaluation.scenario_id;
                const target = adm.evaluation.alignment_target_id;
                const alignment = adm.results.alignment_score;

                if (!isDefined(alignment)) continue;
                if (!OW_SCENARIOS.includes(scenario)) continue;

                const stKey = `${scenario}__${target}`;
                if (isBaselineAdm(admName)) {
                    baselineByST[stKey] = { alignment, sessionId: adm.results?.ta1_session_id, admName };
                } else if (isAlignedAdm(admName)) {
                    alignedByKey[`${stKey}__${admName}`] = {
                        scenario,
                        target,
                        admName,
                        alignment,
                        sessionId: adm.results?.ta1_session_id,
                        kdmas: adm.results?.kdmas ?? []
                    };
                }
            }
            for (const aligned of Object.values(alignedByKey)) {
                const { scenario, target } = aligned;
                const baseline = baselineByST[`${scenario}__${target}`];

                const owScenario = getOWScenario(scenario, currentEvalNum);
                const cleanTarget = target.replace(/^Feb2026-/, '').replace(/^June2025-/, '');

                allOwScenarios.push(owScenario);
                allTargets.push(cleanTarget);

                const rowObj = {
                    'OW Scenario': owScenario,
                    'Target': cleanTarget,
                    'ADM Name': aligned.admName.split('__')[0],
                    'Aligned Server Session ID': aligned.sessionId ?? '-',
                    'Aligned ADM Alignment score (ADM|target)': aligned.alignment,
                    'Baseline ADM Alignment score (ADM|target)': baseline?.alignment ?? '-',
                    'Baseline Server Session ID': baseline?.sessionId ?? '-'
                };

                // handles regression style and scalar scoring
                let hasParams = false;
                let hasValue = false;
                for (const kdma of aligned.kdmas ?? []) {
                    if (!KDMA_LABELS[kdma.kdma]) continue;
                    if (kdma.parameters?.length) {
                        hasParams = true;
                        for (const p of kdma.parameters) {
                            if (PARAM_LABELS[p.name]) {
                                rowObj[kdmaColLabel(kdma.kdma, p.name)] = p.value;
                            }
                        }
                    } else if (isDefined(kdma.value)) {
                        hasValue = true;
                        rowObj[valueColLabel(kdma.kdma)] = kdma.value;
                    }
                }
                rowObj.__scoringType = hasParams ? 'regression' : (hasValue ? 'scalar' : 'none');

                allObjs.push(rowObj);
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
    }, [data8, data15, data16]);

    React.useEffect(() => {
        if (formattedData.length > 0) {
            setFilteredData(formattedData.filter(x =>
                (owScenarioFilters.length === 0 || owScenarioFilters.includes(x['OW Scenario'])) &&
                (targetFilters.length === 0 || targetFilters.includes(x['Target'])) &&
                (includeRegression || x['__scoringType'] !== 'regression')
            ));
        }
    }, [formattedData, owScenarioFilters, targetFilters, includeRegression]);

    // headers only exist when at least one row has a value for it
    const allHeaders = React.useMemo(() => {
        const valueKdmas = new Set();
        const paramKdmas = new Set();
        for (const row of filteredData) {
            for (const k of KDMA_ORDER) {
                if (row[valueColLabel(k)] !== undefined) valueKdmas.add(k);
                if (PARAM_ORDER.some(p => row[kdmaColLabel(k, p)] !== undefined)) paramKdmas.add(k);
            }
        }
        const kdmaHeaders = [];
        for (const k of KDMA_ORDER) {
            if (valueKdmas.has(k)) kdmaHeaders.push(valueColLabel(k));
            if (paramKdmas.has(k)) {
                for (const param of PARAM_ORDER) kdmaHeaders.push(kdmaColLabel(k, param));
            }
        }
        const alignedScoreIdx = HEADERS.indexOf('Aligned ADM Alignment score (ADM|target)');
        return [
            ...HEADERS.slice(0, alignedScoreIdx + 1),
            ...kdmaHeaders,
            ...HEADERS.slice(alignedScoreIdx + 1)
        ];
    }, [filteredData]);

    const errors = [
        error8,
        error15,
        error16
    ].filter(Boolean);

    if (errors.length > 0) {
        return <QueryErrorMessage errors={errors} />;
    }

    if (loading8 || loading15 || loading16) return <p>Loading...</p>;

    return (
        <>
            {filteredData.length < formattedData.length &&
                <p className='filteredText'>
                    Showing {filteredData.length} of {formattedData.length} rows based on filters
                </p>
            }
            <section className='tableHeader d-flex align-items-center'>
                <div className="filters">
                    <Autocomplete
                        multiple
                        options={owScenarios}
                        value={owScenarioFilters}
                        filterSelectedOptions
                        size="small"
                        renderInput={(params) => (
                            <TextField {...params} label="OW Scenario" />
                        )}
                        onChange={(_, newVal) => setOwScenarioFilters(newVal)}
                    />
                    <Autocomplete
                        multiple
                        options={targets}
                        value={targetFilters}
                        filterSelectedOptions
                        size="small"
                        renderInput={(params) => (
                            <TextField {...params} label="Target" />
                        )}
                        onChange={(_, newVal) => setTargetFilters(newVal)}
                    />
                </div>
                <FormControlLabel
                    className="ms-auto"
                    control={
                        <Switch
                            size="small"
                            checked={includeRegression}
                            onChange={(e) => setIncludeRegression(e.target.checked)}
                        />
                    }
                    label="Include regression scoring"
                />
                <DownloadButtons
                    formattedData={formattedData}
                    filteredData={filteredData}
                    HEADERS={allHeaders}
                    fileName={'RQ8_OW_Part1_data'}
                    extraAction={openModal}
                />
            </section>

            <div className='resultTableSection'>
                <table className='itm-table'>
                    <thead>
                        <tr>
                            {allHeaders.map((val, index) => (
                                <th key={'header-' + index}>{val}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((dataSet, index) => (
                            <tr key={`row-${index}`} className={index % 2 === 0 ? 'row-even' : 'row-odd'}>
                                {allHeaders.map((val) => (
                                    <td key={`cell-${index}-${val}`}>
                                        {dataSet[val] ?? '-'}
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
                        downloadName={`Definitions_RQ8_OW_Part1.xlsx`}
                        xlFile={owPart1Defs}
                    />
                </div>
            </Modal>

        </>
    );
}