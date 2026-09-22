import React from "react";
import VisibilityIcon from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import './login.css';
import bcrypt from 'bcryptjs';
<<<<<<< Updated upstream
import gql from "graphql-tag";
import { useQuery } from 'react-apollo'
=======
import { findParticipantByEmail } from '../../services/participantService';
>>>>>>> Stashed changes
import { QueryErrorMessage } from "../ErrorHandling/QueryErrorMessage";

export function PidLookup() {

    const [viewHiddenEmail, setViewHiddenEmail] = React.useState(false);
    const [email, setEmail] = React.useState("");
    const [pid, setPid] = React.useState("");
    const [notFound, setNotFound] = React.useState(false);
    const [loadingParticipantLog, setLoading] = React.useState(false);
    const [errorParticipantLog, setError] = React.useState(null);

    const getPID = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const trimmedEmail = email.trim().toLowerCase();
            const hashedEmail = bcrypt.hashSync(trimmedEmail, "$2a$10$" + process.env.REACT_APP_EMAIL_SALT);
            const matchingParticipant = await findParticipantByEmail(hashedEmail);

            if (matchingParticipant) {
                setPid(matchingParticipant.ParticipantID); 
                setNotFound(false);
            } else {
                setPid("");
                setNotFound(true);
            }
        } catch (error) {
            setError(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleVisibility = () => {
        setViewHiddenEmail(!viewHiddenEmail);
    };

    const onChangeEmail = ({ target }) => {
        setEmail(target.value);
    };

    // show error message if an participantLog Error occurs
    if (errorParticipantLog) {
        console.log(errorParticipantLog);
        return(
            <QueryErrorMessage error={errorParticipantLog}></QueryErrorMessage>
        );
    }





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
                        <button className="action-btn sd-btn sd-navigation__next-btn" type="submit" disabled={loadingParticipantLog}>{loadingParticipantLog ? 'Finding PID...' : 'Find PID'}</button>
                    </div>
                    {pid &&
                        <>
                            <h3 className='pid-shower'>PID: {pid}</h3>
                        </>
                    }
                    {notFound && <h3 className='error-text'>PID Not Found</h3>}
                </form>
            </div>
        </div>
    </div>);
}
