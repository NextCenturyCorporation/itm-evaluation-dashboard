import React from 'react';
import { Modal, Box, LinearProgress, TextField } from '@mui/material';
import { repairAlignment } from './progressUtils';
import '../../css/repairAlignment.css';


const RepairAlignmentModal = ({open, onClose, pid, alignmentStatus, textResults, updateScenarioResult, onRepairComplete }) => {
    const [repairing, setRepairing] = React.useState(false);
    const [confirmInput, setConfirmInput] = React.useState('');
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        if (!open) {
            setConfirmInput('');
            setRepairing(false);
            setError(null);
        }
    }, [open]);

    const handleRepair = async () => {
        if (confirmInput !== pid || !alignmentStatus) return;

        setRepairing(true);
        setError(null);

        try {
            const participantResults = textResults.filter(
                r => r.participantID === pid
            );

            const result = await repairAlignment(
                alignmentStatus.missingScenarios,
                participantResults,
                updateScenarioResult
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
        <Modal open={open} onClose={() => !repairing && onClose()}>
            <Box className="repair-modal-box">
                <h3 style={{ marginTop: 0 }}>Repair Alignment</h3>

                <p>
                    PID <strong>{pid}</strong> is missing{' '}
                    {alignmentStatus.missingCount} scenario(s).
                </p>

                <p style={{ fontSize: '13px', color: '#666' }}>
                    This will recompute alignment and update database records.
                </p>

                <TextField
                    fullWidth
                    size="small"
                    label="Type PID to confirm"
                    value={confirmInput}
                    onChange={(e) => setConfirmInput(e.target.value)}
                    style={{ margin: '12px 0' }}
                />

                {repairing && <LinearProgress color="warning" />}

                {error && (
                    <p style={{ color: '#d32f2f', fontSize: '13px' }}>
                        {error}
                    </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                    <button
                        className="downloadBtn"
                        onClick={onClose}
                        disabled={repairing}
                    >
                        Cancel
                    </button>

                    <button
                        className="downloadBtn"
                        onClick={handleRepair}
                        disabled={repairing || confirmInput !== pid}
                    >
                        {repairing ? 'Repairing...' : 'Repair'}
                    </button>
                </div>
            </Box>
        </Modal>
    );
};

export default RepairAlignmentModal;
