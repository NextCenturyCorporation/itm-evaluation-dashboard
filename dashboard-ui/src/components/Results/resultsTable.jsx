import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import gql from 'graphql-tag';
import '../../css/results-page.css';
import { Query } from 'react-apollo';
import { RQ2223 } from '../Research/tables/rq22-rq23';
import { MultiKDMA_RQ23 as MultiKdmaRq23 } from '../Research/tables/rq23_multiKDMA'
import { PH2RQ2223 } from '../Research/tables/ph2_rq22-rq23';

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

export const multiSort = (a, b) => {
    const aMatch = a.match(/^([a-zA-Z]+)(\d+)$/);
    const bMatch = b.match(/^([a-zA-Z]+)(\d+)$/);

    // only if same base string
    if (aMatch && bMatch && aMatch[1] === bMatch[1]) {
        return parseInt(aMatch[2], 10) - parseInt(bMatch[2], 10);
    }

    // if different base string just use alph.
    return a.localeCompare(b);
};


class ResultsTable extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            adm: "",
            scenario: "",
            evalNumber: 9,
            ADMQueryString: "history.parameters.adm_name",
            showScrollButton: false,
            alignmentTarget: null,
            hideEmpty: true,
            expandAllVersion: 0,
            collapseAllVersion: 0,
            selectedIndex: 0,
            truncateLong: true
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


    handleExpandAll = () => this.setState({ truncateLong: false });
    handleCollapseAll = () => this.setState({ truncateLong: true });

    selectCommand = (index) => this.setState({ selectedIndex: index });

    setEval(target) {
        this.setState({
            evalNumber: target,
            adm: "",
            scenario: "",
            ADMQueryString: target < 3 ? "history.parameters.ADM Name" : "history.parameters.adm_name",
            alignmentTarget: null,
            selectedIndex: 0
        });
    }

    setScenario(target) {
        this.setState({
            scenario: target,
            adm: "",
            alignmentTarget: null,
            selectedIndex: 0
        });
    }

    setPerformerADM(target) {
        this.setState({
            adm: target,
            alignmentTarget: null,
            selectedIndex: 0
        });
    }

    setAlignmentTarget(target) {
        this.setState({
            alignmentTarget: target,
            selectedIndex: 0
        });
    }

    formatScenarioString(id) {
        if (this.state.evalNumber < 3) {
            if (id.toLowerCase().indexOf("adept") > -1) {
                return ("BBN: " + id);
            } else {
                return ("Soartech: " + id);
            }
        } else if (this.state.evalNumber === 3) {
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

    renderRq2() {
        const { evalNumber, scenario, adm } = this.state;
        if (evalNumber >= 4) {
            if (evalNumber === 7) {
                return <MultiKdmaRq23 />;
            } else if (evalNumber >= 8) {
                return <PH2RQ2223 evalNum={evalNumber}/>;
            } else {
                return <RQ2223 evalNum={evalNumber} />;
            }
        } else {
            let message = "Please select a";
            if (!scenario) {
                message += " scenario";
            } else if (!adm) {
                message += "n ADM";
            } else {
                message += "n alignment target";
            }

            return (
                <div className="graph-section">
                    <h2>{message} to view results</h2>
                </div>
            );
        }
    }

    isEmpty = (v) => v === null || v === undefined || v === '' || v === 'Unknown' || (Array.isArray(v) && v.length === 0) || (this.isObject(v) && Object.keys(v).length === 0);

    renderNestedItemsInline = (item, response = null) => {
        if (this.isObject(item)) {
            return this.renderNestedTableInline(item, response);
        } else if (Array.isArray(item)) {
            return <>{item.filter(el => (this.state.hideEmpty ? !this.isEmpty(el) : true))
                       .map((el, i) => <React.Fragment key={i}>{this.renderNestedItemsInline(el)}</React.Fragment>)}</>;
        } else {
            return <span>{this.truncateText(item)}</span>;
        }
    };

    renderNestedTableInline = (tableData, response = null) => {
        const isTreatment = Object.keys(tableData).includes('action_type') && tableData['action_type'] === 'APPLY_TREATMENT';
        const character = tableData['character'];
        const location = tableData['location'];
        return (
            <Table size="small" className="kv-table">
                <TableBody>
                    {Object.entries(tableData)
                        .filter(([_, v]) => (this.state.hideEmpty ? !this.isEmpty(v) : true))
                        .map(([key, value], i) => {
                            if (isTreatment && response && key === 'treatment') {
                                for (const c of (response?.characters ?? [])) {
                                    if (c['id'] === character) {
                                        for (const injury of c['injuries']) {
                                            if (injury['location'] === location) {
                                                if (injury['treatments_applied'])
                                                    value = `${value} (current count: ${injury['treatments_applied']})`;
                                                break;
                                            }
                                        }
                                        break;
                                    }
                                }
                            }
                            return (
                                <TableRow key={i} className="kv-row">
                                    <TableCell className='kv-key'><strong>{this.snakeCaseToNormalCase(key)}</strong></TableCell>
                                    <TableCell className='kv-val'>{this.renderNestedItemsInline(value)}</TableCell>
                                </TableRow>
                            );
                        })}
                </TableBody>
            </Table>
        );
    };

    isObject = (item) => (typeof item === 'object' && !Array.isArray(item) && item !== null);
    
    snakeCaseToNormalCase = (string) => string.replace(/_/g, ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase());

    truncateText = (s) => {
        if (!this.state.truncateLong || typeof s !== 'string') return s;
        const max = 200;
        return s.length > max ? `${s.slice(0, max)}…` : s;
    };

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
                                                {evalOptions.map((item, key) => (
                                                    <ListItem
                                                        className="nav-list-item"
                                                        id={"eval_" + key}
                                                        key={"eval_" + key}
                                                        button
                                                        selected={this.state.evalNumber === item.value}
                                                        onClick={() => this.setEval(item.value)}
                                                    >
                                                        <ListItemText primary={item.label} />
                                                    </ListItem>
                                                ))}
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

                                                const alignmentTargets = (data[getAlignmentTargetsPerScenario] || [])
                                                  .map(el => ({ value: el, name: el }))
                                                  .sort((a, b) => multiSort(a.value, b.value));

                                                return (
                                                  <div>
                                                    <List className="nav-list" component="nav" aria-label="secondary mailbox folder">
                                                      {alignmentTargets.map((item, key) => (
                                                        <ListItem
                                                          className="nav-list-item"
                                                          id={"alignTarget_" + key}
                                                          key={"alignTarget_" + key}
                                                          button
                                                          selected={this.state.alignmentTarget === item.value}
                                                          onClick={() => this.setAlignmentTarget(item.value)}
                                                        >
                                                          <ListItemText primary={item.value} />
                                                        </ListItem>
                                                      ))}
                                                    </List>
                                                  </div>
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
                                                        <div className="results-header">
                                                            <div className="summary-grid">
                                                                <div className="summary-card card--scenario">
                                                                    <div className="summary-label">Scenario</div>
                                                                    <div className="summary-value">{this.state.scenario}</div>
                                                                </div>
                                                                <div className="summary-card card--adm">
                                                                    <div className="summary-label">ADM</div>
                                                                    <div className="summary-value">{this.formatADMString(this.state.adm)}</div>
                                                                </div>
                                                                <div className="summary-card card--score">
                                                                    <div className="summary-label">Alignment Score</div>
                                                                    <div className="summary-value">
                                                                        {(() => {
                                                                            const hist = Array.isArray(testData?.history) ? testData.history : [];
                                                                            const last = hist.length ? hist[hist.length - 1] : null;
                                                                            const raw = last?.response?.score;
                                                                            const num = typeof raw === 'number' ? raw
                                                                                      : (typeof raw === 'string' ? parseFloat(raw) : NaN);
                                                                            return Number.isFinite(num) ? num : '—';
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                                <div className="summary-card card--align">
                                                                    <div className="summary-label">Alignment Target</div>
                                                                    <div className="summary-value">{this.state.alignmentTarget ?? '—'}</div>
                                                                </div>
                                                                <div className="controls-cell">
                                                                    <button className="control-btn" onClick={this.handleExpandAll}>Expand</button>
                                                                    <button className="control-btn" onClick={this.handleCollapseAll}>Collapse</button>
                                                                    <FormControlLabel
                                                                        className="hide-empty-checkbox"
                                                                        control={
                                                                            <Checkbox
                                                                                size="small"
                                                                                checked={this.state.hideEmpty}
                                                                                onChange={(e) => this.setState({ hideEmpty: e.target.checked })}
                                                                            />
                                                                        }
                                                                        label="Hide Empty Fields"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="results-body">
                                                          <div className="left-col">
                                                            <div className="section-heading">Commands</div>
                                                            <div className="commands-pane">
                                                              <ul className="commands-timeline" role="list">
                                                                {testData.history.map((h, i) => (
                                                                  <li
                                                                    key={`${h.command}_${i}`}
                                                                    className={`command-item ${i === this.state.selectedIndex ? 'active' : ''}`}
                                                                    onClick={() => this.selectCommand(i)}
                                                                    title={h.command}
                                                                  >
                                                                    <span className="command-name">{h.command}</span>
                                                                  </li>
                                                                ))}
                                                              </ul>
                                                            </div>
                                                          </div>
                                                          {(() => {
                                                            const hist = Array.isArray(testData?.history) ? testData.history : [];
                                                            const idx = Math.min(this.state.selectedIndex, Math.max(hist.length - 1, 0));
                                                            const sel = hist[idx] || {};
                                                            const hasParams = sel?.parameters && Object.keys(sel.parameters).length > 0;
                                                            const hasResponse = sel?.response && !(this.isEmpty(sel.response));
                                                            return (
                                                              <div className="right-col">
                                                                {hasParams && <div className="section-heading">Parameters</div>}
                                                                {hasParams && (
                                                                  <div className="params-table">
                                                                    {this.renderNestedItemsInline(sel.parameters, sel.command === 'Take Action' ? sel.response : null)}
                                                                  </div>
                                                                )}
                                                                {hasResponse && <div className="section-heading">Response</div>}
                                                                {hasResponse && (
                                                                  <div className="response-table">
                                                                    {this.renderNestedItemsInline(sel.response)}
                                                                  </div>
                                                                )}
                                                              </div>
                                                            );
                                                          })()}
                                                        </div>
                                                    </>
                                                }
                                            </>
                                        )
                                    }
                                }
                            </Query> :
                            <>
                                {this.renderRq2()}
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

export default ResultsTable;
