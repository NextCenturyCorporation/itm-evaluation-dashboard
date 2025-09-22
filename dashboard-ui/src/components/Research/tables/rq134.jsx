import React from "react";
import '../../SurveyResults/resultsTable.css';
import { useQuery } from 'react-apollo'
import gql from "graphql-tag";
import { RQDefinitionTable } from "../variables/rq-variables";
import CloseIcon from '@material-ui/icons/Close';
import { Autocomplete, Modal, TextField } from "@mui/material";
import dreDefinitionXLFile from '../variables/Variable Definitions RQ134_DRE.xlsx';
import ph1DefinitionXLFile from '../variables/Variable Definitions RQ134_PH1.xlsx';
import ph2DefinitionXLFile from '../variables/Variable Definitions RQ134_PH2.xlsx';
import septemberDefinitionXLFile from '../variables/Variable Definitions RQ134_PH2_September.xlsx';
import { getRQ134Data } from "../utils";
import { DownloadButtons } from "./download-buttons";
import { Checkbox, FormControlLabel } from "@material-ui/core";
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';

const GET_PARTICIPANT_LOG = gql`
    query GetParticipantLog {
        getParticipantLog
    }`;

const GET_SURVEY_RESULTS = gql`
    query GetAllResults {
        getAllSurveyResults
    }`;

const GET_TEXT_RESULTS = gql`
    query GetAllResults {
        getAllScenarioResults
    }`;

const GET_ADM_DATA = gql`
    query getAllHistoryByEvalNumber($evalNumber: Float!){
        getAllHistoryByEvalNumber(evalNumber: $evalNumber)
    }`;

const GET_COMPARISON_DATA = gql`
    query getHumanToADMComparison {
        getHumanToADMComparison
    }`;

const GET_SIM_DATA = gql`
    query GetSimAlignment($evalNumber: Float!){
        getAllSimAlignmentByEval(evalNumber: $evalNumber)
    }`;

const HEADERS_DRE = ['Delegator ID', 'ADM Order', 'Datasource', 'Delegator_grp', 'Delegator_mil', 'Delegator_Role', 'TA1_Name', 'Trial_ID', 'Attribute', 'Scenario', 'TA2_Name', 'ADM_Type', 'Target', 'Alignment score (ADM|target)', 'Alignment score (Delegator|target)', 'Alignment score (Participant_sim|Observed_ADM(target))', 'Server Session ID (Delegator)', 'ADM_Aligned_Status (Baseline/Misaligned/Aligned)', 'ADM Loading', 'Competence Error', 'Alignment score (Delegator|Observed_ADM (target))', 'Trust_Rating', 'Delegation preference (A/B)', 'Delegation preference (A/M)', 'Trustworthy_Rating', 'Agreement_Rating', 'SRAlign_Rating'];
const HEADERS_PH1 = ['Delegator ID', 'ADM Order', 'Datasource', 'Delegator_grp', 'Delegator_mil', 'Delegator_Role', 'TA1_Name', 'Trial_ID', 'Attribute', 'Scenario', 'TA2_Name', 'ADM_Type', 'Target', 'P1E/Population Alignment score (ADM|target)', 'DRE/Distance Alignment score (ADM|target)', 'P1E/Population Alignment score (Delegator|target)', 'DRE/Distance Alignment score (Delegator|target)', 'Alignment score (Participant_sim|Observed_ADM(target))', 'Server Session ID (Delegator)', 'ADM_Aligned_Status (Baseline/Misaligned/Aligned)', 'ADM Loading', 'DRE ADM Loading', 'Competence Error', 'P1E/Population Alignment score (Delegator|Observed_ADM (target))', 'DRE/Distance Alignment score (Delegator|Observed_ADM (target))', 'Truncation Error', 'Trust_Rating', 'Delegation preference (A/B)', 'Delegation preference (A/M)', 'Trustworthy_Rating', 'Agreement_Rating', 'SRAlign_Rating'];
const HEADERS_PH2_JUNE_2025 = ['Delegator ID', 'Datasource', 'Delegator_grp', 'Delegator_mil', 'Delegator_Role', 'Trial_ID', 'Attribute', 'Probe Set Assessment', 'Probe Set Observation', 'ADM_Type', 'Target', 'Alignment score (ADM|target)', 'Alignment score (Delegator|target)', 'Server Session ID (Delegator)', 'ADM_Aligned_Status (Baseline/Misaligned/Aligned)', 'ADM Loading', 'Alignment score (Delegator|Observed_ADM (target))', 'Trust_Rating', 'Delegation preference (A/B)', 'Delegation preference (A/M)', 'Delegation (A/HH)', 'Delegation (A/HL)', 'Delegation (A/LH)', 'Delegation (A/LL)', 'Trustworthy_Rating', 'Agreement_Rating', 'SRAlign_Rating'];
const HEADERS_PH2_SEPT_2025 = ['Delegator ID', 'Datasource', 'Delegator_grp', 'Delegator_mil', 'Delegator_Role', 'Trial_ID', 'Attribute', 'Probe Set Assessment', 'Probe Set Observation', 'ADM_Type', 'Target', 'Server Session ID (Delegator)', 'Alignment score (Delegator|Observed_ADM (target))', 'Trust_Rating', 'Delegation Preference (PSAF-1/PSAF-2)', 'Delegation Preference (PSAF-1/PSAF-3)', 'Delegation Preference (PSAF-1/PSAF-4)', 'Delegation Preference (PSAF-2/PSAF-3)', 'Delegation Preference (PSAF-2/PSAF-4)', 'Delegation Preference (PSAF-3/PSAF-4)', 'Trustworthy_Rating', 'Agreement_Rating', 'SRAlign_Rating'];

export function RQ134({ evalNum, tableTitle }) {
    const { loading: loadingParticipantLog, error: errorParticipantLog, data: dataParticipantLog } = useQuery(GET_PARTICIPANT_LOG);
    const { loading: loadingSurveyResults, error: errorSurveyResults, data: dataSurveyResults } = useQuery(GET_SURVEY_RESULTS);
    const { loading: loadingTextResults, error: errorTextResults, data: dataTextResults } = useQuery(GET_TEXT_RESULTS, { fetchPolicy: 'no-cache' });
    const { loading: loadingADMs, error: errorADMs, data: dataADMs } = useQuery(GET_ADM_DATA, {
        variables: { "evalNumber": (evalNum === 6 ? 5 : evalNum) }
    });
    const { data: dreAdms } = useQuery(GET_ADM_DATA, {
        variables: { "evalNumber": 4 }
    });
    const { data: juneAdms } = useQuery(GET_ADM_DATA, {
        variables: { "evalNumber": 8 }
    });
    const { data: julyAdms } = useQuery(GET_ADM_DATA, {
        variables: { "evalNumber": 9 }
    });
    const { loading: loadingComparisonData, error: errorComparisonData, data: comparisonData } = useQuery(GET_COMPARISON_DATA, { fetchPolicy: 'no-cache' });
    const { loading: loadingSim, error: errorSim, data: dataSim } = useQuery(GET_SIM_DATA, { variables: { "evalNumber": evalNum } });
    const { data: dreSim } = useQuery(GET_SIM_DATA, { variables: { "evalNumber": 4 } });
    const { data: janSim } = useQuery(GET_SIM_DATA, { variables: { "evalNumber": 6 } });
    const { data: juneSim } = useQuery(GET_SIM_DATA, { variables: { "evalNumber": 8 } });
    const { data: julySim } = useQuery(GET_SIM_DATA, { variables: { "evalNumber": 9 } });

    const [formattedData, setFormattedData] = React.useState([]);
    const [showDefinitions, setShowDefinitions] = React.useState(false);
    // all options for filters
    const [ta1s, setTA1s] = React.useState([]);
    const [ta2s, setTA2s] = React.useState([]);
    const [scenarios, setScenarios] = React.useState([]);
    const [targets, setTargets] = React.useState([]);
    const [attributes, setAttributes] = React.useState([]);
    const [probeSetAssessments, setProbeSetAssessments] = React.useState([]);
    const [probeSetObservations, setProbeSetObservations] = React.useState([]);
    const [admTypes] = React.useState(['baseline', 'aligned', 'comparison']);
    const [delGrps] = React.useState(['Online', 'emailParticipant', 'Civilian', 'Military']);
    const [delMils] = React.useState(['yes', 'no']);
    // filter options that have been chosen
    const [ta1Filters, setTA1Filters] = React.useState([]);
    const [ta2Filters, setTA2Filters] = React.useState([]);
    const [scenarioFilters, setScenarioFilters] = React.useState([]);
    const [targetFilters, setTargetFilters] = React.useState([]);
    const [attributeFilters, setAttributeFilters] = React.useState([]);
    const [probeSetAssessmentFilters, setProbeSetAssessmentFilters] = React.useState([]);
    const [probeSetObservationFilters, setProbeSetObservationFilters] = React.useState([]);
    const [admTypeFilters, setAdmTypeFilters] = React.useState([]);
    const [delGrpFilters, setDelGrpFilters] = React.useState([]);
    const [delMilFilters, setDelMilFilters] = React.useState([]);
    const [includeDRE, setIncludeDRE] = React.useState(false);
    const [includeJAN, setIncludeJAN] = React.useState(false);
    const [includeJune, setIncludeJune] = React.useState(false);
    const [includeJuly, setIncludeJuly] = React.useState(false);
    // data with filters applied
    const [filteredData, setFilteredData] = React.useState([]);
    // hiding columns
    const [columnsToHide, setColumnsToHide] = React.useState([]);
    // searching rows
    const [searchPid, setSearchPid] = React.useState('');
    const [headers, setHeaders] = React.useState([]);

    const shouldShowTruncationError = evalNum === 6 || (evalNum === 5 && includeJAN);

    const openModal = () => {
        setShowDefinitions(true);
    }

    const closeModal = () => {
        setShowDefinitions(false);
    }

    React.useEffect(() => {
        // reset toggles on render
        setIncludeDRE(false);
        setIncludeJAN(false);
        setIncludeJune(false);
        setIncludeJuly(false);
        clearFilters();
    }, [evalNum]);

    React.useEffect(() => {
        let currentHeaders = evalNum === 5 || evalNum === 6 ? [...HEADERS_PH1] : [...HEADERS_DRE];
        if ([8, 9].includes(evalNum)) {
            currentHeaders = [...HEADERS_PH2_JUNE_2025];
        }
        if (evalNum == 10) {
            currentHeaders = [...HEADERS_PH2_SEPT_2025];
        }
        if (!(evalNum === 6 || (evalNum === 5 && includeJAN))) {
            currentHeaders = currentHeaders.filter(header => header !== 'Truncation Error');
        }

        setHeaders(currentHeaders);
    }, [evalNum, includeJAN]);

    React.useEffect(() => {
        if (dataSurveyResults?.getAllSurveyResults && dataParticipantLog?.getParticipantLog && dataTextResults?.getAllScenarioResults &&
            dataADMs?.getAllHistoryByEvalNumber && comparisonData?.getHumanToADMComparison && dataSim?.getAllSimAlignmentByEval &&
            dreAdms?.getAllHistoryByEvalNumber && dreSim?.getAllSimAlignmentByEval && janSim?.getAllSimAlignmentByEval) {
            const data = getRQ134Data(evalNum, dataSurveyResults, dataParticipantLog, dataTextResults, dataADMs, comparisonData, dataSim);

            if (evalNum === 6) {
                data.allObjs = data.allObjs.map(obj => ({
                    ...obj,
                    Delegator_mil: 'yes'
                }));
            }

            if (includeDRE) {
                // for ph1, offer option to include dre data, but ONLY THE 25 FULL SETS!
                includeExtraData(data, 4, dreSim, dreAdms);
            }
            if (includeJAN) {
                includeExtraData(data, 6, janSim, dataADMs);
            }
            if (includeJune) {
                includeExtraData(data, 8, juneSim, juneAdms);
            }
            if (includeJuly) {
                includeExtraData(data, 9, julySim, julyAdms);
            }
            data.allObjs.sort((a, b) => {
                // Compare PID
                if (Number(a['Delegator ID']) < Number(b['Delegator ID'])) return -1;
                if (Number(a['Delegator ID']) > Number(b['Delegator ID'])) return 1;

                // if PID is equal, compare trial id
                return a.Trial_ID - b.Trial_ID;
            });
            setFormattedData(data.allObjs);
            setFilteredData(data.allObjs);
            setTA1s(Array.from(new Set(data.allTA1s)));
            setTA2s(Array.from(new Set(data.allTA2s)));
            setAttributes(Array.from(new Set(data.allAttributes)));
            setScenarios(Array.from(new Set(data.allScenarios)));
            setProbeSetAssessments(Array.from(new Set(data.allProbeSetAssessment)))
            setProbeSetObservations(Array.from(new Set(data.allProbeSetObservation)))
            setTargets(Array.from(new Set(data.allTargets)));
        }
    }, [dataParticipantLog, dataSurveyResults, dataTextResults, dataADMs, comparisonData, evalNum, includeDRE, includeJAN, includeJune, includeJuly, dreAdms, juneAdms, julyAdms, dreSim, janSim, juneSim, julySim, dataSim]);

    const includeExtraData = (data, evalToAdd, simData, admsToUse) => {
        const addedData = getRQ134Data(evalToAdd, dataSurveyResults, dataParticipantLog, dataTextResults, admsToUse, comparisonData, simData, evalToAdd == 4);
        if (evalToAdd == 6) {
            addedData.allObjs = addedData.allObjs.map(obj => ({
                ...obj,
                Delegator_mil: 'yes'
            }));
        }
        data.allObjs.push(...addedData.allObjs);
        data.allTA1s.push(...addedData.allTA1s);
        data.allTA2s.push(...addedData.allTA2s);
        data.allAttributes.push(...addedData.allAttributes);
        data.allScenarios.push(...addedData.allScenarios);
        data.allTargets.push(...addedData.allTargets);
    };

    const updateDREStatus = (event) => {
        setIncludeDRE(event.target.checked);
    };

    const updateJANStatus = (event) => {
        setIncludeJAN(event.target.checked);
    };

    const updateJuneStatus = (event) => {
        setIncludeJune(event.target.checked);
    };

    const updateJulyStatus = (event) => {
        setIncludeJuly(event.target.checked);
    };

    const hideColumn = (val) => {
        setColumnsToHide([...columnsToHide, val]);
    };

    const updatePidSearch = (event) => {
        setSearchPid(event.target.value);
    };

    const clearFilters = () => {
        setTA1Filters([]);
        setTA2Filters([]);
        setScenarioFilters([]);
        setTargetFilters([]);
        setAttributeFilters([]);
        setAdmTypeFilters([]);
        setDelGrpFilters([]);
        setDelMilFilters([]);
        setSearchPid('');
        setProbeSetAssessmentFilters([]);
        setProbeSetObservationFilters([]);
    };

    const refineData = (origData) => {
        // remove unwanted headers from download
        const updatedData = structuredClone(origData);

        const displayedHeaders = getFilteredHeaders();

        updatedData.map((x) => {
            // Remove all headers that are not in the displayed headers list
            Object.keys(x).forEach(key => {
                if (!displayedHeaders.includes(key)) {
                    delete x[key];
                }
            });
            return x;
        });
        return updatedData;
    };

    React.useEffect(() => {
        if (formattedData.length > 0) {
            setFilteredData(formattedData.filter((x) =>
                (ta1Filters.length === 0 || ta1Filters.includes(x['TA1_Name'])) &&
                (ta2Filters.length === 0 || ta2Filters.includes(x['TA2_Name'])) &&
                (scenarioFilters.length === 0 || scenarioFilters.includes(x['Scenario'])) &&
                (evalNum < 8 || probeSetAssessmentFilters.length === 0 || probeSetAssessmentFilters.includes(x['Probe Set Assessment'])) &&
                (evalNum < 8 || probeSetObservationFilters.length === 0 || probeSetObservationFilters.includes(x['Probe Set Observation'])) &&
                (targetFilters.length === 0 || targetFilters.includes(x['Target'])) &&
                (attributeFilters.length === 0 || attributeFilters.includes(x['Attribute'])) &&
                (admTypeFilters.length === 0 || admTypeFilters.includes(x['ADM_Type'])) &&
                (delGrpFilters.length === 0 || delGrpFilters.includes(x['Delegator_grp'])) &&
                (delMilFilters.length === 0 || delMilFilters.includes(x['Delegator_mil'])) &&
                (searchPid.length === 0 || x['Delegator ID'].includes(searchPid))
            ));
        }
    }, [formattedData, ta1Filters, ta2Filters, scenarioFilters, targetFilters, attributeFilters, admTypeFilters, delGrpFilters, delMilFilters, searchPid, probeSetAssessmentFilters, probeSetObservationFilters, evalNum]);

    const getFilteredHeaders = () => {
        return headers.filter(x => !columnsToHide.includes(x) && (shouldShowTruncationError || x !== 'Truncation Error'));
    };

    if (loadingParticipantLog || loadingSurveyResults || loadingTextResults || loadingADMs || loadingComparisonData || loadingSim) return <p>Loading...</p>;
    if (errorParticipantLog || errorSurveyResults || errorTextResults || errorADMs || errorComparisonData || errorSim) return <p>Error :</p>;

    return (<>
        <h2 className='rq134-header'>{tableTitle}
            {evalNum === 5 &&
                <div className='stacked-checkboxes'>
                    <FormControlLabel className='floating-toggle' control={<Checkbox value={includeDRE} onChange={updateDREStatus} />} label="Include DRE Data" />
                    <FormControlLabel className='floating-toggle' control={<Checkbox value={includeJAN} onChange={updateJANStatus} />} label="Include Jan 2025 Eval Data" />
                </div>}
            {evalNum === 8 &&
                <div className='stacked-checkboxes'>
                    <FormControlLabel className='floating-toggle centered-toggle' control={<Checkbox value={includeJuly} onChange={updateJulyStatus} />} label="Include July 2025 Eval Data" />
                </div>}
            {evalNum === 9 &&
                <div className='stacked-checkboxes'>
                    <FormControlLabel className='floating-toggle centered-toggle' control={<Checkbox value={includeJune} onChange={updateJuneStatus} />} label="Include June 2025 Eval Data" />
                </div>}
        </h2>

        {filteredData.length < formattedData.length &&
            <p className='filteredText'>Showing {filteredData.length} of {formattedData.length} rows based on filters
                <span className='reset-btn' onClick={clearFilters}>(Reset Filters)</span>
            </p>
        }
        <section className='tableHeader'>
            <div className='complexHeader'>
                <div className="too-many-filters">
                    {evalNum < 8 && (
                        <>
                            <Autocomplete
                                multiple
                                options={ta1s}
                                value={ta1Filters}
                                size="small"
                                limitTags={2}
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
                                value={ta2Filters}
                                size="small"
                                limitTags={2}
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
                                options={scenarios}
                                value={scenarioFilters}
                                size="small"
                                limitTags={2}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Scenarios"
                                        placeholder=""
                                    />
                                )}
                                onChange={(_, newVal) => setScenarioFilters(newVal)}
                            />
                        </>
                    )}
                    {evalNum >= 8 && (
                        <>
                            <Autocomplete
                                multiple
                                options={probeSetAssessments.sort()}
                                value={probeSetAssessmentFilters}
                                size="small"
                                limitTags={2}
                                getOptionLabel={(option) => String(option)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Probe Set Assessment"
                                        placeholder=""
                                    />
                                )}
                                onChange={(_, newVal) => setProbeSetAssessmentFilters(newVal)}
                            />
                            <Autocomplete
                                multiple
                                options={probeSetObservations.sort()}
                                value={probeSetObservationFilters}
                                size="small"
                                limitTags={2}
                                getOptionLabel={(option) => String(option)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Probe Set Observation"
                                        placeholder=""
                                    />
                                )}
                                onChange={(_, newVal) => setProbeSetObservationFilters(newVal)}
                            />
                        </>
                    )}
                    <Autocomplete
                        multiple
                        options={targets}
                        value={targetFilters}
                        size="small"
                        limitTags={2}
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
                        options={attributes}
                        value={attributeFilters}
                        size="small"
                        limitTags={2}
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
                        options={admTypes}
                        value={admTypeFilters}
                        size="small"
                        limitTags={2}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="ADM Types"
                                placeholder=""
                            />
                        )}
                        onChange={(_, newVal) => setAdmTypeFilters(newVal)}
                    />
                    <Autocomplete
                        multiple
                        options={delGrps}
                        value={delGrpFilters}
                        size="small"
                        limitTags={2}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Delegator_grp"
                                placeholder=""
                            />
                        )}
                        onChange={(_, newVal) => setDelGrpFilters(newVal)}
                    />
                    <Autocomplete
                        multiple
                        options={delMils}
                        value={delMilFilters}
                        size="small"
                        limitTags={2}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Delegator_mil"
                                placeholder=""
                            />
                        )}
                        onChange={(_, newVal) => setDelMilFilters(newVal)}
                    />
                </div>
                <div className='largeInputs'>
                    <Autocomplete
                        multiple
                        options={headers}
                        size="small"
                        limitTags={1}
                        value={columnsToHide}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Hidden Columns"
                                placeholder=""
                            />
                        )}
                        onChange={(_, newVal) => setColumnsToHide(newVal)}
                    />
                    <TextField label="Search PIDs" size="small" value={searchPid} onInput={updatePidSearch}></TextField>
                </div>

            </div>

            <DownloadButtons
                formattedData={refineData(formattedData)}
                filteredData={refineData(filteredData)}
                HEADERS={getFilteredHeaders()}
                fileName={'RQ-134 data'}
                extraAction={openModal}
            />

        </section>
        <div className='resultTableSection'>
            <table className='itm-table'>
                <thead>
                    <tr>
                        {headers.map((val, index) => {
                            return (!columnsToHide.includes(val) && <th key={'header-' + index} className='rq134Header' style={{ zIndex: val === headers.filter((x) => !columnsToHide.includes(x))[0] ? 1 : 0 }}>
                                {val} <button className='hide-header' onClick={() => hideColumn(val)}><VisibilityOffIcon size={'small'} /></button>
                            </th>);
                        })}
                    </tr>
                </thead>
                <tbody>
                    {filteredData.map((dataSet, index) => {
                        return (<tr key={dataSet['Delegator ID'] + '-' + index}>
                            {headers.map((val) => {
                                return (!columnsToHide.includes(val) && <td key={dataSet['Delegator ID'] + '-' + val}>
                                    {typeof dataSet[val] === 'string' ? dataSet[val]?.replaceAll('"', "") : dataSet[val] ?? '-'}
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
                <RQDefinitionTable downloadName={`Definitions_RQ134_eval${evalNum}.xlsx`} xlFile={evalNum === 10 ? septemberDefinitionXLFile : evalNum >= 8 ? ph2DefinitionXLFile : (evalNum === 5 || evalNum === 6) ? ph1DefinitionXLFile : dreDefinitionXLFile} />
            </div>
        </Modal>
    </>);
}