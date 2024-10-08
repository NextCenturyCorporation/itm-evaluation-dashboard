import React from "react";
import '../../SurveyResults/resultsTable.css';
import { RQDefinitionTable } from "../variables/rq-variables";
import CloseIcon from '@material-ui/icons/Close';
import { Modal, Autocomplete, TextField } from "@mui/material";
import definitionXLFile from '../variables/Variable Definitions RQ2.1.xlsx';
import definitionPDFFile from '../variables/Variable Definitions RQ2.1.pdf';
import { useQuery } from 'react-apollo'
import gql from "graphql-tag";
import { ADM_NAME_MAP, exportToExcel } from "../utils";

const HEADERS = ['TA1_Name', 'TA2_Name', 'Attribute', 'Scenario', 'Group_Target', 'Participant_ID', 'Decision_Maker', 'Alignment score (Individual|Group_target) or (ADM|group_target)']

const getGroupAdmData = gql`
    query getGroupAdmAlignmentEval4 {
        getGroupAdmAlignmentEval4
    }`;


export function RQ21() {
    const { loading: loadingAdms, error: errorAdms, data: dataAdms } = useQuery(getGroupAdmData);
    const [formattedData, setFormattedData] = React.useState([{ 'TA1_Name': '-', 'TA2_Name': '-', 'Attribute': '-', 'Scenario': '-', 'Group_Target': '-', 'Participant_ID': '-', 'Decision_Maker': '-', 'Alignment score (Individual|Group_target) or (ADM|group_target)': '-' }]);
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
        if (dataAdms?.getGroupAdmAlignmentEval4) {
            const admData = dataAdms.getGroupAdmAlignmentEval4;
            const allObjs = [];
            const allTA1s = [];
            const allTA2s = [];
            const allScenarios = [];
            const allGroupTargets = [];
            const allAttributes = [];
            const allDecisionMakers = [];

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
                entryObj['TA2_Name'] = ta2;
                allTA2s.push(ta2);
                entryObj['TA1_Name'] = scenario.includes('qol') || scenario.includes('vol') ? 'SoarTech' : 'Adept';
                allTA1s.push(entryObj['TA1_Name']);
                entryObj['Attribute'] = attribute;
                allAttributes.push(attribute);
                entryObj['Group_Target'] = target;
                allGroupTargets.push(target);
                entryObj['Scenario'] = scenario;
                allScenarios.push(scenario);
                entryObj['Target_Type (Group/Individual)'] = target.toLowerCase().includes('-group') ? 'Group' : 'Individual';
                entryObj['Participant_ID'] = '-';
                entryObj['Decision_Maker'] = admName.toLowerCase().includes('baseline') ? 'Baseline ADM' : 'Aligned ADM';
                allDecisionMakers.push(entryObj['Decision_Maker']);
                entryObj['Alignment score (Individual|Group_target) or (ADM|group_target)'] = alignment;
                allObjs.push(entryObj);
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
                return a.Attribute - b.Attribute;
            });

            setFormattedData(allObjs);
            setFilteredData(allObjs);
            setTA1s(Array.from(new Set(allTA1s)));
            setTA2s(Array.from(new Set(allTA2s)));
            setAttributes(Array.from(new Set(allAttributes)));
            setScenarios(Array.from(new Set(allScenarios)));
            setGroupTargets(Array.from(new Set(allGroupTargets)));
            setDecisionMakers(Array.from(new Set(allDecisionMakers)));
        }
    }, [dataAdms]);


    const openModal = () => {
        setShowDefinitions(true);
    }

    const closeModal = () => {
        setShowDefinitions(false);
    }

    React.useEffect(() => {
        if (formattedData.length > 0) {
            setFilteredData(formattedData.filter((x) =>
                (ta1Filters.length == 0 || ta1Filters.includes(x['TA1_Name'])) &&
                (ta2Filters.length == 0 || ta2Filters.includes(x['TA2_Name'])) &&
                (scenarioFilters.length == 0 || scenarioFilters.includes(x['Scenario'])) &&
                (attributeFilters.length == 0 || attributeFilters.includes(x['Attribute'])) &&
                (groupTargetFilters.length == 0 || groupTargetFilters.includes(x['Group_Target'])) &&
                (decisionMakerFilters.length == 0 || decisionMakerFilters.includes(x['Decision_Maker']))
            ));
        }
    }, [formattedData, ta1Filters, ta2Filters, scenarioFilters, attributeFilters, groupTargetFilters, decisionMakerFilters]);

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
            <div className="option-section">
                <button className='downloadBtn' onClick={() => exportToExcel('RQ-21 data', formattedData, HEADERS)}>Download All Data</button>
                <button className='downloadBtn' onClick={openModal}>View Variable Definitions</button>
            </div>
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
                                    {dataSet[val]}
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
                <RQDefinitionTable downloadName={'Definitions_RQ21.pdf'} xlFile={definitionXLFile} pdfFile={definitionPDFFile} />
            </div>
        </Modal>
    </>);
}
