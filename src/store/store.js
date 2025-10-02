import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import candidatesReducer from './candidatesSlice';
import storage from 'redux-persist/lib/storage';
import { persistStore, persistReducer } from 'redux-persist';


const rootReducer = combineReducers({
candidates: candidatesReducer,
});


const persistConfig = {
key: 'root',
storage,
};


const persistedReducer = persistReducer(persistConfig, rootReducer);


export const store = configureStore({
reducer: persistedReducer,
middleware: (getDefaultMiddleware) =>
getDefaultMiddleware({ serializableCheck: false }),
});


export const persistor = persistStore(store);