import * as React from 'react';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import gql from 'graphql-tag';
import AlignmentScoreBox from './alignmentScore';
import '../../css/results-page.css';
import { Query } from 'react-apollo';


const getScenarioNamesQueryName = "getScenarioNamesByEval";
const getPerformerADMByScenarioName = "getPerformerADMsForScenario";
const getTestByADMandScenarioName = "getTestByADMandScenario";
const getEvalNameNumbers = "getEvalNameNumbers";

const get_eval_name_numbers = gql`
    query getEvalNameNumbers{
        getEvalNameNumbers
  }`;

const scenario_names_aggregation = gql`
    query getScenarioNamesByEval($evalNumber: Float!){
        getScenarioNamesByEval(evalNumber: $evalNumber)
    }`;
const performer_adm_by_scenario = gql`
    query getPerformerADMsForScenario($admQueryStr: String, $scenarioID: ID){
        getPerformerADMsForScenario(admQueryStr: $admQueryStr, scenarioID: $scenarioID)
    }`;
const test_by_adm_and_scenario = gql`
    query getTestByADMandScenario($admQueryStr: String, $scenarioID: ID, $admName: ID){
        getTestByADMandScenario(admQueryStr: $admQueryStr, scenarioID: $scenarioID, admName: $admName)
    }`;

class ResultsTable extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            adm: "",
            scenario: "",
            evalNumber: null,
            ADMQueryString: "history.parameters.ADM Name",
        }
    }

    setEval(target) {
        this.setState({
            evalNumber: target,
            adm: "",
            scenario: "",
            ADMQueryString: target < 3 ? "history.parameters.ADM Name" : "history.parameters.adm_name"
        });
    }

    setScenario(target) {
        this.setState({
            scenario: target,
            adm: "",
        });
    }

    setPerformerADM(target) {
        this.setState({
            adm: target
        });
    }

    formatScenarioString(id) {
        if (this.state.evalNumber < 3) {
            if (id.toLowerCase().indexOf("adept") > -1) {
                return ("BBN: " + id);
            } else {
                return ("Soartech: " + id);
            }
        } else {
            if (id.toLowerCase().indexOf("metricseval") > -1) {
                return ("ADEPT: " + id);
            } else {
                return ("Soartech: " + id);
            }
        }
    }

    formatADMString(peformerADMString) {
        if (peformerADMString.indexOf("ALIGN-ADM") > -1) {
            return ("Kitware: " + peformerADMString);
        } else if (peformerADMString.indexOf("TAD") > -1) {
            return ("Parallax: " + peformerADMString);
        } else {
            return peformerADMString;
        }
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

                                        for (const element of evalOptionsRaw) {
                                            evalOptions.push({ value: element._id.evalNumber, label: element._id.evalName })
                                        }

                                        evalOptions.sort((a, b) => (a.value < b.value) ? 1 : -1)

                                        return (
                                            <List className="nav-list" component="nav" aria-label="secondary mailbox folder">
                                                {evalOptions.map((item, key) =>
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
                                    <Query query={scenario_names_aggregation} variables={{ "evalNumber": this.state.evalNumber }}>
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
                        {this.state.evalNumber !== null && this.state.scenario !== "" &&
                            <>
                                <div className="nav-header">
                                    <span className="nav-header-text">Performer/ADM</span>
                                </div>
                                <div className="nav-menu">
                                    <Query query={performer_adm_by_scenario} variables={{ "admQueryStr": this.state.ADMQueryString, "scenarioID": this.state.scenario }}>
                                        {
                                            ({ loading, error, data }) => {
                                                if (loading) return <div>Loading ...</div>
                                                if (error) return <div>Error</div>

                                                const performerADMOptions = data[getPerformerADMByScenarioName];
                                                let performerADMArray = [];
                                                for (const element of performerADMOptions) {
                                                    performerADMArray.push({
                                                        "value": element,
                                                        "name": element
                                                    });
                                                }
                                                performerADMArray.sort((a, b) => (a.value > b.value) ? 1 : -1);

                                                return (
                                                    <List className="nav-list" component="nav" aria-label="secondary mailbox folder">
                                                        {performerADMArray.map((item, key) =>
                                                            <ListItem className="nav-list-item" id={"performeradm_" + key} key={"performeradm_" + key}
                                                                button
                                                                selected={this.state.adm === item.value}
                                                                onClick={() => this.setPerformerADM(item.value)}>
                                                                <ListItemText primary={this.formatADMString(item.value)} />
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
                        {(this.state.evalNumber !== null && this.state.scenario !== "" && this.state.adm !== "") &&
                            <Query query={test_by_adm_and_scenario} variables={{ "admQueryStr": this.state.ADMQueryString, "scenarioID": this.state.scenario, "admName": this.state.adm }}>
                                {
                                    ({ loading, error, data }) => {
                                        if (loading) return <div>Loading ...</div>
                                        if (error) return <div>Error</div>
                                        const testData = data[getTestByADMandScenarioName];

                                        return (
                                            <>
                                                {testData !== null && testData !== undefined &&
                                                    <>
                                                        <AlignmentScoreBox performer={this.formatADMString(this.state.adm)} data={testData} scenario={this.state.scenario} />
                                                        <div className='paper-container'>
                                                            <TableContainer className="TableContainer">
                                                                <Table stickyHeader aria-label="simple table">
                                                                    <TableBody className='TableBodyScrollable'>
                                                                        {testData.history.map((item, index) => (
                                                                            <TestHistoryRow key={index} item={item} index={index}/>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>
                                                            </TableContainer>
                                                        </div>
                                                    </>
                                                }
                                            </>
                                        )
                                    }
                                }
                            </Query>
                        }
                    </div>
                </div>
            </div>
        );
    }
}


function TestHistoryRow({ item, index }) {
    const [open, setOpen] = React.useState(false);

    const renderNestedItems= (item) => {
        if (isObject(item)) {
            return renderNestedTable(item);
        } else if (Array.isArray(item)) {
            return (
                <>
                    {item.map((el, i) => <React.Fragment key={i}>{renderNestedItems(el)}</React.Fragment>)}
                </>
            );
        } else {
            return <span>{item}</span>;
        }
    }

    const renderNestedTable = (tableData) => {
        return (
            <Table size="small">
                <TableBody>
                    {Object.entries(tableData).map(([key, value], i) => (
                        <TableRow key={i}>
                            <TableCell className='tableCellKey'>
                                <strong>{snakeCaseToNormalCase(key)}</strong>
                            </TableCell>
                            <TableCell className='tableCellValue'>{renderNestedItems(value)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    }


    const isObject = (item) => {
        return (typeof item === 'object' && !Array.isArray(item) && item !== null);
    }

    const snakeCaseToNormalCase = (string) => {
        return string
            .replace(/_/g, ' ')
            .replace(/(^\w|\s\w)/g, m => m.toUpperCase());
    }

    return (
        <React.Fragment>
            <TableRow onClick={() => setOpen(!open)}>
                <TableCell className="tableCellIcon">
                <IconButton
                        aria-label="expand row"
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpen(!open);
                        }}
                    >
                        {open ? <KeyboardArrowUpIcon fontSize='large'/> : <KeyboardArrowDownIcon fontSize='large'/>}
                    </IconButton>
                </TableCell>
                <TableCell className="tableCellCommand">
                    <Typography><strong>Command:</strong> {item.command}</Typography>
                    <Typography>Parameters: {!(Object.keys(item.parameters).length > 0) ? "None" : ""}</Typography>  
                    {renderNestedItems(item.parameters)}
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            <Typography><strong>Response:</strong></Typography>
                            <div style={{ paddingLeft: '16px' }}>
                                {renderNestedItems(item.response)}
                            </div>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment>
    );
}


export default ResultsTable;
