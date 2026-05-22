import React from 'react';
import { Modal,Box, LinearProgress, TextField, Typography, Divider, Button, Stack } from '@mui/material';
import { repairAlignment } from './progressUtils';
import '../../css/repairAlignment.css';

const RepairAlignmentModal = ({open, onClose, pid, alignmentStatus, textResults, updateScenarioResult, onRepairComplete}) => {
    const [repairing, setRepairing] = React.useState(false);
    const [confirmInput, setConfirmInput] = React.useState('');
    const [error, setError] = React.useState(null);
    const [progressLog, setProgressLog] = React.useState([]);
    const progressEndRef = React.useRef(null);

    React.useEffect(() => {
        if (!open) {
            setConfirmInput('');
            setRepairing(false);
            setError(null);
            setProgressLog([]);
        }
    }, [open]);

    React.useEffect(() => {
        progressEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [progressLog]);

    const handleRepair = async () => {
        if (confirmInput !== pid || !alignmentStatus) return;
        setRepairing(true);
        setError(null);

        try {
            const participantResults = textResults.filter(r => r.participantID === pid);
            const scenariosToRepair = alignmentStatus.missingScenarios?.length > 0
                ? alignmentStatus.missingScenarios
                : participantResults.map(r => r.scenario_id);
            const result = await repairAlignment(
                scenariosToRepair,
                participantResults,
                updateScenarioResult,
                (msg) => setProgressLog(prev => [...prev, msg])
            );

            if (!result.success) {
                setError('Some scenarios failed to repair.');
                setRepairing(false);
                return;
            }
            onRepairComplete?.();
        } catch (e) {
            setError(e.message);
            setRepairing(false);
        }
    };

    if (!alignmentStatus) return null;

    return (
        <Modal
            open={open}
            onClose={() => !repairing && onClose()}
        >
            <Box className="repair-modal-box">
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#333', mb: 1 }}>
                    Repair Alignment
                </Typography>

                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    {alignmentStatus.missingCount > 0
                        ? <>Participant <b>{pid}</b> is missing alignment data for <b>{alignmentStatus.missingCount}</b> scenario(s).</>
                        : <>Participant <b>{pid}</b> has complete alignment data. Re-running will recompute all scenarios.</>
                    }
                </Typography>

                <Divider />

                <div className="scenario-badge-container">
                    {(alignmentStatus.missingScenarios?.length > 0
                        ? alignmentStatus.missingScenarios
                        : alignmentStatus.scenarioDetails?.map(d => d.scenario_id) ?? []
                    ).map((id) => (
                        <span key={id} className="scenario-badge">
                            {id}
                        </span>
                    ))}
                </div>

                <div className="repair-warning-text">
                    <strong>Warning:</strong> This will re-run the alignment logic for the scenarios listed above and update the database.
                </div>

                <Box sx={{ mt: 1, mb: 3 }}>
                    <TextField
                        fullWidth
                        label="Confirm Participant ID"
                        variant="filled"
                        size="small"
                        placeholder={pid}
                        value={confirmInput}
                        onChange={(e) => setConfirmInput(e.target.value)}
                        disabled={repairing}
                        error={confirmInput !== '' && confirmInput !== pid}
                        helperText={confirmInput !== '' && confirmInput !== pid ? "ID does not match" : "Type PID to re-submit probes / score participant"}
                    />
                </Box>

                {repairing && (
                    <Box sx={{ width: '100%', mb: 3 }}>
                        <LinearProgress sx={{ height: 8, borderRadius: 4 }} color="warning" />
                        <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center', fontWeight: 600 }}>
                            Computing alignment and updating records...
                        </Typography>
                        {progressLog.length > 0 && (
                            <Box sx={{ mt: 1, maxHeight: 100, overflowY: 'auto', bgcolor: '#f5f5f5', borderRadius: 1, p: 1 }}>
                                {progressLog.map((msg, i) => (
                                    <Typography key={i} variant="caption" sx={{ display: 'block', color: '#555' }}>
                                        {msg}
                                    </Typography>
                                ))}
                                <div ref={progressEndRef} />
                            </Box>
                        )}
                    </Box>
                )}

                {error && (
                    <Typography variant="caption" sx={{ color: '#d32f2f', display: 'block', mb: 2, fontWeight: 600 }}>
                        Error: {error}
                    </Typography>
                )}

                <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button
                        onClick={onClose}
                        disabled={repairing}
                        sx={{ color: '#666' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleRepair}
                        disabled={repairing || confirmInput !== pid}
                        sx={{
                            backgroundColor: '#b15e2f',
                            '&:hover': { backgroundColor: '#8a4924' },
                            px: 4,
                            borderRadius: '8px',
                            textTransform: 'none',
                            fontWeight: 700
                        }}
                    >
                        {repairing ? 'Processing...' : 'Run Repair'}
                    </Button>
                </Stack>
            </Box>
        </Modal>
    );
};

export default RepairAlignmentModal;