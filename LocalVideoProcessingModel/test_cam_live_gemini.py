import cv2
import os
import time
from datetime import datetime
from dotenv import load_dotenv
import google.generativeai as genai
from PIL import Image
import numpy as np

# Încarcă API key
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# URL camera telefon IP Webcam
url = "http://10.47.103.46:8080/video"
cap = cv2.VideoCapture(url)

if not cap.isOpened():
    print("❌ Nu mă pot conecta la camera telefonului!")
    exit()

print("✓ Conectat la camera telefonului.")

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


last_process_time = 0
fps = 20
frame_count = 0

print("📡 Procesare video live... (ESC pentru ieșire)")

while True:
    ret, frame = cap.read()
    if not ret:
        print("❌ Conexiune pierdută cu camera!")
        break

    cv2.imshow("Camera Telefon - Live", frame)

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
        else:
            print("❌ Nu am primit răspuns de la Gemini.")

    frame_count += 1

    if cv2.waitKey(1) == 27:
        break

cap.release()
cv2.destroyAllWindows()
