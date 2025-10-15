import store from '../../store/store';
import { addConfig, addTextBasedConfig, setCurrentSurveyVersion, setCurrentStyle, setCurrentTextEval, setPidBounds, setShowDemographics, setEvals } from '../../store/slices/configSlice';
import { isDefined } from '../AggregateResults/DataFunctions';
import { setParticipantLog } from '../../store/slices/participantSlice';

export function setupConfigWithImages(data) {
    console.log(data)
    const hasImageData = data.getAllImageUrls || data.getAllTextBasedImages;

    for (const config of data.getAllSurveyConfigs) {
        let tempConfig = JSON.parse(JSON.stringify(config));

        if (hasImageData) {
            for (const page of tempConfig.survey.pages) {
                for (const el of page.elements) {
                    if (Object.keys(el).includes("patients")) {
                        for (const patient of el.patients) {
                            let foundImg = null;
                            if (config.survey.version === 4 || config.survey.version === 5 || config.survey.version === 9) {
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
                                    foundImg = data.getAllImageUrls.find((x) => x._id === patient.imgUrl);
                                }
                            }

                            if (isDefined(foundImg)) {
                                if (config.survey.version === 4 || config.survey.version === 5 || config.survey.version === 9) {
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
        if (hasTextBasedImages && tempConfig.eval !== 'mre-eval' && tempConfig.pages && Array.isArray(tempConfig.pages)) {
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
                                (tempConfig.author === 'adept' ? true : x.scenarioId === page.scenario_id)));
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

export function setTextEval(evalName) {
    store.dispatch(setCurrentTextEval(evalName))
}

export function setCurrentUIStyle(version) {
    store.dispatch(setCurrentStyle(version));
}

export function setPidBoundsInStore(bounds) {
    const pidBounds = {
        lowPid: bounds.lowPid || null,
        highPid: bounds.highPid || null
    };
    store.dispatch(setPidBounds(pidBounds));
}

export function setEvalDataInStore(evals) {
    store.dispatch(setEvals(evals?.getAllEvalData ?? []));
}

export function setShowDemographicsInStore(showDemographics) {
    store.dispatch(setShowDemographics(showDemographics));
}