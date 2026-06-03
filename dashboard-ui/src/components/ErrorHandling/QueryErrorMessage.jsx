import {React, useState, useEffect} from 'react';
import { Button, Modal } from 'react-bootstrap';



export function QueryErrorMessage({error}) {
    // all variables, properties, and modal handling functions
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    // open the modal when any error occurs
    useEffect(() => {
        if(error) {
            handleShow();
        }
    }, [error])

    // define graphql and network error messages from Apollo object
    const networkErrorMessage = (error && error.networkError) ? error.networkError.message : null;
    const graphQLErrorMessages =  error && error.graphQLErrors
      ? error.graphQLErrors.map((e, index) => ({
          id: index,
          message: e.message,
          code: e.extensions && e.extensions.code,
        }))
      : [];

    return (
        <>
            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                <Modal.Title>GraphQL Query Error</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                {/*Network Error Message */}

                {networkErrorMessage && (
                <div style={{ marginBottom: '1rem' }}>
                    <h6>Network Error</h6>
                    <p>{networkErrorMessage}</p>
                </div>
                )}

                {/*GraphQL Error Message */}
              
                {graphQLErrorMessages.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                    <h6>GraphQL Errors</h6>
                    <ul>
                        {graphQLErrorMessages.map(err => (
                        <li key={err.id}>
                        <strong>{err.code || 'ERROR'}:</strong> {err.message}
                        </li>
                    ))}
                    </ul>
                </div>
                )}

                {!networkErrorMessage && graphQLErrorMessages.length === 0 && (
                <p>Unknown error occurred.</p>
                )}
                </Modal.Body>

                <Modal.Footer>
                {/* NEXT STEP IDEAS:
                    - add retry button (refetch query)
                    - add "go back" navigation
                    - add refresh page button
                */}
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
                </Modal.Footer>
            </Modal>      
        </>

    );
}