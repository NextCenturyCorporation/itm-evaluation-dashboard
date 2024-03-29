import React from 'react';
import HomeCharts from '../Home/homeCharts';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';

const getEvalNameNumbers = "getEvalNameNumbers";

const get_eval_name_numbers = gql`
    query getEvalNameNumbers{
        getEvalNameNumbers
  }`;

class HomePage extends React.Component {

    render() {
        return (
            <Query query={get_eval_name_numbers}>
            {
                ({ loading, error, data }) => {
                    if (loading) return <div>Loading ...</div> 
                    if (error) return <div>Error</div>

                    const evalOptionsRaw = data[getEvalNameNumbers];
                    let evalOptions = [];

                    for(let i=0; i < evalOptionsRaw.length; i++) {
                        evalOptions.push({value: evalOptionsRaw[i]._id.evalNumber, label:  evalOptionsRaw[i]._id.evalName})
                    }

                    return (
                        <HomeCharts evaluationOptions={evalOptions}/>
                    )
                }
            }
            </Query>
            
        );
    }
}

export default HomePage;