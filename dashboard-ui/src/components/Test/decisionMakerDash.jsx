import React from "react"
import { ListGroup, Card } from 'react-bootstrap'
class DecisionMakerDash extends React.Component {
    render = () => {

        const dashInfo = this.props.dashInfo

        const dashInfoItems = Object.entries(dashInfo).map(([key, value]) => (
            <ListGroup.Item key={key}>
                <strong>{key}:</strong> {value}
            </ListGroup.Item>
        ));

        const columnCount = 2;
        const dashInfoColumns = [[], []];
        
        // to make grid format instead of expand straight down  
        dashInfoItems.forEach((item, index) => {
            dashInfoColumns[index % columnCount].push(item);
        });

        return (
            <Card>
                <Card.Body>
                    <div className="d-flex">
                        {dashInfoColumns.map((column, columnIndex) => (
                            <div key={columnIndex} className="flex-fill">
                                <ListGroup variant="flush">
                                    {column}
                                </ListGroup>
                            </div>
                        ))}
                    </div>
                </Card.Body>
            </Card>
        )
    }
}
export default DecisionMakerDash