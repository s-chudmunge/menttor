import os
from pydantic_settings import BaseSettings
from typing import Optional

os.environ['OPENROUTER_API_KEY'] = "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"

class MinimalSettings(BaseSettings):
    OPENROUTER_API_KEY: Optional[str] = None

def check_key():
    settings = MinimalSettings()
    print(f"OpenRouter API Key Loaded: {'*' * (len(settings.OPENROUTER_API_KEY) - 4) + settings.OPENROUTER_API_KEY[-4:] if settings.OPENROUTER_API_KEY else 'Not Set'}")

if __name__ == "__main__":
    check_key()
