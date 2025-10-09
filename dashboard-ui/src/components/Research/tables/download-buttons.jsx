import React from "react";
import { exportToExcel } from "../utils";
import '../../SurveyResults/resultsTable.css';

export function DownloadButtons({ formattedData, filteredData, HEADERS, fileName, extraAction, isParticipantData = false, extraActionText = 'View Variable Definitions', selectedPhase= null}) {
    const filterDataByHeaders = (data, headers) =>
        data.map(row =>
            Object.fromEntries(
                headers.map(h => [h, row[h]])
            )
        );

    const filteredFormattedData = filterDataByHeaders(formattedData, HEADERS);
    const filteredFilteredData = filterDataByHeaders(filteredData, HEADERS);

    return (
        <div className={"option-section " + (filteredData.length < formattedData.length ? "adjusted-margin" : "")}>
            {filteredData.length < formattedData.length || Object.keys(filteredData[0] ?? {}).length < Object.keys(formattedData[0] ?? {}).length ? <div className="downloadGroup">
                <button className='downloadBtn' onClick={() => exportToExcel(fileName, filteredFormattedData, HEADERS, isParticipantData, selectedPhase)}>Download All Data</button>
                <button className='downloadBtn' onClick={() => exportToExcel(fileName + ' (filtered)', filteredFilteredData, HEADERS, isParticipantData, selectedPhase)}>Download Filtered Data</button>
            </div> :
                <button className='downloadBtn' onClick={() => exportToExcel(fileName, filteredFormattedData, HEADERS, isParticipantData, selectedPhase)}>Download All Data</button>
            }
            {extraAction && <button className='downloadBtn' onClick={extraAction}>{extraActionText}</button>}
        </div>
    );
}
