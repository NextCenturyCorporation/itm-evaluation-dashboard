import { createSlice } from '@reduxjs/toolkit';

const configSlice = createSlice({
    name: 'configs',
    initialState: {
        surveyConfigs: null,
        textBasedConfigs: null
    },
    reducers: {
        addConfig: (state, action) => {
            let payload = action.payload;
            if (state.surveyConfigs === null) {
                state.surveyConfigs = {};
            }
            state.surveyConfigs[payload.id] = payload.data.survey;
        },

        addTextBasedConfig: (state, action) => {
            let payload = action.payload;
            if (state.textBasedConfigs === null) {
                state.textBasedConfigs = {};
            }

            state.textBasedConfigs[payload.id] = payload.data
        }
    }
});

export const { addConfig, addTextBasedConfig } = configSlice.actions;
export default configSlice.reducer;

