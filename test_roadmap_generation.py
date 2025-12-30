import requests
import os
import json
import time

def test_roadmap_generation():
    try:
        # Wait for the server to start
        time.sleep(5)

        # Set the environment variable for the API key
        os.environ['OPENROUTER_API_KEY'] = "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"

        # The payload for the roadmap generation
        payload = {
            "subject": "Python",
            "goal": "Learn the basics of Python",
            "time_value": 1,
            "time_unit": "weeks",
            "model": "openrouter:google/gemma-3n-e2b-it:free"
        }

        # The URL of the backend
        url = "http://localhost:8080/roadmaps/generate"

        # Send the POST request
        response = requests.post(url, json=payload)

        # Check the response
        if response.status_code == 200:
            print("Roadmap generation successful:")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"Roadmap generation failed with status code: {response.status_code}")
            print("Response:")
            print(response.text)

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    test_roadmap_generation()
