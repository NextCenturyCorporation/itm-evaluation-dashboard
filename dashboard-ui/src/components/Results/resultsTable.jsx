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
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import gql from 'graphql-tag';
import AlignmentScoreBox from './alignmentScore';
import '../../css/results-page.css';
import { Query } from 'react-apollo';
import { RQ2223 } from '../Research/tables/rq22-rq23';


const getScenarioNamesQueryName = "getScenarioNamesByEval";
const getPerformerADMByScenarioName = "getPerformerADMsForScenario";
const getTestByADMandScenarioName = "getTestByADMandScenario";
const getEvalNameNumbers = "getEvalNameNumbers";
const getAlignmentTargetsPerScenario = "getAlignmentTargetsPerScenario";

const get_eval_name_numbers = gql`
    query getEvalNameNumbers{
        getEvalNameNumbers
  }`;

const scenario_names_aggregation = gql`
    query getScenarioNamesByEval($evalNumber: Float!){
        getScenarioNamesByEval(evalNumber: $evalNumber)
    }`;
const performer_adm_by_scenario = gql`
    query getPerformerADMsForScenario($admQueryStr: String, $scenarioID: ID, $evalNumber: Float){
        getPerformerADMsForScenario(admQueryStr: $admQueryStr, scenarioID: $scenarioID, evalNumber: $evalNumber)
    }`;
const test_by_adm_and_scenario = gql`
    query getTestByADMandScenario($admQueryStr: String, $scenarioID: ID, $admName: ID, $alignmentTarget: String, $evalNumber: Int){
        getTestByADMandScenario(admQueryStr: $admQueryStr, scenarioID: $scenarioID, admName: $admName, alignmentTarget: $alignmentTarget, evalNumber: $evalNumber)
    }`;
const alignment_target_by_scenario = gql`
    query getAlignmentTargetsPerScenario($evalNumber: Float!, $scenarioID: ID, $admName: ID){
        getAlignmentTargetsPerScenario(evalNumber: $evalNumber, scenarioID: $scenarioID, admName: $admName)
    }`;


class ResultsTable extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            adm: "",
            scenario: "",
            evalNumber: 7,
            ADMQueryString: "history.parameters.adm_name",
            showScrollButton: false,
            alignmentTarget: null
        }
    }

    componentDidMount() {
        window.addEventListener('scroll', this.toggleVisibility);
    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.toggleVisibility);
    }

    toggleVisibility = () => {
        if (window.pageYOffset > 300) {
            this.setState({
                showScrollButton: true
            });
        } else {
            this.setState({
                showScrollButton: false
            });
        }
    };

    scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    setEval(target) {
        this.setState({
            evalNumber: target,
            adm: "",
            scenario: "",
            ADMQueryString: target < 3 ? "history.parameters.ADM Name" : "history.parameters.adm_name",
            alignmentTarget: null
        });
    }

    setScenario(target) {
        this.setState({
            scenario: target,
            adm: "",
            alignmentTarget: null
        });
    }

    setPerformerADM(target) {
        this.setState({
            adm: target,
            alignmentTarget: null
        });
    }

    setAlignmentTarget(target) {
        this.setState({
            alignmentTarget: target
        });
    }

    formatScenarioString(id) {
        if (this.state.evalNumber < 3) {
            if (id.toLowerCase().indexOf("adept") > -1) {
                return ("BBN: " + id);
            } else {
                return ("Soartech: " + id);
            }
        } else if (this.state.evalNumber == 3) {
            if (id.toLowerCase().indexOf("metricseval") > -1) {
                return ("ADEPT: " + id);
            } else {
                return ("Soartech: " + id);
            }
        } else {
            if (id.toLowerCase().includes("qol") || id.toLowerCase().includes("vol")) {
                return ("Soartech: " + id);
            } else {
                return ("Adept: " + id);
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
                                    <Query query={performer_adm_by_scenario} variables={{ "admQueryStr": this.state.ADMQueryString, "scenarioID": this.state.scenario, "evalNumber": this.state.evalNumber }}>
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
                        {(this.state.evalNumber >= 3 && this.state.scenario !== "" && this.state.adm !== "") &&
                            <>
                                <div className="nav-header">
                                    <span className="nav-header-text">Alignment Target</span>
                                </div>
                                <div className="nav-menu">
                                    <Query query={alignment_target_by_scenario} variables={{ "evalNumber": this.state.evalNumber, "scenarioID": this.state.scenario, "admName": this.state.adm }}>
                                        {
                                            ({ loading, error, data }) => {
                                                if (loading) return <div>Loading ...</div>
                                                if (error) return <div>Error</div>

                                                const alignmentTargetOptions = data[getAlignmentTargetsPerScenario];
                                                let alignmentTargetArray = [];
                                                for (const element of alignmentTargetOptions) {
                                                    alignmentTargetArray.push({
                                                        "value": element,
                                                        "name": element
                                                    });
                                                }
                                                alignmentTargetArray.sort((a, b) => (a.value > b.value) ? 1 : -1);

                                                return (
                                                    <List className="nav-list" component="nav" aria-label="secondary mailbox folder">
                                                        {alignmentTargetArray.map((item, key) =>
                                                            <ListItem className="nav-list-item" id={"alignTarget_" + key} key={"alignTarget_" + key}
                                                                button
                                                                selected={this.state.alignmentTarget === item.value}
                                                                onClick={() => this.setAlignmentTarget(item.value)}>
                                                                <ListItemText primary={item.value} />
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
                        {((this.state.evalNumber < 3 && this.state.scenario !== "" && this.state.adm !== "") || (
                            this.state.evalNumber >= 3 && this.state.scenario !== "" && this.state.adm !== "" && this.state.alignmentTarget !== null)) ?
                            <Query query={test_by_adm_and_scenario} variables={{ "admQueryStr": this.state.ADMQueryString, "scenarioID": this.state.scenario, "admName": this.state.adm, "alignmentTarget": this.state.alignmentTarget, "evalNumber": this.state.evalNumber }}>
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
                                                            <TableContainer>
                                                                <Table className='itm-table' stickyHeader aria-label="simple table">
                                                                    <TableBody className='TableBodyScrollable'>
                                                                        {testData.history.map((item, index) => (
                                                                            <ActionRow key={item.command + index} item={item} />
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
                            </Query> :
                            <>
                                {(this.state.evalNumber >= 4) && (this.state.evalNumber != 7) ?
                                    <RQ2223 evalNum={this.state.evalNumber} /> :
                                    <div className="graph-section">
                                        <h2>Please select a{this.state.scenario == "" ? " scenario" : this.state.adm == "" ? "n ADM" : "n alignment target"} to view results</h2>
                                    </div>}
                            </>
                        }
                    </div>
                </div>
                {this.state.showScrollButton && (
                    <IconButton onClick={(e) => {
                        e.stopPropagation()
                        this.scrollToTop()
                    }} style={{
                        position: 'fixed',
                        left: '20px',
                        bottom: '20px',
                        borderRadius: '10px',
                        backgroundColor: '#592610',
                        color: 'white',
                        cursor: 'pointer',
                        zIndex: 1000,
                        boxShadow: '0px 2px 10px rgba(0,0,0,0.3)'
                    }}>
                        Back To Top <ArrowUpwardIcon fontSize='large' />
                    </IconButton>
                )}
            </div>
        );
    }
}


function ActionRow({ item }) {
    const [open, setOpen] = React.useState(false);

    const renderNestedItems = (item, response = null) => {
        // pass response through for treatment counts
        if (isObject(item)) {
            return renderNestedTable(item, response);
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

    const renderNestedTable = (tableData, response = null) => {
        const isTreatment = Object.keys(tableData).includes('action_type') && tableData['action_type'] == 'APPLY_TREATMENT';
        const character = tableData['character'];
        const location = tableData['location'];
        return (
            <Table size="small">
                <TableBody>
                    {Object.entries(tableData).map(([key, value], i) => {
                        if (isTreatment && response && key == 'treatment') {
                            for (const c of (response?.characters ?? [])) {
                                if (c['id'] == character) {
                                    for (const injury of c['injuries']) {
                                        if (injury['location'] == location) {
                                            if (injury['treatments_applied'])
                                                value = value + ` (current count: ${injury['treatments_applied']})`;
                                            break;
                                        }
                                    }
                                    break;
                                }
                            }
                        }
                        return (
                            <TableRow key={i}>
                                <TableCell className='tableCellKey'>
                                    <strong>{snakeCaseToNormalCase(key)}</strong>
                                </TableCell>
                                <TableCell className='tableCellValue'>{renderNestedItems(value)}</TableCell>
                            </TableRow>
                        )
                    })}
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
            <TableRow className='noBorderRow' onClick={() => setOpen(!open)}>
                <TableCell className="noBorderCell tableCellIcon">
                    <IconButton
                        aria-label="expand row"
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpen(!open);
                        }}
                    >
                        {open ? <KeyboardArrowUpIcon fontSize='large' /> : <KeyboardArrowDownIcon fontSize='large' />}
                    </IconButton>
                </TableCell>
                <TableCell className="noBorderCell tableCellCommand">
                    <Typography><strong>Command:</strong> {item.command}</Typography>
                    <Typography>Parameters: {!(Object.keys(item.parameters).length > 0) ? "None" : ""}</Typography>
                    {renderNestedItems(item.parameters, item.command == 'Take Action' ? item.response : null)}
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
