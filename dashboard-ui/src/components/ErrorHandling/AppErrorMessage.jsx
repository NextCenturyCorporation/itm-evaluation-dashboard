import { useState } from 'react';
import { Card, Button, Collapse } from 'react-bootstrap';



export function AppErrorMessage({error, errors=[]}) {
    // instantiate all necessary variables
    // an array to hold one or more Apollo Error objects
    const allErrors = [...(error ? [error] : []),
                        ...(errors.filter(Boolean)),
                    ];
    // arrays for each type of error
    const networkErrors = []; 
    const graphQLErrors = [];
    const jsErrors = [];
    
    // collapse state to show error details
    const [showErrors, setShowErrors] = useState(false);

    // do not render the errors message if error is null
    if(allErrors.length === 0) {
        return null;
    }

    // iterate through all errors in the array
    allErrors.forEach((currentError, errorIndex) => {

       // ---------------------------------
       // Get Java Script Error Messages
       // ---------------------------------

        // ensure the error is an instance of a javascript 
        const isApolloError = currentError?.networkError || currentError?.graphQLErrors;
        
        if (!isApolloError && currentError instanceof Error) {

            if ( 
                !jsErrors.some(
                    err => err.message === currentError.message
                )
            ) { // populate jsError Array
                jsErrors.push({
                    id: `js-${errorIndex}`,
                    name: currentError.name,
                    message: currentError.message,
                    stack: currentError.stack,
                });
            }

            // once found + jsErrors array is populated, exit out of function 
            return;
        }
       
       // ---------------------------------
       // Get Network Error Messages
       // ---------------------------------

        if(currentError?.networkError?.message) {
            const message = currentError.networkError.message; // get the first error message

            if(!networkErrors.some(err => err.message === message)) { // only add unique network errors
                networkErrors.push({
                    id: errorIndex,
                    message: currentError.networkError.message,
                })
            }
        }

       // ---------------------------------
       // Get GraphQL Error Messages
       // ---------------------------------
       
        if (currentError?.graphQLErrors?.length > 0) {
            currentError.graphQLErrors.forEach((err, index) => {
                // only add graphQL error to array if it does not already exist
                if(!graphQLErrors.some(gqlErr => gqlErr.message === err.message)) {
                    graphQLErrors.push({
                        id: `graphql-${errorIndex}-${index}`,
                        message: err.message,
                        code: err.extensions?.code,
                    });
                }
            });
        }

        // ---------------------------------
        // Get Hidden GraphQLError Messages
        // ---------------------------------
        
        if (currentError?.networkError?.result?.errors?.length > 0) {
            currentError.networkError.result.errors.forEach((err, index) => {
                // only add nested graphQL error messages to array if it does not already exist
                if(!graphQLErrors.some(gqlErr => gqlErr.message === err.message)) {
                    graphQLErrors.push({
                        id: `network-graphql-${errorIndex}-${index}`,
                        message: err.message,
                        code: err.extensions?.code,
                    });
                }
            });
        }
    });

    return (
        <>
                <Card bg="light" border="dark" className="error-message" >
                    <Card.Header> <h4>APPLICATION ERROR</h4> </Card.Header>
                    <Card.Body>
                        <p>Please try reloading the page. If the problem persists, contact an administrator.</p>
                        
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowErrors(!showErrors)}
                            aria-controls="error-details"
                            aria-expanded={showErrors}
                        >
                            {showErrors ? 'Hide Error Details' : 'Show Error Details'}
                        </Button>

                        <Collapse in={showErrors}>
                        <div id="error-details" className="mt-3">
                            <Card body style={{ maxWidth: '100%' }}>

                                {/* Javascript Error Message */}
                                {jsErrors.length > 0 && (
                                    <div className="mb-3">
                                        <h6><strong>Application Errors</strong></h6>
                                        <ul>
                                            {jsErrors.map(err => (
                                                <li key={err.id}>
                                                    <strong>{err.name}:</strong>{" "}
                                                    {err.message}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/*Network Error Message */}
                                {networkErrors.length > 0 && (
                                <div className="mb-0">
                                    <h6><strong>Network Errors</strong></h6>
                                    <ul>
                                        {networkErrors.map(err => (
                                            <li key={err.id}>
                                                {err.message}
                                            </li>
                                         ))}
                                    </ul>
                                </div>
                                )}

                                {/*GraphQL Error Message */}
                                {graphQLErrors.length > 0 && (
                                <div>
                                    <h6><strong>GraphQL Errors</strong></h6>
                                    <ul className="mb-0">
                                        {graphQLErrors.map(err => (
                                        <li key={err.id}>
                                        <strong>{err.code || 'ERROR'}:</strong> {err.message}
                                        </li>
                                    ))}
                                    </ul>
                                </div>
                                )}

                                {networkErrors.length === 0 && graphQLErrors.length === 0 && jsErrors.length === 0 && (
                                <p className="mb-0">Unknown error occurred.</p>
                                )}
                            </Card>
                        </div>
                        </Collapse>
                    </Card.Body>
                </Card>
        </>
    );
}