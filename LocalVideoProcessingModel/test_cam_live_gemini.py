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

# Dicționar pentru a ține evidența mașinilor deja raportate
reported_vehicles = {}  # {vehicle_id: timestamp} - poate fi plate_number SAU location+description
REPORT_COOLDOWN = 1800  # 30 minute în secunde
LOCATION_TOLERANCE = 0.002  # ~200 metri - verifică dacă există rapoarte în apropiere

# Funcție pentru reverse geocoding
def get_address_from_coords(lat, lon):
    """Obține adresa și districtul din coordonatele GPS folosind Nominatim (OpenStreetMap)"""
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}&zoom=18&addressdetails=1"
        headers = {'User-Agent': 'ParkingIncidentApp/1.0'}
        response = requests.get(url, headers=headers, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            address_parts = data.get('address', {})
            
            # Construiește adresa
            road = address_parts.get('road', '')
            house_number = address_parts.get('house_number', '')
            suburb = address_parts.get('suburb', address_parts.get('neighbourhood', ''))
            district = address_parts.get('city_district', suburb)
            
            street = f"{road} {house_number}" if house_number else road
            
            return street or "Adresă necunoscută", district or "District necunoscut"
        else:
            print(f"❌ Eroare geocoding: {response.status_code}")
            return "Adresă necunoscută", "District necunoscut"
    except Exception as e:
        print(f"❌ Eroare la reverse geocoding: {e}")
        return "Adresă necunoscută", "District necunoscut"

# Funcție pentru a extrage descrierea vehiculului din răspunsul AI
def extract_vehicle_description(ai_response):
    """Extrage descrierea vehiculului (culoare și tip) din răspunsul AI"""
    for line in ai_response.split('\n'):
        if 'DESCRIERE_VEHICUL' in line or 'DESCRIERE_VEHICUL' in line:
            description = line.split(':', 1)[1].strip()
            return description if description else None
    return None

# Funcție pentru a extrage numărul de înmatriculare din răspunsul AI
def extract_plate_number(ai_response):
    """Extrage numărul de înmatriculare din răspunsul AI"""
    for line in ai_response.split('\n'):
        if 'NUMĂR_ÎNMATRICULARE' in line or 'NUMAR_INMATRICULARE' in line:
            # Extrage textul după ':'
            plate = line.split(':', 1)[1].strip()
            # Ignore dacă este NECITIBIL
            if plate and plate.upper() != 'NECITIBIL':
                return plate
    return None

# Funcție pentru a normaliza descrierea vehiculului
def normalize_vehicle_description(description):
    """Normalizează descrierea vehiculului pentru a reduce varianțele"""
    if not description:
        return "unknown"
    
    desc = description.lower()
    
    # Extrage culorile principale
    colors = []
    color_keywords = ['alb', 'negru', 'gri', 'roșu', 'albastru', 'verde', 'galben', 'argintiu', 'maro', 'portocaliu']
    for color in color_keywords:
        if color in desc:
            colors.append(color)
    
    # Extrage tipul vehiculului (taxi are prioritate)
    vehicle_types = []
    type_keywords = ['taxi', 'camion', 'camioneta', 'suv', 'van', 'sedan', 'hatchback', 'coupe', 'break']
    for vtype in type_keywords:
        if vtype in desc:
            vehicle_types.append(vtype)
            break  # Luăm doar primul găsit, în ordinea priorității
    
    # Construiește o descriere simplificată
    parts = []
    if colors:
        parts.append(colors[0])  # Doar prima culoare
    if vehicle_types:
        parts.append(vehicle_types[0])  # Doar primul tip
    
    if not parts:
        # Dacă nu am găsit nici culoare nici tip, folosim primele 3 cuvinte
        words = desc.split()[:3]
        return '_'.join(words)
    
    return '_'.join(parts)

# Funcție pentru a genera un ID unic bazat pe locație și descriere
def generate_vehicle_id(lat, lon, vehicle_description):
    """Generează un ID unic pentru vehicul bazat pe locație și descriere"""
    # Rotunjim coordonatele la 3 zecimale (~111 metri precizie) pentru a permite mai multă toleranță
    location_key = f"{round(lat, 3)}_{round(lon, 3)}"
    # Normalizăm descrierea agresiv
    desc_normalized = normalize_vehicle_description(vehicle_description)
    return f"{location_key}_{desc_normalized}"

# Funcție pentru a verifica dacă o mașină a fost deja raportată recent
def is_vehicle_recently_reported(vehicle_id, identifier_type="unknown", lat=None, lon=None, color=None):
    """Verifică dacă vehiculul a fost raportat recent (fie după număr, fie după locație+descriere)"""
    if not vehicle_id:
        return False
    
    current_time = time.time()
    
    # Curăță dicționarul de intrări vechi
    expired_vehicles = [vid for vid, timestamp in reported_vehicles.items() 
                       if current_time - timestamp > REPORT_COOLDOWN]
    for vid in expired_vehicles:
        del reported_vehicles[vid]
    
    # Verifică exact match
    if vehicle_id in reported_vehicles:
        time_since_report = current_time - reported_vehicles[vehicle_id]
        print(f"⏳ Vehicul ({identifier_type}) deja raportat acum {int(time_since_report/60)} minute [EXACT MATCH]")
        return True
    
    # Verifică și vehicule similare în apropiere (doar pentru identificări bazate pe locație)
    if lat and lon and color and '_' not in str(vehicle_id)[:10]:  # Nu este plate number
        for reported_id in list(reported_vehicles.keys()):
            if current_time - reported_vehicles[reported_id] > REPORT_COOLDOWN:
                continue
            
            # Verifică dacă este un ID bazat pe locație
            if reported_id.count('_') >= 2:
                try:
                    # Extrage coordonatele și descrierea din ID-ul raportat
                    parts = reported_id.split('_')
                    reported_lat = float(parts[0])
                    reported_lon = float(parts[1])
                    reported_desc = '_'.join(parts[2:])
                    
                    # Calculează distanța aproximativă
                    lat_diff = abs(lat - reported_lat)
                    lon_diff = abs(lon - reported_lon)
                    
                    # Verifică dacă este în apropiere și are aceeași culoare
                    if lat_diff < LOCATION_TOLERANCE and lon_diff < LOCATION_TOLERANCE:
                        if color and color in reported_desc:
                            time_since_report = current_time - reported_vehicles[reported_id]
                            print(f"⏳ Vehicul similar în apropiere ({reported_desc}) raportat acum {int(time_since_report/60)} minute [SIMILAR MATCH]")
                            return True
                except:
                    pass
    
    return False

# Funcție pentru a trimite incidentul la backend
def send_incident_to_backend(ai_response, frame, plate_number):
    """Trimite incidentul detectat la backend"""
    try:
        # Verifică dacă avem coordonate GPS
        if not latitude or not longitude:
            print("❌ Nu pot trimite incident fără coordonate GPS")
            return False
        
        # Obține adresa și districtul din coordonatele GPS
        print("🗺️ Se obține adresa din coordonate GPS...")
        street, district = get_address_from_coords(latitude, longitude)
        print(f"✓ Adresă: {street}, District: {district}")
        
        # Salvează frame-ul temporar
        frame_path = f"incident_frame_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
        cv2.imwrite(frame_path, frame)
        
        # Extrage informațiile din răspunsul AI
        incident_data = {
            "address": street,
            "district": district,
            "latitude": latitude,
            "longitude": longitude,
            "datetime": datetime.now().isoformat(),
            "ai_description": ai_response,
            "car_number": plate_number,
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
                # Extrage numărul de înmatriculare și descrierea
                plate_number = extract_plate_number(result)
                vehicle_description = extract_vehicle_description(result)
                
                # Extrage culoarea pentru matching mai bun
                normalized_desc = normalize_vehicle_description(vehicle_description)
                color = normalized_desc.split('_')[0] if normalized_desc and '_' in normalized_desc else None
                
                # Determină ID-ul vehiculului pentru tracking duplicat
                if plate_number:
                    # Dacă avem număr de înmatriculare, folosim acesta
                    vehicle_id = plate_number
                    identifier_type = f"număr {plate_number}"
                    check_location = False
                else:
                    # Dacă nu avem număr, folosim locație + descriere
                    vehicle_id = generate_vehicle_id(latitude, longitude, vehicle_description)
                    identifier_type = f"locație+descriere ({normalized_desc})"
                    check_location = True
                
                print(f"🔍 Verificare duplicat pentru: {vehicle_id}")
                
                # Verifică dacă vehiculul a fost deja raportat recent
                is_duplicate = is_vehicle_recently_reported(
                    vehicle_id, 
                    identifier_type,
                    lat=latitude if check_location else None,
                    lon=longitude if check_location else None,
                    color=color if check_location else None
                )
                
                if is_duplicate:
                    print(f"⏭️ Incident ignorat - vehicul deja raportat recent")
                else:
                    print("🚨 Încălcare detectată! Se trimite la backend...")
                    success = send_incident_to_backend(result, frame, plate_number)
                    # Marchează vehiculul ca raportat doar dacă trimiterea a reușit
                    if success:
                        reported_vehicles[vehicle_id] = time.time()
                        print(f"✓ Vehicul marcat ca raportat: {vehicle_id}")
                        print(f"📋 Total vehicule în tracking: {len(reported_vehicles)}")
        else:
            print("❌ Nu am primit răspuns de la Gemini.")

    frame_count += 1

    # Check for keyboard interrupt to exit (Ctrl+C in terminal)
    # if cv2.waitKey(1) == 27:
    #     break

cap.release()
# cv2.destroyAllWindows()  # Not needed without GUI
