import React from 'react';
import { TCCC, GET_TCCC_RESULTS  } from "./tables/tccc";
import Select from 'react-select';
import { useQuery } from "react-apollo";
import './dre-rq.css';

export function TcccAnalysis() {
    const { loading: loadingTcccResults, error: errorTcccResults, data: dataTcccResults } = useQuery(GET_TCCC_RESULTS)
    const evalOptions = dataTcccResults ? Array.from(new Set(dataTcccResults.getTcccResults.map(doc => {
        return doc.eval
    }))).map(evalDate => {
       return {'value': evalDate, 'label': evalDate }
    }) : []

    const evalOptionsWithAll = [{'value': null, 'label': "All Evaluations"}, ...evalOptions]
    const [selectedEval, setSelectedEval] = React.useState(null);
        function selectEvaluation(target) {
            setSelectedEval(target.value);
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
                        // Fixes the overlapping problem of the component
                        menu: provided => ({ ...provided, zIndex: 9999 })
                    }}
                />
            </div >
            <div className='section-container'>
                <TCCC evalDate={selectedEval}/>
            </div>
        </div>
    )
}