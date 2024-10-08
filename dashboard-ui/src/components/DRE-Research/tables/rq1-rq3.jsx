import React from "react";
import '../../SurveyResults/resultsTable.css';
import { useQuery } from 'react-apollo'
import gql from "graphql-tag";
import { isDefined } from "../../AggregateResults/DataFunctions";
import { RQDefinitionTable } from "../variables/rq-variables";
import CloseIcon from '@material-ui/icons/Close';
import { Autocomplete, Modal, TextField } from "@mui/material";
import definitionXLFile from '../variables/Variable Definitions RQ1_RQ3.xlsx';
import definitionPDFFile from '../variables/Variable Definitions RQ1_RQ3.pdf';
import { admOrderMapping, delEnvMapping } from "../../Survey/survey";
import { exportToExcel, getAlignments } from "../utils";

const RATING_MAP = {
    "Strongly disagree": 1,
    "Disagree": 2,
    "Neither agree nor disagree": 3,
    "Agree": 4,
    "Strongly agree": 5,
    '-': '-'
};


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

const HEADERS = ['ADM Order', 'Delegator_ID', 'Delegator_grp', 'Delegator_mil', 'Delegator_Role', 'TA1_Name', 'Trial_ID', 'Attribute', 'Scenario', 'TA2_Name', 'ADM_Type', 'Target', 'Alignment score (ADM|target)', 'Alignment score (Delegator|target)', 'Server Session ID (Delegator)', 'ADM_Aligned_Status (Baseline/Misaligned/Aligned)', 'ADM Loading', 'Alignment score (Delegator|Observed_ADM (target))', 'Trust_Rating', 'Delegation preference (A/B)', 'Delegation preference (A/M)', 'Trustworthy_Rating', 'Agreement_Rating', 'SRAlign_Rating'];


export function RQ13() {
    const { loading: loadingParticipantLog, error: errorParticipantLog, data: dataParticipantLog } = useQuery(GET_PARTICIPANT_LOG);
    const { loading: loadingSurveyResults, error: errorSurveyResults, data: dataSurveyResults } = useQuery(GET_SURVEY_RESULTS);
    const { loading: loadingTextResults, error: errorTextResults, data: dataTextResults } = useQuery(GET_TEXT_RESULTS, {
        fetchPolicy: 'no-cache'
    });
    const { loading: loadingADMs, error: errorADMs, data: dataADMs } = useQuery(GET_ADM_DATA, {
        variables: { "evalNumber": 4 }
    });
    const { loading: loadingComparisonData, error: errorComparisonData, data: comparisonData } = useQuery(GET_COMPARISON_DATA);

    const [formattedData, setFormattedData] = React.useState([]);
    const [showDefinitions, setShowDefinitions] = React.useState(false);
    // all options for filters
    const [ta1s, setTA1s] = React.useState([]);
    const [ta2s, setTA2s] = React.useState([]);
    const [scenarios, setScenarios] = React.useState([]);
    const [targets, setTargets] = React.useState([]);
    const [attributes, setAttributes] = React.useState([]);
    const [admTypes, setAdmTypes] = React.useState(['baseline', 'aligned', 'comparison']);
    const [delGrps, setDelGrps] = React.useState(['Civilian', 'Military']);
    const [delMils, setDelMils] = React.useState(['yes', 'no']);
    // filter options that have been chosen
    const [ta1Filters, setTA1Filters] = React.useState([]);
    const [ta2Filters, setTA2Filters] = React.useState([]);
    const [scenarioFilters, setScenarioFilters] = React.useState([]);
    const [targetFilters, setTargetFilters] = React.useState([]);
    const [attributeFilters, setAttributeFilters] = React.useState([]);
    const [admTypeFilters, setAdmTypeFilters] = React.useState([]);
    const [delGrpFilters, setDelGrpFilters] = React.useState([]);
    const [delMilFilters, setDelMilFilters] = React.useState([]);
    // data with filters applied
    const [filteredData, setFilteredData] = React.useState([]);


    const openModal = () => {
        setShowDefinitions(true);
    }

    const closeModal = () => {
        setShowDefinitions(false);
    }

    React.useEffect(() => {
        if (dataSurveyResults?.getAllSurveyResults && dataParticipantLog?.getParticipantLog && dataTextResults?.getAllScenarioResults && dataADMs?.getAllHistoryByEvalNumber && comparisonData?.getHumanToADMComparison) {
            const surveyResults = dataSurveyResults.getAllSurveyResults;
            const participantLog = dataParticipantLog.getParticipantLog;
            const textResults = dataTextResults.getAllScenarioResults;
            const admData = dataADMs.getAllHistoryByEvalNumber;
            const comparisons = comparisonData.getHumanToADMComparison;
            const allObjs = [];
            const allTA1s = [];
            const allTA2s = [];
            const allScenarios = [];
            const allTargets = [];
            const allAttributes = [];

            // find participants that have completed the delegation survey
            const completed_surveys = surveyResults.filter((res) => res.results?.surveyVersion == 4 && isDefined(res.results['Post-Scenario Measures']));
            for (const res of completed_surveys) {
                const pid = res.results['Participant ID Page']?.questions['Participant ID']?.response;
                // see if participant is in the participantLog
                const logData = participantLog.find(
                    log => log['ParticipantID'] == pid
                );
                if (!logData) {
                    continue;
                }
                const {textResultsForPID, alignments} = getAlignments(textResults, pid);
                // set up object to store participant data
                const admOrder = admOrderMapping[logData['ADMOrder']];
                let trial_num = 1;
                const st_scenario = logData['Del-1'].includes('ST') ? logData['Del-1'] : logData['Del-2'];
                const ad_scenario = logData['Del-1'].includes('AD') ? logData['Del-1'] : logData['Del-2'];

                for (const entry of admOrder) {
                    const types = ['baseline', 'aligned', 'misaligned', 'comparison'];
                    for (const t of types) {

                        let page = Object.keys(res.results).find((k) => {
                            const obj = res.results[k];
                            const alignMatches = obj['admAlignment'] == t || obj['pageType'] == 'comparison' && t == 'comparison';
                            const ta2Matches = obj['admAuthor'] == (entry['TA2'] == 'Kitware' ? 'kitware' : 'TAD');
                            let scenario = false;
                            if (entry['TA1'] == 'Adept') {
                                scenario = entry['Attribute'] == 'MJ' ? delEnvMapping[ad_scenario][0] : delEnvMapping[ad_scenario][1];
                            }
                            else {
                                scenario = entry['Attribute'] == 'QOL' ? delEnvMapping[st_scenario][0] : delEnvMapping[st_scenario][1];
                            }

                            const scenarioMatches = obj['scenarioIndex'] == scenario;

                            return alignMatches && ta2Matches && scenarioMatches;
                        });
                        if (!page) {
                            // likely from missing misaligned/aligned for those few parallax adms
                            continue;
                        }
                        page = res.results[page];
                        const entryObj = {};
                        entryObj['ADM Order'] = logData['ADMOrder'];
                        entryObj['Delegator_ID'] = pid;
                        entryObj['Delegator_grp'] = logData['Type'] == 'Civ' ? 'Civilian' : 'Military';
                        const roles = res.results?.['Post-Scenario Measures']?.questions?.['What is your current role (choose all that apply):']?.['response'];
                        // override 102, who is military
                        entryObj['Delegator_mil'] = roles?.includes('Military Background') || pid == '202409102' ? 'yes' : 'no';
                        entryObj['Delegator_Role'] = roles ?? '-'
                        if (Array.isArray(entryObj['Delegator_Role'])) {
                            entryObj['Delegator_Role'] = entryObj['Delegator_Role'].join('; ');
                        }
                        entryObj['TA1_Name'] = entry['TA1'];
                        allTA1s.push(entry['TA1']);
                        entryObj['Trial_ID'] = trial_num;
                        trial_num += 1;
                        entryObj['Attribute'] = entry['Attribute'];
                        allAttributes.push(entryObj['Attribute']);
                        entryObj['Scenario'] = entry['TA1'] == 'Adept' ? ad_scenario : st_scenario;
                        allScenarios.push(entryObj['Scenario']);
                        entryObj['TA2_Name'] = entry['TA2'];
                        allTA2s.push(entry['TA2']);
                        entryObj['ADM_Type'] = t == 'comparison' ? 'comparison' : ['misaligned', 'aligned'].includes(t) ? 'aligned' : 'baseline';
                        entryObj['Target'] = page['admTarget'] ?? '-';
                        if (entryObj['Target'] != '-') {
                            allTargets.push(entryObj['Target']);
                        }
                        const foundADM = admData.find((adm) => adm.history[0].parameters.adm_name == page['admName'] && (adm.history[0].response?.id ?? adm.history[1].response?.id) == page['scenarioIndex'].replace('IO', 'MJ') &&
                            adm.history[adm.history.length - 1].parameters.target_id == page['admTarget']);
                        const alignment = foundADM?.history[foundADM.history.length - 1]?.response?.score ?? '-';
                        entryObj['Alignment score (ADM|target)'] = alignment;
                        entryObj['Alignment score (Delegator|target)'] = alignments.find((a) => a.target == page['admTarget'])?.score ?? '-';
                        entryObj['Server Session ID (Delegator)'] = t == 'comparison' ? '-' : textResultsForPID.find((r) => r.scenario_id.includes(entryObj['TA1_Name'] == 'Adept' ? 'MJ' : (entryObj['Target'].includes('qol') ? 'qol' : 'vol')))?.[entryObj['TA1_Name'] == 'Adept' ? 'combinedSessionId' : 'serverSessionId'] ?? '-';
                        entryObj['ADM_Aligned_Status (Baseline/Misaligned/Aligned)'] = t == 'comparison' ? '-' : t;
                        entryObj['ADM Loading'] = t == 'comparison' ? '-' : t == 'baseline' ? 'normal' : ['least aligned', 'most aligned'].includes(page['admChoiceProcess']) ? 'normal' : 'exemption';

                        const comparison_entry = comparisons?.find((x) => x['adm_type'] == t && x['pid'] == pid && delEnvMapping[entryObj['Scenario']].includes(x['adm_scenario']) && ((entry['TA2'] == 'Parallax' && x['adm_author'] == 'TAD') || (entry['TA2'] == 'Kitware' && x['adm_author'] == 'kitware')) && x['adm_scenario']?.toLowerCase().includes(entryObj['Attribute']?.toLowerCase()));
                        entryObj['Alignment score (Delegator|Observed_ADM (target))'] = comparison_entry?.score ?? '-';

                        entryObj['Trust_Rating'] = RATING_MAP[page['pageType'] == 'singleMedic' ? page['questions']?.[page['pageName'] + ': I would be comfortable allowing this medic to execute medical triage, even if I could not monitor it']?.['response'] ?? '-' : '-'];
                        if (t == 'comparison') {
                            const adms = page['pageName'].split(' vs ');
                            const alignedAdm = adms[1];
                            const baselineAdm = adms[0];
                            const misalignedAdm = adms[2];
                            const qAB = page.questions[alignedAdm + ' vs ' + baselineAdm + ': Forced Choice']?.response ?? '-';
                            const qAM = page.questions[alignedAdm + ' vs ' + misalignedAdm + ': Forced Choice']?.response ?? '-';

                            entryObj['Delegation preference (A/B)'] = qAB == '-' ? '-' : (qAB == alignedAdm ? 'A' : 'B');
                            entryObj['Delegation preference (A/M)'] = qAM == '-' ? '-' : (qAM == alignedAdm ? 'A' : 'M');
                            // need to back-populate previous rows with which was chosen
                            for (let i = 0; i < 3; i++) {
                                switch (allObjs[allObjs.length - 1 - i]['ADM_Aligned_Status (Baseline/Misaligned/Aligned)']) {
                                    case 'aligned':
                                        allObjs[allObjs.length - 1 - i]['Delegation preference (A/B)'] = entryObj['Delegation preference (A/B)'] == 'A' ? 'y' : 'n';
                                        allObjs[allObjs.length - 1 - i]['Delegation preference (A/M)'] = entryObj['Delegation preference (A/M)'] == 'A' ? 'y' : 'n';
                                        break
                                    case 'baseline':
                                        allObjs[allObjs.length - 1 - i]['Delegation preference (A/B)'] = entryObj['Delegation preference (A/B)'] == 'B' ? 'y' : 'n';
                                        break
                                    case 'misaligned':
                                        allObjs[allObjs.length - 1 - i]['Delegation preference (A/M)'] = entryObj['Delegation preference (A/M)'] == 'M' ? 'y' : 'n';
                                        break
                                    default:
                                        break
                                }
                            }
                        }
                        else {
                            entryObj['Delegation preference (A/B)'] = '-';
                            entryObj['Delegation preference (A/M)'] = '-';
                        }
                        entryObj['Trustworthy_Rating'] = RATING_MAP[page['pageType'] == 'singleMedic' ? page['questions']?.[page['pageName'] + ': This medic is trustworthy']?.['response'] ?? '-' : '-'];
                        entryObj['Agreement_Rating'] = RATING_MAP[page['pageType'] == 'singleMedic' ? page['questions']?.[page['pageName'] + ': Do you agree with the decisions that this medic made?']?.['response'] ?? '-' : '-'];
                        entryObj['SRAlign_Rating'] = RATING_MAP[page['pageType'] == 'singleMedic' ? page['questions']?.[page['pageName'] + ': The way this medic makes medical decisions is how I make decisions']?.['response'] ?? '-' : '-'];
                        allObjs.push(entryObj);
                    }
                }
            }
            setFormattedData(allObjs);
            setFilteredData(allObjs);
            setTA1s(Array.from(new Set(allTA1s)));
            setTA2s(Array.from(new Set(allTA2s)));
            setAttributes(Array.from(new Set(allAttributes)));
            setScenarios(Array.from(new Set(allScenarios)));
            setTargets(Array.from(new Set(allTargets)));
        }
    }, [dataParticipantLog, dataSurveyResults, dataTextResults, dataADMs, comparisonData]);


    React.useEffect(() => {
        if (formattedData.length > 0) {
            setFilteredData(formattedData.filter((x) =>
                (ta1Filters.length == 0 || ta1Filters.includes(x['TA1_Name'])) &&
                (ta2Filters.length == 0 || ta2Filters.includes(x['TA2_Name'])) &&
                (scenarioFilters.length == 0 || scenarioFilters.includes(x['Scenario'])) &&
                (targetFilters.length == 0 || targetFilters.includes(x['Target'])) &&
                (attributeFilters.length == 0 || attributeFilters.includes(x['Attribute'])) &&
                (admTypeFilters.length == 0 || admTypeFilters.includes(x['ADM_Type'])) &&
                (delGrpFilters.length == 0 || delGrpFilters.includes(x['Delegator_grp'])) &&
                (delMilFilters.length == 0 || delMilFilters.includes(x['Delegator_mil']))
            ));
        }
    }, [formattedData, ta1Filters, ta2Filters, scenarioFilters, targetFilters, attributeFilters, admTypeFilters, delGrpFilters, delMilFilters]);

    if (loadingParticipantLog || loadingSurveyResults || loadingTextResults || loadingADMs || loadingComparisonData) return <p>Loading...</p>;
    if (errorParticipantLog || errorSurveyResults || errorTextResults || errorADMs || errorComparisonData) return <p>Error :</p>;

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
                    options={admTypes}
                    filterSelectedOptions
                    size="small"
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
                    filterSelectedOptions
                    size="small"
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
                    filterSelectedOptions
                    size="small"
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
            <div className="option-section">
                <button className='downloadBtn' onClick={() => exportToExcel('RQ-1_and_RQ-3 data', formattedData, HEADERS)}>Download All Data</button>
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
                                    {typeof dataSet[val] === 'string' ? dataSet[val]?.replaceAll('"', "") : dataSet[val]}
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
                <RQDefinitionTable downloadName={'Definitions_RQ1_RQ3.pdf'} xlFile={definitionXLFile} pdfFile={definitionPDFFile} />
            </div>
        </Modal>
    </>);
}


