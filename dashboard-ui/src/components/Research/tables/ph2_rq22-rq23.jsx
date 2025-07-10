import React from "react";
import '../../SurveyResults/resultsTable.css';
import { useQuery } from 'react-apollo'
import gql from "graphql-tag";
import { RQDefinitionTable } from "../variables/rq-variables";
import CloseIcon from '@material-ui/icons/Close';
import { Autocomplete, TextField, Modal } from "@mui/material";
import ph2DefinitionXLFile from '../variables/Variable Definitions RQ2.2_2.3_PH2.xlsx';
import { isDefined } from "../../AggregateResults/DataFunctions";
import { DownloadButtons } from "./download-buttons";

const getAdmData = gql`
    query getAllHistoryByEvalNumber($evalNumber: Float!){
        getAllHistoryByEvalNumber(evalNumber: $evalNumber)
    }`;

const PH2_HEADERS = [
    'Trial_ID',
    'Attribute',
    'Target',
    'Set',
    'Target_Type (Group/Individual)',
    'Aligned Server Session ID',
    'Aligned ADM Alignment score (ADM|target)',
    'Baseline ADM Alignment score (ADM|target)',
    'Baseline Server Session ID'
];

export function PH2RQ2223({ evalNum }) {
    const { loading, error, data } = useQuery(getAdmData, {
        variables: { "evalNumber": evalNum }
    });

    const [formattedData, setFormattedData] = React.useState([]);
    const [showDefinitions, setShowDefinitions] = React.useState(false);

    const [attributes, setAttributes] = React.useState([]);
    const [targets, setTargets] = React.useState([]);
    const [sets, setSets] = React.useState([]);
    const [targetType, ] = React.useState(['Group', 'Individual']);

    const [attributeFilters, setAttributeFilters] = React.useState([]);
    const [targetFilters, setTargetFilters] = React.useState([]);
    const [setFilters, setSetFilters] = React.useState([]);
    const [targetTypeFilters, setTargetTypeFilters] = React.useState([]);

    const [filteredData, setFilteredData] = React.useState([]);

    const openModal = () => setShowDefinitions(true);
    const closeModal = () => setShowDefinitions(false);

    React.useEffect(() => {
        if (data?.getAllHistoryByEvalNumber) {
            const admData = data.getAllHistoryByEvalNumber;
            const organized_adms = {};
            const allObjs = [];
            const allAttributes = [];
            const allTargets = [];
            const allSets = [];

            for (const adm of admData) {
                const admName = adm.evaluation.adm_name;
                const scenario = adm.evaluation.scenario_id;
                const scenarioName = adm.evaluation.scenario_name;
                const target = adm.evaluation.alignment_target_id;
                const alignment = adm.results.alignment_score;

                if (!scenarioName.includes('Random')) continue;

                if (!isDefined(alignment)) continue;

                if (!organized_adms[scenario]) {
                    organized_adms[scenario] = {
                        scenarioName,
                        targets: {}
                    };
                }

                if (!organized_adms[scenario].targets[target]) {
                    organized_adms[scenario].targets[target] = {};
                }

                organized_adms[scenario].targets[target][admName] = {
                    alignment,
                    adm
                };
            }

            const trialCounterPerSet = {};
            for (const scenario of Object.keys(organized_adms)) {
                const scenarioName = organized_adms[scenario].scenarioName;
                const targets = organized_adms[scenario].targets;

                const setMatch = scenarioName.match(/(\d{1,3})\D*$/);
                const scenarioSet = setMatch ? `Set ${setMatch[1]}` : 'Full';

                for (const target of Object.keys(targets)) {
                    const entryObj = {};

                    const attribute = scenario.includes('MF') && scenario.includes('AF') ? 'AF-MF' :
                        scenario.includes('MF') ? 'MF' :
                            scenario.includes('AF') ? 'AF' :
                                scenario.includes('SS') ? 'SS' : 'PS';

                    const trialKey = `${attribute}_${scenarioSet}`;
                    if (!trialCounterPerSet[trialKey]) {
                        trialCounterPerSet[trialKey] = 1;
                    }
                    entryObj['Trial_ID'] = trialCounterPerSet[trialKey]++;

                    entryObj['Attribute'] = attribute;
                    allAttributes.push(attribute);

                    const sliceNum = attribute === 'AF-MF' ? -7 : -3;

                    entryObj['Target'] = target.slice(sliceNum);
                    allTargets.push(target.slice(sliceNum));

                    entryObj['Set'] = scenarioSet;
                    allSets.push(scenarioSet);

                    entryObj['Target_Type (Group/Individual)'] =
                        target.toLowerCase().includes('-group') ? 'Group' : 'Individual';

                    let aligned = null;
                    for (const admName of Object.keys(targets[target])) {
                        if (admName.includes('aligned') || admName.includes('ComparativeRegression')) {
                            aligned = targets[target][admName];
                            break;
                        }
                    }

                    if (aligned) {
                        entryObj['Aligned ADM Alignment score (ADM|target)'] = aligned.alignment;
                        entryObj['Aligned Server Session ID'] = aligned.adm?.results?.ta1_session_id ?? '-'
                    } else {
                        entryObj['Aligned ADM Alignment score (ADM|target)'] = '-';
                        entryObj['Aligned Server Session ID'] = '-';
                    }

                    let baseline = null;
                    for (const admName of Object.keys(targets[target])) {
                        if (admName.includes('OutlinesBaseline')) {
                            baseline = targets[target][admName];
                            break;
                        }
                    }

                    if (baseline) {
                        entryObj['Baseline ADM Alignment score (ADM|target)'] = baseline.alignment;
                        entryObj['Baseline Server Session ID'] = baseline.adm?.results?.ta1_session_id ?? '-';

                    } else {
                        entryObj['Baseline ADM Alignment score (ADM|target)'] = '-';
                        entryObj['Baseline Server Session ID'] = '-';
                    }

                    allObjs.push(entryObj);
                }
            }

            allObjs.sort((a, b) => {
                if (a.Attribute < b.Attribute) return -1;
                if (a.Attribute > b.Attribute) return 1;

                if (a.Set < b.Set) return -1;
                if (a.Set > b.Set) return 1;

                return a.Trial_ID - b.Trial_ID;
            });


            if (allObjs.length > 0) {
                setFormattedData(allObjs);
                setFilteredData(allObjs);
            } else {
                setFormattedData([{ 'Trial_ID': '-' }]);
                setFilteredData([{ 'Trial_ID': '-' }]);
            }

            setAttributes(Array.from(new Set(allAttributes)));
            setTargets(Array.from(new Set(allTargets)));
            setSets(Array.from(new Set(allSets)));
        }
    }, [data, evalNum]);

    React.useEffect(() => {
        if (formattedData.length > 0) {
            setFilteredData(formattedData.filter(x =>
                (attributeFilters.length === 0 || attributeFilters.includes(x['Attribute'])) &&
                (targetFilters.length === 0 || targetFilters.includes(x['Target'])) &&
                (setFilters.length === 0 || setFilters.includes(x['Set'])) &&
                (targetTypeFilters.length === 0 || targetTypeFilters.includes(x['Target_Type (Group/Individual)']))
            ));
        }
    }, [formattedData, attributeFilters, targetFilters, setFilters, targetTypeFilters]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error.message}</p>;

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
                        options={attributes}
                        filterSelectedOptions
                        size="small"
                        renderInput={(params) => (
                            <TextField {...params} label="Attributes" />
                        )}
                        onChange={(_, newVal) => setAttributeFilters(newVal)}
                    />

                    <Autocomplete
                        multiple
                        options={targets}
                        filterSelectedOptions
                        size="small"
                        renderInput={(params) => (
                            <TextField {...params} label="Targets" />
                        )}
                        onChange={(_, newVal) => setTargetFilters(newVal)}
                    />

                    <Autocomplete
                        multiple
                        options={sets}
                        filterSelectedOptions
                        size="small"
                        renderInput={(params) => (
                            <TextField {...params} label="Set" />
                        )}
                        onChange={(_, newVal) => setSetFilters(newVal)}
                    />

                    <Autocomplete
                        multiple
                        options={targetType}
                        filterSelectedOptions
                        size="small"
                        renderInput={(params) => (
                            <TextField {...params} label="Target Type" />
                        )}
                        onChange={(_, newVal) => setTargetTypeFilters(newVal)}
                    />
                </div>

                <DownloadButtons
                    formattedData={formattedData}
                    filteredData={filteredData}
                    HEADERS={PH2_HEADERS}
                    fileName={'RQ-22_and_RQ-23_PH2_data'}
                    extraAction={openModal}
                />
            </section>

            <div className='resultTableSection'>
                <table className='itm-table'>
                    <thead>
                        <tr>
                            {PH2_HEADERS.map((val, index) => (
                                <th key={'header-' + index}>{val}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((dataSet, index) => (
                            <tr key={`row-${index}`}>
                                {PH2_HEADERS.map((val) => (
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
                        downloadName={`Definitions_RQ22_23_PH2.xlsx`}
                        xlFile={ph2DefinitionXLFile}
                    />
                </div>
            </Modal>
        </>
    );
}
