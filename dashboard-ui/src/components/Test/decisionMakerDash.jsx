import React from "react"
import { ListGroup, Card } from 'react-bootstrap'
class DecisionMakerDash extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            htmlFileContent: null,
            doc: null,
            dashInfo: null
        };
    }

    componentDidUpdate(prevProps) {
        if (this.props.decisionMaker !== prevProps.decisionMaker) {
            this.setState({dashInfo: null})
            this.fetchData(this.props.decisionMaker);
        }
    }

    fetchData() {
        if (this.props.decisionMaker && this.props.isHuman) {

            const htmlFilePath = process.env.PUBLIC_URL + `/jungleExampleData/${this.props.decisionMaker === "human1" ? "jungle1" : "jungle2"}.html`;

            // grab html file
            fetch(htmlFilePath)
                .then((response) => response.text())
                .then((data) => {
                    this.setState({ htmlFileContent: data });
                    this.parseDoc()
                })
                .catch((error) => {
                    console.error('Error fetching file:', error);
                });
        }
    }

    parseDoc() {
        const { htmlFileContent } = this.state;
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlFileContent, 'text/html')
        
        this.setState({ doc: doc })
        this.parseDash(doc)
    }

    parseDash(doc) {
        let dashInfo = {}
        const dash = doc.querySelector('.dash')

        if (dash) {
            const divElements = dash.querySelectorAll('div')

            divElements.forEach(divElement => {
                const label = divElement.querySelector('label')
                const span = divElement.querySelector('span')


                const labelText = label ? label.textContent : 'Label not found'
                const spanText = span ? span.textContent : 'Span not found'

                dashInfo[labelText] = spanText
            })
            this.setState({ dashInfo: dashInfo })
        } 
    }

    formatDashInfo(dashInfo) {
        if (dashInfo) {
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

            return dashInfoColumns
        } else {
            return []
        }
    }

    render = () => {
        const dashInfoColumns = this.formatDashInfo(this.state.dashInfo)
        return (
            <>
             <h3>{this.props.title}</h3>
                {dashInfoColumns.length ? (
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
                ) : (
                    <></>
                )
                }
            </>
        )
    }
}
export default DecisionMakerDash