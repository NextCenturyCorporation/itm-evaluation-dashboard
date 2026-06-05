import { React } from 'react';
import { Card } from 'react-bootstrap';



export function QueryErrorMessage({error, errors=[]}) {
    // instantiate all necessary variables
    // an array to hold one or more Apollo Error objects
    const allErrors = [...(error ? [error] : []),
                        ...(errors.filter(Boolean)),
                    ];
    // arrays for each type of error
    const networkErrors = []; 
    const graphQLErrors = [];

    // do not render the errors message if error is null
    if(allErrors.length === 0) {
        return null;
    }

    // define graphql and network error messages from Apollo object
    allErrors.forEach((apolloError, errorIndex) => {
        // get the network error message
        if(apolloError?.networkError?.message) {
            networkErrors.push({
                id: errorIndex,
                message: apolloError.networkError.message,
            })
        }

        // get the standard apollo graphQL errors 
        if (apolloError?.graphQLErrors?.length > 0) {
            apolloError.graphQLErrors.forEach((err, index) => {
                graphQLErrors.push({
                    id: `graphql-${errorIndex}-${index}`,
                    message: err.message,
                    code: err.extensions?.code,
                });
            });
        }

        // get the graphQL errors that are hidden and nested within network error results 
        if (apolloError?.networkError?.result?.errors?.length > 0) {
            apolloError.networkError.result.errors.forEach((err, index) => {
                graphQLErrors.push({
                    id: `network-graphql-${errorIndex}-${index}`,
                    message: err.message,
                    code: err.extensions?.code,
                });
            });
        }
    });
    // debug 
    console.log("GraphQL Errors:", graphQLErrors);
    console.log("Network Errors:", networkErrors);
    return (
        <>
                <Card bg="light" border="dark" className="home-container query-alert mt-4" >
                    <Card.Header> QUERY ERROR </Card.Header>
                    <Card.Body>
                        {/*Network Error Message */}

                        {networkErrors.length > 0 && (
                        <div className="mb-0">
                            <h6><strong>Network Errors</strong></h6>
                            <p>{networkErrors[0].message}</p>
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

                        {!networkErrors.length === 0 && graphQLErrors.length === 0 && (
                        <p className="mb-0">Unknown error occurred.</p>
                        )}
                    </Card.Body>
                </Card>
        </>
    );
}