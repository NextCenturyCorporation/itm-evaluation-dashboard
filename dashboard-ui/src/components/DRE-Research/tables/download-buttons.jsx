import React from "react";
import { exportToExcel } from "../utils";
import '../../SurveyResults/resultsTable.css';

export function DownloadButtons({ formattedData, filteredData, HEADERS, fileName, openModal, isParticipantData = false }) {
    return (
        <div className={"option-section " + (filteredData.length < formattedData.length ? "adjusted-margin" : "")}>
            {filteredData.length < formattedData.length ? <div className="downloadGroup">
                <button className='downloadBtn' onClick={() => exportToExcel(fileName, formattedData, HEADERS, isParticipantData)}>Download All Data</button>
                <button className='downloadBtn' onClick={() => exportToExcel(fileName + ' (filtered)', filteredData, HEADERS, isParticipantData)}>Download Filtered Data</button>
            </div> :
                <button className='downloadBtn' onClick={() => exportToExcel(fileName, formattedData, HEADERS, isParticipantData)}>Download All Data</button>
            }
            {openModal && <button className='downloadBtn' onClick={openModal}>View Variable Definitions</button>}
        </div>
    );
}
