import React from 'react';
import { Button, Card } from 'react-bootstrap';
import './login.css';
import { createBrowserHistory } from 'history';
const history = createBrowserHistory({ forceRefresh: true });

export function WaitingPage({ rejected }) {
    return (
        <Card className='waiting-card'>
            <Card.Header><h3>Welcome to the ITM Program!</h3></Card.Header>
            <Card.Body>
                <div>
                    <b>Status: {rejected ? 'Account Rejected' : 'Awaiting Approval'}</b>
                    <hr />
                    Thank you for your interest in the DARPA In the Moment Program.
                    <br />
                    {rejected && 'You have been denied access to the dashboard. If you believe this is a mistake, please contact an administrator.'}
                    <br /><br />If you are supposed to be taking the text scenarios, please navigate to <a href='https://darpaitm.caci.com/participantText'>https://darpaitm.com/participantText</a>
                </div>
                <Button onClick={() => history.push('/login')} className='return-btn'>Return to Login</Button>
            </Card.Body>
        </Card>
    );
}

