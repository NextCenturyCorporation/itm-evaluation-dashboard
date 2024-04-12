import React from 'react';
import AggregateResults from '../AggregateResults/aggregateResults';

class HomePage extends React.Component {
    constructor(props) {
        super();
    }

    render() {
        return (
            <>
                {(this.props.currentUser.admin === true || this.props.currentUser.evaluator === true) && (
                    <div className="home-container">
                        <div className="home-navigation-container">
                            <div className="evaluation-selector-container">
                                <div className="evaluation-selector-label"><h3>Program Questions:</h3></div>
                            </div>
                        </div>
                        <AggregateResults type="Program" />
                    </div>
                )}
                {(this.props.currentUser.admin !== true && this.props.currentUser.evaluator !== true) && (
                    <div className="home-container">
                        <div className="home-navigation-container">
                            <div className="evaluation-selector-container">
                                <div className="evaluation-selector-label"><h3>Welcome to the ITM Program!</h3></div>
                            </div>
                        </div>
                        <div className="data-collection-only">
                            Thank you for your interest in the DARPA In the Moment Program.  Please use the drop down above to select if you will be completing the delegation survey or the text based scenarios.
                        </div>
                    </div>
                )}
            </>
        );
    }
}

export default HomePage;