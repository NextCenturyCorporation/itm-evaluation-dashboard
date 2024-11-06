import { RQ13 } from "./tables/rq1-rq3";
import './dre-rq.css';
import rq1Code from './rcode/code_for_dashboard_RQ1.R';
import React from 'react';
import { Button, Modal } from 'react-bootstrap';
import { RCodeModal } from "./rcode/RcodeModal";

export function RQ1() {
    const [rq1CodeShowing, setRQ1CodeShowing] = React.useState(false);

    const close1Code = () => {
        setRQ1CodeShowing(false);
    }
    return (<div className="researchQuestion">
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
                onto the trust ratings given tot he observed decision maker by the human.
            </p>
            <p>
                <b>Independent variable (calculated):</b> Alignment score <br />
                <b>Dependent variable:</b> Trust rating on each observed DM
            </p>
        </div>
        <div className="section-container">
            <h2>RQ1 Data</h2>
            <RQ13 />
        </div>
        <div className="section-container">
            <h2>RQ1 Analysis 1.1 - Linear Mixed Effects Regression Alignment on Trust</h2>
            <p>
                Variables used from dataset:
            </p>
            <ul>
                <li>Participant ID</li>
                <li>Alignment Score (Delegator | Observed_ADM (target))</li>
                <li>Trust_Rating</li>
            </ul>
            <div className="buttons">
                <button onClick={() => setRQ1CodeShowing(true)}>View R Syntax</button>
                <Modal className='rCodeModal' show={rq1CodeShowing} onHide={close1Code} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>RQ1 Analysis - Code</Modal.Title>
                    </Modal.Header>
                    <Modal.Body><RCodeModal rcodeFile={rq1Code} downloadName={'RQ1_code.R'} /></Modal.Body>
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
                <li>ADM_Aligned_Status (Baseline/Misaligned/Aligned)</li>
                <li>Trust_Rating</li>
            </ul>
            <div className="buttons">
                <button onClick={() => setRQ1CodeShowing(true)}>View R Syntax</button>
                <Modal className='rCodeModal' show={rq1CodeShowing} onHide={close1Code} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>RQ1 Analysis - Code</Modal.Title>
                    </Modal.Header>
                    <Modal.Body><RCodeModal rcodeFile={rq1Code} downloadName={'RQ1_code.R'} /></Modal.Body>
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