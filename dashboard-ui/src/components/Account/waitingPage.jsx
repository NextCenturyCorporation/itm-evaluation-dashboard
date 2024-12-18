import React from 'react';

export function WaitingPage({ rejected }) {
    return (
        <>
            <div className="home-container">
                <div className="home-navigation-container">
                    <div className="evaluation-selector-container">
                        <div className="evaluation-selector-label"><h3>Welcome to the ITM Program!</h3></div>
                    </div>
                </div>
                <div className="data-collection-only">
                    <b>Status: {rejected ? 'Account Rejected' : 'Awaiting Approval'}</b>
                    <hr />
                    Thank you for your interest in the DARPA In the Moment Program.
                    <br />
                    {rejected && 'You have been denied access to the dashboard. If you believe this is a mistake, please contact an administrator.'}
                    <br /><br />If you are supposed to be taking the text scenarios, please navigate to <a href='https://darpaitm.caci.com/participantText'>https://darpaitm.com/participantText</a>
                </div>
            </div>
        </>
    );
}

