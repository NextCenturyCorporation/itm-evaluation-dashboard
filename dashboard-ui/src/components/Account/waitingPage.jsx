import React from 'react';

export function WaitingPage() {
    return (
        <>
            <div className="home-container">
                <div className="home-navigation-container">
                    <div className="evaluation-selector-container">
                        <div className="evaluation-selector-label"><h3>Welcome to the ITM Program!</h3></div>
                    </div>
                </div>
                <div className="data-collection-only">
                    Thank you for your interest in the DARPA In the Moment Program.  Your account is awaiting approval. Please check back later. <br /><br />If you are supposed to be taking the text scenarios, please navigate to <a href='https://darpaitm.caci.com/participantText'>https://darpaitm.com/participantText</a>
                </div>
            </div>
        </>
    );
}

