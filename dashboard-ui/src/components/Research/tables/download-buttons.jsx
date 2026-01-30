import React from "react";
import { exportToExcel } from "../utils";
import '../../SurveyResults/resultsTable.css';

export function DownloadButtons({ formattedData, filteredData, HEADERS, fileName, extraAction, isParticipantData = false, extraActionText = 'View Variable Definitions', selectedPhase= null}) {
    const filterDataByHeaders = (data, headers) =>
        data.map(row => ({
            ...Object.fromEntries(headers.map(h => [h, row[h]])),
            _evalNumber: row._evalNumber // need for formatting
        }));
    
    const filteredFormattedData = filterDataByHeaders(formattedData, HEADERS);
    const filteredFilteredData = filterDataByHeaders(filteredData, HEADERS);
    
    const hasFilteredData = filteredData.length > 0;
    const isFiltered = filteredData.length < formattedData.length || 
                       Object.keys(filteredData[0] ?? {}).length < Object.keys(formattedData[0] ?? {}).length;
    
    return (
        <div className='option-section'>
            {isFiltered ? (
                <div className="downloadGroup">
                    <button 
                        className='downloadBtn' 
                        onClick={() => hasFilteredData && exportToExcel(fileName + ' (filtered)', filteredFilteredData, HEADERS, isParticipantData, selectedPhase)}
                        disabled={!hasFilteredData}
                        style={{
                            opacity: hasFilteredData ? 1 : 0.5,
                            cursor: hasFilteredData ? 'pointer' : 'not-allowed'
                        }}
                    >
                        Download Filtered Data
                    </button>
                </div>
            ) : (
                <button 
                    className='downloadBtn' 
                    onClick={() => exportToExcel(fileName, filteredFormattedData, HEADERS, isParticipantData, selectedPhase)}
                >
                    Download All Data
                </button>
            )}
            {extraAction && <button className='downloadBtn' onClick={extraAction}>{extraActionText}</button>}
        </div>
    );
}