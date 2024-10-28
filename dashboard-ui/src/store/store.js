import { configureStore } from '@reduxjs/toolkit';
import configReducer from "./slices/configSlice";
import participantReducer from './slices/participantSlice';

const store = configureStore({
    reducer: {
        configs: configReducer,
        participants: participantReducer
    }
});

export default store;