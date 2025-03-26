import React from 'react';
import ScoreChart from './scoreChart';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import Select from 'react-select';

const getScenarioNamesQueryName = "getScenarioNamesByEval";

const scenario_names_aggregation = gql`
    query getScenarioNamesByEval($evalNumber: Float!){
        getScenarioNamesByEval(evalNumber: $evalNumber)
  }`;

class AdmCharts extends React.Component {

    constructor(props) {
        super();

        const filteredOptions = props.evaluationOptions.filter(option => option.value !== 7);
        filteredOptions.sort((a, b) => (a.value < b.value) ? 1 : -1);
        this.filteredOptions = filteredOptions
        this.state = {
            currentEval: filteredOptions[0],
        }

        this.selectEvaluation = this.selectEvaluation.bind(this);
    }

    selectEvaluation(target) {
        this.setState({
            currentEval: target
        });
    }

    getHeaderLabel(id, name) {
        if (this.state.currentEval.value < 3) {
            if (id.toLowerCase().indexOf("adept") > -1) {
                return ("BBN: " + id + " " + name);
            } else {
                return ("Soartech: " + id + " " + name);
            }
        } else if (this.state.currentEval.value == 3) {
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
                                options={this.filteredOptions}
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
                                        {
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