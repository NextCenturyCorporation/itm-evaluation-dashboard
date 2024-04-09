import React from 'react';
import AggregateResults from '../AggregateResults/aggregateResults';

class HomePage extends React.Component {

    render() {
        return (
            <div className="home-container">
                <div className="home-navigation-container">
                    <div className="evaluation-selector-container">
                        <div className="evaluation-selector-label"><h3>Program Questions:</h3></div>
                    </div>
                </div>
                <AggregateResults type="Program" />
            </div>
            
        );
    }
}

export default HomePage;