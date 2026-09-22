import React from "react";
import '../../css/resultsTable.css';
import '../../css/admInfo.css';
import '../../css/repairAlignment.css';
import { Autocomplete, TextField, Modal, Box, Snackbar, Alert, TablePagination } from "@mui/material";
import { VisibilityOff, Delete, Build, CheckCircle, Error } from '@material-ui/icons';
import { useMutation, useQuery } from 'react-apollo'
import gql from "graphql-tag";
import { exportToExcel } from "../Research/utils";
import { isDefined } from "../AggregateResults/DataFunctions";
import { QueryErrorMessage } from "../ErrorHandling/QueryErrorMessage";
import { Spinner } from 'react-bootstrap';
import { SCENARIO_HEADERS } from "./progressUtils";
import { accountsClient, apolloClient } from "../../services/accountsService";
import AdmInfoModal from "./admInfoModal";
import RepairAlignmentModal from "./repairAlignmentModal";
import { GET_PROGRESS_DETAILS, evaluationLabel, formatProgressRows, fetchProgressExport } from "./participantProgressData";
import { useParticipantProgress } from "./useParticipantProgress";

const DELETE_PID_DATA = gql`
    mutation deleteDataByPID($caller: JSON!, $pid: String!) {
        deleteDataByPID(caller: $caller, pid: $pid) 
    }
`;

const UPDATE_SCENARIO_RESULT = gql`
    mutation updateScenarioResult($id: String!, $updates: JSON!) {
        updateScenarioResult(id: $id, updates: $updates)
    }
`;

const PROLIFIC_COLUMNS = ['Prolific ID', 'Contact ID', 'Survey Link'];

const HEADERS_PHASE1 = ['Participant ID', 'Participant Type', 'Evaluation', 'Prolific ID', 'Contact ID', 'Survey Link', 'Sim Date-Time', 'Sim Count', 'Sim-1', 'Sim-2', 'Sim-3', 'Sim-4', 'Del Start Date-Time', 'Del End Date-Time', 'Delegation', 'Del-1', 'Del-2', 'Del-3', 'Del-4', 'Text Start Date-Time', 'Text End Date-Time', 'Text', 'IO1', 'MJ1', 'MJ2', 'MJ4', 'MJ5', 'QOL1', 'QOL2', 'QOL3', 'QOL4', 'VOL1', 'VOL2', 'VOL3', 'VOL4'];

const HEADERS_PHASE2 = ['Participant ID', 'Participant Type', 'Evaluation', 'Prolific ID', 'Contact ID', 'Survey Link', 'Sim Date-Time', 'Sim Count', 'Sim-1', 'Sim-2', 'Del Start Date-Time', 'Del End Date-Time', 'Delegation', 'Del-1', 'Del-2', 'Del-3', 'Del-4', 'Del-5', 'Text Start Date-Time', 'Text End Date-Time', 'Text', 'Alignment Status', 'Subpop', 'AF1', 'AF2', 'AF3', 'MF1', 'MF2', 'MF3', 'PS1', 'PS2', 'PS3', 'SS1', 'SS2', 'SS3', 'PS-AF1', 'PS-AF2', 'AF-Bi', 'AF-Tri', 'MF-Bi', 'PS-Bi', 'PS-Tri', 'SS-Bi'];

const HEADERS_UK = ['Participant ID', 'Participant Type', 'Evaluation', 'Prolific ID', 'Contact ID', 'Survey Link', 'Sim Date-Time', 'Sim Count', 'Sim-1', 'Sim-2', 'Sim-3', 'Sim-4', 'Del Start Date-Time', 'Del End Date-Time', 'Delegation', 'Del-1', 'Del-2', 'Del-3', 'Text Start Date-Time', 'Text End Date-Time', 'Text', 'IO1', 'MJ1', 'MJ5', 'VOL2'];

// Eval-specific text thresholds; unlisted evals use phase-based defaults (Phase 2/UK: 4, Phase 1: 5)
const TEXT_THRESHOLD_BY_EVAL = { 13: 12, 17: 6 };
// Phase 2 evals that use a delegation threshold of 4 instead of 5
const DEL_THRESHOLD_4_EVALS = new Set([10, 16]);

export const computeTextThreshold = (evalNumber, isPH2OrUK) =>
    TEXT_THRESHOLD_BY_EVAL[evalNumber] ?? (isPH2OrUK ? 4 : 5);

const computeDelThreshold = (evalNumber, isUK, isPH2OrUK) => {
    if (isUK) return 3;
    if (isPH2OrUK && !DEL_THRESHOLD_4_EVALS.has(evalNumber)) return 5;
    return 4;
};

function formatLoading(val) {
    if (val === 'exemption') return 'Exemption';
    if (val === 'most aligned' || val === 'least aligned') return 'Normal';
    return val;
}

export function ParticipantProgressTable({ canViewProlific = false, isAdmin = false, currentUser = null }) {
    const KDMA_MAP = { AF: 'affiliation', MF: 'merit', PS: 'personal_safety', SS: 'search', MJ: 'Moral judgement', IO: 'Ingroup Bias', vol: 'PerceivedQuantityOfLivesSaved' };
    const [typeFilters, setTypeFilters] = React.useState([]);
    const [evalFilters, setEvalFilters] = React.useState([]);
    const [completionFilters, setCompletionFilters] = React.useState([]);
    const [columnsToHide, setColumnsToHide] = React.useState([]);
    const [sortOptions] = React.useState(['Participant ID ↑', 'Participant ID ↓', 'Text Start Time ↑', 'Text Start Time ↓', 'Sim Count ↑', 'Sim Count ↓', 'Del Count ↑', 'Del Count ↓', 'Text Count ↑', 'Text Count ↓'])
    const [sortBy, setSortBy] = React.useState('Participant ID ↑');
    const [searchPid, setSearchPid] = React.useState('');
    const [downloading, setDownloading] = React.useState(false);
    const [actionError, setActionError] = React.useState(null);
    const [selectedPhase, setSelectedPhase] = React.useState('Phase 2');
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = React.useState(false);
    const [rowToDelete, setRowToDelete] = React.useState({});
    const [deleteInput, setDeleteInput] = React.useState('');
    const [deleteResultMessage, setDeleteResultMessage] = React.useState('');
    const [deleteUser] = useMutation(DELETE_PID_DATA);
    const [updateScenarioResult] = useMutation(UPDATE_SCENARIO_RESULT);
    const [repairSnackbar, setRepairSnackbar] = React.useState({ open: false, message: '', severity: 'success' });
    const [repairModal, setRepairModal] = React.useState({
        open: false,
        pid: null,
        status: null
    });


    const getHeaders = () => {
        let headers;
        if (selectedPhase === 'Phase 2') headers = [...HEADERS_PHASE2];
        else if (selectedPhase === 'UK Phase 1') headers = [...HEADERS_UK];
        else headers = [...HEADERS_PHASE1];

        if (!canViewProlific) headers = headers.filter(h => !PROLIFIC_COLUMNS.includes(h));
        if (isAdmin) headers.splice(3, 0, "Delete");
        return headers;
    };

    const HEADERS = [...getHeaders()];

    const getCompletionOptions = () => {
        const textThreshold = selectedPhase === 'Phase 2' || selectedPhase === 'UK Phase 1' ? 4 : 5;
        const baseOptions = [`All Text (${textThreshold})`, 'Missing Text', 'Complete Delegation', 'No Delegation', 'All Sim (4)', 'Any Sim', 'No Sim'];

        if (selectedPhase === 'Phase 1') {
            // phase 1 option
            baseOptions.splice(-1, 0, 'Adept + OW Sim');
        }

        return baseOptions;
    };

    const [popupInfo, setPopupInfo] = React.useState({
        open: false,
        pid: null,
        scenarioId: null
    });

    const { progress, rows: filteredData, evalOptions, filter, page, setPage, pageSize, setPageSize,
        loading: isRefreshing, error: progressError, refetch: refetchProgress } = useParticipantProgress({
        selectedPhase, evalFilters, typeFilters, completionFilters, searchPid, sortBy, canViewProlific
    });
    const detailPid = repairModal.open ? repairModal.pid : popupInfo.open ? popupInfo.pid : null;
    const { data: detailData, loading: detailLoading, error: detailError } = useQuery(GET_PROGRESS_DETAILS, {
        variables: { pid: detailPid }, skip: !detailPid, fetchPolicy: 'network-only', notifyOnNetworkStatusChange: true
    });
    const details = detailData?.getParticipantProgressDetails;
    const changeFilter = (setter, value) => { setter(value); setPage(0); };
    const changePhase = value => {
        setSelectedPhase(value || 'Phase 1');
        setTypeFilters([]); setEvalFilters([]); setCompletionFilters([]); setPage(0);
    };
    const refreshData = async () => {
        setActionError(null);
        try { await refetchProgress(); } catch (error) { setActionError(error.message); }
    };
    const downloadData = async filtered => {
        setDownloading(true); setActionError(null);
        try {
            const exportFilter = filtered ? filter : { ...filter, evalNumbers: [], participantTypes: [], completionFilters: [], searchPid: '' };
            const records = await fetchProgressExport(apolloClient, exportFilter);
            const rows = refineData(formatProgressRows(records, canViewProlific, window.location.origin));
            await exportToExcel('Participant_Progress' + (filtered ? ' (filtered)' : ''), rows,
                HEADERS.filter(header => !columnsToHide.includes(header) && header !== 'Delete'), true, selectedPhase);
        } catch (error) {
            setActionError(error.message);
        } finally {
            setDownloading(false);
        }
    };

    const openPopup = (pid, scenarioId) => {
        setPopupInfo({ open: true, pid, scenarioId });
    };

    const closePopup = () => {
        setPopupInfo({ open: false, pid: null, scenarioId: null });
    };

    const cancelDeletion = () => {
        setDeleteConfirmationOpen(false);
    };

    const updateDeleteInput = (e) => {
        setDeleteInput(e.target.value);
    };

    const closeSnackbar = () => {
        setDeleteResultMessage('');
    }

    const activateDelete = async () => {
        if (!canDeleteData(rowToDelete)) {
            setDeleteResultMessage(`${rowToDelete['Participant ID']}'s data was not deleted. Data is not old enough.`);
            setDeleteConfirmationOpen(false);
            setDeleteInput('');
            await refreshData();
            return;
        }
        const tokens = await accountsClient.getTokens();
        const res = await deleteUser({
            variables: {
                pid: rowToDelete['Participant ID'],
                caller: { user: currentUser, tokens: tokens }
            }
        });
        if (!res.data?.deleteDataByPID) {
            setDeleteResultMessage(`${rowToDelete['Participant ID']}'s data was not deleted.`);
        }
        else {
            let wasDeleted = true;
            for (const k of Object.keys(res.data.deleteDataByPID)) {
                if (!res.data.deleteDataByPID[k].ok) {
                    wasDeleted = false;
                    setDeleteResultMessage(`${rowToDelete['Participant ID']}'s data was not deleted.`);
                    break;
                }
            }
            if (wasDeleted) {
                setDeleteResultMessage(`${rowToDelete['Participant ID']}'s data was deleted.`)
            }
        }
        setDeleteConfirmationOpen(false);
        setDeleteInput('');
        await refreshData();
    };

    const canDeleteData = (row) => {
        // Allow immediate deletion for Test data
        if (row['Participant Type'] === 'Test') {
            return true;
        }

        const oldEnough = (milliseconds) => {
            // del or text end time does not exist and had not been started, so we ignore
            if (isNaN(milliseconds)) {
                return true;
            }
            return (milliseconds / (1000 * 60 * 60)) >= 24;
        };

        const now = new Date();
        const participantCreation = row['Participant Creation Date-Time'];
        if (isDefined(participantCreation)) {
            const timeSincePID = now - new Date(participantCreation);
            if (!oldEnough(timeSincePID)) {
                return false;
            }
        }
        // check if it was started, unfinished, and not yet 24 hours old (if text or survey is 24 hours old, it's probably not real data and can be deleted)
        const delInProgress = isDefined(row['Del Start Date-Time']) && !isDefined(row['Del End Date-Time']) && !oldEnough(now - row['Unformatted Delegation Start']);
        const textInProgress = isDefined(row['Text Start Date-Time']) && !isDefined(row['Text End Date-Time']) && !oldEnough(now - row['Unformatted Text Start']);
        if (delInProgress || textInProgress) {
            return false;
        }
        const delEnd = row['Unformatted Delegation End'];
        const textEnd = row['Unformatted Text End'];
        const timeSinceDel = now - delEnd;
        const timeSinceText = now - textEnd;
        return oldEnough(timeSinceDel) && oldEnough(timeSinceText);

    };

    const confirmDeletion = async (toDelete) => {
        setRowToDelete(toDelete);
        setDeleteConfirmationOpen(true);
    };

    const formatCell = (header, dataSet) => {
        if (header === 'Delete') {
            if (canDeleteData(dataSet)) {
                return <td key={`${dataSet['Participant ID']}-${header}`} className='white-cell delete-column'>
                    <button className="delete-btn" onClick={() => confirmDeletion(dataSet)}>
                        <Delete />
                    </button>
                </td>
            }
            else return <td key={`${dataSet['Participant ID']}-${header}`} className='white-cell delete-column'>-</td>
        }

        if (header === 'Alignment Status') {
            const val = dataSet['Alignment Status'];
            const pid = dataSet['Participant ID'];
            const status = dataSet['_alignmentStatus'];
            const isMissing = val && val.startsWith('Missing');
            const isComplete = val && val.startsWith('Complete');
            const cellClass = isComplete ? 'dk-green-cell' : isMissing ? 'alignment-missing-cell' : 'white-cell';

            return (
                <td key={`${pid}-${header}`} className={cellClass}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                        {isComplete && <CheckCircle style={{ fontSize: '14px', color: '#2e7d32' }} />}
                        {isMissing && <Error style={{ fontSize: '14px', color: '#e65100' }} />}
                        <span>{val ?? '-'}</span>
                        {(isMissing || isComplete) && isAdmin && (
                            <button
                                className="repair-align-btn"
                                title={isMissing ? `Repair: ${status?.missingScenarios?.join(', ')}` : 'Re-run alignment'}
                                onClick={() => setRepairModal({ open: true, pid, status })}
                            >
                                <Build style={{ fontSize: '14px' }} />
                            </button>
                        )}
                    </div>
                </td>
            );
        }

        const val = dataSet[header];

        if ((selectedPhase === 'Phase 2' || selectedPhase === 'UK Phase 1') && /^Del-\d+$/.test(header) && val && dataSet['Delegation'] > 0) {
            const exists = dataSet['Text'] > 0;
            if (exists) {
                return (
                    <td key={`${dataSet['Participant ID']}-${header}`} className='white-cell'>
                        {dataSet['_evalNumber'] !== 10 ? <button
                            className="view-adm-btn"
                            onClick={() => openPopup(dataSet['Participant ID'], val)}
                        >
                            {val}
                        </button> :
                            <p>{val}</p>
                        }
                    </td>
                );
            }
        }

        const getClassName = (header, val, dataSet) => {
            if (SCENARIO_HEADERS.includes(header) && isDefined(val)) {
                return 'li-green-cell';
            }
            const isPH2OrUK = selectedPhase === 'Phase 2' || selectedPhase === 'UK Phase 1';
            const isUK = selectedPhase === 'UK Phase 1';
            const textThreshold = computeTextThreshold(dataSet['_evalNumber'], isPH2OrUK);
            const delThreshold = computeDelThreshold(dataSet['_evalNumber'], isUK, isPH2OrUK);
            if ((header === 'Delegation' && val >= delThreshold) ||
                (header === 'Text' && val == textThreshold) ||
                (header === 'Sim Count' && (val === 4 || (isPH2OrUK && val === 2)))) {
                return 'dk-green-cell';
            }
            return 'white-cell';
        };
        return (<td key={dataSet['Participant ID'] + '-' + header} className={getClassName(header, val, dataSet) + ' ' + (header.length < 5 ? 'small-column ' : ' ') + (header.length > 17 ? 'large-column' : '')}>
            {header === 'Survey Link' && val ? <button onClick={() => copyLink(val)} className='downloadBtn'>Copy Link</button> : <span>{val ?? '-'}</span>}
        </td>);
    };

    const copyLink = (linkToCopy) => {
        navigator.clipboard.writeText(linkToCopy);
    };

    const hideColumn = (val) => {
        setColumnsToHide([...columnsToHide, val]);
    };

    const refineData = (origData) => {
        // remove unwanted headers from download
        const updatedData = structuredClone(origData);
        const currentHeaders = getHeaders();
        updatedData.map((x) => {
            for (const h of columnsToHide) {
                delete x[h];
            }
            delete x['_phase'];
            // remove fields that aren't in the current phase's headers
            const keysToDelete = Object.keys(x).filter(key =>
                !currentHeaders.includes(key) && key !== '_evalNumber'
            );
            for (const key of keysToDelete) {
                delete x[key];
            }
            return x;
        });
        return updatedData;
    };

    const updatePidSearch = (event) => {
        setSearchPid(event.target.value);
    };

    return (<>
        <h2 className='progress-header'>Participant Progress</h2>
        {(progressError || actionError) && <Alert severity="error" action={<button onClick={refreshData}>Retry</button>}>
            {progressError?.message || actionError}
        </Alert>}
        <section className='tableHeader'>
            <div className="filters">
                <Autocomplete
                    options={['Phase 1', 'Phase 2', 'UK Phase 1']}
                    value={selectedPhase}
                    size="small"
                    style={{ width: '200px' }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Phase"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => changePhase(newVal)}
                />
            </div>
        </section>
        <p className='filteredText'>{progress?.totalCount ?? 0} matching participants of {progress?.phaseCount ?? 0} in this phase</p>
        <section className='tableHeader'>
            <div className="filters">
                <Autocomplete
                    multiple
                    options={progress?.participantTypes || []}
                    filterSelectedOptions
                    size="small"
                    value={typeFilters}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Type"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => changeFilter(setTypeFilters, newVal)}
                />
                <Autocomplete
                    multiple
                    options={evalOptions}
                    getOptionLabel={evaluationLabel}
                    isOptionEqualToValue={(option, value) => option.evalNumber === value.evalNumber}
                    filterSelectedOptions
                    size="small"
                    style={{ width: '400px' }}
                    value={evalFilters}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Eval"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => changeFilter(setEvalFilters, newVal)}
                />
                <Autocomplete
                    multiple
                    options={getCompletionOptions()}
                    filterSelectedOptions
                    size="small"
                    style={{ width: '600px' }}
                    value={completionFilters}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Progress"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => changeFilter(setCompletionFilters, newVal)}
                />
                <Autocomplete
                    multiple
                    options={HEADERS}
                    size="small"
                    limitTags={1}
                    style={{ width: '600px' }}
                    value={columnsToHide}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Hidden Columns"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => setColumnsToHide(newVal)}
                />
                <Autocomplete
                    options={sortOptions}
                    size="small"
                    style={{ width: '600px' }}
                    value={sortBy}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Sort By"
                            placeholder=""
                        />
                    )}
                    onChange={(_, newVal) => changeFilter(setSortBy, newVal || sortOptions[0])}
                />
                <TextField label="Search PIDs" size="small" value={searchPid} onInput={updatePidSearch}></TextField>
            </div>
            <div className="option-section">
                <button className="downloadBtn" onClick={() => downloadData(false)} disabled={downloading || isRefreshing || !progress?.phaseCount}>Download All Data</button>
                {(typeFilters.length > 0 || evalFilters.length > 0 || completionFilters.length > 0 || filter.searchPid.length > 0) &&
                    <button className="downloadBtn" onClick={() => downloadData(true)} disabled={downloading || isRefreshing || !progress?.totalCount}>Download Filtered Data</button>}
                <button className="downloadBtn" onClick={refreshData} disabled={isRefreshing}>Refresh Data</button>
                {downloading && <span role="status">Preparing download...</span>}
            </div>
        </section>
        <div className='resultTableSection'>
            <table className='itm-table'>
                <thead>
                    <tr>
                        {HEADERS.map((val, index) => {
                            return (!columnsToHide.includes(val) && <th key={'header-' + index} className={(val.length < 5 ? 'small-column ' : ' ') + (val === 'Delete' ? 'delete-column' : '')}>
                                {val} <button className='hide-header' onClick={() => hideColumn(val)}><VisibilityOff size={'small'} /></button>
                            </th>);
                        })}
                    </tr>
                </thead>
                <tbody>
                    {isRefreshing ?
                        <tr className='refreshing-row'>
                            <td colSpan={HEADERS.filter(h => !columnsToHide.includes(h)).length}>
                                <div className='refreshing-td'>
                                    <Spinner animation="border" role="status" variant="dark" className='refresh-spinner' size="large" />
                                    <span className='refreshing-label'>Fetching Data...</span>
                                </div>
                            </td>
                        </tr>
                        : filteredData.length === 0 ? <tr><td colSpan={HEADERS.length}>No participants match these filters.</td></tr>
                        : filteredData.map((dataSet, index) => {
                            return (<tr key={dataSet['Participant ID'] + '-' + index}>
                                {HEADERS.map((val) => {
                                    return !columnsToHide.includes(val) && formatCell(val, dataSet);
                                })}
                            </tr>);
                        })}
                </tbody>
            </table>
        </div>
        <TablePagination component="div" count={progress?.totalCount || 0} page={page} rowsPerPage={pageSize}
            rowsPerPageOptions={[25, 50, 100]} onPageChange={(_, nextPage) => setPage(nextPage)}
            onRowsPerPageChange={event => { setPageSize(Number(event.target.value)); setPage(0); }}
            backIconButtonProps={{ disabled: isRefreshing || page === 0 }}
            nextIconButtonProps={{ disabled: isRefreshing || (page + 1) * pageSize >= (progress?.totalCount || 0) }} />
        <Modal open={deleteConfirmationOpen} onClose={cancelDeletion}>
            <Box className='delete-modal-box'>
                <h2 className="deletion-header">
                    Confirm Deletion
                </h2>
                <p>All sim data, survey data, and text scenario data related to this participant will be permanently deleted.</p>
                <div className='delete-table-container'>
                    <table className='itm-table'>
                        <thead>
                            <tr>
                                {HEADERS.map((header) => {
                                    if (header !== 'Delete') {
                                        return <th key={'delete-' + header}>
                                            {header}
                                        </th>
                                    }
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                {HEADERS.map((header) => {
                                    if (header !== 'Delete') {
                                        return formatCell(header, rowToDelete)
                                    }
                                })}
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="type-to-delete">
                    <p>Type in the Participant ID to confirm deletion:</p>
                    <TextField className='delete-input' value={deleteInput} onInput={updateDeleteInput} />
                </div>
                <div className='delete-btn-group'>
                    <button className='downloadBtn' onClick={cancelDeletion}>Cancel</button>
                    <button className='downloadBtn' disabled={deleteInput !== rowToDelete['Participant ID']} onClick={activateDelete}>Delete Participant</button>
                </div>
            </Box>
        </Modal >
        <Snackbar open={deleteResultMessage !== ''} autoHideDuration={10000} onClose={closeSnackbar}>
            <Alert severity={deleteResultMessage.includes("not") ? "error" : "success"} onClose={closeSnackbar} variant="filled" >
                {deleteResultMessage}
            </Alert>
        </Snackbar>
        <Snackbar open={repairSnackbar.open} autoHideDuration={10000} onClose={() => setRepairSnackbar({ ...repairSnackbar, open: false })}>
            <Alert severity={repairSnackbar.severity} onClose={() => setRepairSnackbar({ ...repairSnackbar, open: false })} variant="filled">
                {repairSnackbar.message}
            </Alert>
        </Snackbar>
        <Modal open={!!detailPid && (detailLoading || !!detailError || !details)} onClose={() => {
            closePopup(); setRepairModal({ open: false, pid: null, status: null });
        }}>
            <Box className="adm-popup-body">
                {detailError ? <QueryErrorMessage error={detailError} /> : <p>Loading participant details...</p>}
                <button onClick={() => { closePopup(); setRepairModal({ open: false, pid: null, status: null }); }}>Close</button>
            </Box>
        </Modal>
        {!detailLoading && !detailError && details && <AdmInfoModal
            open={popupInfo.open && (selectedPhase === 'Phase 2' || selectedPhase === 'UK Phase 1')}
            onClose={closePopup}
            pid={popupInfo.pid}
            scenarioId={popupInfo.scenarioId}
            dataTextResults={details}
            dataSurveyResults={details}
            KDMA_MAP={KDMA_MAP}
            formatLoading={formatLoading}
        />}
        {!detailLoading && !detailError && details && <RepairAlignmentModal
            open={repairModal.open}
            pid={repairModal.pid}
            alignmentStatus={repairModal.status}
            textResults={details.getAllScenarioResults}
            updateScenarioResult={updateScenarioResult}
            onClose={() => setRepairModal({ open: false, pid: null, status: null })}
            onRepairComplete={async () => {
                setRepairModal({ open: false, pid: null, status: null });
                await refreshData();
                setRepairSnackbar({
                    open: true,
                    message: `Alignment repaired for ${repairModal.pid}`,
                    severity: 'success'
                });
            }}
        />}

    </>);
}