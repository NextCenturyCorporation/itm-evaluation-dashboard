import React from 'react';
import { RQ134 } from "./tables/rq134";
import './dre-rq.css';
import Select from 'react-select';
import { RCodeModal } from "./rcode/RcodeModal";
import rq32CodeDre from './rcode/code_for_dashboard_RQ32_dre.R';
import rq31CodeDre from './rcode/code_for_dashboard_RQ31_and_RQ33_dre.R';
import rq32CodePh1 from './rcode/code_for_dashboard_RQ32_ph1.R';
import rq31CodePh1 from './rcode/code_for_dashboard_RQ31_and_RQ33_ph1.R';
import { Button, Modal } from 'react-bootstrap';

const ALLOWED_EVAL_OPTIONS = [
    { value: 4, label: 'Dry Run Evaluation' },
    { value: 5, label: 'Phase 1 Evaluation' },
    { value: 6, label: 'Jan 2025 Evaluation' },
    { value: 8, label: 'Phase II June 2025 Collaboration'}
];

export function RQ3() {
    const [rq32CodeShowing, setRQ32CodeShowing] = React.useState(false);
    const [rq31CodeShowing, setRQ31CodeShowing] = React.useState(false);
    const [selectedEval, setSelectedEval] = React.useState(8);
    function selectEvaluation(target) {
        setSelectedEval(target.value);
    }

    const close32Code = () => {
        setRQ32CodeShowing(false);
    }

    const close31Code = () => {
        setRQ31CodeShowing(false);
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
            <h2>RQ3: Does alignment affect delegation preference for ADMs?</h2>
            <p className='indented'>
                <b>H<sub>1</sub></b> = Human delegators prefer to delegate to decision makers with higher
                alignment to themselves on decision-making attributes in military medical triage scenarios.
            </p>
            <p className='indented'>
                <b>H<sub>0</sub></b> = Human delegators do not show a delegation preference based on attribute alignment.
            </p>
            <p>We test this hypothesis by presenting human delegators with decisions from decision makers with varying levels
                of alignment and measure their delegation preference
            </p>
            <p>
                <b>Independent variable:</b> ADM type (aligned vs baseline) <br />
                <b>Dependent variable:</b> Delegation preference (forced choice)
            </p>
        </div>
        <div className="section-container">
            <RQ134 evalNum={selectedEval} tableTitle={'RQ3 Data'} />

        </div>
        <div className="section-container">
            <h2>RQ3 Analysis 3.1 - Binomial test of proportion</h2>
            <p>
                Variables used from dataset:
            </p>
            <ul>
                {(selectedEval == 5 || selectedEval == 6) && <li>
                    Competence Error
                    <ul>
                        <li>Use only "0"</li>
                    </ul>
                </li>}
                <li>ADM_Aligned_Status
                    <ul>
                        <li>Filter for only {(selectedEval == 5 || selectedEval == 6) ? '"aligned"' : '"comparison"'} trials</li>
                    </ul>
                </li>
                <li>ADM Loading
                    <ul>
                        <li>Filter for only "normal" trials</li>
                    </ul>
                </li>
                <li>Delegation preference (A/B)</li>
                <li>Delegation preference (A/M)</li>
            </ul>
            <div className="buttons">
                <button onClick={() => setRQ31CodeShowing(true)}>View R Syntax</button>
                <Modal className='rCodeModal' show={rq31CodeShowing} onHide={close31Code} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>RQ3 Analysis 3.1 and 3.3 - Code</Modal.Title>
                    </Modal.Header>
                    <Modal.Body><RCodeModal rcodeFile={selectedEval == 4 ? rq31CodeDre : rq31CodePh1} downloadName={'RQ31_33_code.R'} /></Modal.Body>
                    <Modal.Footer>
                        <Button className='downloadBtn' onClick={close31Code}>
                            Close
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </div>
        <div className="section-container">
            <h2>RQ3 Analysis 3.2 - Logistic regression of alignment score</h2>
            <p>
                Variables used from dataset:
            </p>
            <ul>
                {(selectedEval == 5 || selectedEval == 6) && <li>
                    Competence Error
                    <ul>
                        <li>Use only "0"</li>
                    </ul>
                </li>}
                <li>Alignment score (Delegator | Observed_ADM (target))</li>
                <li>Delegation preference (A/B)</li>
                <li>Delegation preference (A/M)</li>
            </ul>
            <div className="buttons">
                <button onClick={() => setRQ32CodeShowing(true)}>View R Syntax</button>
                <Modal className='rCodeModal' show={rq32CodeShowing} onHide={close32Code} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>RQ3 Analysis 3.2 - Code</Modal.Title>
                    </Modal.Header>
                    <Modal.Body><RCodeModal rcodeFile={selectedEval == 4 ? rq32CodeDre : rq32CodePh1} downloadName={'RQ32_code.R'} /></Modal.Body>
                    <Modal.Footer>
                        <Button className='downloadBtn' onClick={close32Code}>
                            Close
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </div>
        <div className="section-container">
            <h2>RQ3 Analysis 3.3 - Repeated Measures ANOVA of Trust ratings by delegation choice</h2>
            <p>
                Variables used from dataset:
            </p>
            <ul>
                {(selectedEval == 5 || selectedEval == 6) && <li>
                    Competence Error
                    <ul>
                        <li>Use only "0"</li>
                    </ul>
                </li>}
                <li>Delegation preference (A/B)</li>
                <li>Delegation preference (A/M)</li>
                <li>Trust_Rating</li>
            </ul>
            <div className="buttons">
                <button onClick={() => setRQ31CodeShowing(true)}>View R Syntax</button>
            </div>
        </div>
    </div>);
}