import { Modal } from "@mui/material";
import '../../css/alreadyCompleteModal.css';

export default function AlreadyCompleteModal({ open, onClose, participantId }) {
    return (
        <Modal open={open} onClose={onClose} aria-labelledby="already-complete-title">
            <div className="acp-card">
                <div className="acp-accent" />
                <div className="acp-body">
                    {/* checkmark-in-circle icon */}
                    <div className="acp-icon" aria-hidden="true">
                        <svg className="acp-check" viewBox="0 0 24 24">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                    <h2 id="already-complete-title" className="acp-title">You're all set</h2>
                    <p className="acp-message">
                        You have already completed this portion of the experiment.
                        If you think you are receiving this message in error, please
                        speak with a moderator.
                    </p>
                    {participantId != null && (
                        <div className="acp-pid">
                            Your Participant ID is <strong>{participantId}</strong>
                        </div>
                    )}
                    <button type="button" className="acp-btn" onClick={onClose}>Close</button>
                </div>
            </div>
        </Modal>
    );
}