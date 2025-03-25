import { createSlice } from '@reduxjs/toolkit';

const configSlice = createSlice({
    name: 'configs',
    initialState: {
        surveyConfigs: {},
        textBasedConfigs: {},
        currentSurveyVersion: null,
        currentStyle: null
    },
    reducers: {
        addConfig: (state, action) => {
            const { id, data } = action.payload
            state.surveyConfigs[id] = data.survey;
        },

        addTextBasedConfig: (state, action) => {
            const { id, data } = action.payload
            state.textBasedConfigs[data.scenario_id] = data
        },

        setCurrentSurveyVersion: (state, action) => {
            state.currentSurveyVersion = action.payload;
        },

        setCurrentStyle: (state, action) => {
            state.currentStyle = action.payload
        }
    }
});

export const { addConfig, addTextBasedConfig, setCurrentSurveyVersion, setCurrentStyle } = configSlice.actions;
export default configSlice.reducer;

