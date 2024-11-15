import React from "react";
import { exportToExcel } from "../utils";
import '../../SurveyResults/resultsTable.css';

export function DownloadButtons({ formattedData, filteredData, HEADERS, fileName, openModal }) {
    return (
        <div className={"option-section " + (filteredData.length < formattedData.length ? "adjusted-margin" : "")}>
            {filteredData.length < formattedData.length ? <div className="downloadGroup">
                <button className='downloadBtn' onClick={() => exportToExcel(fileName, formattedData, HEADERS)}>Download All Data</button>
                <button className='downloadBtn' onClick={() => exportToExcel(fileName + ' (filtered)', filteredData, HEADERS)}>Download Filtered Data</button>
            </div> :
                <button className='downloadBtn' onClick={() => exportToExcel(fileName, formattedData, HEADERS)}>Download All Data</button>
            }
            <button className='downloadBtn' onClick={openModal}>View Variable Definitions</button>
        </div>
    );
}
