import { createSlice } from '@reduxjs/toolkit';

const participantSlice = createSlice({
    name: 'participants',
    initialState: {
        participantLog: null,
    },
    reducers: {
        setParticipantLog: (state, action) => {
            state.participantLog = action.payload;
        }
    }
});

export const { setParticipantLog } = participantSlice.actions;
export default participantSlice.reducer;

