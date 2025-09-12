import { createSlice } from '@reduxjs/toolkit';

const configSlice = createSlice({
    name: 'configs',
    initialState: {
        surveyConfigs: {},
        textBasedConfigs: {},
        currentSurveyVersion: null,
        currentTextEval: null,
        currentStyle: null,
        pidBounds: {
            lowPid: null,
            highPid: null
        },
        showDemographics: false
    },
    reducers: {
        addConfig: (state, action) => {
            const { id, data } = action.payload
            state.surveyConfigs[id] = data.survey;
        },

        addTextBasedConfig: (state, action) => {
            const { data } = action.payload
            state.textBasedConfigs[data.scenario_id] = data
        },

        setCurrentSurveyVersion: (state, action) => {
            state.currentSurveyVersion = action.payload;
        },

        setCurrentTextEval: (state, action) => {
            state.currentTextEval = action.payload
        },

        setCurrentStyle: (state, action) => {
            state.currentStyle = action.payload
        },

        setPidBounds: (state, action) => {
            state.pidBounds = action.payload;
        },
        setShowDemographics: (state, action) => {  
            state.showDemographics = action.payload;
        }
    }
});

export const { addConfig, addTextBasedConfig, setCurrentSurveyVersion, setCurrentTextEval, setCurrentStyle, setPidBounds, setShowDemographics } = configSlice.actions;
export default configSlice.reducer;

