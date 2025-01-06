import { configureStore } from '@reduxjs/toolkit'
import { rootReducer } from './rootReducer'
import uiReducer from './features/ui/uiSlice'

export const store = configureStore({
  reducer: {
    ui: uiReducer
  }
  // middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(middleware)
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
