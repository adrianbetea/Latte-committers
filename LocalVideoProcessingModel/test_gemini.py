"""
Script pentru testarea Gemini Flash 2.5 cu imagini extrase din video
"""
import os
import sys
import json
from datetime import datetime
from dotenv import load_dotenv
import google.generativeai as genai
from PIL import Image

# Încarcă variabilele de mediu din .env
load_dotenv()

# Configurație
CAMERA_ID = "TM_Centru_01"
LOCATION_GPS = "45.7537, 21.2257"

def test_gemini_connection():
    """Testează conexiunea la Gemini API"""
    api_key = os.getenv('GEMINI_API_KEY')
    
    if not api_key or api_key == 'your_api_key_here':
        print("❌ API Key lipsește!")
        print("\n1. Deschide fișierul .env")
        print("2. Obține API key de la: https://aistudio.google.com/app/apikey")
        print("3. Înlocuiește 'your_api_key_here' cu key-ul tău")
        return False
    
    try:
        genai.configure(api_key=api_key)
        
        # Listează modelele disponibile
        print("Testare conexiune la Gemini API...")
        models = genai.list_models()
        
        # Caută Gemini Flash
        flash_models = [m for m in models if 'flash' in m.name.lower()]
        
        if flash_models:
            print("✓ Conexiune reușită!")
            print("\nModele Flash disponibile:")
            for model in flash_models:
                print(f"  - {model.name}")
        else:
            print("✓ Conexiune reușită, dar nu s-au găsit modele Flash")
            
        return True
        
    except Exception as e:
        print(f"❌ Eroare la conectare: {e}")
        print("\nVerifică că API key-ul este corect în fișierul .env")
        return False


def parse_violation_response(response_text):
    """
    Parsează răspunsul modelului și extrage informațiile
    
    Returns:
        Dict cu informații despre încălcare sau None
    """
    if not response_text:
        return None
    
    # Verifică dacă e încălcare
    if "ÎNCĂLCARE: DA" not in response_text.upper() and "INCALCARE: DA" not in response_text.upper():
        return None
    
    result = {
        "has_violation": True,
        "plate_number": "NECUNOSCUT",
        "vehicle_description": "",
        "violation_location": ""
    }
    
    # Extrage numărul de înmatriculare
    lines = response_text.split('\n')
    for line in lines:
        line_upper = line.upper()
        if "NUMĂR" in line_upper or "NUMAR" in line_upper:
            parts = line.split(':', 1)
            if len(parts) > 1:
                plate = parts[1].strip()
                if "NECITIBIL" not in plate.upper() and plate:
                    result["plate_number"] = plate
        
        elif "DESCRIERE" in line_upper:
            parts = line.split(':', 1)
            if len(parts) > 1:
                result["vehicle_description"] = parts[1].strip()
        
        elif "LOCAȚIE" in line_upper or "LOCATIE" in line_upper:
            parts = line.split(':', 1)
            if len(parts) > 1:
                result["violation_location"] = parts[1].strip()
    
    return result


def create_json_payload(violation_data, image_filename):
    """
    Creează JSON payload pentru încălcare
    
    Args:
        violation_data: Dict cu datele încălcării
        image_filename: Numele fișierului imagine
    
    Returns:
        Dict în formatul cerut
    """
    # Construiește descrierea
    evidence_parts = []
    if violation_data.get("vehicle_description"):
        evidence_parts.append(violation_data["vehicle_description"])
    if violation_data.get("violation_location"):
        evidence_parts.append(f"parcata {violation_data['violation_location']}")
    
    evidence_description = ", ".join(evidence_parts) if evidence_parts else "Vehicul parcat ilegal"
    
    payload = {
        "camera_id": CAMERA_ID,
        "location_gps": LOCATION_GPS,
        "plate_number": violation_data.get("plate_number", "NECUNOSCUT"),
        "violation_start": datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "evidence_description": evidence_description,
        "status": "NEW"
    }
    
    return payload


def analyze_image_gemini(image_path, prompt):
    """
    Analizează o imagine folosind Gemini Flash 2.5
    
    Args:
        image_path: Calea către imagine
        prompt: Întrebarea/promptul pentru model
    
    Returns:
        Răspunsul modelului
    """
    print(f"\n{'='*60}")
    print(f"Analizare: {os.path.basename(image_path)}")
    print(f"{'='*60}")
    
    try:
        api_key = os.getenv('GEMINI_API_KEY')
        genai.configure(api_key=api_key)
        
        # Folosește modelul Flash 2.5
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Încarcă imaginea
        img = Image.open(image_path)
        
        print("Se trimite la Gemini... (poate dura 5-15 secunde)")
        
        # Generează răspuns
        response = model.generate_content([prompt, img])
        
        return response.text
        
    except Exception as e:
        print(f"❌ Eroare: {e}")
        return None


def analyze_parking_violations(images_folder="test_images"):
    """Analizează imaginile pentru parcări ilegale"""
    
    # Verifică dacă există folderul cu imagini
    if not os.path.exists(images_folder):
        print(f"❌ Folderul '{images_folder}' nu există!")
        print("Rulează mai întâi extract_frames.py")
        return
    
    # Găsește imaginile
    image_extensions = ['.jpg', '.jpeg', '.png']
    image_files = [f for f in os.listdir(images_folder) 
                   if any(f.lower().endswith(ext) for ext in image_extensions)]
    
    if not image_files:
        print(f"❌ Nu sunt imagini în folderul '{images_folder}'!")
        print("Rulează mai întâi extract_frames.py")
        return
    
    print(f"\nAm găsit {len(image_files)} imagini de analizat")
    
    # Prompt pentru detecție parcări
    prompt = """Analizează această imagine de parcare. 

Identifică orice vehicul care este parcat în afara unui loc marcat sau pe o zonă interzisă/hașurată (zone cu linii diagonale, pe pistă de biciclete, pe trecere de pietoni).

Dacă detectezi o încălcare, răspunde:
ÎNCĂLCARE: DA
NUMĂR_ÎNMATRICULARE: [număr sau "NECITIBIL"]
DESCRIERE_VEHICUL: [culoare și tip]
LOCAȚIE_ÎNCĂLCARE: [unde este parcată ilegal]

Dacă NU există încălcare, răspunde doar:
ÎNCĂLCARE: NU
"""
    
    # Analizează fiecare imagine
    violations_found = []
    
    for i, image_file in enumerate(image_files, 1):
        image_path = os.path.join(images_folder, image_file)
        
        print(f"\n[{i}/{len(image_files)}] Procesare {image_file}...")
        
        result = analyze_image_gemini(image_path, prompt)
        
        if result:
            print("\n" + "─"*60)
            print("RĂSPUNS MODEL:")
            print("─"*60)
            print(result)
            print("─"*60)
            
            # Parsează rezultatul
            violation_data = parse_violation_response(result)
            
            if violation_data:
                # Creează JSON payload
                json_payload = create_json_payload(violation_data, image_file)
                violations_found.append(json_payload)
                
                
                print("ÎNCĂLCARE DETECTATĂ - JSON PAYLOAD:")
                print(json.dumps(json_payload, indent=2, ensure_ascii=False))
            else:
                print("\n✓ Nu s-a detectat nicio încălcare în această imagine.")
    
    # Rezumat final
    print("\n" + "="*60)
    print(f"REZUMAT: {len(violations_found)} încălcări detectate din {len(image_files)} imagini")
    print("="*60)
    
    if violations_found:
        print("\nToate încălcările în format JSON:")
        print(json.dumps(violations_found, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    print("="*60)
    print("Detecție Parcări Ilegale - Gemini Flash 2.5")
    print("="*60)
    
    # Testează conexiunea
    if not test_gemini_connection():
        sys.exit(1)
    
    # Rulează analiza pentru parcări ilegale
    analyze_parking_violations()
