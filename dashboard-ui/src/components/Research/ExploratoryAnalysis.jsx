import React from 'react';
import './dre-rq.css';
import { RQ5 } from "./tables/rq5";
import { RQ6 } from "./tables/rq6";
import Select from 'react-select';
import { RQ5_PH1 } from './tables/rq5_ph1';
import { HumanVariability } from './tables/humanVariability';
import { BlockedTable } from './tables/BlockedTable';
import { CalibrationData } from './tables/CalibrationData';
import { getAllEvals } from './utils';
import { useSelector, useDispatch } from 'react-redux'
import { setSelectedResearchEval } from '../../store/slices/configSlice';
import { Alert } from "@mui/material";


export function ExploratoryAnalysis() {
    const evalOptions = getAllEvals();
    const dispatch = useDispatch()
    const storedEval = useSelector(state => state.configs.selectedResearchEval)  
    const selectedEval = storedEval ?? evalOptions[0].value;
    const hasData = selectedEval !== 15 && selectedEval !== 16 && selectedEval !== 17
    function selectEvaluation(target) {
        dispatch(setSelectedResearchEval(target.value))
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
        {hasData ?
        <>
        {selectedEval === 13 &&
            <div className="section-container">
                <HumanVariability evalNum={selectedEval} />
            </div>
        }

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

        {selectedEval !== 15 && selectedEval !== 16 && ( 
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
        )}
        </>
        : <Alert 
        style={{marginTop: '10px'}}
        severity="info">No data available</Alert>
    }
    </div>);
}