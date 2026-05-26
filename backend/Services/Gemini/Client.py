import google.generativeai as genai 
from ...Security.Settings import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

_model = genai.GenerativeModel("gemini-1.5-flash")

async def call_genai(prompts: str) -> str:
    try: 
        response = _model.generate_content(prompts)
        return response.text.strip()
    except Exception as e:
        raise RuntimeError(f"GenAI Model Is Throwing Error {str(e)}")