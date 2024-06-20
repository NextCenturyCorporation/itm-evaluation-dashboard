import { configureStore } from '@reduxjs/toolkit';
import configReducer from "./slices/configSlice";

const store = configureStore({
    reducer: {
        configs: configReducer
    }
});

export default store;