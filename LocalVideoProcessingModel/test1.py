import cv2
import os
import time
from datetime import datetime
from extract_frames import extract_frames
import requests

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

# Citire GPS
latitude, longitude = read_gps_coords()
if latitude and longitude:
    print(f"✓ Coordonate GPS: {latitude}, {longitude}")
else:
    print("❌ Nu s-au putut citi coordonatele GPS")

# Funcție pentru trimiterea incidentului la backend
def send_incident_to_backend(frame, timestamp):
    """Trimite incidentul detectat la backend"""
    try:
        # Salvează frame-ul
        frame_path = f"incident_frame_{timestamp}.jpg"
        cv2.imwrite(frame_path, frame)
        
        # Creează datele incidentului
        incident_data = {
            "address": f"Camera IP - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "latitude": latitude,
            "longitude": longitude,
            "datetime": datetime.now().isoformat(),
            "ai_description": f"Incident detectat la {datetime.now().strftime('%H:%M:%S')}",
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

url = "http://10.47.103.46:8080/video"
cap = cv2.VideoCapture(url)

fps = 20  # aproximativ, pentru sincronizare
frame_count = 0
last_processed_time = 0
output_folder = "extracted_frames"
os.makedirs(output_folder, exist_ok=True)

print("📡 Procesare video live... (ESC pentru ieșire)")

while True:
    ret, frame = cap.read()
    if not ret:
        print("❌ Conexiune pierdută cu camera!")
        break

    cv2.imshow("Camera telefon - Live", frame)

    # Procesare la fiecare 10 secunde
    current_time = frame_count / fps
    if current_time - last_processed_time >= 10:
        last_processed_time = current_time
        timestamp = int(current_time)
        
        print(f"\n⏱ Procesare frame la secunda {timestamp}")
        
        # Salvăm frame-ul curent într-un fișier temporar
        temp_frame_path = os.path.join(output_folder, f"frame_at_{timestamp}s.jpg")
        cv2.imwrite(temp_frame_path, frame)
        print(f"✓ Frame salvat: {temp_frame_path}")

        # Trimite la backend
        if latitude and longitude:
            send_incident_to_backend(frame, timestamp)
        
        # Folosim extract_frames pe frame-ul respectiv
        extract_frames(temp_frame_path, output_folder, num_frames=1)

    frame_count += 1

    if cv2.waitKey(1) == 27:  # ESC pentru a opri
        break

cap.release()
cv2.destroyAllWindows()
print("✓ Procesare încheiată")
