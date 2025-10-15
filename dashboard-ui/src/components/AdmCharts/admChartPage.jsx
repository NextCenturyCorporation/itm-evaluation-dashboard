import React from 'react';
import AdmCharts from './admCharts';
import { PAGES, getEvalOptionsForPage } from '../Research/utils';

class ADMChartPage extends React.Component {

    render() {

        const evalOptions = getEvalOptionsForPage(PAGES.ADM_ALIGNMENT);

        return (
            <AdmCharts evaluationOptions={evalOptions} />
        )
    }
}

export default ADMChartPage;