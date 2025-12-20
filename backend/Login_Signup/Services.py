import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

def func_workout(level, workout_type):
    """Fetches exercises from API Ninjas with error handling."""
    url = "https://api.api-ninjas.com/v1/exercises"
    headers = {"X-Api-Key": settings.API_NINJAS_KEY}
    params = {"type": workout_type, "difficulty": level}

    try:
        # Timeout prevents your server from hanging if the API is slow
        res = requests.get(url, headers=headers, params=params, timeout=8)
        res.raise_for_status() # Automatically triggers the HTTPError block for 4xx/5xx
        return {"success": True, "data": res.json()}
    
    except requests.exceptions.HTTPError as e:
        logger.error(f"API Ninjas HTTP Error: {e.response.status_code} - {e.response.text}")
        return {"success": False, "msg": f"Exercise API error: {e.response.status_code}"}
    except requests.exceptions.RequestException as e:
        logger.error(f"Network Error: {str(e)}")
        return {"success": False, "msg": "Failed to connect to exercise service."}

def diet_by_bmi(bmi):
    """Calculates diet goals and fetches nutrition data."""
    if bmi < 18.5:
        query, goal = "rice, banana, peanut butter, milk", "High calorie diet"
    elif bmi < 25:
        query, goal = "chicken breast, rice, vegetables, fruits", "Balanced diet"
    else:
        query, goal = "salad, oats, apple, eggs", "Low calorie diet"

    url = "https://api.api-ninjas.com/v1/nutrition"
    headers = {"X-Api-Key": settings.API_NINJAS_KEY}

    try:
        res = requests.get(url, headers=headers, params={"query": query}, timeout=8)
        res.raise_for_status()
        return {
            "success": True, 
            "data": {"goal": goal, "bmi": bmi, "foods": res.json()}
        }
    except Exception as e:
        logger.error(f"Diet API Failure: {str(e)}")
        return {"success": False, "msg": "Nutrition service currently unavailable."}