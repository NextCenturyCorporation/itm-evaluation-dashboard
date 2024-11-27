import React from "react";
import VisibilityIcon from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import './login.css';
import bcrypt from 'bcryptjs';
import gql from "graphql-tag";
import { useQuery } from 'react-apollo'
import { simNameMappings } from "../TextBasedScenarios/TextBasedScenariosPage";

const GET_PARTICIPANT_LOG = gql`
    query GetParticipantLog {
        getParticipantLog
    }`;

export function PidLookup() {

    const [viewHiddenEmail, setViewHiddenEmail] = React.useState(false);
    const [email, setEmail] = React.useState("");
    const [pid, setPid] = React.useState("");
    const [sim1, setSim1] = React.useState("")
    const [sim2, setSim2] = React.useState("")
    const [notFound, setNotFound] = React.useState(false);
    const { loading: loadingParticipantLog, error: errorParticipantLog, data: dataParticipantLog } = useQuery(GET_PARTICIPANT_LOG);

    const getPID = (e) => {
        e.preventDefault();
        if (dataParticipantLog?.getParticipantLog) {
            const trimmedEmail = email.trim().toLowerCase();
            const hashedEmail = bcrypt.hashSync(trimmedEmail, "$2a$10$" + process.env.REACT_APP_EMAIL_SALT);
            const matchingParticipant = dataParticipantLog.getParticipantLog.find(
                (x) => x.hashedEmail == hashedEmail
            );

            if (matchingParticipant) {
                setPid(matchingParticipant.ParticipantID);
                setSim1(matchingParticipant['Sim-1']);
                setSim2(matchingParticipant['Sim-2']);
                setNotFound(false);
            } else {
                setPid("");
                setSim1("");
                setSim2("");
                setNotFound(true);
            }
        }
    };

    const formatSimValue = (sim) => {
        const mapped = simNameMappings[sim];
        return Array.isArray(mapped) ? mapped.join(", ") : mapped;
    };

    const toggleVisibility = () => {
        setViewHiddenEmail(!viewHiddenEmail);
    };

    const onChangeEmail = ({ target }) => {
        setEmail(target.value);
    };

    if (loadingParticipantLog) return <p>Loading Participant Log...</p>;
    if (errorParticipantLog) return <p>Error loading participant log:</p>;

    return (<div className="row justify-content-center align-items-center h-100 center-container">

        <div className="login-container">
            <div id="sign-in-pane">
                <div className="sign-in-instructions">
                    <h4 className="sign-in-header">Find Participant ID</h4>
                    <p className='justified-subtext'>To get the participant's PID, enter their email address.
                        <br /><i>It must be the same email address they used to complete the at-home text scenarios.</i>
                    </p>
                </div>
                <form onSubmit={getPID}>
                    <div className="form-group">
                        <div className="input-login-header">Email Address</div>
                        <div className="input-with-btn">
                            <input className="form-control form-control-lg" required placeholder="Email" type={viewHiddenEmail ? "text" : "password"} id="emailOnly" value={email} onChange={onChangeEmail} />
                            <button className="blank-btn" type='button' onClick={toggleVisibility}>{viewHiddenEmail ? <VisibilityIcon /> : <VisibilityOffIcon />}</button>
                        </div>
                    </div>

                    <div className="form-group">
                        <button className="action-btn sd-btn sd-navigation__next-btn" type="submit">Find PID</button>
                    </div>
                    {pid &&
                        <>
                            <h3 className='pid-shower'>PID: {pid}</h3>
                            <h3 className='pid-shower'>SIM-1: {formatSimValue(sim1)}</h3>
                            <h3 className='pid-shower'>SIM-2: {formatSimValue(sim2)}</h3>
                        </>
                    }
                    {notFound && <h3 className='error-text'>PID Not Found</h3>}
                </form>
            </div>
        </div>
    </div>);
}

