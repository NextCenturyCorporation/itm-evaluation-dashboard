import { RQ13 } from "./tables/rq1-rq3";
import './dre-rq.css';

export function RQ1() {
    return (<>
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
                <button>View R Syntax</button>
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
                <button>View R Syntax</button>
            </div>
        </div>
    </>);
}