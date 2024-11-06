import store from '../../store/store';
import { addConfig, addTextBasedConfig, setCurrentSurveyVersion } from '../../store/slices/configSlice';
import { isDefined } from '../AggregateResults/DataFunctions';
import { setParticipantLog } from '../../store/slices/participantSlice';

export function setupConfigWithImages(data) {
    for (const config of data.getAllSurveyConfigs) {
        let tempConfig = JSON.parse(JSON.stringify(config));
        for (const page of tempConfig.survey.pages) {
            for (const el of page.elements) {
                if (Object.keys(el).includes("patients")) {
                    for (const patient of el.patients) {
                        let foundImg = null;
                        if (config.survey.version == 4) {
                            let pName = patient.name;
                            if (pName.includes('Casualty')) {
                                pName = 'casualty_' + pName.substring(pName.length - 1);
                            }
                            foundImg = data.getAllTextBasedImages.find((x) => ((x.casualtyId.toLowerCase() === pName.toLowerCase() || (x.casualtyId === 'us_soldier' && pName === 'US Soldier')) && (x.scenarioId === page.scenarioIndex || x.scenarioId.replace('MJ', 'IO') === page.scenarioIndex)));
                        }
                        else {
                            foundImg = data.getAllImageUrls?.find((x) => x._id == patient.imgUrl);
                        }
                        if (isDefined(foundImg)) {
                            if (config.survey.version == 4) {
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
        store.dispatch(addConfig({ id: tempConfig._id, data: tempConfig }));
    }
}

export function setupTextBasedConfig(data) {
    if (!data || !data.getAllTextBasedConfigs) {
        console.warn("No text-based configs found in Mongo");
        return;
    }
    for (const config of data.getAllTextBasedConfigs) {
        let tempConfig = JSON.parse(JSON.stringify(config));
        if (tempConfig.eval != 'mre-eval') {
            for (const page of tempConfig.pages) {
                for (const el of page.elements) {
                    if (Object.keys(el).includes("patients")) {
                        for (const patient of el.patients) {
                            const foundImg = data.getAllTextBasedImages.find((x) => (x.casualtyId?.toLowerCase() === patient.id?.toLowerCase() && x.scenarioId === page.scenario_id));
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
