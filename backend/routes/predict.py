# backend/routes/predict.py
# =============================================================================
# POST /api/v1/predict
# Runs the ML placement prediction and auto-saves the result to SQLite.
# Requires authentication — the prediction is saved under the logged-in user.
# =============================================================================

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from schemas   import PredictRequest, PredictResponse
from predictor import run_prediction
from database  import get_db
from routes.auth import get_current_user
import crud
import logging

logger = logging.getLogger("skillai.predict")
router = APIRouter()


@router.post(
    "/predict",
    response_model=PredictResponse,
    summary="Predict Placement Probability",
    description=(
        "Accepts a student profile and returns an AI-computed placement "
        "probability, recommendation, skill gaps, and company matches. "
        "Result is automatically saved to the authenticated user's history. "
        "Requires a valid JWT token."
    ),
    tags=["Prediction"],
)
async def predict_placement(
    payload:      PredictRequest,
    db:           Session = Depends(get_db),
    current_user          = Depends(get_current_user),
) -> PredictResponse:
    try:
        result = run_prediction(payload)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Prediction failed. Please try again.")

    # Auto-save to the authenticated user's account
    try:
        logger.info("[predict] Saving prediction for user_id=%s", current_user.id)
        record = crud.save_prediction(db, current_user.id, payload, result)
        logger.info("[predict] Saved prediction id=%s score=%s", record.id, record.prediction_score)
    except Exception as exc:
        logger.error("[predict] DB save FAILED: %s", exc, exc_info=True)
        # Do NOT re-raise — the prediction result is still returned to the user

    return result
