import os
import base64
import json
import openai
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Dict, Any

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY is not set in the environment variables.")
client = openai.OpenAI(api_key=api_key)

app = FastAPI(
    title="Travel Wizard AI Service",
    description="An API service to generate travel ideas from images.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

@app.post("/api/v1/inspire-from-image")
async def inspire_from_image(image: UploadFile = File(...)):
    """
    接收一张图片，使用 GPT-4 Vision 分析，并返回一个结构化的旅行灵感 JSON。
    """
    # 1. read and encode image
    try:
        contents = await image.read()
        base64_image = base64.b64encode(contents).decode("utf-8")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read image: {e}")

    # 2. using openapi prompt
    prompt = """
    You are a world-class travel expert. Analyze this image and return a JSON object with the following structure:
    {
      "type": "destination_idea",
      "content": {
        "title": "A short, catchy title (e.g., 'Santorini, Greece')",
        "vibe": "Describe the travel vibe in a few words (e.g., 'Romantic, Relaxing, Picturesque')",
        "description": "A one-paragraph, engaging description of the destination and why it matches the image.",
        "suggested_activities": ["A list of 3-4 key activities that fit the vibe."],
        "image_url": "Provide a placeholder string 'image_placeholder' for now."
      }
    }
    Do not include any text or markdown formatting outside of the JSON object.
    """

    # 3. OpenAI GPT-4o
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            },
                        },
                    ],
                }
            ],
            max_tokens=500,
        )
        response_content = response.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API request failed: {e}")

    # 4. analyze return value
    try:
        cleaned_json_string = response_content.strip().replace("```json", "").replace("```", "")
        result = json.loads(cleaned_json_string)
        return result
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="Failed to parse JSON response from OpenAI. Raw response: " + response_content
        )

# Add this import at the top of your main.py file
from pydantic import BaseModel
from typing import Dict, Any

# --- Pydantic Model for the Poll Request ---
# This defines the expected structure of the data your frontend will send.
class PollRequest(BaseModel):
    optionA: Dict[str, Any]
    optionB: Dict[str, Any]

# --- New API Endpoint for Generating Polls ---
@app.post("/api/v1/generate-poll")
async def generate_poll(request: PollRequest):
    """
    Receives two travel options and uses GPT-4o to generate a poll question.
    """
    try:
        # Convert the dictionary data to a clean string for the prompt
        option_a_str = json.dumps(request.optionA, indent=2)
        option_b_str = json.dumps(request.optionB, indent=2)

        # 2. Construct a precise prompt for GPT-4o
        prompt = f"""
        You are a helpful travel assistant who creates concise, engaging polls to help groups make decisions.
        Based on the two travel options below, create a poll. The poll question should highlight the key trade-off or difference between the two choices (e.g., location vs. luxury, adventure vs. relaxation).

        Option A:
        {option_a_str}

        Option B:
        {option_b_str}

        Your response MUST be a single, valid JSON object with the following structure:
        {{
          "question": "The engaging poll question",
          "options": [
            {{ "id": "A", "text": "A short summary for Option A" }},
            {{ "id": "B", "text": "A short summary for Option B" }}
          ]
        }}
        Do not include any other text or markdown formatting.
        """

        # 3. Call the OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "user", "content": prompt}
            ],
            max_tokens=300,
            response_format={"type": "json_object"} # Use JSON mode for reliable output
        )
        response_content = response.choices[0].message.content

        # 4. Parse and return the result
        result = json.loads(response_content)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate poll: {e}")
    
@app.get("/")
def read_root():
    return {"status": "Travel Wizard AI Service is running!"}