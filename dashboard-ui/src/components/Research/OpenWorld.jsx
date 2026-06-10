import React from 'react';
import './dre-rq.css';
import { RQ8 } from "./tables/rq8";
import { PH2RQ8 } from "./tables/ph2_rq8";
import { PH2RQ8Apr26} from "./tables/ph2_rq8_apr26";
import Select from 'react-select';
import { getAllEvals } from './utils';
import { useSelector, useDispatch } from 'react-redux'
import { setSelectedResearchEval } from '../../store/slices/configSlice';

export function OpenWorld() {
    const evalAllowList = [4, 5, 6, 8, 9, 10, 12, 15, 16, 17]
    const evalOptions = getAllEvals();
    const dispatch = useDispatch()
    const storedEval = useSelector(state => state.configs.selectedResearchEval)
    
    const filteredEvals = evalOptions.filter(x => 
        evalAllowList.includes(x.value)
    )

    const selectedEval = evalAllowList.includes(storedEval) ? storedEval : filteredEvals[0].value
    function selectEvaluation(target) {
        dispatch(setSelectedResearchEval(target.value))
    }

    const rq8Map = { 16: PH2RQ8Apr26 };
    const RQ8Component = rq8Map[selectedEval]
    return (<div className="researchQuestion">
        <div className="rq-selection-section">
            <Select
                onChange={selectEvaluation}
                options={filteredEvals}
                defaultValue={filteredEvals[0]}
                placeholder="Select Evaluation"
                value={filteredEvals.find(option => option.value === selectedEval)}
                styles={{
                    // Fixes the overlapping problem of the component
                    menu: provided => ({ ...provided, zIndex: 9999 })
                }}
            />
        </div>

        <div className="section-container">
            <h2>RQ8: Exploratory: How do the assessed attributes predict behavior in open triage scenarios?</h2>
            <p className='indented'>
                <b>H<sub>1</sub></b> = KDMA assessments predict behavior in an open world medical triage scenario.
            </p>
            <p className='indented'>
                <b>H<sub>0</sub></b> = KDMA assessments do not predict behavior in an open world medical triage scenario.
            </p>
            <p>
                <b>Independent variable (calculated):</b> KDMA measurement (ADEPT) or Alignment score to selected target (ST) <br />
                <b>Dependent variables:</b> Number of assessment actions per patient and total; Number of treatment actions per patient and total;
                tagging accuracy; use of expectant tag (yes/no); time per patient; number of visits per patient; triage time total; evacuation patients
            </p>
        </div>

        <div className="section-container">
            {RQ8Component ? <RQ8Component evalNum={selectedEval} /> : selectedEval < 8 ? <RQ8 evalNum={selectedEval} /> : <PH2RQ8 evalNum={selectedEval}/>}
        </div>

    </div>);
}