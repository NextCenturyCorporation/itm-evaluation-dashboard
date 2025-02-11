import React from 'react';
import { RQ134 } from "./tables/rq134";
import './dre-rq.css';
import Select from 'react-select';
import rq1CodeDre from './rcode/code_for_dashboard_RQ1_dre.R';
import rq1CodePh1 from './rcode/code_for_dashboard_RQ1_ph1.R';
import { Button, Modal } from 'react-bootstrap';
import { RCodeModal } from "./rcode/RcodeModal";

const ALLOWED_EVAL_OPTIONS = [
    { value: 4, label: 'Dry Run Evaluation' },
    { value: 5, label: 'Phase 1 Evaluation' },
    { value: 6, label: 'Jan 2025 Evaluation' }
];

export function RQ1() {
    const [rq1CodeShowing, setRQ1CodeShowing] = React.useState(false);

    const close1Code = () => {
        setRQ1CodeShowing(false);
    }
    const [selectedEval, setSelectedEval] = React.useState(5);
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
            <h2>RQ1: Does alignment score predict measures of trust?</h2>
            <p className='indented'>
                <b>H<sub>1</sub></b> = Alignment score calculated between the responses of one human on attribute-driven
                decision making and responses of an observed decision maker should predict that human's trust ratings
                of the observed decision maker.
            </p>
            <p className='indented'>
                <b>H<sub>0</sub></b> = Alignment score does not predict trust ratings
            </p>
            <p>We test this hypothesis by calculating the alignment score between decisions of a human
                decision maker and the decisions of an observed decision maker and then regressing it
                onto the trust ratings given to the observed decision maker by the human.
            </p>
            <p>
                <b>Independent variable (calculated):</b> Alignment score <br />
                <b>Dependent variable:</b> Trust rating on each observed DM
            </p>
        </div>
        <div className="section-container">
            <RQ134 evalNum={selectedEval} tableTitle={'RQ1 Data'} />

        </div>
        <div className="section-container">
            <h2>RQ1 Analysis 1.1 - Linear Mixed Effects Regression Alignment on Trust</h2>
            <p>
                Variables used from dataset:
            </p>
            <ul>
                <li>Participant ID</li>
                {(selectedEval == 5 || selectedEval == 6) && <li>
                    Competence Error
                    <ul>
                        <li>Use only "0"</li>
                    </ul>
                </li>}
                <li>Alignment Score (Delegator | Observed_ADM (target))</li>
                <li>Trust_Rating</li>
            </ul>
            <div className="buttons">
                <button onClick={() => setRQ1CodeShowing(true)}>View R Syntax</button>
                <Modal className='rCodeModal' show={rq1CodeShowing} onHide={close1Code} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>RQ1 Analysis - Code</Modal.Title>
                    </Modal.Header>
                    <Modal.Body><RCodeModal rcodeFile={selectedEval == 4 ? rq1CodeDre : rq1CodePh1} downloadName={'RQ1_code.R'} /></Modal.Body>
                    <Modal.Footer>
                        <Button className='downloadBtn' onClick={close1Code}>
                            Close
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </div>
        <div className="section-container">
            <h2>RQ1 Analysis 1.2 - ANOVA comparing DM Alignment Type</h2>
            <p>
                Variables used from dataset:
            </p>
            <ul>
                <li>Participant ID</li>
                {(selectedEval == 5 || selectedEval == 6) && <li>
                    Competence Error
                    <ul>
                        <li>Use only "0"</li>
                    </ul>
                </li>}
                <li>ADM_Aligned_Status (Baseline/Misaligned/Aligned)</li>
                {(selectedEval == 5 || selectedEval == 6) && <li>
                    ADM_Loading
                    <ul>
                        <li>Use only "normal"</li>
                    </ul>
                </li>}
                <li>Trust_Rating</li>
            </ul>
            <div className="buttons">
                <button onClick={() => setRQ1CodeShowing(true)}>View R Syntax</button>
                <Modal className='rCodeModal' show={rq1CodeShowing} onHide={close1Code} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>RQ1 Analysis - Code</Modal.Title>
                    </Modal.Header>
                    <Modal.Body><RCodeModal rcodeFile={selectedEval == 4 ? rq1CodeDre : rq1CodePh1} downloadName={'RQ1_code.R'} /></Modal.Body>
                    <Modal.Footer>
                        <Button className='downloadBtn' onClick={close1Code}>
                            Close
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </div>
    </div>);
}