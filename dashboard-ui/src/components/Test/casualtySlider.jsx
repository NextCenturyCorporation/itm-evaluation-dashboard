import React from 'react';
import { ListGroup, Card, Carousel, Modal } from 'react-bootstrap';
class CasualtySlider extends React.Component {

    state = {
        showModal: false,
        selectedCasualty: null,
    };

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
            const { name, url, salt, tagApplied, correctTag } = this.state.selectedCasualty;
            
            return (
                <div>
                    <Card>
                        <Card.Body>
                            <Card.Title>Name: {name}</Card.Title>
                            <ListGroup variant="flush">
                                <ListGroup.Item>{salt}</ListGroup.Item>
                                <ListGroup.Item>{tagApplied}</ListGroup.Item>
                                <ListGroup.Item>{correctTag}</ListGroup.Item>
                            </ListGroup>
                        </Card.Body>
                    </Card>
                </div>
            );
        }
    }

    getCasualtyArray(tables) {
        let casualties = []

        {tables.map((table, index) => {
            const name = table.firstChild.innerText
            const url = table.lastChild.firstChild.firstChild.firstChild.src
            const salt = table.lastChild.childNodes[1].firstChild.innerText
            const tagApplied = table.lastChild.lastChild.firstChild.innerText
            const correctTag = table.lastChild.lastChild.childNodes[1].innerText
            console.log(tagApplied)
            casualties.push(new Casualty(name, url, salt, tagApplied, correctTag))
        })}
        return casualties
    }

    render = () => {
        const imageStyle = {
            height: '50vh', 
            objectFit: 'cover', 
        };
        
        const tables = this.props.tables
        console.log(tables)
        const casualties = this.getCasualtyArray(tables)

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
                <Modal show={this.state.showModal} onHide={this.handleCloseModal}>
                    <Modal.Header closeButton>
                        <Modal.Title>Casualty Details</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
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
    }
}

export default CasualtySlider;
