import os
from pydantic_settings import BaseSettings
from typing import Optional

class MinimalSettings(BaseSettings):
    # Keep other settings if any, or leave empty
    pass

def check_key():
    settings = MinimalSettings()
    # You can add checks for other keys here if needed
    print("Key check complete.")

if __name__ == "__main__":
    check_key()