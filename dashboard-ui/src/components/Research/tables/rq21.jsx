import React from "react";
import '../../SurveyResults/resultsTable.css';
import { RQDefinitionTable } from "../variables/rq-variables";
import CloseIcon from '@material-ui/icons/Close';
import { Modal, Autocomplete, TextField } from "@mui/material";
import dreDefinitionXLFile from '../variables/Variable Definitions RQ2.1_DRE.xlsx';
import ph1DefinitionXLFile from '../variables/Variable Definitions RQ2.1_PH1.xlsx';
import { useQuery } from 'react-apollo'
import gql from "graphql-tag";
import { ADM_NAME_MAP, getAlignments } from "../utils";
import { DownloadButtons } from "./download-buttons";

const HEADERS = ['TA1_Name', 'Source', 'Attribute', 'Scenario', 'Group_Target', 'Decision_Maker', 'Alignment score (Individual|Group_target) or (ADM|group_target)']

const getGroupAdmData = gql`
    query getGroupAdmAlignmentByEval($evalNumber: Float!) {
        getGroupAdmAlignmentByEval(evalNumber: $evalNumber)
    }`;

const GET_TEXT_RESULTS = gql`
    query GetAllResults {
        getAllScenarioResults
    }`;

export function RQ21({ evalNum }) {
    const { loading: loadingAdms, error: errorAdms, data: dataAdms } = useQuery(getGroupAdmData, { variables: { "evalNumber": evalNum } });
    const { loading: loadingTextResults, error: errorTextResults, data: dataTextResults } = useQuery(GET_TEXT_RESULTS, {
        fetchPolicy: 'no-cache'
    });
    const [formattedData, setFormattedData] = React.useState([]);
    const [ta1s, setTA1s] = React.useState([]);
    const [ta2s, setTA2s] = React.useState([]);
    const [attributes, setAttributes] = React.useState([]);
    const [scenarios, setScenarios] = React.useState([]);
    const [groupTargets, setGroupTargets] = React.useState([]);
    const [decisionMakers, setDecisionMakers] = React.useState([]);
    const [showDefinitions, setShowDefinitions] = React.useState(false);
    const [ta1Filters, setTA1Filters] = React.useState([]);
    const [ta2Filters, setTA2Filters] = React.useState([]);
    const [scenarioFilters, setScenarioFilters] = React.useState([]);
    const [attributeFilters, setAttributeFilters] = React.useState([]);
    const [groupTargetFilters, setGroupTargetFilters] = React.useState([]);
    const [decisionMakerFilters, setDecisionMakerFilters] = React.useState([]);
    const [filteredData, setFilteredData] = React.useState([]);


    React.useEffect(() => {
        if (dataAdms?.getGroupAdmAlignmentByEval && dataTextResults?.getAllScenarioResults) {
            const admData = dataAdms.getGroupAdmAlignmentByEval;
            const textResults = dataTextResults.getAllScenarioResults.filter((x) => x.evalNumber === evalNum);
            let allObjs = [];
            const allTA1s = [];
            const allTA2s = [];
            const allScenarios = [];
            const allGroupTargets = [];
            const allAttributes = [];
            const allDecisionMakers = ['Human'];
            const pids = [];
            const recorded = {};


            for (const adm of admData) {
                const admName = adm.history[0].parameters.adm_name;
                const scenario = adm.history[0].response?.id ?? adm.history[1].response?.id;
                const last_entry = adm.history[adm.history.length - 1];
                const target = last_entry.parameters.target_id;
                const alignment = last_entry.response.score;
                if (!Object.keys(ADM_NAME_MAP).includes(admName)) {
                    continue;
                }
                const ta2 = ADM_NAME_MAP[admName];
                const entryObj = {};
                const attribute = scenario.includes('qol') ? 'QOL' : scenario.includes('vol') ? 'VOL' : target.includes('Moral') ? 'MJ' : 'IO';
                entryObj['Source'] = ta2;
                allTA2s.push(ta2);
                entryObj['TA1_Name'] = scenario.includes('qol') || scenario.includes('vol') ? 'SoarTech' : 'Adept';
                allTA1s.push(entryObj['TA1_Name']);
                entryObj['Attribute'] = attribute;
                allAttributes.push(attribute);
                entryObj['Group_Target'] = target;
                allGroupTargets.push(target);
                entryObj['Scenario'] = scenario;
                allScenarios.push(scenario);
                entryObj['Decision_Maker'] = admName.toLowerCase().includes('baseline') ? 'Baseline ADM' : 'Aligned ADM';
                allDecisionMakers.push(entryObj['Decision_Maker']);
                entryObj['Alignment score (Individual|Group_target) or (ADM|group_target)'] = alignment;
                allObjs.push(entryObj);
            }

            allObjs.sort((a, b) => {
                // Compare TA2
                if (a['Source'] < b['Source']) return -1;
                if (a['Source'] > b['Source']) return 1;

                // If TA2 is equal, compare TA1
                if (a.TA1_Name < b.TA1_Name) return -1;
                if (a.TA1_Name > b.TA1_Name) return 1;

                // If TA1 is equal, compare Scenario
                if (a.Scenario < b.Scenario) return -1;
                if (a.Scenario > b.Scenario) return 1;

                // if Scenario is equal, compare attribute
                return a.Attribute - b.Attribute;
            });

            const textObjs = [];
            for (const res of textResults) {
                const pid = res['participantID'];
                if (pids.includes(pid)) {
                    continue;
                }
                recorded[pid] = [];

                const { textResultsForPID, } = getAlignments(evalNum, textResults, pid);
                for (const entry of textResultsForPID) {
                    // ignore training scenarios
                    if (entry['scenario_id'].includes('MJ1') || entry['scenario_id'].includes('IO1')) {
                        continue;
                    }
                    // don't include duplicate entries
                    if (recorded[pid]?.includes(entry['serverSessionId'])) {
                        continue;
                    }
                    else {
                        recorded[pid].push(entry['serverSessionId']);
                    }
                    if (Object.keys(entry).includes('group_targets')) {
                        for (const target of Object.keys(entry['group_targets'])) {
                            const entryObj = {};
                            entryObj['Source'] = 'Human';
                            entryObj['Scenario'] = entry['scenario_id'];
                            allScenarios.push(entryObj['Scenario']);
                            entryObj['TA1_Name'] = entryObj['Scenario'].includes('qol') || entryObj['Scenario'].includes('vol') ? 'SoarTech' : 'Adept';
                            allTA1s.push(entryObj['TA1_Name']);
                            entryObj['Decision_Maker'] = entry['participantID'];
                            entryObj['Group_Target'] = target;
                            allGroupTargets.push(target);
                            const attribute = entryObj['Scenario'].includes('qol') ? 'QOL' : entryObj['Scenario'].includes('vol') ? 'VOL' : target.includes('Moral') ? 'MJ' : 'IO';
                            entryObj['Attribute'] = attribute;
                            allAttributes.push(attribute);
                            entryObj['Alignment score (Individual|Group_target) or (ADM|group_target)'] = entry?.['group_targets']?.[target];
                            textObjs.push(entryObj);
                        }
                    }
                }
                pids.push(pid);
            }

            textObjs.sort((a, b) => a['Decision_Maker'] - b['Decision_Maker']);
            allObjs = allObjs.concat(textObjs);

            if (allObjs.length > 0) {
                setFormattedData(allObjs);
                setFilteredData(allObjs);
            }
            else {
                setFormattedData([{ 'TA1_Name': null }]);
                setFilteredData([{ 'TA1_Name': '-' }])
            }
            setTA1s(Array.from(new Set(allTA1s)));
            setTA2s(Array.from(new Set(allTA2s)));
            setAttributes(Array.from(new Set(allAttributes)));
            setScenarios(Array.from(new Set(allScenarios)));
            setGroupTargets(Array.from(new Set(allGroupTargets)));
            setDecisionMakers(Array.from(new Set(allDecisionMakers)));
        }
        else {
            setFormattedData([{ 'TA1_Name': '-' }]);
            setFilteredData([{ 'TA1_Name': '-' }])
        }
    }, [dataAdms, dataTextResults, evalNum]);


    const openModal = () => {
        setShowDefinitions(true);
    }

    const closeModal = () => {
        setShowDefinitions(false);
    }

    React.useEffect(() => {
        if (formattedData.length > 0) {
            setFilteredData(formattedData.filter((x) =>
                (ta1Filters.length === 0 || ta1Filters.includes(x['TA1_Name'])) &&
                (ta2Filters.length === 0 || ta2Filters.includes(x['Source'])) &&
                (scenarioFilters.length === 0 || scenarioFilters.includes(x['Scenario'])) &&
                (attributeFilters.length === 0 || attributeFilters.includes(x['Attribute'])) &&
                (groupTargetFilters.length === 0 || groupTargetFilters.includes(x['Group_Target'])) &&
                (decisionMakerFilters.length === 0 || decisionMakerFilters.includes(x['Decision_Maker']) || decisionMakerFilters.includes(x['Source']))
            ));
        }
    }, [formattedData, ta1Filters, ta2Filters, scenarioFilters, attributeFilters, groupTargetFilters, decisionMakerFilters]);

    if (loadingAdms || loadingTextResults) return <p>Loading...</p>;
    if (errorAdms || errorTextResults) return <p>Error :</p>;

    return (<>
        {filteredData.length < formattedData.length && <p className='filteredText'>Showing {filteredData.length} of {formattedData.length} rows based on filters</p>}
        <section className='tableHeader'>
            <div className="filters">
                <Autocomplete
                    multiple
                    options={ta1s}
                    filterSelectedOptions
                    size="small"
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="TA1"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setTA1Filters(newVal)}
                />
                <Autocomplete
                    multiple
                    options={ta2s}
                    filterSelectedOptions
                    size="small"
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="TA2"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setTA2Filters(newVal)}
                />
                <Autocomplete
                    multiple
                    options={attributes}
                    filterSelectedOptions
                    size="small"
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Attributes"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setAttributeFilters(newVal)}
                />
                <Autocomplete
                    multiple
                    options={scenarios}
                    filterSelectedOptions
                    size="small"
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Scenarios"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setScenarioFilters(newVal)}
                />
                <Autocomplete
                    multiple
                    options={groupTargets}
                    filterSelectedOptions
                    size="small"
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Group Targets"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setGroupTargetFilters(newVal)}
                />
                <Autocomplete
                    multiple
                    options={decisionMakers}
                    filterSelectedOptions
                    size="small"
                    id='big-filter'
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Decision Makers"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setDecisionMakerFilters(newVal)}
                />
            </div>
            <DownloadButtons formattedData={formattedData} filteredData={filteredData} HEADERS={HEADERS} fileName={'RQ-21 data'} extraAction={openModal} />
        </section>
        <div className='resultTableSection'>
            <table className='itm-table'>
                <thead>
                    <tr>
                        {HEADERS.map((val, index) => {
                            return (<th key={'header-' + index}>
                                {val}
                            </th>);
                        })}
                    </tr>
                </thead>
                <tbody>
                    {filteredData.map((dataSet, index) => {
                        return (<tr key={dataSet['Source'] + '-' + index}>
                            {HEADERS.map((val) => {
                                return (<td key={dataSet['Source'] + '-' + val}>
                                    {dataSet[val] ?? '-'}
                                </td>);
                            })}
                        </tr>);
                    })}
                </tbody>
            </table>
        </div>
        <Modal className='table-modal' open={showDefinitions} onClose={closeModal}>
            <div className='modal-body'>
                <span className='close-icon' onClick={closeModal}><CloseIcon /></span>
                <RQDefinitionTable downloadName={`Definitions_RQ21_eval${evalNum}.xlsx`} xlFile={(evalNum === 5 || evalNum === 6) ? ph1DefinitionXLFile : dreDefinitionXLFile} />
            </div>
        </Modal>
    </>);
}
