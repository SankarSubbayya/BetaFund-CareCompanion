from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Bland AI
    bland_ai_api_key: str = ""

    # InsForge
    insforge_base_url: str = ""
    insforge_anon_key: str = ""

    # Google Places API (optional)
    google_places_api_key: str = ""

    # App
    base_url: str = "http://localhost:8000"
    skip_auth: bool = True

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
