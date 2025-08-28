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
import {
  multiSort,
  isExpandable,
  snakeCaseToNormalCase,
  formatPathTitle,
  formatLeaf,
  pathKey,
  deepIsEmpty,
  isEmpty,
  getNodeAtPath,
  collectExpandablePaths,
  formatADMString,
  formatScenarioString,
  getDisplayCommandName,
  extractKdmaPairsFromHistory,
  kdmaAcronym
} from './utils';

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

function AutoFitText({ text, max = 16, min = 11, className = '' }) {
  const wrapRef = React.useRef(null);
  const spanRef = React.useRef(null);
  const [size, setSize] = React.useState(max);
  const rafRef = React.useRef(0);

  const fit = React.useCallback(() => {
    const wrap = wrapRef.current;
    const span = spanRef.current;
    if (!wrap || !span) return;
    const maxWidth = Math.max(0, wrap.clientWidth - 4);
    let s = size;
    const overflow = span.scrollWidth > maxWidth;
    if (overflow && s > min) {
      const next = Math.max(min, +(s - 0.4).toFixed(2));
      if (next !== s) {
        span.style.fontSize = `${next}px`;
        setSize(next);
      }
    } else if (!overflow && s < max) {
      const next = Math.min(max, +(s + 0.4).toFixed(2));
      span.style.fontSize = `${next}px`;
      if (span.scrollWidth <= maxWidth && next !== s) setSize(next);
      else span.style.fontSize = `${s}px`;
    }
  }, [max, min, text, size]);

  React.useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => fit());
  }, [fit, text]);

  React.useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !('ResizeObserver' in window)) return;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => fit());
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [fit]);

  return (
    <div ref={wrapRef} className={`command-name autofit ${className}`}>
      <span ref={spanRef} style={{ fontSize: `${size}px`, whiteSpace: 'nowrap', display: 'inline-block' }}>
        {text}
      </span>
    </div>
  );
}

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
            selectedIndex: 0,
            truncateLong: true,
            expandedPathsParams: new Set(),
            expandedPathsResponse: new Set(),
            inspectorOpen: false,
            inspectorNode: null,
            inspectorTitle: '',
            inspectorRoot: null,
            inspectorPath: [],
            inspectorRootLabel: 'Root'
        }
    }

    componentDidMount() {
        window.addEventListener('scroll', this.toggleVisibility);
        this._onKeyDown = (e) => {
          if (e.key === 'Escape') this.setState({ inspectorOpen: false });
        };
        window.addEventListener('keydown', this._onKeyDown);
    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.toggleVisibility);
        window.removeEventListener('keydown', this._onKeyDown);
    }

    toggleVisibility = () => this.setState({ showScrollButton: window.pageYOffset > 300 });

    scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    selectCommand = (index) =>
      this.setState({
        selectedIndex: index,
        expandedPathsParams: new Set(),
        expandedPathsResponse: new Set(),
        inspectorOpen: false
      });

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

    openInspector = (root, pathArr = [], rootLabel = 'Root') => {
      this.setState({
        inspectorOpen: true,
        inspectorRoot: root,
        inspectorPath: Array.isArray(pathArr) ? pathArr : [],
        inspectorTitle: formatPathTitle(Array.isArray(pathArr) ? pathArr : []),
        inspectorRootLabel: rootLabel || 'Root',
      });
    };

    closeInspector = () => {
      this.setState({ inspectorOpen: false });
    };

  renderTreeRows = (obj, path = [], depth = 0, responseCtx = null, parentObj = null, scope = 'params', root = null, basePath = []) => {
      const rows = [];
      if (!isExpandable(obj)) return rows;
      const setName = scope === 'resp' ? 'expandedPathsResponse' : 'expandedPathsParams';

      if (Array.isArray(obj)) {
        obj.forEach((value, idx) => {
          const childPath = [...path, `[${idx}]`];
          const pathId = pathKey(childPath);
          const expandable = isExpandable(value);
          const expanded = expandable && this.state[setName].has(pathId);

          rows.push(
            <TableRow key={pathId} className="tree-row">
              <TableCell className="tree-key">
                <div className="tree-key-wrap" style={{ paddingLeft: depth * 14 }}>
                  {expandable ? (
                    <button
                      className="toggle-btn"
                      aria-label={expanded ? 'Collapse' : 'Expand'}
                      aria-expanded={expanded}
                      onClick={() => {
                        const next = new Set(this.state[setName]);
                        if (expanded) next.delete(pathId); else next.add(pathId);
                        this.setState({ [setName]: next });
                      }}
                    >
                      {expanded ? '▾' : '▸'}
                    </button>
                  ) : (
                    <span className="toggle-spacer" />
                  )}
                  <strong>{`[${idx}]`}</strong>
                </div>
              </TableCell>
              <TableCell className="tree-val">
                {!expandable ? (
                  <div className={this.state.truncateLong ? 'line-clip-1' : 'value-wrap'}>
                    {formatLeaf(value)}
                  </div>
                ) : (
                  <button
                    className="view-btn"
                    onClick={() =>
                    this.openInspector(
                      root ?? obj,
                      [...basePath, ...childPath],
                      scope === 'resp' ? 'Response' : 'Parameters'
                    )
                  }
                  >
                    View
                  </button>
                )}
              </TableCell>
            </TableRow>
          );

          if (expandable && expanded) {
            rows.push(...this.renderTreeRows(value, childPath, depth + 1, responseCtx, value, scope, root ?? obj, basePath));
          }
        });
        return rows;
      }

      const entries = Object.entries(obj).filter(([_, v]) => (this.state.hideEmpty ? !deepIsEmpty(v) : true));
      for (const [key, rawVal] of entries) {
        let value = rawVal;
        if (
          parentObj &&
          parentObj.action_type === 'APPLY_TREATMENT' &&
          key === 'treatment' &&
          responseCtx
        ) {
          const character = parentObj.character;
          const location = parentObj.location;
          for (const c of (responseCtx?.characters ?? [])) {
            if (c.id === character) {
              for (const inj of (c.injuries ?? [])) {
                if (inj.location === location && inj.treatments_applied) {
                  value = `${rawVal} (current count: ${inj.treatments_applied})`;
                  break;
                }
              }
            }
          }
        }
        const childPath = [...path, key];
        const pathId = pathKey(childPath);
        const expandable = isExpandable(value)
        const expanded = expandable && this.state[setName].has(pathId);

        rows.push(
          <TableRow key={pathId} className="tree-row">
            <TableCell className="tree-key">
              <div className="tree-key-wrap" style={{ paddingLeft: depth * 14 }}>
                {expandable ? (
                  <button
                    className="toggle-btn"
                    aria-label={expanded ? 'Collapse' : 'Expand'}
                    aria-expanded={expanded}
                    onClick={() => {
                      const next = new Set(this.state[setName]);
                      if (expanded) next.delete(pathId); else next.add(pathId);
                      this.setState({ [setName]: next });
                    }}
                  >
                    {expanded ? '▾' : '▸'}
                  </button>
                ) : (
                  <span className="toggle-spacer" />
                )}
                <strong>{snakeCaseToNormalCase(key)}</strong>
              </div>
            </TableCell>
            <TableCell className="tree-val">
              {!expandable ? (
                <div className={this.state.truncateLong ? 'line-clip-1' : 'value-wrap'}>
                   {formatLeaf(value)}
                </div>
              ) : (
                <button
                    className="view-btn"
                    onClick={() =>
                      this.openInspector(
                        root ?? obj,
                        [...basePath, ...childPath],
                        scope === 'resp' ? 'Response' : 'Parameters'
                      )
                    }
                >
                  View
                </button>
              )}
            </TableCell>
          </TableRow>
        );

        if (expandable && expanded) {
          if (Array.isArray(value)) {
            value.forEach((el, idx) => {
              const subPath = [...childPath, `[${idx}]`];
              const subId = pathKey(subPath);
              const isObj = isExpandable(el);
              const isSubExpanded = isObj && this.state[setName].has(subId);
              rows.push(
                <TableRow key={subId} className="tree-row">
                  <TableCell className="tree-key">
                    <div className="tree-key-wrap" style={{ paddingLeft: (depth + 1) * 14 }}>
                      {isObj ? (
                        <button
                          className="toggle-btn"
                          aria-label={isSubExpanded ? 'Collapse' : 'Expand'}
                          aria-expanded={isSubExpanded}
                          onClick={() => {
                            const next = new Set(this.state[setName]);
                            if (isSubExpanded) next.delete(subId); else next.add(subId);
                            this.setState({ [setName]: next });
                          }}
                        >
                          {isSubExpanded ? '▾' : '▸'}
                        </button>
                      ) : (
                        <span className="toggle-spacer" />
                      )}
                      <strong>{`[${idx}]`}</strong>
                    </div>
                  </TableCell>
                  <TableCell className="tree-val">
                    {!isObj ? (
                      <div className={this.state.truncateLong ? 'line-clip-1' : 'value-wrap'}>
                        {formatLeaf(el)}
                      </div>
                    ) : (
                      <button
                        className="view-btn"
                        onClick={() =>
                          this.openInspector(
                            root ?? obj,
                            [...basePath, ...childPath, `[${idx}]`],
                            scope === 'resp' ? 'Response' : 'Parameters'
                          )
                        }
                      >
                        View
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              );
              if (isObj && isSubExpanded) {
                rows.push(...this.renderTreeRows(el, [...childPath, `[${idx}]`], depth + 2, responseCtx, el, scope, root ?? obj, basePath));
              }
            });
          } else {
            rows.push(...this.renderTreeRows(value, childPath, depth + 1, responseCtx, value, scope, root ?? obj, basePath));
          }
        }
      }
      return rows;
    };

    renderTreeTable = (data, scope = 'params', responseCtx = null, rootOverride = null, basePath = []) => {
      if (!data || typeof data !== 'object') return null;
      return (
        <Table size="small" className="tree-table">
          <TableBody>
            {this.renderTreeRows(data, [], 0, responseCtx, data, scope, rootOverride ?? data, basePath)}
          </TableBody>
        </Table>
      );
    };

    renderValueOrTree = (data, scope = 'resp', responseCtx = null, rootOverride = null, basePath = []) => {
      if (data && typeof data === 'object') {
        return this.renderTreeTable(data, scope, responseCtx, rootOverride ?? data, basePath);
      }
      return (
        <div className="value-wrap">
          <div className={this.state.truncateLong ? 'line-clip-1' : 'value-wrap'}>
            {formatLeaf(data)}
          </div>
        </div>
      );
    };

    expandAllResponse = (resp) => {
      if (!resp || typeof resp !== 'object') return;
      const all = collectExpandablePaths(resp);
      this.setState({ expandedPathsResponse: all });
    };

    collapseAllResponse = () => {
      this.setState({ expandedPathsResponse: new Set() });
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
                                                                <ListItemText primary={formatScenarioString(this.state.evalNumber, item.value)} />
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
                                                                <ListItemText primary={formatADMString(item.value)} />
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
                                                            {(() => {
                                                                const kdmas = extractKdmaPairsFromHistory(testData.history);
                                                                const gridClass =
                                                                    `summary-grid ${kdmas.length===1 ? 'has-1-kdma' : ''} ${kdmas.length>=2 ? 'has-2-kdma' : ''}`;
                                                                return (
                                                            <div className={gridClass}>
                                                                <div className="summary-card card--scenario">
                                                                    <div className="summary-label">Scenario</div>
                                                                    <div className="summary-value">{this.state.scenario}</div>
                                                                </div>
                                                                <div className="summary-card card--adm">
                                                                    <div className="summary-label">ADM</div>
                                                                    <div className="summary-value">{formatADMString(this.state.adm)}</div>
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
                                                                            return Number.isFinite(num) ? num.toFixed(5) : 'N/A';
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                                {kdmas[0] && (
                                                                  <div className="summary-card card--kdma1">
                                                                    <div className="summary-label">{kdmaAcronym(kdmas[0].name)} KDMA Value</div>
                                                                    <div className="summary-value">
                                                                      {Number.isFinite(kdmas[0].value) ? kdmas[0].value.toFixed(5) : 'N/A'}
                                                                    </div>
                                                                  </div>
                                                                )}
                                                                {kdmas[1] && (
                                                                  <div className="summary-card card--kdma2">
                                                                    <div className="summary-label">{kdmaAcronym(kdmas[1].name)} KDMA Value</div>
                                                                    <div className="summary-value">
                                                                      {Number.isFinite(kdmas[1].value) ? kdmas[1].value.toFixed(5) : 'N/A'}
                                                                    </div>
                                                                  </div>
                                                                )}
                                                                <div className="summary-card card--align">
                                                                    <div className="summary-label">Alignment Target</div>
                                                                    <div className="summary-value">{this.state.alignmentTarget ?? 'N/A'}</div>
                                                                </div>
                                                                <div className={`controls-cell ${kdmas.length>=2 ? 'stack' : ''}`}>
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
                                                                    <FormControlLabel
                                                                        className="truncate-checkbox"
                                                                        control={
                                                                            <Checkbox
                                                                                size="small"
                                                                                checked={this.state.truncateLong}
                                                                                onChange={(e) => this.setState({ truncateLong: e.target.checked })}
                                                                            />
                                                                        }
                                                                        label="Truncate Text"
                                                                    />
                                                                </div>
                                                            </div>);
                                                            })()}
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
                                                                    title={getDisplayCommandName(h, {
                                                                      alignmentTarget: this.state.alignmentTarget,
                                                                      evalNumber: this.state.evalNumber,
                                                                      scenario: this.state.scenario
                                                                    })}
                                                                  >
                                                                <AutoFitText
                                                                    text={getDisplayCommandName(h, {
                                                                        alignmentTarget: this.state.alignmentTarget,
                                                                        evalNumber: this.state.evalNumber,
                                                                        scenario: this.state.scenario
                                                                    })}
                                                                />
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
                                                            const hasResponse = sel?.response !== undefined && sel?.response !== null && !isEmpty(sel.response);
                                                            const responseIsTree = hasResponse && typeof sel.response === 'object';
                                                            return (
                                                              <div className="right-col">
                                                                {hasParams && <div className="section-heading">Parameters</div>}
                                                                {hasParams && (
                                                                  <div className="panel-card">
                                                                    {this.renderTreeTable(
                                                                      sel.parameters,
                                                                      'params',
                                                                      sel.command === 'Take Action' ? sel.response : null,
                                                                      sel.parameters,
                                                                      []
                                                                    )}
                                                                  </div>
                                                                )}
                                                                {hasResponse && (
                                                                  <div className="section-bar">
                                                                    <div className="section-heading">Response</div>
                                                                    {responseIsTree && (
                                                                      <div className="section-controls">
                                                                        <button
                                                                          className="control-btn"
                                                                          onClick={() => this.expandAllResponse(sel.response)}
                                                                        >
                                                                          Expand All
                                                                        </button>
                                                                        <button
                                                                          className="control-btn"
                                                                          onClick={this.collapseAllResponse}
                                                                        >
                                                                          Collapse All
                                                                        </button>
                                                                      </div>
                                                                    )}
                                                                  </div>
                                                                )}
                                                                {hasResponse && (
                                                                  <div className="panel-card">
                                                                    {responseIsTree
                                                                      ? this.renderTreeTable(sel.response, 'resp', null, sel.response, [])
                                                                      : this.renderValueOrTree(sel.response)}
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
                {this.state.inspectorOpen && (
                  <div
                    className="inspector-backdrop"
                    role="presentation"
                    onClick={this.closeInspector}
                  >
                    <div
                      className="inspector-drawer"
                      role="dialog"
                      aria-modal="true"
                      aria-label="Inspector"
                      onClick={(e) => e.stopPropagation()}
                    >
                    <div className="inspector-header">
                        <nav className="inspector-breadcrumb" aria-label="Breadcrumb">
                          <ol className="crumbs">
                            <li className="crumb">
                              <button
                                type="button"
                                className="crumb-btn"
                                onClick={() =>
                                  this.setState({
                                    inspectorPath: [],
                                    inspectorTitle: this.state.inspectorRootLabel
                                  })
                                }
                              >
                                {this.state.inspectorRootLabel}
                              </button>
                            </li>
                            {this.state.inspectorPath.map((tok, i) => {
                              const label = tok.startsWith('[') ? tok : snakeCaseToNormalCase(tok);
                              const isLast = i === this.state.inspectorPath.length - 1;
                              return (
                                <React.Fragment key={`${tok}_${i}`}>
                                  <li className="crumb-sep" aria-hidden="true">›</li>
                                  <li className={`crumb ${isLast ? 'crumb-current' : ''}`}>
                                    {isLast ? (
                                      <span>{label}</span>
                                    ) : (
                                      <button
                                        type="button"
                                        className="crumb-btn"
                                        onClick={() =>
                                          this.setState({
                                            inspectorPath: this.state.inspectorPath.slice(0, i + 1),
                                            inspectorTitle: formatPathTitle(this.state.inspectorPath.slice(0, i + 1))
                                          })
                                        }
                                      >
                                        {label}
                                      </button>
                                    )}
                                  </li>
                                </React.Fragment>
                              );
                            })}
                          </ol>
                        </nav>
                        <button className="btn-link" onClick={this.closeInspector}>Close</button>
                      </div>
                      <div className="inspector-body">
                        {(() => {
                          const node = getNodeAtPath(this.state.inspectorRoot, this.state.inspectorPath);
                          return this.renderValueOrTree(
                            node,
                            'resp',
                            null,
                            this.state.inspectorRoot,
                            this.state.inspectorPath
                          );
                        })()}
                        <pre className="inspector-json">
                            {JSON.stringify(getNodeAtPath(this.state.inspectorRoot, this.state.inspectorPath), null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
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
