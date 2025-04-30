"""
Application configuration settings
"""

from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "GeoLandmark Explorer API"
    API_V1_STR: str = "/api/v1"
    
    # Database settings
    DB_NAME: str = os.getenv("DB_NAME", "geo")
    DB_USER: str = os.getenv("DB_USER", "postgres")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "336699")
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: str = os.getenv("DB_PORT", "5432")
    DATABASE_URL: str = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    
    # Redis settings
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_DB: int = int(os.getenv("REDIS_DB", "0"))
    REDIS_ENABLED: bool = os.getenv("REDIS_ENABLED", "true").lower() == "true"
    
    # CORS settings
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",  # React development server
        "http://localhost:8000",  # FastAPI development server
        "http://localhost:8080",  # Alternative development port
    ]
    
    # Cache settings
    CACHE_TTL: int = int(os.getenv("CACHE_TTL", "300"))  # 5 minutes default
    
    # Map settings
    DEFAULT_MAP_CENTER: List[float] = [8.2275, 46.8182]  # Center of Switzerland
    DEFAULT_ZOOM: int = 7
    MAX_ZOOM: int = 20
    MIN_ZOOM: int = 1
    
    # Transaction settings
    DEFAULT_TIME_PERIOD: str = "30d"  # Default time period for transaction queries
    MAX_RESULTS: int = 1000  # Maximum number of results to return
    BATCH_SIZE: int = 100  # Batch size for processing large datasets
    
    class Config:
        case_sensitive = True

settings = Settings() 