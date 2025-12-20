import requests
from django.conf import settings


def func_workout(level, workout_type):
    url = "https://api.api-ninjas.com/v1/exercises"

    headers = {
        "X-Api-Key": settings.API_NINJAS_KEY
    }

    params = {
        "difficulty": level,
        "type": workout_type
    }

    res = requests.get(url, headers=headers, params=params, timeout=5)
    res.raise_for_status()

    return res.json()


def diet_by_bmi(bmi):
    if bmi < 18.5:
        query = "rice, banana, peanut butter, milk"
        goal = "High calorie diet"

    elif bmi < 25:
        query = "chicken breast, rice, vegetables, fruits"
        goal = "Balanced diet"

    else:
        query = "salad, oats, apple, eggs"
        goal = "Low calorie diet"

    url = "https://api.api-ninjas.com/v1/nutrition"

    headers = {
        "X-Api-Key": settings.API_NINJAS_KEY
    }

    params = {
        "query": query
    }

    res = requests.get(url, headers=headers, params=params, timeout=5)
    res.raise_for_status()

    return {
        "goal": goal,
        "bmi": bmi,
        "foods": res.json()
    }
