import cv2
import os
import time
from datetime import datetime
from dotenv import load_dotenv
import google.generativeai as genai
from PIL import Image
import numpy as np
import requests
import json

# Încarcă API key
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# URL camera telefon IP Webcam
url = "http://10.133.72.247:8080/video"
cap = cv2.VideoCapture(url)

if not cap.isOpened():
    print("❌ Nu mă pot conecta la camera telefonului!")
    exit()

print("✓ Conectat la camera telefonului.")

# Citire coordonate GPS din fișier
def read_gps_coords():
    """Citeste coordonatele GPS din fisierul gps_coords.txt"""
    try:
        with open("gps_coords.txt", "r") as f:
            gps_data = {}
            for line in f:
                if "=" in line:
                    key, value = line.strip().split("=")
                    gps_data[key.strip()] = float(value.strip())
            return gps_data.get("lat"), gps_data.get("lon")
    except Exception as e:
        print(f"❌ Eroare la citirea GPS: {e}")
        return None, None

latitude, longitude = read_gps_coords()
if latitude and longitude:
    print(f"✓ Coordonate GPS: {latitude}, {longitude}")
else:
    print("❌ Nu s-au putut citi coordonatele GPS")

# Funcție pentru a trimite incidentul la backend
def send_incident_to_backend(ai_response, frame):
    """Trimite incidentul detectat la backend"""
    try:
        # Salvează frame-ul temporar
        frame_path = f"incident_frame_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
        cv2.imwrite(frame_path, frame)
        
        # Extrage informațiile din răspunsul AI
        incident_data = {
            "address": f"Camera IP - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "latitude": latitude,
            "longitude": longitude,
            "datetime": datetime.now().isoformat(),
            "ai_description": ai_response,
            "photos": [frame_path]
        }
        
        # Trimite la backend
        response = requests.post(
            "http://localhost:3000/api/incidents",
            json=incident_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 201:
            print(f"✓ Incident trimis la backend: {response.json()}")
            return True
        else:
            print(f"❌ Eroare la trimiterea incidentului: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Eroare la trimiterea incidentului: {e}")
        return False

# Prompt pentru parcări ilegale
PROMPT = """
Analizează această imagine de parcare. 

Identifică orice vehicul care este parcat în afara unui loc marcat sau pe o zonă interzisă/hașurată.

Dacă detectezi o încălcare, răspunde:
ÎNCĂLCARE: DA
NUMĂR_ÎNMATRICULARE: [număr sau NECITIBIL]
DESCRIERE_VEHICUL: [culoare și tip]
LOCAȚIE_ÎNCĂLCARE: [locație]

Dacă nu există încălcare:
ÎNCĂLCARE: NU
"""

def send_to_gemini(frame):
    """Trimite frame-ul direct la Gemini și returnează textul răspunsului."""

    # Convertim frame-ul OpenCV în imagine PIL
    img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))

    model = genai.GenerativeModel("gemini-2.5-flash")

    print("\n📤 Se trimite frame-ul către Gemini...")

    response = model.generate_content([PROMPT, img])

    return response.text if response else None

    return response.text if response else None


last_process_time = 0
fps = 20
frame_count = 0

print("📡 Procesare video live... (ESC pentru ieșire)")

while True:
    ret, frame = cap.read()
    if not ret:
        print("❌ Conexiune pierdută cu camera!")
        break

    # cv2.imshow("Camera Telefon - Live", frame)  # Disabled GUI

    current_time = frame_count / fps

    # La fiecare 10 secunde
    if current_time - last_process_time >= 10:
        last_process_time = current_time

        print(f"\n⏱ Procesare frame la secunda {int(current_time)}")

        result = send_to_gemini(frame)

        if result:
            print("\n📥 Răspuns primit:")
            print("----------------------------------------")
            print(result)
            print("----------------------------------------")
            
            # Verifică dacă este o încălcare
            if "ÎNCĂLCARE: DA" in result or "INCALCARE: DA" in result:
                print("🚨 Încălcare detectată! Se trimite la backend...")
                send_incident_to_backend(result, frame)
        else:
            print("❌ Nu am primit răspuns de la Gemini.")

    frame_count += 1

    # Check for keyboard interrupt to exit (Ctrl+C in terminal)
    # if cv2.waitKey(1) == 27:
    #     break

cap.release()
# cv2.destroyAllWindows()  # Not needed without GUI
