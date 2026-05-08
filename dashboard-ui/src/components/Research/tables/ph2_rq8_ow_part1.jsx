import React from "react";
import '../../../css/resultsTable.css';
import { useQuery } from 'react-apollo';
import gql from "graphql-tag";
import { Autocomplete, TextField, Modal } from "@mui/material";
import { isDefined } from "../../AggregateResults/DataFunctions";
import { DownloadButtons } from "./download-buttons";
import { RQDefinitionTable } from "../variables/rq-variables";
import CloseIcon from '@material-ui/icons/Close';
import owPart1Defs from '../variables/Variable Definitions RQ8_OW_Part1.xlsx';


const getAdmData = gql`
    query getAdmHistoryByScenario($evalNumber: Float!, $scenarioIDs: [ID]){
        getAdmHistoryByScenario(evalNumber: $evalNumber, scenarioIDs: $scenarioIDs)
    }`;

const OW_ADM_SESSIONS = {
    8: {
        baseline: 'ALIGN-ADM-OutlinesBaseline-Mistral-7B-Instruct-v0.3__58cbacb9-3edb-4b6c-ba08-a117709cc860',
        aligned: 'ALIGN-ADM-Ph2-ComparativeRegression-BertRelevance-Mistral-7B-Instruct-v0.3__f6f648dd-3dce-4bf0-bcd2-a68442fb76a9'
    },
    15: {
        baseline: 'ALIGN-ADM-OutlinesBaseline-Mistral-7B-Instruct-v0.3__9d7c67c1-9c7e-46b1-a8d9-75eceb2428ca',
        aligned: 'ALIGN-ADM-Ph2-ComparativeRegression-BertRelevance-Mistral-7B-Instruct-v0.3__96699c14-ab0d-4dfc-b915-8ddfb67f198b'
    }
};

const HEADERS = [
    'Trial_ID', 'OW Scenario', 'Target', 'ADM Name', 'Aligned Server Session ID', 'Aligned ADM Alignment score (ADM|target)',
    'Baseline ADM Alignment score (ADM|target)', 'Baseline Server Session ID'
];

const OW_EVALS = [8, 15];

const getOWScenario = (scenarioId, evalNum) => {
    const env = scenarioId.split('OW_')[1] || scenarioId;
    return `${evalNum === 8 ? 'June2025' : 'Feb2026'} ${env}`;
};

export function PH2RQ8OWPart1() {
    const { loading: loading8, error: error8, data: data8 } = useQuery(getAdmData, { variables: { evalNumber: 8, scenarioIDs: ["June2025-OW_desert", "June2025-OW_urban"] } });
    const { loading: loading15, error: error15, data: data15 } = useQuery(getAdmData, { variables: { evalNumber: 15, scenarioIDs: ["Feb2026-OW_desert", "Feb2026-OW_urban"] } });
    const [formattedData, setFormattedData] = React.useState([]);
    const [filteredData, setFilteredData] = React.useState([]);
    const [showDefinitions, setShowDefinitions] = React.useState(false);
    const [owScenarios, setOwScenarios] = React.useState([]);
    const [targets, setTargets] = React.useState([]);
    const [owScenarioFilters, setOwScenarioFilters] = React.useState([]);
    const [targetFilters, setTargetFilters] = React.useState([]);

    const openModal = () => setShowDefinitions(true);
    const closeModal = () => setShowDefinitions(false);

    React.useEffect(() => {
        if (!data8?.getAdmHistoryByScenario || !data15?.getAdmHistoryByScenario) return;
        const allObjs = [];
        const allOwScenarios = [];
        const allTargets = [];
        const dataByEval = {
            8: data8.getAdmHistoryByScenario,
            15: data15.getAdmHistoryByScenario
        };
        for (const currentEvalNum of OW_EVALS) {
            const rawData = dataByEval[currentEvalNum];
            const sessions = OW_ADM_SESSIONS[currentEvalNum];
            const grouped = {};
            for (const adm of rawData) {
                const admName = adm.evaluation.adm_name;
                const scenario = adm.evaluation.scenario_id;
                const target = adm.evaluation.alignment_target_id;
                const alignment = adm.results.alignment_score;

                if (!isDefined(alignment)) continue;
                if (admName !== sessions.baseline && admName !== sessions.aligned) continue;

                const key = `${scenario}__${target}`;
                if (!grouped[key]) grouped[key] = { scenario, target, aligned: null, baseline: null };

                if (admName === sessions.aligned) {
                    grouped[key].aligned = { alignment, sessionId: adm.results?.ta1_session_id, admName };
                } else {
                    grouped[key].baseline = { alignment, sessionId: adm.results?.ta1_session_id, admName };
                }
            }
            for (const { scenario, target, aligned, baseline } of Object.values(grouped)) {
                if (!aligned) continue;

                const owScenario = getOWScenario(scenario, currentEvalNum);
                const cleanTarget = target.replace(/^Feb2026-/, '').replace(/^June2025-/, '');

                allOwScenarios.push(owScenario);
                allTargets.push(cleanTarget);

                allObjs.push({
                    'OW Scenario': owScenario,
                    'Target': cleanTarget,
                    'ADM Name': aligned.admName,
                    'Aligned Server Session ID': aligned.sessionId ?? '-',
                    'Aligned ADM Alignment score (ADM|target)': aligned.alignment,
                    'Baseline ADM Alignment score (ADM|target)': baseline?.alignment ?? '-',
                    'Baseline Server Session ID': baseline?.sessionId ?? '-'
                });
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
    }, [data8, data15]);

    React.useEffect(() => {
        if (formattedData.length > 0) {
            setFilteredData(formattedData.filter(x =>
                (owScenarioFilters.length === 0 || owScenarioFilters.includes(x['OW Scenario'])) &&
                (targetFilters.length === 0 || targetFilters.includes(x['Target']))
            ));
        }
    }, [formattedData, owScenarioFilters, targetFilters]);

    if (loading8 || loading15) return <p>Loading...</p>;
    if (error8) return <p>Error: {error8.message}</p>;
    if (error15) return <p>Error: {error15.message}</p>;

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
                <DownloadButtons
                    formattedData={formattedData}
                    filteredData={filteredData}
                    HEADERS={HEADERS}
                    fileName={'RQ8_OW_Part1_data'}
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