import React from "react";
import { exportToExcel } from "../utils";
import '../../SurveyResults/resultsTable.css';

export function DownloadButtons({ formattedData, filteredData, HEADERS, fileName, extraAction, isParticipantData = false, extraActionText = 'View Variable Definitions' }) {
    return (
        <div className={"option-section " + (filteredData.length < formattedData.length ? "adjusted-margin" : "")}>
            {filteredData.length < formattedData.length || Object.keys(filteredData[0] ?? {}).length < Object.keys(formattedData[0] ?? {}).length ? <div className="downloadGroup">
                <button className='downloadBtn' onClick={() => exportToExcel(fileName, formattedData, HEADERS, isParticipantData)}>Download All Data</button>
                <button className='downloadBtn' onClick={() => exportToExcel(fileName + ' (filtered)', filteredData, HEADERS, isParticipantData)}>Download Filtered Data</button>
            </div> :
                <button className='downloadBtn' onClick={() => exportToExcel(fileName, formattedData, HEADERS, isParticipantData)}>Download All Data</button>
            }
            {extraAction && <button className='downloadBtn' onClick={extraAction}>{extraActionText}</button>}
        </div>
    );
}
