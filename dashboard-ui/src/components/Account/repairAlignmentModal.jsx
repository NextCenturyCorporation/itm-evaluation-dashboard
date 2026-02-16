import React from 'react';
import { Modal, Box, LinearProgress } from '@mui/material';
import { Spinner } from 'react-bootstrap';
import { repairAlignmentForParticipant } from './progressUtils';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import '../../css/resultsTable.css';

const RepairAlignmentModal = ({ open, onClose, pid, alignmentStatus, textResults, updateScenarioResult, onRepairComplete }) => {
    const [isRepairing, setIsRepairing] = React.useState(false);
    const [progressMessage, setProgressMessage] = React.useState('');
    const [result, setResult] = React.useState(null);

    const handleRepair = async () => {
        if (!alignmentStatus || !pid) return;

        setIsRepairing(true);
        setProgressMessage('Starting repair...');
        setResult(null);

        try {
            const participantResults = textResults.filter(r => r.participantID === pid);
            const repairResult = await repairAlignmentForParticipant(
                alignmentStatus.missingScenarios,
                participantResults,
                updateScenarioResult,
                (msg) => setProgressMessage(msg)
            );
            setResult(repairResult);
            setProgressMessage('');

            if (repairResult.success) {
                // Auto-close and refresh after short delay
                setTimeout(() => {
                    onRepairComplete?.();
                }, 2000);
            }
        } catch (e) {
            setResult({ success: false, repaired: 0, total: alignmentStatus.missingScenarios.length, errors: [{ scenario_id: 'unknown', error: e.message }] });
            setProgressMessage('');
        } finally {
            setIsRepairing(false);
        }
    };

    const handleClose = () => {
        if (isRepairing) return; // Don't close while repairing
        setResult(null);
        setProgressMessage('');
        onClose();
    };

    if (!alignmentStatus) return null;

    return (
        <Modal open={open} onClose={handleClose}>
            <Box className='repair-modal-box'>
                <h2 style={{ marginTop: 0 }}>Repair Alignment Data</h2>
                <p>Participant <strong>{pid}</strong> is missing <code>mostLeastAligned</code> data for {alignmentStatus.missingCount} scenario(s).</p>

                <p style={{ fontSize: '14px', color: '#666' }}>
                    This will create new ADEPT sessions, re-submit all probe responses from the stored scenario data,
                    and re-compute alignment scores. The scenario documents in the database will be updated with the new values.
                </p>

                <h4 style={{ marginBottom: '8px' }}>Missing Scenarios:</h4>
                <ul className="repair-scenario-list">
                    {alignmentStatus.missingScenarios.map((sid) => {
                        const detail = alignmentStatus.scenarioDetails.find(d => d.scenario_id === sid);
                        const wasRepaired = result?.repaired > 0 && !result?.errors?.find(e => e.scenario_id === sid);
                        const hadError = result?.errors?.find(e => e.scenario_id === sid);

                        return (
                            <li key={sid} className="repair-scenario-item">
                                <span>{sid}</span>
                                <span style={{ fontSize: '12px', color: '#888' }}>eval {detail?.evalNumber}</span>
                                {wasRepaired && <CheckCircleIcon style={{ fontSize: '18px', color: '#2e7d32' }} />}
                                {hadError && <ErrorIcon style={{ fontSize: '18px', color: '#d32f2f' }} title={hadError.error} />}
                            </li>
                        );
                    })}
                </ul>

                {isRepairing && (
                    <div style={{ margin: '16px 0' }}>
                        <LinearProgress color="warning" />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                            <Spinner animation="border" size="sm" variant="warning" />
                            <span style={{ fontSize: '13px', color: '#666' }}>{progressMessage}</span>
                        </div>
                    </div>
                )}

                {result && (
                    <div style={{
                        margin: '16px 0',
                        padding: '12px',
                        borderRadius: '6px',
                        backgroundColor: result.success ? '#e8f5e9' : '#fff3e0',
                        border: `1px solid ${result.success ? '#a5d6a7' : '#ffcc02'}`
                    }}>
                        {result.success ? (
                            <p style={{ margin: 0, color: '#2e7d32' }}>
                                <CheckCircleIcon style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: '6px' }} />
                                Successfully repaired {result.repaired}/{result.total} scenario(s). Refreshing...
                            </p>
                        ) : (
                            <>
                                <p style={{ margin: '0 0 8px', color: '#e65100' }}>
                                    <ErrorIcon style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: '6px' }} />
                                    Repaired {result.repaired}/{result.total}. Some errors occurred:
                                </p>
                                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                                    {result.errors.map((e, i) => (
                                        <li key={i}><code>{e.scenario_id}</code>: {e.error}</li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                    <button className='downloadBtn' onClick={handleClose} disabled={isRepairing}>Cancel</button>
                    <button
                        className='downloadBtn'
                        onClick={handleRepair}
                        disabled={isRepairing || result?.success}
                        style={isRepairing ? { opacity: 0.6 } : {}}
                    >
                        {isRepairing ? 'Repairing...' : 'Repair Alignment'}
                    </button>
                </div>
            </Box>
        </Modal>
    );
};

export default RepairAlignmentModal;