import React from "react";
import '../../SurveyResults/resultsTable.css';
import { useQuery } from 'react-apollo'
import gql from "graphql-tag";
import { RQDefinitionTable } from "../variables/rq-variables";
import CloseIcon from '@material-ui/icons/Close';
import { Autocomplete, Modal, TextField } from "@mui/material";
import calibrationDefinitions from '../variables/Variable Definitions Calibration_Scores.xlsx'
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

const HEADERS_PH1 = ['Delegator_ID', 'ADM Order', 'Datasource', 'Delegator_grp', 'Delegator_mil', 'Delegator_Role', 'Trial_ID', 'Attribute', 'Scenario', 'TA2_Name', 'ADM_Type', 'Target', 'P1E/Population Alignment score (ADM|target)', 'P1E/Population Alignment score (Delegator|target)', 'Server Session ID (Delegator)', 'ADM_Aligned_Status (Baseline/Misaligned/Aligned)', 'ADM Loading', 'Competence Error', 'P1E/Population Alignment score (Delegator|Observed_ADM (target))', 'Truncation Error', 'Trust_Rating', 'Delegation preference (A/B)', 'Delegation preference (A/M)', 'Trustworthy_Rating', 'Agreement_Rating', 'SRAlign_Rating', 'Calibration Alignment Score (Delegator|Observed_ADM (target))'];

export function CalibrationData({ evalNum }) {
    const { loading: loadingParticipantLog, error: errorParticipantLog, data: dataParticipantLog } = useQuery(GET_PARTICIPANT_LOG);
    const { loading: loadingSurveyResults, error: errorSurveyResults, data: dataSurveyResults } = useQuery(GET_SURVEY_RESULTS);
    const { loading: loadingTextResults, error: errorTextResults, data: dataTextResults } = useQuery(GET_TEXT_RESULTS, { fetchPolicy: 'no-cache' });
    const { loading: loadingADMs, error: errorADMs, data: dataADMs } = useQuery(GET_ADM_DATA, {
        variables: { "evalNumber": (evalNum == 6 ? 5 : evalNum) }
    });

    const { loading: loadingComparisonData, error: errorComparisonData, data: comparisonData } = useQuery(GET_COMPARISON_DATA, { fetchPolicy: 'no-cache' });
    const { loading: loadingSim, error: errorSim, data: dataSim } = useQuery(GET_SIM_DATA, { variables: { "evalNumber": evalNum } });
    const { data: janSim } = useQuery(GET_SIM_DATA, { variables: { "evalNumber": 6 } });

    const [formattedData, setFormattedData] = React.useState([]);
    const [showDefinitions, setShowDefinitions] = React.useState(false);
    // all options for filters
    const [ta2s, setTA2s] = React.useState([]);
    const [scenarios, setScenarios] = React.useState([]);
    const [targets, setTargets] = React.useState([]);
    const [attributes, setAttributes] = React.useState([]);
    const [admTypes] = React.useState(['baseline', 'aligned', 'comparison']);
    const [delGrps] = React.useState(['Civilian', 'Military']);
    const [delMils] = React.useState(['yes', 'no']);
    // filter options that have been chosen
    const [ta2Filters, setTA2Filters] = React.useState([]);
    const [scenarioFilters, setScenarioFilters] = React.useState([]);
    const [targetFilters, setTargetFilters] = React.useState([]);
    const [attributeFilters, setAttributeFilters] = React.useState([]);
    const [admTypeFilters, setAdmTypeFilters] = React.useState([]);
    const [delGrpFilters, setDelGrpFilters] = React.useState([]);
    const [delMilFilters, setDelMilFilters] = React.useState([]);
    const [includeJAN, setIncludeJAN] = React.useState(false);
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
        setIncludeJAN(false);
    }, [evalNum]);

    React.useEffect(() => {
        let currentHeaders = evalNum === 5 || evalNum === 6 ? [...HEADERS_PH1] : [];
        if (!(evalNum === 6 || (evalNum === 5 && includeJAN))) {
            currentHeaders = currentHeaders.filter(header => header !== 'Truncation Error');
        }

        setHeaders(currentHeaders);
    }, [evalNum, includeJAN]);

    React.useEffect(() => {
        if (dataSurveyResults?.getAllSurveyResults && dataParticipantLog?.getParticipantLog && dataTextResults?.getAllScenarioResults &&
            dataADMs?.getAllHistoryByEvalNumber && comparisonData?.getHumanToADMComparison && dataSim?.getAllSimAlignmentByEval &&
             janSim?.getAllSimAlignmentByEval) {
            const data = getRQ134Data(evalNum, dataSurveyResults, dataParticipantLog, dataTextResults, dataADMs, comparisonData, dataSim);
            
            if (evalNum === 6) {
                data.allObjs = data.allObjs.map(obj => ({
                    ...obj,
                    Delegator_mil: 'yes'
                }));
            }

            if (includeJAN) {
                const janData = getRQ134Data(6, dataSurveyResults, dataParticipantLog, dataTextResults, dataADMs, comparisonData, janSim);
                janData.allObjs = janData.allObjs.map(obj => ({
                    ...obj,
                    Delegator_mil: 'yes'
                }));
                data.allObjs.push(...janData.allObjs);
                data.allTA2s.push(...janData.allTA2s);
                data.allAttributes.push(...janData.allAttributes);
                data.allScenarios.push(...janData.allScenarios);
                data.allTargets.push(...janData.allTargets);
            }

            // git rid of comparison rows, only VOL
            data.allObjs = data.allObjs.filter(obj => 
                obj['Attribute'] == 'VOL' && 
                obj['ADM_Type'] !== 'comparison'
            );

            const expandedData = expandCalibrationRows(data.allObjs);
            
            expandedData.sort((a, b) => {
                // Compare PID
                if (Number(a['Delegator_ID']) < Number(b['Delegator_ID'])) return -1;
                if (Number(a['Delegator_ID']) > Number(b['Delegator_ID'])) return 1;

                // attribute as second filter
                if (a['Attribute'] < b['Attribute']) return -1;
                if (a['Attribute'] > b['Attribute']) return 1;

                // if PID is equal, compare trial id
                return a.Trial_ID - b.Trial_ID;
            });

            
            const updatedTA2s = Array.from(new Set(expandedData.map(obj => obj['TA2_Name']).filter(Boolean)));
            const updatedAttributes = Array.from(new Set(expandedData.map(obj => obj['Attribute']).filter(Boolean)));
            const updatedScenarios = Array.from(new Set(expandedData.map(obj => obj['Scenario']).filter(Boolean)));
            const updatedTargets = Array.from(new Set(expandedData.map(obj => obj['Target']).filter(Boolean)));

            
            setFormattedData(expandedData);
            setFilteredData(expandedData);
            
            setTA2s(updatedTA2s);
            setAttributes(updatedAttributes);
            setScenarios(updatedScenarios);
            setTargets(updatedTargets);
            
            setTA2Filters([]);
            setScenarioFilters([]);
            setTargetFilters([]);
            setAttributeFilters([]);
            setAdmTypeFilters([]);
            setDelGrpFilters([]);
            setDelMilFilters([]);
            setSearchPid('');
        }
    }, [dataParticipantLog, dataSurveyResults, dataTextResults, dataADMs, comparisonData, evalNum, includeJAN, janSim]);


    const expandCalibrationRows = (objs) => {
        const expandedRows = []
        objs.forEach(obj => {
            if (obj['Calibration Alignment Score (Delegator|Observed_ADM (target))']) {
                try {
                    const calibrationScores = JSON.parse(obj['Calibration Alignment Score (Delegator|Observed_ADM (target))']);

                    // Create a row for each calibration score
                    Object.entries(calibrationScores).forEach(([scoreName, scoreValue]) => {
                        const newRow = { ...obj };
                        newRow['Attribute'] = scoreName;
                        newRow['Calibration Alignment Score (Delegator|Observed_ADM (target))'] = scoreValue;
                        expandedRows.push(newRow);
                    });
                }
                catch (error) {
                    console.log("error parsing scores")
                    expandedRows.push(obj);
                }
            } else {
                console.log("No calibration scores found")
                expandedRows.push(obj)
            }

        })
        return expandedRows;
    }

    const updateJANStatus = (event) => {
        setIncludeJAN(event.target.checked);
    };

    const hideColumn = (val) => {
        setColumnsToHide([...columnsToHide, val]);
    };

    const updatePidSearch = (event) => {
        setSearchPid(event.target.value);
    };

    const clearFilters = () => {
        setTA2Filters([]);
        setScenarioFilters([]);
        setTargetFilters([]);
        setAttributeFilters([]);
        setAdmTypeFilters([]);
        setDelGrpFilters([]);
        setDelMilFilters([]);
        setSearchPid('');
    };

    const refineData = (origData) => {
        // Create a copy of the data
        const updatedData = structuredClone(origData);
        
        // Get the headers that should be displayed
        const visibleHeaders = getFilteredHeaders();
        
        // For each data row, keep only the visible columns
        updatedData.map((x) => {
            // Get all keys in the object
            const allKeys = Object.keys(x);
            
            // For each key, if it's not in visibleHeaders, delete it
            for (const key of allKeys) {
                if (!visibleHeaders.includes(key)) {
                    delete x[key];
                }
            }
            return x;
        });
        
        return updatedData;
    };

    React.useEffect(() => {
        if (formattedData.length > 0) {
            setFilteredData(formattedData.filter((x) =>
                (ta2Filters.length == 0 || ta2Filters.includes(x['TA2_Name'])) &&
                (scenarioFilters.length == 0 || scenarioFilters.includes(x['Scenario'])) &&
                (targetFilters.length == 0 || targetFilters.includes(x['Target'])) &&
                (attributeFilters.length == 0 || attributeFilters.includes(x['Attribute'])) &&
                (admTypeFilters.length == 0 || admTypeFilters.includes(x['ADM_Type'])) &&
                (delGrpFilters.length == 0 || delGrpFilters.includes(x['Delegator_grp'])) &&
                (delMilFilters.length == 0 || delMilFilters.includes(x['Delegator_mil'])) &&
                (searchPid.length == 0 || x['Delegator_ID'].includes(searchPid))
            ));
        }
    }, [formattedData, ta2Filters, scenarioFilters, targetFilters, attributeFilters, admTypeFilters, delGrpFilters, delMilFilters, searchPid]);

    const getFilteredHeaders = () => {
        return headers.filter(x => !columnsToHide.includes(x) && (shouldShowTruncationError || x !== 'Truncation Error'));
    };

    if (loadingParticipantLog || loadingSurveyResults || loadingTextResults || loadingADMs || loadingComparisonData || loadingSim) return <p>Loading...</p>;
    if (errorParticipantLog || errorSurveyResults || errorTextResults || errorADMs || errorComparisonData || errorSim) return <p>Error :</p>;

    return (<>
        <h2 className='rq134-header'>Calibration Scores
            {evalNum == 5 &&
                <div className='stacked-checkboxes'>
                    <FormControlLabel className='floating-toggle' control={<Checkbox value={includeJAN} onChange={updateJANStatus} />} label="Include Jan 2025 Eval Data" />
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
                fileName={'Calibration data'}
                extraAction={openModal}
            />

        </section>
        <div className='resultTableSection'>
            <table className='itm-table'>
                <thead>
                    <tr>
                        {headers.map((val, index) => {
                            return (!columnsToHide.includes(val) && <th key={'header-' + index} className='rq134Header' style={{ zIndex: val == headers.filter((x) => !columnsToHide.includes(x))[0] ? 1 : 0 }}>
                                {val} <button className='hide-header' onClick={() => hideColumn(val)}><VisibilityOffIcon size={'small'} /></button>
                            </th>);
                        })}
                    </tr>
                </thead>
                <tbody>
                    {filteredData.map((dataSet, index) => {
                        return (<tr key={dataSet['Delegator_ID'] + '-' + index}>
                            {headers.map((val) => {
                                return (!columnsToHide.includes(val) && <td key={dataSet['Delegator_ID'] + '-' + val}>
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
                <RQDefinitionTable downloadName={`Definitions_Calibration_Scores_eval${evalNum}.xlsx`} xlFile={calibrationDefinitions} />
            </div>
        </Modal>
    </>);
}