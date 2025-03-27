import React from "react";
import '../../SurveyResults/resultsTable.css';
import { useQuery } from 'react-apollo'
import gql from "graphql-tag";
import { RQDefinitionTable } from "../variables/rq-variables";
import CloseIcon from '@material-ui/icons/Close';
import { Autocomplete, TextField, Modal } from "@mui/material";
import ph2DefinitionXLFile from '../variables/Variable Definitions RQ2.3_PH2.xlsx';
import { DownloadButtons } from "./download-buttons";

const getAnalysisData = gql`
    query getMultiKdmaAnalysisData {
        getMultiKdmaAnalysisData
    }`;

const HEADERS = ['ADM Name', 'ADM Type', 'Human Scenario', 'Target Type', 'MJ Alignment Target', 'IO Alignment Target', 'MJ KDMA - MJ2', 'MJ KDMA - MJ4', 'MJ KDMA - MJ5', 'MJ KDMA - AVE', 'IO KDMA - MJ2', 'IO KDMA - MJ4', 'IO KDMA - MJ5', 'IO KDMA - AVE', 'Alignment (Target|ADM) - MJ2', 'Alignment (Target|ADM) - MJ4', 'Alignment (Target|ADM) - MJ5', 'Alignment (Target|ADM) - AVE'];

const BASELINE_ADMS = [];
const ALIGNED_ADMS = ['ALIGN-ADM-RelevanceComparativeRegression-ADEPT__4e570b6d-8f9e-4e3c-8d0f-ffcde73a5792', 'ALIGN-ADM-ComparativeRegression-ADEPT__b3da51ed-57ff-429b-8ae8-6ff9dc44b65d', 'ALIGN-ADM-RelevanceComparativeRegression-ADEPT__785ccc32-bf56-4bfc-a034-b64a3222102b'];

export function Phase2_RQ23() {
    const { loading: loading, error: error, data: data } = useQuery(getAnalysisData);
    const [formattedData, setFormattedData] = React.useState([]);
    const [showDefinitions, setShowDefinitions] = React.useState(false);
    // all options for filters
    const [admNames, setAdmNames] = React.useState([]);
    const admTypes = ['aligned', 'baseline'];
    const scenarios = ['MJ2', 'MJ4', 'MJ5'];
    const targetTypes = ['overall', 'narr', 'train'];
    // filter options that have been chosen
    const [admNameFilters, setAdmNameFilters] = React.useState([]);
    const [admTypeFilters, setAdmTypeFilters] = React.useState([]);
    const [scenarioFilters, setScenarioFilters] = React.useState([]);
    const [targetTypeFilters, setTargetTypeFilters] = React.useState([]);
    // data with filters applied
    const [filteredData, setFilteredData] = React.useState([]);


    const openModal = () => {
        setShowDefinitions(true);
    }

    const closeModal = () => {
        setShowDefinitions(false);
    }

    React.useEffect(() => {
        if (data?.getMultiKdmaAnalysisData) {
            const analysisData = data.getMultiKdmaAnalysisData;
            const allObjs = [];
            const allAdmNames = [];

            for (const admGroup of analysisData) {
                const entryObj = {};
                const admName = admGroup.admName;
                entryObj['ADM Name'] = admName;
                allAdmNames.push(admName);
                let admType = '-';
                if (BASELINE_ADMS.includes(admName))
                    admType = 'baseline';
                else if (ALIGNED_ADMS.includes(admName))
                    admType = 'aligned';
                entryObj['ADM Type'] = admType;
                entryObj['Human Scenario'] = admGroup['humanScenario'];
                entryObj['Target Type'] = admGroup['targetType'];
                entryObj['MJ Alignment Target'] = admGroup['mjTarget'];
                entryObj['IO Alignment Target'] = admGroup['ioTarget'];
                entryObj['MJ KDMA - MJ2'] = admGroup['mjAD1_kdma'];
                entryObj['MJ KDMA - MJ4'] = admGroup['mjAD2_kdma'];
                entryObj['MJ KDMA - MJ5'] = admGroup['mjAD3_kdma'];
                entryObj['MJ KDMA - AVE'] = admGroup['mjAve_kdma'];
                entryObj['IO KDMA - MJ2'] = admGroup['ioAD1_kdma'];
                entryObj['IO KDMA - MJ4'] = admGroup['ioAD2_kdma'];
                entryObj['IO KDMA - MJ5'] = admGroup['ioAD3_kdma'];
                entryObj['IO KDMA - AVE'] = admGroup['ioAve_kdma'];
                entryObj['Alignment (Target|ADM) - MJ2'] = admGroup['AD1_align'];
                entryObj['Alignment (Target|ADM) - MJ4'] = admGroup['AD2_align'];
                entryObj['Alignment (Target|ADM) - MJ5'] = admGroup['AD3_align'];
                entryObj['Alignment (Target|ADM) - AVE'] = admGroup['ave_align'];
                for (const key of Array.from(Object.keys(entryObj))) {
                    if (entryObj[key] == -1) {
                        entryObj[key] = '-';
                    }
                }
                allObjs.push(entryObj);
            }

            allObjs.sort((a, b) => {
                // Compare ADM Name
                if (a['ADM Name'] < b['ADM Name']) return -1;
                if (a['ADM Name'] > b['ADM Name']) return 1;

                // If ADM Name is equal, compare Type
                if (a['ADM Type'] < b['ADM Type']) return -1;
                if (a['ADM Type'] > b['ADM Type']) return 1;

                // If Type is equal, compare Scenario
                return a.Scenario - b.Scenario;
            });

            if (allObjs.length > 0) {
                setFormattedData(allObjs);
                setFilteredData(allObjs);
            }
            else {
                setFormattedData([{ 'ADM Name': '-' }]);
                setFilteredData([{ 'ADM Name': '-' }]);
            }
            setAdmNames(Array.from(new Set(allAdmNames)));
        }
    }, [data]);

    React.useEffect(() => {
        if (formattedData.length > 0) {
            setFilteredData(formattedData.filter((x) =>
                (admNameFilters.length == 0 || admNameFilters.includes(x['ADM Name'])) &&
                (admTypeFilters.length == 0 || admTypeFilters.includes(x['ADM Type'])) &&
                (scenarioFilters.length == 0 || scenarioFilters.filter((sf) => x['Human Scenario'].includes(sf)).length > 0) &&
                (targetTypeFilters.length == 0 || targetTypeFilters.includes(x['Target Type']))
            ));
        }
    }, [formattedData, admNameFilters, admTypeFilters, scenarioFilters, targetTypeFilters]);


    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error :</p>;

    return (<>
        {filteredData.length < formattedData.length && <p className='filteredText'>Showing {filteredData.length} of {formattedData.length} rows based on filters</p>}
        <section className='tableHeader'>
            <div className="filters">
                <Autocomplete
                    multiple
                    options={admNames}
                    filterSelectedOptions
                    size="small"
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="ADM Name"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setAdmNameFilters(newVal)}
                />
                <Autocomplete
                    multiple
                    options={admTypes}
                    filterSelectedOptions
                    size="small"
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="ADM Type"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setAdmTypeFilters(newVal)}
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
                    options={targetTypes}
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
            <DownloadButtons formattedData={formattedData} filteredData={filteredData} HEADERS={HEADERS} fileName={'RQ-23 data'} extraAction={openModal} />
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
                        return (<tr key={dataSet['ADM Name'] + '-' + dataSet['Alignment Target'] + '-' + index}>
                            {HEADERS.map((val) => {
                                return (<td key={dataSet['ADM Name'] + '-' + dataSet['Alignment Target'] + '-' + val}>
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
                <RQDefinitionTable downloadName={`Definitions_RQ23_eval7.xlsx`} xlFile={ph2DefinitionXLFile} />
            </div>
        </Modal>
    </>);
}
