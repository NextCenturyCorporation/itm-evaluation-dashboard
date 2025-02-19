import React from 'react';
import AggregateResults from '../AggregateResults/aggregateResults';
import { isUserElevated } from '../App';

class HomePage extends React.Component {
    constructor(props) {
        super();
    }

    render() {
        return (
            <>
                {isUserElevated(this.props.currentUser) && (
                    <div className="home-container">
                        <div className="home-navigation-container">
                            <div className="evaluation-selector-container">
                                <div className="evaluation-selector-label"><h3>Program Questions:</h3></div>
                            </div>
                        </div>
                        <AggregateResults type="Program" />
                    </div>
                )}
                {!isUserElevated(this.props.currentUser) && (
                    <div className="home-container">
                        <div className="home-navigation-container">
                            <div className="evaluation-selector-container">
                                <div className="evaluation-selector-label"><h3>Welcome to the ITM Program!</h3></div>
                            </div>
                        </div>
                        <div className="data-collection-only">
                            Thank you for your interest in the DARPA In the Moment Program.  If you are supposed to be taking the text scenarios, please navigate to <a href='https://darpaitm.caci.com/participantText'>https://darpaitm.com/participantText</a>
                        </div>
                    </div>
                )}
            </>
        );
    }
}

export default HomePage;