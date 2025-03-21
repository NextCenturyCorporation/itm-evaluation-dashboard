import React from "react";
import '../../SurveyResults/resultsTable.css';
import { useQuery } from 'react-apollo'
import gql from "graphql-tag";
import { RQDefinitionTable } from "../variables/rq-variables";
import CloseIcon from '@material-ui/icons/Close';
import { Autocomplete, TextField, Modal } from "@mui/material";
import dreDefinitionXLFile from '../variables/Variable Definitions RQ2.2_2.3_DRE.xlsx';
import ph1DefinitionXLFile from '../variables/Variable Definitions RQ2.2_2.3_PH1.xlsx';
import { ADM_NAME_MAP } from "../utils";
import { isDefined } from "../../AggregateResults/DataFunctions";
import { DownloadButtons } from "./download-buttons";

const getAdmData = gql`
    query getAllHistoryByEvalNumber($evalNumber: Float!){
        getAllHistoryByEvalNumber(evalNumber: $evalNumber)
    }`;

const DRE_HEADERS = ['Trial_ID', 'TA2_Name', 'TA1_Name', 'Attribute', 'Target', 'Scenario', 'Target_Type (Group/Individual)', 'Aligned ADM Alignment score (ADM|target)', 'Aligned Server Session ID', 'Baseline ADM Alignment score (ADM|target)', 'Baseline Server Session ID'];
const PH1_HEADERS = ['Trial_ID', 'TA2_Name', 'TA1_Name', 'Attribute', 'Target', 'Scenario', 'Target_Type (Group/Individual)', 'P1E Aligned ADM Alignment score (ADM|target)', 'P1E Aligned Server Session ID', 'DRE Aligned ADM Alignment score (ADM|target)', 'DRE Aligned Server Session ID', 'P1E Baseline ADM Alignment score (ADM|target)', 'P1E Baseline Server Session ID', 'DRE Baseline ADM Alignment score (ADM|target)', 'DRE Baseline Server Session ID'];


export function RQ2223({ evalNum }) {
    const { loading: loading, error: error, data: data } = useQuery(getAdmData, {
        variables: { "evalNumber": evalNum }
    });
    const [formattedData, setFormattedData] = React.useState([]);
    const [showDefinitions, setShowDefinitions] = React.useState(false);
    // all options for filters
    const [ta1s, setTA1s] = React.useState([]);
    const [ta2s, setTA2s] = React.useState([]);
    const [attributes, setAttributes] = React.useState([]);
    const [scenarios, setScenarios] = React.useState([]);
    const [targets, setTargets] = React.useState([]);
    const [targetType, setTargetType] = React.useState(['Group', 'Individual']);
    // filter options that have been chosen
    const [ta1Filters, setTA1Filters] = React.useState([]);
    const [ta2Filters, setTA2Filters] = React.useState([]);
    const [attributeFilters, setAttributeFilters] = React.useState([]);
    const [scenarioFilters, setScenarioFilters] = React.useState([]);
    const [targetFilters, setTargetFilters] = React.useState([]);
    const [targetTypeFilters, setTargetTypeFilters] = React.useState([]);
    // data with filters applied
    const [filteredData, setFilteredData] = React.useState([]);
    const HEADERS = evalNum == 5 || evalNum == 6 ? PH1_HEADERS : DRE_HEADERS;


    const openModal = () => {
        setShowDefinitions(true);
    }

    const closeModal = () => {
        setShowDefinitions(false);
    }

    React.useEffect(() => {
        if (data?.getAllHistoryByEvalNumber) {
            const admData = data.getAllHistoryByEvalNumber;
            const organized_adms = {};
            const allObjs = [];
            const allTA1s = [];
            const allTA2s = [];
            const allScenarios = [];
            const allTargets = [];
            const allAttributes = [];

            for (const adm of admData) {
                const admName = adm.history[0].parameters.adm_name;
                const scenario = adm.history[0].response?.id ?? adm.history[1].response?.id;
                const last_entry = adm.history[adm.history.length - 1];
                const target = last_entry.parameters.target_id;
                const alignment = last_entry.response?.score;
                const dre_alignment = last_entry.response?.dre_alignment?.score;
                if (!isDefined(alignment)) {
                    continue;
                }
                if (!Object.keys(ADM_NAME_MAP).includes(admName)) {
                    continue;
                }
                const ta2 = ADM_NAME_MAP[admName];
                if (!Object.keys(organized_adms).includes(ta2)) {
                    organized_adms[ta2] = {};
                }
                if (!Object.keys(organized_adms[ta2]).includes(scenario)) {
                    organized_adms[ta2][scenario] = {};
                }
                if (!Object.keys(organized_adms[ta2][scenario]).includes(target)) {
                    organized_adms[ta2][scenario][target] = {};
                }
                organized_adms[ta2][scenario][target][admName] = { 'alignment': alignment, 'adm': adm, 'dre_alignment': dre_alignment };
            }
            for (const ta2 of Object.keys(organized_adms)) {
                for (const scenario of Object.keys(organized_adms[ta2])) {
                    let trial = 1;
                    let last_attribute = '';
                    for (const target of Object.keys(organized_adms[ta2][scenario])) {
                        const entryObj = {};
                        const attribute = scenario.includes('qol') ? 'QOL' : scenario.includes('vol') ? 'VOL' : target.includes('Moral') ? 'MJ' : 'IO';
                        if ((last_attribute == 'MJ' && attribute == 'IO') || last_attribute == 'IO' && attribute == 'MJ') {
                            trial = 1;
                        }
                        last_attribute = attribute;
                        entryObj['Trial_ID'] = trial;
                        trial += 1;
                        entryObj['TA2_Name'] = ta2;
                        allTA2s.push(ta2);
                        entryObj['TA1_Name'] = scenario.includes('qol') || scenario.includes('vol') ? 'SoarTech' : 'Adept';
                        allTA1s.push(entryObj['TA1_Name']);
                        entryObj['Attribute'] = attribute;
                        allAttributes.push(attribute);
                        entryObj['Target'] = target;
                        allTargets.push(target);
                        entryObj['Scenario'] = scenario;
                        allScenarios.push(scenario);
                        entryObj['Target_Type (Group/Individual)'] = target.toLowerCase().includes('-group') ? 'Group' : 'Individual';
                        const aligned = organized_adms[ta2][scenario][target][ta2 == 'Parallax' ? 'TAD-aligned' : "ALIGN-ADM-ComparativeRegression-ICL-Template"];

                        if (evalNum == 5 || evalNum == 6) {
                            entryObj['P1E Aligned ADM Alignment score (ADM|target)'] = aligned?.alignment;
                            entryObj['P1E Aligned Server Session ID'] = aligned?.adm?.history?.find((x) => x.command == 'TA1 Session Alignment')?.parameters?.session_id ?? '-';
                            entryObj['DRE Aligned ADM Alignment score (ADM|target)'] = entryObj['TA1_Name'] == 'SoarTech' ? aligned?.alignment : aligned?.dre_alignment;
                            entryObj['DRE Aligned Server Session ID'] = entryObj['TA1_Name'] == 'SoarTech' ? entryObj['P1E Aligned Server Session ID'] : aligned?.adm?.history?.find((x) => x.command == 'TA1 Session Alignment')?.parameters?.dreSessionId ?? '-';
                        }
                        else {
                            entryObj['Aligned ADM Alignment score (ADM|target)'] = aligned?.alignment;
                            entryObj['Aligned Server Session ID'] = aligned?.adm?.history?.find((x) => x.command == 'TA1 Session Alignment')?.parameters?.session_id ?? '-';
                        }
                        const baseline = organized_adms[ta2][scenario][target][ta2 == 'Parallax' ? 'TAD-severity-baseline' : "ALIGN-ADM-OutlinesBaseline"];

                        if (evalNum == 5 || evalNum == 6) {
                            entryObj['P1E Baseline ADM Alignment score (ADM|target)'] = baseline?.alignment;
                            entryObj['P1E Baseline Server Session ID'] = baseline?.adm?.history?.find((x) => x.command == 'TA1 Session Alignment')?.parameters?.session_id ?? '-';
                            entryObj['DRE Baseline ADM Alignment score (ADM|target)'] = entryObj['TA1_Name'] == 'SoarTech' ? baseline?.alignment : baseline?.dre_alignment;
                            entryObj['DRE Baseline Server Session ID'] = entryObj['TA1_Name'] == 'SoarTech' ? entryObj['P1E Baseline Server Session ID'] : baseline?.adm?.history?.find((x) => x.command == 'TA1 Session Alignment')?.parameters?.dreSessionId ?? '-';
                        }
                        else {
                            entryObj['Baseline ADM Alignment score (ADM|target)'] = baseline?.alignment;
                            entryObj['Baseline Server Session ID'] = baseline?.adm?.history?.find((x) => x.command == 'TA1 Session Alignment')?.parameters?.session_id ?? '-';
                        }
                        allObjs.push(entryObj);
                    }

                }
            }
            // sort by TA2, then TA1, then scenario, then attribute, then trial
            allObjs.sort((a, b) => {
                // Compare TA2
                if (a.TA2_Name < b.TA2_Name) return -1;
                if (a.TA2_Name > b.TA2_Name) return 1;

                // If TA2 is equal, compare TA1
                if (a.TA1_Name < b.TA1_Name) return -1;
                if (a.TA1_Name > b.TA1_Name) return 1;

                // If TA1 is equal, compare Scenario
                if (a.Scenario < b.Scenario) return -1;
                if (a.Scenario > b.Scenario) return 1;

                // if Scenario is equal, compare attribute
                if (a.Attribute < b.Attribute) return -1;
                if (a.Attribute > b.Attribute) return 1;

                // if attribute is equal, compare group/individual
                if (a['Target_Type (Group/Individual)'] < b['Target_Type (Group/Individual)']) return 1;
                if (a['Target_Type (Group/Individual)'] > b['Target_Type (Group/Individual)']) return -1;

                // If attribute is equal, compare Trial_ID
                return a.Trial_ID - b.Trial_ID;
            });

            if (allObjs.length > 0) {
                setFormattedData(allObjs);
                setFilteredData(allObjs);
            }
            else {
                setFormattedData([{ 'Trial_ID': '-' }]);
                setFilteredData([{ 'Trial_ID': '-' }]);
            }
            setTA1s(Array.from(new Set(allTA1s)));
            setTA2s(Array.from(new Set(allTA2s)));
            setAttributes(Array.from(new Set(allAttributes)));
            setScenarios(Array.from(new Set(allScenarios)));
            setTargets(Array.from(new Set(allTargets)));
        }
    }, [data, evalNum]);

    React.useEffect(() => {
        if (formattedData.length > 0) {
            setFilteredData(formattedData.filter((x) =>
                (ta1Filters.length == 0 || ta1Filters.includes(x['TA1_Name'])) &&
                (ta2Filters.length == 0 || ta2Filters.includes(x['TA2_Name'])) &&
                (scenarioFilters.length == 0 || scenarioFilters.includes(x['Scenario'])) &&
                (targetFilters.length == 0 || targetFilters.includes(x['Target'])) &&
                (attributeFilters.length == 0 || attributeFilters.includes(x['Attribute'])) &&
                (targetTypeFilters.length == 0 || targetTypeFilters.includes(x['Target_Type (Group/Individual)']))
            ));
        }
    }, [formattedData, ta1Filters, ta2Filters, scenarioFilters, targetFilters, attributeFilters, targetTypeFilters]);


    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error :</p>;

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
                    options={targets}
                    filterSelectedOptions
                    size="small"
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Targets"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setTargetFilters(newVal)}
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
                    options={targetType}
                    filterSelectedOptions
                    size="small"
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Target Type"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setTargetTypeFilters(newVal)}
                />
            </div>
            <DownloadButtons formattedData={formattedData} filteredData={filteredData} HEADERS={HEADERS} fileName={'RQ-22_and_RQ-23 data'} extraAction={openModal} />
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
                        return (<tr key={dataSet['Delegator_ID'] + '-' + index}>
                            {HEADERS.map((val) => {
                                return (<td key={dataSet['Delegator_ID'] + '-' + val}>
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
                <RQDefinitionTable downloadName={`Definitions_RQ22_23_eval${evalNum}.xlsx`} xlFile={(evalNum == 5 || evalNum == 6) ? ph1DefinitionXLFile : dreDefinitionXLFile} />
            </div>
        </Modal>
    </>);
}
