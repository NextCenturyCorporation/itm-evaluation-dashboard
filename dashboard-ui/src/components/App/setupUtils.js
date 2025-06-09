import store from '../../store/store';
import { addConfig, addTextBasedConfig, setCurrentSurveyVersion, setCurrentStyle } from '../../store/slices/configSlice';
import { isDefined } from '../AggregateResults/DataFunctions';
import { setParticipantLog } from '../../store/slices/participantSlice';

export function setupConfigWithImages(data) {
    const hasImageData = data.getAllImageUrls || data.getAllTextBasedImages;
    
    for (const config of data.getAllSurveyConfigs) {
        let tempConfig = JSON.parse(JSON.stringify(config));
        
        if (hasImageData) {
            for (const page of tempConfig.survey.pages) {
                for (const el of page.elements) {
                    if (Object.keys(el).includes("patients")) {
                        for (const patient of el.patients) {
                            let foundImg = null;
                            if (config.survey.version == 4 || config.survey.version == 5) {
                                if (data.getAllTextBasedImages) {
                                    let pName = patient.name;
                                    if (pName.includes('Casualty')) {
                                        pName = 'casualty_' + pName.substring(pName.length - 1);
                                    }
                                    foundImg = data.getAllTextBasedImages.find((x) => ((x.casualtyId.toLowerCase() === pName.toLowerCase() || (x.casualtyId === 'us_soldier' && pName === 'US Soldier')) && (x.scenarioId === page.scenarioIndex || x.scenarioId.replace('MJ', 'IO') === page.scenarioIndex)));
                                }
                            }
                            else {
                                if (data.getAllImageUrls) {
                                    foundImg = data.getAllImageUrls.find((x) => x._id == patient.imgUrl);
                                }
                            }
                            
                            if (isDefined(foundImg)) {
                                if (config.survey.version == 4 || config.survey.version == 5) {
                                    patient.imgUrl = foundImg.imageByteCode;
                                }
                                else {
                                    patient.imgUrl = foundImg.url;
                                }
                            }
                        }
                    }
                }
            }
        }
        
        store.dispatch(addConfig({ id: tempConfig._id, data: tempConfig }));
    }
}

export function setupTextBasedConfig(data) {
    if (!data || !data.getAllTextBasedConfigs) {
        console.warn("No text-based configs found in Mongo");
        return;
    }
    
    const hasTextBasedImages = data.getAllTextBasedImages && data.getAllTextBasedImages.length > 0;
    
    for (const config of data.getAllTextBasedConfigs) {
        let tempConfig = JSON.parse(JSON.stringify(config));
        
        if (hasTextBasedImages && tempConfig.eval != 'mre-eval') {
            for (const page of tempConfig.pages) {
                for (const el of page.elements) {
                    if (Object.keys(el).includes("patients")) {
                        for (const patient of el.patients) {
                            /*
                            soartech has different images for same casualty id's depending on scenario so we need to make sure casualty id matches 
                            patient id, as well as the scenario id for each. However, adept is able to reuse images from dre in phase 1. Hence the 
                            funky ternary operator here
                            */
                            const foundImg = data.getAllTextBasedImages.find((x) => (x.casualtyId?.toLowerCase() === patient.id?.toLowerCase() &&
                                (tempConfig.author == 'adept' ? true : x.scenarioId === page.scenario_id)));
                            if (foundImg) {
                                patient.imgUrl = foundImg.imageByteCode;
                            }
                        }
                    }
                }
            }
        }
        
        store.dispatch(addTextBasedConfig({ id: tempConfig._id, data: tempConfig }));
    }
}

export function setSurveyVersion(version) {
    store.dispatch(setCurrentSurveyVersion(Number(version).toFixed(1)));
}

export function setParticipantLogInStore(participants) {
    store.dispatch(setParticipantLog(participants));
}

export function setCurrentUIStyle(version) {
    store.dispatch(setCurrentStyle(version));
}

export const PH1_SURVEY_SETS = [
    { "Text-1": "AD-1", "Text-2": "ST-1", "Sim-1": "AD-2", "Sim-2": "ST-2", "Del-1": "AD-3", "Del-2": "ST-3", "ADMOrder": 1 },
    { "Text-1": "ST-1", "Text-2": "AD-2", "Sim-1": "ST-2", "Sim-2": "AD-3", "Del-1": "ST-3", "Del-2": "AD-1", "ADMOrder": 2 },
    { "Text-1": "AD-2", "Text-2": "ST-2", "Sim-1": "AD-3", "Sim-2": "ST-3", "Del-1": "AD-1", "Del-2": "ST-1", "ADMOrder": 3 },
    { "Text-1": "ST-2", "Text-2": "AD-3", "Sim-1": "ST-3", "Sim-2": "AD-1", "Del-1": "ST-1", "Del-2": "AD-2", "ADMOrder": 4 },
    { "Text-1": "AD-3", "Text-2": "ST-3", "Sim-1": "AD-1", "Sim-2": "ST-1", "Del-1": "AD-2", "Del-2": "ST-2", "ADMOrder": 1 },
    { "Text-1": "ST-3", "Text-2": "AD-1", "Sim-1": "ST-1", "Sim-2": "AD-2", "Del-1": "ST-2", "Del-2": "AD-3", "ADMOrder": 2 },
    { "Text-1": "AD-1", "Text-2": "ST-1", "Sim-1": "AD-2", "Sim-2": "ST-2", "Del-1": "AD-3", "Del-2": "ST-3", "ADMOrder": 3 },
    { "Text-1": "ST-1", "Text-2": "AD-2", "Sim-1": "ST-2", "Sim-2": "AD-3", "Del-1": "ST-3", "Del-2": "AD-1", "ADMOrder": 4 },
    { "Text-1": "AD-2", "Text-2": "ST-2", "Sim-1": "AD-3", "Sim-2": "ST-3", "Del-1": "AD-1", "Del-2": "ST-1", "ADMOrder": 1 },
    { "Text-1": "ST-2", "Text-2": "AD-3", "Sim-1": "ST-3", "Sim-2": "AD-1", "Del-1": "ST-1", "Del-2": "AD-2", "ADMOrder": 2 },
    { "Text-1": "AD-3", "Text-2": "ST-3", "Sim-1": "AD-1", "Sim-2": "ST-1", "Del-1": "AD-2", "Del-2": "ST-2", "ADMOrder": 3 },
    { "Text-1": "ST-3", "Text-2": "AD-1", "Sim-1": "ST-1", "Sim-2": "AD-2", "Del-1": "ST-2", "Del-2": "AD-3", "ADMOrder": 4 },
    { "Text-1": "AD-1", "Text-2": "ST-1", "Sim-1": "AD-2", "Sim-2": "ST-2", "Del-1": "AD-3", "Del-2": "ST-3", "ADMOrder": 3 },
    { "Text-1": "ST-1", "Text-2": "AD-2", "Sim-1": "ST-2", "Sim-2": "AD-3", "Del-1": "ST-3", "Del-2": "AD-1", "ADMOrder": 4 },
    { "Text-1": "AD-2", "Text-2": "ST-2", "Sim-1": "AD-3", "Sim-2": "ST-3", "Del-1": "AD-1", "Del-2": "ST-1", "ADMOrder": 1 },
    { "Text-1": "ST-2", "Text-2": "AD-3", "Sim-1": "ST-3", "Sim-2": "AD-1", "Del-1": "ST-1", "Del-2": "AD-2", "ADMOrder": 2 },
    { "Text-1": "AD-3", "Text-2": "ST-3", "Sim-1": "AD-1", "Sim-2": "ST-1", "Del-1": "AD-2", "Del-2": "ST-2", "ADMOrder": 3 },
    { "Text-1": "ST-3", "Text-2": "AD-1", "Sim-1": "ST-1", "Sim-2": "AD-2", "Del-1": "ST-2", "Del-2": "AD-3", "ADMOrder": 4 },
    { "Text-1": "AD-1", "Text-2": "ST-1", "Sim-1": "AD-2", "Sim-2": "ST-2", "Del-1": "AD-3", "Del-2": "ST-3", "ADMOrder": 1 },
    { "Text-1": "ST-1", "Text-2": "AD-2", "Sim-1": "ST-2", "Sim-2": "AD-3", "Del-1": "ST-3", "Del-2": "AD-1", "ADMOrder": 2 },
    { "Text-1": "AD-2", "Text-2": "ST-2", "Sim-1": "AD-3", "Sim-2": "ST-3", "Del-1": "AD-1", "Del-2": "ST-1", "ADMOrder": 3 },
    { "Text-1": "ST-2", "Text-2": "AD-3", "Sim-1": "ST-3", "Sim-2": "AD-1", "Del-1": "ST-1", "Del-2": "AD-2", "ADMOrder": 4 },
    { "Text-1": "AD-3", "Text-2": "ST-3", "Sim-1": "AD-1", "Sim-2": "ST-1", "Del-1": "AD-2", "Del-2": "ST-2", "ADMOrder": 1 },
    { "Text-1": "ST-3", "Text-2": "AD-1", "Sim-1": "ST-1", "Sim-2": "AD-2", "Del-1": "ST-2", "Del-2": "AD-3", "ADMOrder": 2 }
]