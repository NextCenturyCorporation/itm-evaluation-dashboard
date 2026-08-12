import React from "react";
import '../../../css/resultsTable.css';
import { useQuery } from 'react-apollo';
import gql from "graphql-tag";
import { Autocomplete, TextField, Modal, FormControlLabel, Switch } from "@mui/material";
import { isDefined } from "../../AggregateResults/DataFunctions";
import { DownloadButtons } from "./download-buttons";
import { RQDefinitionTable } from "../variables/rq-variables";
import CloseIcon from '@material-ui/icons/Close';
import owPart2Defs from '../variables/Variable Definitions RQ8_OW_Part2.xlsx';
import { EVAL_LABEL } from "./ph2_rq8_ow_part1";
const getAdmData = gql`
    query getAllOWData($evalNumber: Float!, $scenarioIDs: [ID]){
        getAllOWData(evalNumber: $evalNumber, scenarioIDs: $scenarioIDs)
    }`;

const OW_EVALS = [8, 15, 16]

const KDMA_SHORT = { affiliation: 'AF', merit: 'MF', personal_safety: 'PS', search: 'SS' };

function roundIfNumber(value) {
    if (typeof value === 'number' && !isNaN(value)) return Math.round(value * 100) / 100;
    return value;
}
function getKdmaParam(parameters, paramName) {
    return parameters?.find(p => p?.name === paramName)?.value;
}

function rank(key) {
    return key.startsWith('Desert') ? 1 : key.startsWith('Urban') ? 2 : 0
}

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
    const [includeRegression, setIncludeRegression] = React.useState(false);

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

                const owScenario = getOWScenario(scenario, currentEvalNum);
                const cleanTarget = (target || '')
                    .replace(/^Feb2026-/, '').replace(/^June2025-/, '').replace(/^April2026-/, '');

                const row = {
                    'OW Scenario': owScenario,
                    'Target': cleanTarget,
                    'ADM Name': admName.split('__')[0],
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
            .sort((a, b) => rank(a) - rank(b))
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
            <section className='tableHeader d-flex align-items-center'>
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