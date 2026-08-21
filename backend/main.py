import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv
import requests
from datetime import datetime
import os.path
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from typing import Optional

SCOPES=['https://www.googleapis.com/auth/calendar.events']
load_dotenv()
WEATHER_API_KEY=os.getenv("WEATHER_API_KEY")
# Gemini AI Setup
API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=API_KEY)

latest_weather_data=None
def get_weather(location:str)->str:
    global latest_weather_data
    url=f"http://api.openweathermap.org/data/2.5/weather?q={location}&appid={WEATHER_API_KEY}&units=metric"
    response=requests.get(url)
    if response.status_code==200:
        data=response.json()
        temp = data['main']['temp']
        desc = data['weather'][0]['description']
        feels_like = data['main']['feels_like']
        wind = data['wind']['speed']
        humidity = data['main']['humidity']
        sunrise = datetime.fromtimestamp(data['sys']['sunrise']).strftime('%I:%M %p')
        sunset = datetime.fromtimestamp(data['sys']['sunset']).strftime('%I:%M %p')
        latest_weather_data = {
            "temp": round(temp),
            "location": data['name'],
            "feelsLike": round(feels_like),
            "wind": round(wind, 1),
            "humidity": humidity,
            "sunrise": sunrise,
            "sunset": sunset
        }
        
        return f"The weather in {location} is {temp}°C with {desc}."
    return "Could not fetch weather data."

def get_calender_service():
    creds=None
    if os.path.exists('token.json'):
        creds=Credentials.from_authorized_user_file('token.json',SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())    
        else:
            flow=InstalledAppFlow.from_client_secrets_file('credentials.json',SCOPES)
            creds=flow.run_local_server(port=0)
        with open('token.json','w') as token:
            token.write(creds.to_json())
    service=build('calendar','v3',credentials=creds)
    return service
latest_calendar_data = None
def create_calendar_event(summary: str, start_time: str, end_time: str, description: str = ""):
    global latest_calendar_data
    """
    Creates a new event in the user's Google Calendar.
    Args:
        summary: The title or name of the event/meeting.
        start_time: Start time in ISO format (e.g., '2026-07-30T10:00:00')
        end_time: End time in ISO format (e.g., '2026-07-30T11:00:00')
        description: Description or agenda of the meeting.
    """
    print(f"\n[DEBUG] AI is trying to book from: {start_time} to {end_time}") 
    
    try:
        service = get_calender_service()
        event_details = {
            'summary': summary,
            'description': description,
            'start': {'dateTime': start_time, 'timeZone': 'Asia/Kolkata'},
            'end': {'dateTime': end_time, 'timeZone': 'Asia/Kolkata'},
        }
        event = service.events().insert(calendarId='primary', body=event_details).execute()
        latest_calendar_data = {
            "title": summary,
            "time": start_time.replace("T", " ")[:16] # Time-a thelivaa format panrom
        }
        return f"Event created successfully! Here is the link: {event.get('htmlLink')}"
    except Exception as e:
        # 🚨 Google enna thappu nu solluthu nu thelivaa terminal-la varum
        print(f"\n🚨 CALENDAR API ERROR: {e}\n") 
        return f"Error creating event: {str(e)}"

model = genai.GenerativeModel('gemini-flash-latest',tools=[get_weather,create_calendar_event]) 
app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Ithu unga React app-a allow pannum
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    file:Optional[str]=None

# Test URL
@app.get("/")
def read_root():
    return {"status": " Backend is running with Gemini AI! 🚀"}


@app.post("/api/chat")
async def chat_with_ai(request: ChatRequest):
    global latest_weather_data,latest_calendar_data
    latest_weather_data = None  
    latest_calendar_data = None

    try:
        
        now = datetime.now()
        current_time_str = now.strftime("%A, %B %d, %Y %I:%M %p")
        
        smart_prompt = (
            f"[System Note: Today's exact date and time is {current_time_str}. "
            f"If the user asks to book a meeting, calculate the correct date based on this time. "
            f"Use ISO format (YYYY-MM-DDTHH:MM:SS) for start_time and end_time].\n\n"
            f"User Message: {request.message}"
        )

        chat = model.start_chat(enable_automatic_function_calling=True)
      # 🚨 FILE UPLOAD LOGIC 🚨
        # Dummy text vantha crash aagama irukka, thelivaana check panrom
        if request.file and ";base64," in request.file:
            print("[DEBUG] Valid file received from frontend!")
            header, base64_data = request.file.split(';base64,')
            mime_type = header.replace('data:', '')
            
            image_blob = {
                "mime_type": mime_type,
                "data": base64_data
            }
            response = chat.send_message([smart_prompt, image_blob])
        else:
            # File illana, illana thappaana format-la vantha normal text mattum anuppurom
            response = chat.send_message(smart_prompt)
        
        return {
            "reply": response.text,
            "weatherData": latest_weather_data,
            "calendarData": latest_calendar_data
        }
    except Exception as e:
        return {"error": str(e)}