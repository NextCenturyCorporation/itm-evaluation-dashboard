import { createSlice } from '@reduxjs/toolkit';

const configSlice = createSlice({
    name: 'configs',
    initialState: {
        surveyConfigs: null
    },
    reducers: {
        addConfig: (state, action) => {
            let payload = action.payload;
            if (state.surveyConfigs === null) {
                state.surveyConfigs = {};
            }
            state.surveyConfigs[payload.id] = payload.data.survey;
        }
    }
});

export const { addConfig } = configSlice.actions;
export default configSlice.reducer;

