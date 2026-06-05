// ─────────────────────────────────────────────────────────────────────────────
// src/hooks/usePrediction.js
//
// Custom React hook that manages the full lifecycle of a prediction API call:
//   idle  →  loading  →  success | error
//
// Separates all async/state logic from the UI component so PlacementPrediction
// can stay focused purely on rendering.
//
// Usage:
//   const { state, predict, reset } = usePrediction()
//   state.status   : 'idle' | 'loading' | 'success' | 'error'
//   state.result   : PredictResponse object from the API (or null)
//   state.error    : error message string (or null)
// ─────────────────────────────────────────────────────────────────────────────

import { useReducer, useCallback } from 'react'
import { predictPlacement } from '../api/predictApi'

// ── State shape ───────────────────────────────────────────────────
const initialState = {
  status: 'idle',   // 'idle' | 'loading' | 'success' | 'error'
  result: null,     // PredictResponse from API
  error:  null,     // string error message
}

// ── Reducer ───────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { status: 'loading', result: null, error: null }
    case 'FETCH_SUCCESS':
      return { status: 'success', result: action.payload, error: null }
    case 'FETCH_ERROR':
      return { status: 'error', result: null, error: action.payload }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

// ── Hook ──────────────────────────────────────────────────────────
export function usePrediction() {
  const [state, dispatch] = useReducer(reducer, initialState)

  /**
   * predict(form) — fire the API call.
   * Dispatches loading → success | error automatically.
   *
   * @param {Object} form - the React form state object
   */
  const predict = useCallback(async (form) => {
    dispatch({ type: 'FETCH_START' })
    try {
      const result = await predictPlacement(form)
      dispatch({ type: 'FETCH_SUCCESS', payload: result })
    } catch (err) {
      dispatch({ type: 'FETCH_ERROR', payload: err.message })
    }
  }, [])

  /**
   * reset() — go back to idle, clear result and error.
   */
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  return { state, predict, reset }
}
