import React from "react";
import '../../../css/resultsTable.css';
import { useQuery } from 'react-apollo'
import gql from "graphql-tag";
import { RQDefinitionTable } from "../variables/rq-variables";
import CloseIcon from '@material-ui/icons/Close';
import { Autocomplete, TextField, Modal } from "@mui/material";
import ph2DefinitionXLFile from '../variables/Variable Definitions RQ2.2_2.3_PH2.xlsx';
import eval14Defs from '../variables/Variable Definitions RQ2.2_2.3_PH2_eval14.xlsx';
import eval15Defs from '../variables/Variable Definitions RQ2.2_2.3_PH2_eval15.xlsx';
import { isDefined } from "../../AggregateResults/DataFunctions";
import { DownloadButtons } from "./download-buttons";

const getAdmData = gql`
    query getAllHistoryByEvalNumber($evalNumber: Float!){
        getAllHistoryByEvalNumber(evalNumber: $evalNumber)
    }`;


const evalToName = {
    8: 'June',
    9: 'July'
}

export function PH2RQ2223({ evalNum }) {
    const { loading, error, data } = useQuery(getAdmData, {
        variables: { "evalNumber": evalNum }
    });

    const [formattedData, setFormattedData] = React.useState([]);
    const [showDefinitions, setShowDefinitions] = React.useState(false);

    const [attributes, setAttributes] = React.useState([]);
    const [admNames, setAdmNames] = React.useState([]);
    const [targets, setTargets] = React.useState([]);
    const [sets, setSets] = React.useState([]);
    const [setConstructions, setSetConstructions] = React.useState([]);

    const [attributeFilters, setAttributeFilters] = React.useState([]);
    const [admNamesFilters, setAdmNamesFilters] = React.useState([]);
    const [targetFilters, setTargetFilters] = React.useState([]);
    const [setFilters, setSetFilters] = React.useState([]);
    const [setConstructionFilters, setSetConstructionFilters] = React.useState([]);
    const [targetTypeFilters, setTargetTypeFilters] = React.useState([]);

    const [filteredData, setFilteredData] = React.useState([]);

    const openModal = () => setShowDefinitions(true);
    const closeModal = () => setShowDefinitions(false);

    // only eval 14 needs the set construction header
    const PH2_HEADERS = React.useMemo(() => {
        const baseHeaders = [
            'Trial_ID',
            'Attribute',
            'Target',
        ];

        if (evalNum === 15) {
            baseHeaders.push('ADM Name')
            baseHeaders.push('AF Target')
            baseHeaders.push('MF Target')
            baseHeaders.push('PS Target')
            baseHeaders.push('SS Target')
            baseHeaders.push('Oracle Alignment')
        }

        if (evalNum === 14 || evalNum === 15) {
            baseHeaders.push('Set Construction');
        }

        baseHeaders.push(
            'Set',
            'Probe IDs',
            'Aligned Server Session ID',
            'Aligned ADM Alignment score (ADM|target)',
            'Baseline ADM Alignment score (ADM|target)',
            'Baseline Server Session ID'
        );

        return baseHeaders;
    }, [evalNum]);

    const parseEval15Target = (target) => {
        const targets = {'AF': '', 'MF': '', 'PS': '', 'SS': ''}
        const regexp = /([A-Z]+)-?(\d+)/g

        const matchedTargets = [...target.matchAll(regexp)]

        matchedTargets.forEach(match => {
            targets[match[1]] = match[2]
        })

        return targets
    }

    const ALIGNED_PREFIXES = ['ALIGN', 'ADM', 'Ph2', 'BertRelevance', 'DirectRegression', 'ComparativeRegression'];

    const getModelSuffix = (admName) => {
        const parts = admName.split('-');
        let i = 0;
        while (i < parts.length && ALIGNED_PREFIXES.includes(parts[i])) i++;
        const raw = parts.slice(i).join('-');
        if (raw.includes('__')) return raw.split('__')[0];
            return raw.replace(/_\d+(_\d+)*$/, '');


    };


    // reset all filters when eval num changes
    React.useEffect(() => {
        setSetConstructionFilters([])
        setAttributeFilters([])
        setTargetFilters([])
        setSetFilters([])
        setTargetTypeFilters([])
        setAdmNamesFilters([])
    }, [evalNum])

    React.useEffect(() => {
        if (data?.getAllHistoryByEvalNumber) {
            const admData = data.getAllHistoryByEvalNumber;
            const organized_adms = {};
            const allObjs = [];
            const allAttributes = [];
            const allTargets = [];
            const allSets = [];
            const allAdmNames = [];
            const allSetConstructions = []
            const probeMap = {};

            for (const adm of admData) {
                const admName = adm.evaluation.adm_name;
                const scenario = adm.evaluation.scenario_id;
                const scenarioName = adm.evaluation.scenario_name;
                const target = adm.evaluation.alignment_target_id;
                const alignment = adm.results.alignment_score;
                const setConstruction = adm.evaluation.set_construction || '';

                /*
                Eval 14 has multiple aligned ADMs for scenario_target combos because of the different 
                set constructions. So I needed to conditionally add more to the key for this eval
                */
                const scenarioKey = evalNum === 14 ? `${scenario}_${setConstruction}` : scenario;
                const mapKey = evalNum === 14 
                    ? `${scenario}_${setConstruction}_${target}_${alignment}`
                    : `${scenario}_${target}_${alignment}`;

                probeMap[mapKey] = adm.probe_ids || [];

                if (!isDefined(alignment)) continue;

                if (!organized_adms[scenarioKey]) {
                    organized_adms[scenarioKey] = {
                        admName,
                        scenarioName,
                        setConstruction,
                        targets: {}
                    };
                }

                if (!organized_adms[scenarioKey].targets[target]) {
                    organized_adms[scenarioKey].targets[target] = {};
                }

                organized_adms[scenarioKey].targets[target][admName] = {
                    alignment,
                    adm
                };
            }

            // First, collect all entries grouped by attribute and set
            const groupedEntries = {};

            for (const scenarioKey of Object.keys(organized_adms)) {
                const setAdmName = organized_adms[scenarioKey].admName
                const scenarioName = organized_adms[scenarioKey].scenarioName;
                const setConstruction = organized_adms[scenarioKey].setConstruction;
                const targets = organized_adms[scenarioKey].targets;

                const isRandom = scenarioName.includes('Random');
                const setMatch = scenarioName.match(/(\d{1,3})\D*$/);

                // exclude full runs (not sets)
                if (!setMatch) { continue; }
                if (evalNum === 14 && !isRandom) { continue; }
                const scenarioSet = evalNum === 14 || evalNum === 15
                    ? scenarioName
                    : isRandom
                        ? `P2${evalToName[evalNum]} Dynamic Set ${setMatch[1]}`
                        : `P2${evalToName[evalNum]} Observation Set ${setMatch[1]}`;

                const actualScenario = evalNum === 14 && scenarioKey.includes('_') 
                    ? scenarioKey.substring(0, scenarioKey.lastIndexOf('_'))
                    : scenarioKey;


                for (const target of Object.keys(targets)) {
                    const alignedAdms = Object.keys(targets[target])
                        .filter(name => evalNum === 15
                        ? !name.includes('OutlinesBaseline')
                        : name.includes('aligned') || name.includes('ComparativeRegression') || name.includes('DirectRegression')
                        )
                        .map(name => ({ name, ...targets[target][name] }));
                    
                    if (alignedAdms.length === 0) continue;

                    const parsed = evalNum === 15 ? parseEval15Target(target) : null;


                    const attribute = evalNum === 15
                        ? ['AF', 'MF', 'PS', 'SS'].filter(a => parsed[a] !== '').join('-')
                        : actualScenario.includes('MF') && actualScenario.includes('AF') ? 'AF-MF' :
                        actualScenario.includes('MF') ? 'MF' :
                        actualScenario.includes('AF') ? 'AF' :
                        actualScenario.includes('SS') ? 'SS' : 'PS';

                    const derivedSetConstruction = (evalNum === 15 && !setConstruction)
                        ? (attribute.includes('-') ? '2D' : '1D')
                        : setConstruction;

                    
                    let baselineMap = {};
                    if (evalNum === 15) {
                        for (const admName of Object.keys(targets[target])) {
                            if (admName.includes('OutlinesBaseline')) {
                                const idx = admName.indexOf('OutlinesBaseline-');
                                const rawSuffix = admName.slice(idx + 'OutlinesBaseline-'.length);
                                const suffix = rawSuffix.includes('__') 
                                    ? rawSuffix.split('__')[0] 
                                    : rawSuffix.replace(/_\d+(_\d+)*$/, '');

                                baselineMap[suffix] = targets[target][admName];
                            }
                        }
                    }

                    for (const aligned of alignedAdms) {
                         const entryObj = {};
                         entryObj['Attribute'] = attribute;
                        allAttributes.push(attribute);

                    entryObj['Set'] = scenarioSet;
                    allSets.push(scenarioSet);

                    if (evalNum === 15) {
                        entryObj['Target'] = target.replace('Feb2026-', '')
                        allTargets.push(target.replace('Feb2026-', ''))
                        entryObj['ADM Name'] = aligned.name
                        allAdmNames.push(aligned.name)
                        entryObj['Set Construction'] = derivedSetConstruction || '-';
                        allSetConstructions.push(derivedSetConstruction)

                        entryObj['AF Target'] = parsed.AF
                        entryObj['MF Target'] = parsed.MF
                        entryObj['PS Target'] = parsed.PS
                        entryObj['SS Target'] = parsed.SS
                        entryObj['Oracle Alignment'] = aligned.adm.oracle_alignment
                    }

                    else {
                        const sliceNum = attribute === 'AF-MF' ? -7 : -3;
                        entryObj['Target'] = target.slice(sliceNum);
                        allTargets.push(target.slice(sliceNum));
                    }

                    // only applicable for eval 14
                    if (evalNum === 14) {
                        entryObj['Set Construction'] = setConstruction || '-';
                        allSetConstructions.push(setConstruction)
                    }

                    if (aligned) {
                        entryObj['Aligned ADM Alignment score (ADM|target)'] = aligned.alignment;
                        entryObj['Aligned Server Session ID'] = aligned.adm?.results?.ta1_session_id ?? '-'
                    } 

                    const mapKey = evalNum === 14 
                        ? `${actualScenario}_${setConstruction}_${target}_${aligned?.alignment}`
                        : `${actualScenario}_${target}_${aligned?.alignment}`;
                    const rawProbes = probeMap[mapKey] || [];
                    

                    const formatted = rawProbes.map(raw => {
                        let attr = entryObj['Attribute'];
                        let number;

                        if (raw.includes('.Probe')) {
                            const [prefix, probePart] = raw.split('.Probe');
                            number = parseInt(probePart.trim());

                            const parts = prefix.split('-');
                            if (parts.length >= 2) attr = parts[1];
                        }
                        else {
                            const m = raw.match(/Probe\s*(\d+)/);
                            number = m ? parseInt(m[1]) : NaN;
                        }

                        return { attr, number };
                    })
                        .filter(x => !isNaN(x.number))
                        .sort((a, b) => {
                            const cmp = a.attr.localeCompare(b.attr);
                            if (cmp !== 0) return cmp;
                            return a.number - b.number;
                        })
                        .map(x => `Probe-${x.attr}-${x.number}`)
                        .join(', ');

                    entryObj['Probe IDs'] = formatted;

                    let baseline = null;
                    if (evalNum === 15) {
                        baseline = baselineMap[getModelSuffix(aligned.name)] || null;
                    } else {
                        for (const admName of Object.keys(targets[target])) {
                            if (admName.includes('OutlinesBaseline')) {
                                baseline = targets[target][admName];
                                break;
                            }
                        }
                    }


                    if (baseline) {
                        entryObj['Baseline ADM Alignment score (ADM|target)'] = baseline.alignment;
                        entryObj['Baseline Server Session ID'] = baseline.adm?.results?.ta1_session_id ?? '-';

                    } else {
                        entryObj['Baseline ADM Alignment score (ADM|target)'] = '-';
                        entryObj['Baseline Server Session ID'] = '-';
                    }

                    const groupKey = evalNum === 14 || evalNum === 15
                        ? `${attribute}_${derivedSetConstruction}_${scenarioSet}`
                        : `${attribute}_${scenarioSet}`;
                    if (!groupedEntries[groupKey]) {
                        groupedEntries[groupKey] = [];
                    }
                    groupedEntries[groupKey].push(entryObj);
                    if (evalNum === 15 && attribute.includes('-') && aligned.adm?.results?.attribute_data?.length > 0) {
                        for (const attrEntry of aligned.adm.results.attribute_data) {
                            const attrKey = Object.keys(attrEntry)[0];
                            const attrData = attrEntry[attrKey];

                            const attr1DObj = { ...entryObj };
                            attr1DObj['Attribute'] = attrKey;
                            attr1DObj['Aligned ADM Alignment score (ADM|target)'] = attrData.alignment_score;
                            attr1DObj['Aligned Server Session ID'] = attrData.ta1_session_id ?? '-';
                            attr1DObj['Probe IDs'] = (attrData.probes ?? []).map(p => p.probe_id).join(', ');

                            allAttributes.push(attrKey);

                            const attrGroupKey = `${attrKey}_${derivedSetConstruction}_${scenarioSet}`
                            if (!groupedEntries[attrGroupKey]) groupedEntries[attrGroupKey] = [];
                            groupedEntries[attrGroupKey].push(attr1DObj);
                        }
                    }

                }
            }
        }
            for (const groupKey of Object.keys(groupedEntries)) {
                const entries = groupedEntries[groupKey];

                entries.sort((a, b) => {
                    const getNumericTarget = (target) => {
                        const match = target.match(/(\d+)/);
                        return match ? parseInt(match[1]) : 0;
                    };

                    const aNum = getNumericTarget(a.Target);
                    const bNum = getNumericTarget(b.Target);

                    if (aNum !== bNum) {
                        return aNum - bNum;
                    }

                    return a.Target.localeCompare(b.Target);
                });

                entries.forEach((entry, index) => {
                    entry['Trial_ID'] = index + 1;
                    allObjs.push(entry);
                });
            }

            const extractSetNum = s => {
                const m = /Set\s+(\d+)$/.exec(s);
                return m ? parseInt(m[1]) : Number.POSITIVE_INFINITY;
            };

            allObjs.sort((a, b) => {
                if (a.Attribute < b.Attribute) return -1;
                if (a.Attribute > b.Attribute) return 1;
                if (evalNum === 14 || evalNum === 15) {
                    const aSetConst = a['Set Construction'] || '';
                    const bSetConst = b['Set Construction'] || '';
                    if (aSetConst < bSetConst) return -1;
                    if (aSetConst > bSetConst) return 1;
                }

                const aNum = extractSetNum(a.Set);
                const bNum = extractSetNum(b.Set);
                if (aNum !== bNum) return aNum - bNum;
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

            setAdmNames(Array.from(new Set(allAdmNames)));
            setAttributes(Array.from(new Set(allAttributes)));
            setTargets(Array.from(new Set(allTargets)));
            setSets(Array.from(new Set(allSets)));
            setSetConstructions(Array.from(new Set(allSetConstructions)))
        }
    }, [data, evalNum]);

    React.useEffect(() => {
        if (formattedData.length > 0) {
            setFilteredData(formattedData.filter(x =>
                (attributeFilters.length === 0 || attributeFilters.includes(x['Attribute'])) &&
                (targetFilters.length === 0 || targetFilters.includes(x['Target'])) &&
                (setFilters.length === 0 || setFilters.includes(x['Set'])) &&
                (setConstructionFilters.length === 0 || setConstructionFilters.includes(x['Set Construction'])) &&
                (admNamesFilters.length === 0 || admNamesFilters.includes(x['ADM Name']))

            ));
        }
    }, [formattedData, attributeFilters, targetFilters, setFilters, targetTypeFilters, setConstructionFilters, admNamesFilters]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error.message}</p>;

    //eval 15 at least one filter before rendering rows due to dataset size
    const hasActiveFilters = attributeFilters.length > 0 || targetFilters.length > 0 ||
        setFilters.length > 0 || setConstructionFilters.length > 0 || admNamesFilters.length > 0;
    const shouldRenderRows = evalNum !== 15 || hasActiveFilters;

    return (
        <>
            {evalNum === 15 && !hasActiveFilters
                ? <p className='filteredText'>
                    Select at least one filter to display results. Full data is available for download.
                  </p>
                : filteredData.length < formattedData.length &&
                    <p className='filteredText'>
                        Showing {filteredData.length} of {formattedData.length} rows based on filters
                    </p>
            }

            <section className='tableHeader'>
                <div className="filters">
                    <Autocomplete
                        multiple
                        options={attributes}
                        value={attributeFilters}
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
                        value={targetFilters}
                        filterSelectedOptions
                        size="small"
                        renderInput={(params) => (
                            <TextField {...params} label="Targets" />
                        )}
                        onChange={(_, newVal) => setTargetFilters(newVal)}
                    />
                    {(evalNum === 14 || evalNum === 15) && 
                        <Autocomplete
                        multiple
                        options={setConstructions}
                        value={setConstructionFilters}
                        filterSelectedOptions
                        size="small"
                        renderInput={(params) => (
                            <TextField {...params} label="Set Construction" />
                        )}
                        onChange={(_, newVal) => setSetConstructionFilters(newVal)}
                    />
                    }

                    {evalNum === 15 && 
                        <Autocomplete
                        className='large-box'
                        multiple
                        options={admNames}
                        value={admNamesFilters}
                        filterSelectedOptions
                        size="small"
                        renderInput={(params) => (
                            <TextField {...params} label="ADM Name" />
                        )}
                        onChange={(_, newVal) => setAdmNamesFilters(newVal)}
                    />
                    }

                    <Autocomplete
                        className='large-box'
                        multiple
                        options={sets}
                        value={setFilters}
                        filterSelectedOptions
                        size="small"
                        renderInput={(params) => (
                            <TextField {...params} label="Set" />
                        )}
                        onChange={(_, newVal) => setSetFilters(newVal)}
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
                        {shouldRenderRows && filteredData.map((dataSet, index) => (
                            <tr key={`row-${index}`}>
                                {PH2_HEADERS.map((val) => {
                                    if (val === 'Probe IDs') {
                                        return (
                                            <td key={`cell-${index}-probe`}>
                                                {dataSet['Probe IDs'] ?? '-'}
                                            </td>
                                        );
                                    }
                                    return (
                                        <td key={`cell-${index}-${val}`}>
                                            {dataSet[val] ?? '-'}
                                        </td>
                                    );
                                })}
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
                        xlFile={evalNum === 14 ? eval14Defs : evalNum === 15 ? eval15Defs : ph2DefinitionXLFile}
                    />
                </div>
            </Modal>
        </>
    );
}