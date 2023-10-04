import React from 'react';
import { ListGroup, Card, Carousel, Modal, Tabs, Tab } from 'react-bootstrap';
import DecisionList from './decisionList';
import { getCasualtyArray } from './htmlUtility';
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
    };

    // Method to close the modal
    handleCloseModal = () => {
        this.setState({
            showModal: false,
            selectedCasualty: null,
        });
    };

    renderCasualtyDetails() {
        if (this.state.selectedCasualty) {
            const casualty = this.state.selectedCasualty;

            return (
                <div>
                    <Card>
                        <Card.Body>
                            <Card.Title>Name: {casualty.name}</Card.Title>
                            <Tabs>
                                <Tab eventKey="0" title="Casualty Description">
                                    {renderPatientInfo(casualty)}
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

    render = () => {

        const tables = this.props.tables
        const decisionMaker = this.props.decisionMaker
        const casualties = getCasualtyArray(tables, decisionMaker)

        const imageStyle = {
            height: '400px',
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

export class Casualty {
    constructor(name, imgURL, salt, sort, pulse, breath, hearing, mood) {
        this.name = name
        this.imgURL = imgURL
        this.salt = salt
        this.sort = sort
        this.pulse = pulse
        this.breath = breath
        this.hearing = hearing
        this.mood = mood
        this.actionsOnCasualty = []
    }
}

export const renderPatientInfo = (casualty) => {
    return (
        <ListGroup variant="flush">
            <ListGroup.Item>{casualty.salt}</ListGroup.Item>
            <ListGroup.Item>{casualty.sort}</ListGroup.Item>
            <ListGroup.Item>{casualty.pulse}</ListGroup.Item>
            <ListGroup.Item>{casualty.breath}</ListGroup.Item>
            <ListGroup.Item>{casualty.hearing}</ListGroup.Item>
            <ListGroup.Item>{casualty.mood}</ListGroup.Item>
        </ListGroup>
    )
}

export default CasualtySlider;
