import React from "react"
import DecisionList from "./decisionList"
import DecisionMakerDash from "./decisionMakerDash"
import { Tabs, Tab } from 'react-bootstrap'
class DecisionMakerDetails extends React.Component {

    render = () => {
        const decisionMaker = this.props.decisionMaker; // Assuming 'decisions' is an array passed as a prop
        return (
            <Tabs className="p-1">
                <Tab eventKey="0" title="Action List" className="p-4">
                    <h3>Decision Maker {decisionMaker.id}</h3>
                    <DecisionList decisions={decisionMaker.decisions} />
                </Tab>
                <Tab eventKey="1" title="General Scenario Stats" className="p-4">
                    <h3>Decision Maker {decisionMaker.id}</h3>
                    <DecisionMakerDash dashInfo={this.props.dashInfo} />
                </Tab>
            </Tabs>
        )
    }
}

export default DecisionMakerDetails