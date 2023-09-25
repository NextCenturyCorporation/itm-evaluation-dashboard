import React from 'react';
import { ListGroup, Card, Carousel, Modal, Tabs, Tab, Accordion } from 'react-bootstrap';
import DecisionList from './decisionList';
class CasualtySlider extends React.Component {

    state = {
        showModal: false,
        selectedCasualty: null,
    };

    tagMappings = {
        "red": "Immediate",
        "gray": "Expectant",
        "green": "Minimal",
        "yellow": "Delayed"
    }

    // Method to handle clicking on an image
    handleCasualtyClick = (casualty) => {
        this.setState({
            showModal: true,
            selectedCasualty: casualty,
        });
        console.log(casualty.actionsOnCasualty)
    };

    // Method to close the modal
    handleCloseModal = () => {
        this.setState({
            showModal: false,
            selectedCasualty: null,
        });
    };

    formattedActionType(actionType) {
        return actionType
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    renderCasualtyDetails() {
        if (this.state.selectedCasualty) {
            const { name, salt, tagApplied, correctTag, actionsOnCasualty } = this.state.selectedCasualty;

            const visibleDecisionsCount = 5;
            const decisionHeight = 50;

            // total height of accordion maxes out at count * height of each 
            const accordionHeight = `${visibleDecisionsCount * decisionHeight}px`;

            return (
                <div>
                    <Card>
                        <Card.Body>
                            <Card.Title>Name: {name}</Card.Title>
                            <Tabs>
                                <Tab eventKey="0" title="Casualty Description">
                                    <ListGroup variant="flush">
                                        <ListGroup.Item>{salt}</ListGroup.Item>
                                        <ListGroup.Item>{tagApplied}</ListGroup.Item>
                                        <ListGroup.Item>{correctTag}</ListGroup.Item>
                                    </ListGroup>
                                </Tab>
                                <Tab eventKey="1" title="Decision Maker 1 Actions">
                                    <DecisionList decisions={this.state.selectedCasualty.actionsOnCasualty} />
                                </Tab>
                                <Tab eventKey="2" title="Decision Maker 2 Actions">
                                    <p>ADM</p>
                                </Tab>
                            </Tabs>
                        </Card.Body>
                    </Card>
                </div>
            );
        }
    }

    getCasualtyArray(tables, decisionMaker) {
        let casualties = []

        tables.map((table) => {
            const name = table.firstChild.innerText
            const url = table.lastChild.firstChild.firstChild.firstChild.src
            const salt = table.lastChild.childNodes[1].firstChild.innerText
            const tagApplied = table.lastChild.lastChild.firstChild.innerText
            const correctTag = table.lastChild.lastChild.childNodes[1].innerText

            const matchingDecisions = decisionMaker.filter((decision) => {
                return decision.actionData.some((entry) => {
                    return entry === name
                }
                );
            });

            const casualty = new Casualty(name, url, salt, tagApplied, correctTag);

            // If matching decisions are found, add them to the casualty's actionsOnCasualty array
            if (matchingDecisions.length > 0) {
                matchingDecisions.forEach((matchingDecision) => {
                    casualty.actionsOnCasualty.push(matchingDecision);
                });
            }

            casualties.push(casualty)
        })


        return casualties
    }

    render = () => {

        const tables = this.props.tables
        const decisionMaker = this.props.decisionMaker
        const casualties = this.getCasualtyArray(tables, decisionMaker)


        const imageStyle = {
            height: `${this.props.height}px`,
            objectFit: 'cover',
        };

        return (
            <div>
                <Carousel interval={null}>
                    {casualties.map((casualty, index) => (

                        <Carousel.Item key={index}>
                            <img
                                className="d-block w-100"
                                src={casualty.imgURL}
                                alt={`Slide ${index + 1}`}
                                style={imageStyle}
                            />
                            <Carousel.Caption>
                                <div
                                    className="translucent-background"
                                    onClick={() => this.handleCasualtyClick(casualty)}
                                >
                                    <h3>Name: {casualty.name}</h3>
                                    <p className="m-0">Click for casualty details</p>
                                </div>
                            </Carousel.Caption>
                        </Carousel.Item>
                    ))}
                </Carousel>
                <Modal show={this.state.showModal} onHide={this.handleCloseModal} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>Casualty Details</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="modal-dialog-scrollable">
                        {this.renderCasualtyDetails()}
                    </Modal.Body>
                    <Modal.Footer>
                        <button className="btn btn-secondary" onClick={this.handleCloseModal}>
                            Close
                        </button>
                    </Modal.Footer>
                </Modal>
            </div>
        );
    }
}

class Casualty {
    constructor(name, imgURL, salt, tagApplied, correctTag) {
        this.name = name;
        this.imgURL = imgURL
        this.salt = salt
        this.tagApplied = tagApplied
        this.correctTag = correctTag
        this.actionsOnCasualty = []
    }
}

export default CasualtySlider;
