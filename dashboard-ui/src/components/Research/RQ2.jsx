import React from 'react';
import { RQ2223 } from "./tables/rq22-rq23";
import './dre-rq.css';
import { RQ21 } from "./tables/rq21";
import Select from 'react-select';
import rq21CodeDre from './rcode/code_for_dashboard_RQ21_dre.R';
import rq2CodeDre from './rcode/code_for_dashboard_RQ2_dre.R';
import rq21CodePh1 from './rcode/code_for_dashboard_RQ21_ph1.R';
import rq2CodePh1 from './rcode/code_for_dashboard_RQ2_ph1.R';
import { Button, Modal } from 'react-bootstrap';
import { RCodeModal } from "./rcode/RcodeModal";
import { MultiKDMA_RQ23 } from './tables/rq23_multiKDMA';
import { PH2RQ2223 } from './tables/ph2_rq22-rq23';

const ALLOWED_EVAL_OPTIONS = [
    { value: 4, label: 'Dry Run Evaluation' },
    { value: 5, label: 'Phase 1 Evaluation' },
    { value: 7, label: 'Phase II Experiment 1' },
    { value: 8, label: 'Phase II June 2025 Collaboration'}
];

export function RQ2() {
    const [rq21CodeShowing, setRQ21CodeShowing] = React.useState(false);
    const [rq2CodeShowing, setRQ2CodeShowing] = React.useState(false);
    const [selectedEval, setSelectedEval] = React.useState(8);

    function selectEvaluation(target) {
        setSelectedEval(target.value);
    }

    const close21Code = () => {
        setRQ21CodeShowing(false);
    }

    const close2Code = () => {
        setRQ2CodeShowing(false);
    }

    const getRQ21Code = () => selectedEval === 4 ? rq21CodeDre : rq21CodePh1;
    const getRQ2Code = () => selectedEval === 4 ? rq2CodeDre : rq2CodePh1;
    const showRQ21Section = () => selectedEval !== 7 && selectedEval < 8;
    const showRCodeButtons = () => selectedEval !== 7 && selectedEval < 8;
    const shouldUsePH2Component = () => selectedEval >= 8;

    return (
        <div className="researchQuestion">
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

            {showRQ21Section() && (
                <>
                    <h3>RQ2 Analysis 2.1: Alignable ADM tuned within largest cluster of human attributes</h3>
                    <div className="section-container">
                        <h2>RQ2.1 Data</h2>
                        <RQ21 evalNum={selectedEval} />
                        {showRCodeButtons() && (
                            <div className="buttons">
                                <button onClick={() => setRQ21CodeShowing(true)}>View R Syntax</button>
                                <Modal className='rCodeModal' show={rq21CodeShowing} onHide={close21Code} centered>
                                    <Modal.Header closeButton>
                                        <Modal.Title>RQ3 Analysis 2.1 - Code</Modal.Title>
                                    </Modal.Header>
                                    <Modal.Body>
                                        <RCodeModal 
                                            rcodeFile={getRQ21Code()} 
                                            downloadName={'RQ21_code.R'} 
                                        />
                                    </Modal.Body>
                                    <Modal.Footer>
                                        <Button className='downloadBtn' onClick={close21Code}>
                                            Close
                                        </Button>
                                    </Modal.Footer>
                                </Modal>
                            </div>
                        )}
                    </div>
                    <h3>RQ2 Analysis 2.2: T-tests comparing Alignable ADM versus Baseline ADM on group-aligned targets</h3>
                </>
            )}

            {selectedEval === 7 ? (
                <h3>RQ2 Analysis 2.3: T-tests on Individual Targets - Alignable ADM tuned to Human Multi-KDMA Targets</h3>
            ) : (
                <h3>RQ2 Analysis 2.3: T-tests comparing Alignable ADM versus Baseline ADM on individual-aligned targets</h3>
            )}

            <div className="section-container">
                {selectedEval !== 7 && <h2>RQ2.2 & 2.3 Data</h2>}
                
                {/* Render appropriate component based on selectedEval */}
                {selectedEval === 7 ? (
                    <MultiKDMA_RQ23 />
                ) : shouldUsePH2Component() ? (
                    <PH2RQ2223 evalNum={selectedEval} />
                ) : (
                    <RQ2223 evalNum={selectedEval} />
                )}
                
                {showRCodeButtons() && (
                    <div className="buttons">
                        <button onClick={() => setRQ2CodeShowing(true)}>View R Syntax</button>
                        <Modal className='rCodeModal' show={rq2CodeShowing} onHide={close2Code} centered>
                            <Modal.Header closeButton>
                                <Modal.Title>RQ3 Analysis 2.2 and 2.3 - Code</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <RCodeModal 
                                    rcodeFile={getRQ2Code()} 
                                    downloadName={'RQ2_code.R'} 
                                />
                            </Modal.Body>
                            <Modal.Footer>
                                <Button className='downloadBtn' onClick={close2Code}>
                                    Close
                                </Button>
                            </Modal.Footer>
                        </Modal>
                    </div>
                )}
            </div>
        </div>
    );
}