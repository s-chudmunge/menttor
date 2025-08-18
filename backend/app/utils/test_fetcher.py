import asyncio
from huggingface_fetcher import HuggingFaceModelFetcher

async def main():
    async with HuggingFaceModelFetcher() as fetcher:
        models = await fetcher.fetch_models(limit=100, free_only=False)
        print(f"Fetched {len(models)} models:")
        for m in models:  # removed [:10] to show all
            print(f"{m['name']} - Downloads: {m['downloads']} - License: {m['license']}")

if __name__ == "__main__":
    asyncio.run(main())

