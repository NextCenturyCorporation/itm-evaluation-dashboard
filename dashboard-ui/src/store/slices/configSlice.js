import { createSlice } from '@reduxjs/toolkit';

const configSlice = createSlice({
    name: 'configs',
    initialState: {
        surveyConfigs: {},
        textBasedConfigs: {}
    },
    reducers: {
        addConfig: (state, action) => {
            const { id, data } = action.payload
            state.surveyConfigs[id] = data.survey;
        },

        addTextBasedConfig: (state, action) => {
            const { id, data } = action.payload
            state.textBasedConfigs[data.scenario_id] = data
        }
    }
});

export const { addConfig, addTextBasedConfig } = configSlice.actions;
export default configSlice.reducer;

