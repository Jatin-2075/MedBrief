from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from DataBase.Database import engine, Base
from Router.Auth_Router import router as auth_router
from Router.Personal_Data_Router import router as personal_router
from Router.Medical_Data_Router import router as medical_router
from Router.System import router as system_router

app = FastAPI(
    title="MedBreif AI",
    version="1.0.0",
    description="Backend API for MedBreif AI"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(personal_router)
app.include_router(medical_router)
app.include_router(system_router)

Base.metadata.create_all(bind=engine)


@app.get("/", tags=["Root"])
async def root():
    return {"message": "MedBreif AI backend is running"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("Main:app", host="0.0.0.0", port=8000, reload=True)
