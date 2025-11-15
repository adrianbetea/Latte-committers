import requests
import time

# --- CONFIG ---
IP_WEBCAM_URL = "http://10.47.103.46:8080"  # schimbă cu IP-ul tău
GPS_ENDPOINT = f"{IP_WEBCAM_URL}/gps.json"
INTERVAL = 10  # secunde

# --- LOOP PRINCIPAL ---
while True:
    try:
        response = requests.get(GPS_ENDPOINT, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        if "location" in data:
            loc = data["location"]
            lat = loc.get("lat", "N/A")
            lon = loc.get("lon", "N/A")
            alt = loc.get("alt", "N/A")
            bearing = loc.get("bearing", "N/A")
            speed = loc.get("speed", "N/A")
            
            print(f"Lat: {lat}, Lon: {lon}, Alt: {alt}, Bearing: {bearing}, Speed: {speed}")
        else:
            print("Nu s-au primit date GPS")
    
    except requests.RequestException as e:
        print(f"Eroare la conectarea la IP Webcam: {e}")
    
    time.sleep(INTERVAL)


