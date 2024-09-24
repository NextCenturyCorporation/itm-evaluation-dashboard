import { RQ13 } from "./tables/rq1-rq3";
import './dre-rq.css';

export function RQ3() {
    return (<div className="researchQuestion">
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
            <h2>RQ3 Data</h2>
            <RQ13 />

        </div>
        <div className="section-container">
            <h2>RQ3 Analysis 3.1 - Binomial test of proportion</h2>
            <p>
                Variables used from dataset:
            </p>
            <ul>
                <li>ADM_Type</li>
                <ul>
                    <li>Filter for only "comparison" trials</li>
                </ul>
                <li>Delegation preference (A/B)</li>
            </ul>
        </div>
        <div className="section-container">
            <h2>RQ3 Analysis 3.2 - Logistic regression of alignment score</h2>
            <p>
                Variables used from dataset:
            </p>
            <ul>
                <li>Alignment score (Delegator | Observed_ADM (target))</li>
                <li>Delegation preference (A/B)</li>
                <li>Delegation preference (A/M)</li>
            </ul>
        </div>
        <div className="section-container">
            <h2>RQ3 Analysis 3.3 - Repeated Measures ANOVA of Trust ratings by delegation choice</h2>
            <p>
                Variables used from dataset:
            </p>
            <ul>
                <li>Delegation preference (A/B)</li>
                <li>Delegation preference (A/M)</li>
                <li>Trust_Rating</li>
            </ul>
        </div>
    </div>);
}