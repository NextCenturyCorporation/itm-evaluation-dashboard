import React from 'react';
import { RQ2223 } from "./tables/rq22-rq23";
import './dre-rq.css';
import { RQ21 } from "./tables/rq21";
import Select from 'react-select';

const ALLOWED_EVAL_OPTIONS = [
    { value: 4, label: 'Dry Run Evaluation' },
    { value: 5, label: 'Phase 1 Evaluation' }
];

export function RQ2() {
    const [selectedEval, setSelectedEval] = React.useState(4);
    function selectEvaluation(target) {
        setSelectedEval(target.value);
    }
    return (<div className="researchQuestion">
        <div className="rq-selection-section">
            <Select
                onChange={selectEvaluation}
                options={ALLOWED_EVAL_OPTIONS}
                defaultValue={ALLOWED_EVAL_OPTIONS[0]}
                placeholder="Select Evaluation"
                value={ALLOWED_EVAL_OPTIONS.find(option => option.value === selectedEval)}
                styles={{
                    // Fixes the overlapping problem of the component
                    menu: provided => ({ ...provided, zIndex: 9999 })
                }}
            />
        </div>
        <div className="section-container">
            <h2>RQ2: Do aligned ADMs have the ability to tune to a subset of the attribute space?</h2>
            <p className='indented'>
                <b>H<sub>1</sub></b> = ADMs trained to use human attributes in decision making at varying
                levels will demonstrate alignment to humans' decision making in military medical triage scenarios
            </p>
            <p className='indented'>
                <b>H<sub>0</sub></b> = Trained ADMs will not align to human decision making based on attribute
            </p>
            <p>We test this hypothesis by aligning the ADM to a target representative of a subset of human attribute
                measurements. We then calculate the alignment score between the group target and the ADM decisions,
                and the group target of each of the individuals' responses that contributed to the group target. We
                expect the alignment score of the ADM to the group target to fall greater than or equal to the lowest
                alignment score from an individual within the group (thereby falling within the cluster of alignment
                scores in that group).
            </p>
            <p>
                <b>Independent variable:</b> ADM type (aligned or baseline) <br />
                <b>Dependent variable:</b> Alignment score between ADM and target
            </p>
        </div>
        <h3>RQ2 Analysis 2.1: Alignable ADM tuned within largest cluster of human attributes</h3>
        <div className="section-container">
            <h2>RQ2.1 Data</h2>
            <RQ21 evalNum={selectedEval} />

        </div>
        <h3>RQ2 Analysis 2.2: T-tests comparing Alignable ADM versus Baseline ADM on group-aligned targets</h3>
        <h3>RQ2 Analysis 2.3: T-tests comparing Alignable ADM versus Baseline ADM on individual-aligned targets</h3>
        <div className="section-container">
            <h2>RQ2.2 & 2.3 Data</h2>
            <RQ2223 evalNum={selectedEval} />

        </div>
    </div>);
}