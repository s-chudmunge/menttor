from huggingface_hub import HfApi
import os
from dotenv import load_dotenv

load_dotenv()

print("Loaded token:", os.getenv("HUGGINGFACE_HUB_TOKEN"))

api = HfApi()
try:
    models = api.list_models(limit=5)
    print("Successfully fetched models:")
    for m in models:
        print("-", m.modelId)
except Exception as e:
    print("Failed to fetch models:", str(e))