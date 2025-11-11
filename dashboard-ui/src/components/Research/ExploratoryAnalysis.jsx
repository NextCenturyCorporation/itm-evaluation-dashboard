import React from 'react';
import { RQ134 } from "./tables/rq134";
import './dre-rq.css';
import { RQ5 } from "./tables/rq5";
import { RQ8 } from "./tables/rq8";
import { PH2RQ8 } from "./tables/ph2_rq8";
import { RQ6 } from "./tables/rq6";
import Select from 'react-select';
import { RQ5_PH1 } from './tables/rq5_ph1';
import { HumanVariability } from './tables/humanVariability';
import { BlockedTable } from './tables/BlockedTable';
import { CalibrationData } from './tables/CalibrationData';
import { PAGES, getEvalOptionsForPage } from './utils';

export function ExploratoryAnalysis() {
    const evalOptions = getEvalOptionsForPage(PAGES.EXPLORATORY_ANALYSIS);

    const [selectedEval, setSelectedEval] = React.useState(evalOptions[0].value);
    function selectEvaluation(target) {
        setSelectedEval(target.value);
    }
    return (<div className="researchQuestion">
        <div className="rq-selection-section">
            <Select
                onChange={selectEvaluation}
                options={evalOptions}
                defaultValue={evalOptions[0]}
                placeholder="Select Evaluation"
                value={evalOptions.find(option => option.value === selectedEval)}
                styles={{
                    // Fixes the overlapping problem of the component
                    menu: provided => ({ ...provided, zIndex: 9999 })
                }}
            />
        </div>
        {selectedEval === 13 &&
            <div className="section-container">
                <HumanVariability evalNum={selectedEval} />
            </div>
        }
        <div className="section-container">
            <h2>RQ4: Does alignment score predict perceived alignment?</h2>
            <p className='indented'>
                <b>H<sub>1</sub></b> = Alignment score calculated between the responses of one human on attribute-driven
                decision making and responses of an observed decision maker should predict that human's ratings of self-reported
                alignment on the observed decision maker
            </p>
            <p className='indented'>
                <b>H<sub>0</sub></b> = Alignment score does not predict self-reported alignment ratings
            </p>
            <p>We test this hypothesis by calculating the alignment score between decisions of a human
                decision maker and the decisions of an observed decision maker and then regressing it
                onto the self-reported alignment ratings given to the observed decision maker by the human.
            </p>
            <p>
                <b>Independent variable (calculated):</b> Alignment score <br />
                <b>Dependent variable:</b> Self-reported alignment rating on each observed DM
            </p>
        </div>
        <div className="section-container">
            <RQ134 evalNum={selectedEval} tableTitle={'RQ4 Data'} />
            <p>
                <b>Variables used from dataset:</b>
            </p>
            <ul>
                <li>Participant ID</li>
                <li>Alignment Score (Delegator | Observed_ADM (target))</li>
                <li>SRAlign_Rating</li>
            </ul>
        </div>
        {selectedEval < 8 &&
            <>
                <div className="section-container">
                    <h2>RQ5: To what extent does alignment score predict identical behavior at the probe level in patterns of real human behavior?</h2>
                    <p className='indented'>
                        <b>H<sub>1</sub></b> = Alignment scores as calculated by the TA1s will be positively related to the % of exact matches in probe responses
                    </p>
                    <p className='indented'>
                        <b>H<sub>0</sub></b> = Alignment scores as calculated by the TA1s will not be positively related to the % of exact matches in probe responses
                    </p>
                    <p>For each pair of DMs (human and ADM) that completed the same scenario, we will calculate the percentage of probes answered exactly the same and
                        look at the correlation between the alignment score and the percentage of probes answered the same as an indicator of how the relationship
                        between alignment score, as calculated at a scenario level by the characterization teams, and the behavioral responses of the human and ADM.
                    </p>
                    <p className='indented'>
                        <b>H<sub>1</sub></b> = Alignment scores to group targets, as calculated by the TA1s, will be positively related to the % of exact matches
                        in probe responses among group members
                    </p>
                    <p className='indented'>
                        <b>H<sub>0</sub></b> = Alignment scores to group targets, as calculated by the TA1s, will not be positively related to the % of exact matches
                        in probe responses among group members
                    </p>
                    <p>Similarly, we can also examine the correlation between alignment score to a group target and the % of probes answered the same as group members
                        as an indicator of the relationship between alignment score and behavioral response. We can calculate, for each probe, the probe agreement
                        between an individual and a group as the percentage of group individuals who answered the question in the same way
                    </p>
                    <p>
                        <b>Dependent variables:</b> Alignment score and % matching probe responses
                    </p>
                </div>
                <div className="section-container">
                    {selectedEval === 5 ?
                        <RQ5_PH1 evalNum={selectedEval} /> :
                        <RQ5 evalNum={selectedEval} />}


                </div>


                <div className="section-container">
                    <h2>RQ6: Does attribute assessment in different formats produce the same results?</h2>
                    <p className='indented'>
                        <b>H<sub>1</sub></b> = The human delegator probe responses in the text scenarios should be highly aligned to the same delegator’s probe responses in the simulated scenario.
                    </p>
                    <p className='indented'>
                        <b>H<sub>0</sub></b> = The human delegator probe responses in the text scenarios should not be aligned to the same delegator’s probe responses in the simulated scenario.
                    </p>
                </div>
                <div className="section-container">
                    <RQ6 evalNum={selectedEval} />
                </div>

                <div className="section-container">
                    <h2>RQ7: Exploratory: How do the attributes interact?</h2>
                    <p>TBD</p>
                </div>
            </>
        }

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
            {selectedEval < 8 ? <RQ8 evalNum={selectedEval} /> : <PH2RQ8 evalNum={selectedEval} />}
        </div>

        <>
            <div className="section-container">
                <BlockedTable evalNum={selectedEval} />
            </div>
            {selectedEval > 4 && selectedEval < 8 &&
                <div className="section-container">
                    <CalibrationData evalNum={selectedEval} />
                </div>
            }
        </>

    </div>);
}