import React from 'react';
import { TCCC, GET_TCCC_RESULTS  } from "./tables/tccc";
import Select from 'react-select';
import { useQuery } from "react-apollo";
import './dre-rq.css';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const toSortKey = evalStr => {
    const [month, year] = evalStr.split(' ');
    return Number(year) * 12 + MONTHS.indexOf(month);
};

export function TcccAnalysis() {
    const { loading: loadingTcccResults, error: errorTcccResults, data: dataTcccResults } = useQuery(GET_TCCC_RESULTS)
    const evalOptions = dataTcccResults
    ? Array.from(new Set(dataTcccResults.getTcccResults.map(doc => doc.eval)))
        .sort((a, b) => toSortKey(b) - toSortKey(a))
        .map(evalDate => ({ value: evalDate, label: evalDate }))
    : [];


    const evalOptionsWithAll = [{'value': null, 'label': "All Evaluations"}, ...evalOptions]
    const [selectedEval, setSelectedEval] = React.useState(null);
        function selectEvaluation(target) {
            setSelectedEval(target.value);
        }

    if (errorTcccResults) {
        throw errorTcccResults;
    }

    return (
        <div>
            <div className="rq-selection-section">
                <Select
                    onChange={selectEvaluation}
                    options={evalOptionsWithAll}
                    defaultValue={"All Evaluations"}
                    placeholder="Select Evaluation"
                    value={evalOptionsWithAll.find(option => option.value === selectedEval)}
                    styles={{
                        menu: provided => ({ ...provided, zIndex: 9999 }),
                        menuList: provided => ({ ...provided, maxHeight: 'none' })
                    }}
                />
            </div >
            <div className='section-container'>
                <TCCC evalDate={selectedEval}/>
            </div>
        </div>
    )
}