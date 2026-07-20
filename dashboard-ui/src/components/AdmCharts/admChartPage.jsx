import React from 'react';
import AdmCharts from './admCharts';
import { getAllEvals } from '../Research/utils';

class ADMChartPage extends React.Component {

    render() {

        const evalOptions = getAllEvals();

        return (
            <AdmCharts evaluationOptions={evalOptions} />
        )
    }
}

export default ADMChartPage;