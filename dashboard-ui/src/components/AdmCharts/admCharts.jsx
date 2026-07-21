import React from 'react';
import ScoreChart from './scoreChart';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import Select from 'react-select';
import store from '../../store/store';
import { setSelectedResearchEval } from '../../store/slices/configSlice';

const getScenarioNamesQueryName = "getScenarioNamesByEval";

const scenario_names_aggregation = gql`
    query getScenarioNamesByEval($evalNumber: Float!){
        getScenarioNamesByEval(evalNumber: $evalNumber)
  }`;

class AdmCharts extends React.Component {

    constructor(props) {
        super();
        const storedEval = store.getState()?.configs?.selectedResearchEval;
        const initialEval = props.evaluationOptions.find(o => o.value === storedEval) ?? props.evaluationOptions[0];
        this.state = {
            currentEval: initialEval,

        }

        this.selectEvaluation = this.selectEvaluation.bind(this);
    }

    selectEvaluation(target) {
        this.setState({
            currentEval: target
        });
        store.dispatch(setSelectedResearchEval(target.value));
    }

    getHeaderLabel(id, name) {
        if (this.state.currentEval.value < 3) {
            if (id.toLowerCase().indexOf("adept") > -1) {
                return ("BBN: " + id + " " + name);
            } else {
                return ("Soartech: " + id + " " + name);
            }
        } else if (this.state.currentEval.value === 3) {
            if (id.toLowerCase().indexOf("metricseval") > -1) {
                return ("ADEPT: " + id + " " + name);
            } else {
                return ("Soartech: " + name);
            }
        } else {
            if (id.toLowerCase().includes("qol") || id.toLowerCase().includes("vol")) {
                return ("Soartech: " + name + " (" + id + ")");
            } else {
                return ("Adept: " + name + " (" + id + ")");
            }

        }
    }

    render() {
        return (
            <div className="home-container">
                <div className="home-navigation-container">
                    <div className="evaluation-selector-container">
                        <div className="evaluation-selector-label">Evaluation:</div>
                        <div className="evaluation-selector-holder">
                            <Select
                                onChange={this.selectEvaluation}
                                options={this.props.evaluationOptions}
                                defaultValue={this.state.currentEval}
                            />
                        </div>
                    </div>
                </div>
                {this.state.currentEval !== '' &&
                    <Query query={scenario_names_aggregation} variables={{ "evalNumber": this.state?.currentEval?.value }}>
                        {
                            ({ loading, error, data }) => {
                                if (loading) return <div>Loading ...</div>
                                if (error) return <div>Error</div>

                                const scenarioNameOptions = data[getScenarioNamesQueryName];
                                let scenariosArray = [];
                                for (let i = 0; i < scenarioNameOptions.length; i++) {
                                    scenariosArray.push({
                                        "id": scenarioNameOptions[i]._id.id,
                                        "name": scenarioNameOptions[i]._id.name
                                    });
                                }
                                scenariosArray.sort((a, b) => (a.id > b.id) ? 1 : -1);

                                return (
                                    <div className="home-container">
                                        {scenariosArray.length === 0 ? <p>This page is not available for the selected evaluation.</p> :
                                            scenariosArray.map(scenario =>
                                                <div className='chart-home-container' key={"id_" + scenario.id}>
                                                    <div className='chart-header'>
                                                        <div className='chart-header-label'>
                                                            <h4>{this.getHeaderLabel(scenario.id, scenario.name)}</h4>
                                                        </div>
                                                    </div>
                                                    <ScoreChart testid={scenario.id} evalNumber={this.state.currentEval.value} />
                                                </div>
                                            )
                                        }
                                    </div>
                                )
                            }
                        }
                    </Query>
                }
            </div>

        );
    }
}

export default AdmCharts;