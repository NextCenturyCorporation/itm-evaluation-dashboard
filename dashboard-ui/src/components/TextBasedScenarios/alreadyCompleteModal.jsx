import { Modal } from "@mui/material";
import '../../css/admInfo.css';

export default function AlreadyCompleteModal({open, onClose, participantId}) {
    return (
         <Modal open={open} onClose={onClose}>
            <div className="adm-popup-body">
                <h1>
                You have already completed this portion of the experiment. 
                If you think you are receiving this message in error, please speak with a moderator.
                </h1>
                <h3>Your Participant ID is {participantId}</h3>
            </div>
        </Modal>
    )
}