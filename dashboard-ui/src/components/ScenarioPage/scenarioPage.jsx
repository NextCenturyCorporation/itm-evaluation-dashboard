import React from 'react';
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableContainer from "@material-ui/core/TableContainer";
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import '../../css/scenario-page.css';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';

const getScenarioName = "getScenario";
const getScenarioNamesQueryName = "getScenarioNamesByEval";
const getEvalNameNumbers = "getEvalNameNumbers";

const get_eval_name_numbers = gql`
    query getEvalNameNumbers{
        getEvalNameNumbers
    }`;
const scenario_names_aggregation = gql`
    query getScenarioNamesByEval($evalNumber: Float!){
        getScenarioNamesByEval(evalNumber: $evalNumber)
    }`;
const GET_ITM_SCENARIO = gql`
    query getScenario($scenarioId: ID) {
        getScenario(scenarioId: $scenarioId) 
    }`;

class ScenarioPage extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            scenario: "",
            evalNumber: null,
        }
    }

    setEval(target){
        this.setState({
            evalNumber: target,
            scenario: "",
        });
    }

    setScenario(target) {
        this.setState({
            scenario: target
        });
    }

    formatScenarioString(id) {
        if(this.state.evalNumber < 3) {
            if(id.toLowerCase().indexOf("adept") > -1 ) {
                return ("BBN: " + id);
            } else {
                return ("Soartech: " + id);
            }
        } else {
            if(id.toLowerCase().indexOf("metricseval") > -1 ) {
                return ("ADEPT: " + id);
            } else {
                return ("Soartech: " + id);
            }
        }
    }

    isObject(item) {
        return (typeof item === 'object' && !Array.isArray(item) && item !== null);
    }

    renderNestedItems(item) {
        if (this.isObject(item)) {
            return this.renderNestedTable(item);
        } else if (Array.isArray(item)) {
            return (
                <ul>
                    {item.map((el, i) => <li key={i}>{this.renderNestedItems(el)}</li>)}
                </ul>
            );
        } else {
            return <span>{item}</span>;
        }
    }

    renderNestedTable(data) {
        return (
            <Table size="small">
                <TableBody>
                    {Object.entries(data).map(([key, value], i) => (
                        key !== "__typename" &&
                        <TableRow key={i}>
                            <TableCell className="tableCell">{key}</TableCell>
                            <TableCell className="tableCell">{this.renderNestedItems(value)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    }

    render() {
        return (
            <div className="layout">
                <div className="layout-board">
                    <div className="nav-section">
                        <div className="nav-header">
                            <span className="nav-header-text">Evaluation</span>
                        </div>
                        <div className="nav-menu">
                            <Query query={get_eval_name_numbers}>
                            {
                                ({ loading, error, data }) => {
                                    if (loading) return <div>Loading ...</div> 
                                    if (error) return <div>Error</div>

                                    const evalOptionsRaw = data[getEvalNameNumbers];
                                    let evalOptions = [];

                                    for(let i=0; i < evalOptionsRaw.length; i++) {
                                        evalOptions.push({value: evalOptionsRaw[i]._id.evalNumber, label:  evalOptionsRaw[i]._id.evalName})
                                    }

                                    evalOptions.sort((a, b) => (a.value < b.value) ? 1 : -1)

                                    return (
                                        <List className="nav-list" component="nav" aria-label="secondary mailbox folder">
                                            {evalOptions.map((item,key) =>
                                                <ListItem className="nav-list-item" id={"eval_" + key} key={"eval_" + key}
                                                    button
                                                    selected={this.state.evalNumber === item.value}
                                                    onClick={() => this.setEval(item.value)}>
                                                    <ListItemText primary={item.label} />
                                                </ListItem>
                                            )}
                                        </List>
                                    )
                                }
                            }
                            </Query>
                        </div>
                        {this.state.evalNumber !== null &&
                            <>
                                <div className="nav-header">
                                    <span className="nav-header-text">Scenario</span>
                                </div>
                                <div className="nav-menu">
                                    <Query query={scenario_names_aggregation}  variables={{"evalNumber": this.state.evalNumber}}>
                                        {
                                            ({ loading, error, data }) => {
                                                if (loading) return <div>Loading ...</div>
                                                if (error) return <div>Error</div>

                                                const scenarioNameOptions = data[getScenarioNamesQueryName];
                                                let scenariosArray = [];
                                                for (const element of scenarioNameOptions) {
                                                    scenariosArray.push({
                                                        "value": element._id.id,
                                                        "name": element._id.name
                                                    });
                                                }
                                                scenariosArray.sort((a, b) => (a.value > b.value) ? 1 : -1);

                                                return (
                                                    <List className="nav-list" component="nav" aria-label="secondary mailbox folder">
                                                        {scenariosArray.map((item, key) =>
                                                            <ListItem className="nav-list-item" id={"scenario_" + key} key={"scenario_" + key}
                                                                button
                                                                selected={this.state.scenario === item.value}
                                                                onClick={() => this.setScenario(item.value)}>
                                                                <ListItemText primary={this.formatScenarioString(item.value)} />
                                                            </ListItem>
                                                        )}
                                                    </List>
                                                )
                                            }
                                        }
                                    </Query>
                                </div>
                            </>
                        }
                    </div>
                    <div className="test-overview-area">
                        {(this.state.scenario !== "") &&
                            <Query query={GET_ITM_SCENARIO} variables={{ "scenarioId": this.state.scenario }}>
                                {
                                    ({ loading, error, data }) => {
                                        if (loading) return <div>Loading ...</div>
                                        if (error) return <div>Error</div>

                                        const scenarioData = data[getScenarioName];

                                        return (
                                            <TableContainer className="TableContainer">
                                                <Table stickyHeader aria-label="simple table">
                                                    <TableHead className="TableHead">
                                                        <TableRow>
                                                            <TableCell className="tableCell main">
                                                                Scenario: {this.formatScenarioString(this.state.scenario)}
                                                            </TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        <TableRow className="TableHead">
                                                            <TableCell className="tableCell main">
                                                                {this.renderNestedItems(scenarioData)}
                                                            </TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        );
                                    }
                                }
                            </Query>
                        }
                    </div>
                </div>
            </div>
        )
    }
}

export default ScenarioPage;
