import cv2
import os
import time
from extract_frames import extract_frames  # presupunem că ai modificat extract_frames să accepte și frame-uri

url = "http://10.47.103.46:8080/video"
cap = cv2.VideoCapture(url)

fps = 20  # aproximativ, pentru sincronizare
frame_count = 0
last_processed_time = 0
output_folder = "extracted_frames"
os.makedirs(output_folder, exist_ok=True)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    cv2.imshow("Camera telefon", frame)

    # Procesare la fiecare 10 secunde
    current_time = frame_count / fps
    if current_time - last_processed_time >= 10:
        last_processed_time = current_time
        
        # Salvăm frame-ul curent într-un fișier temporar
        temp_frame_path = os.path.join(output_folder, f"frame_at_{int(current_time)}s.jpg")
        cv2.imwrite(temp_frame_path, frame)
        print(f"\nSaved frame for processing: {temp_frame_path}")

        # Folosim extract_frames pe "video-ul" format doar din frame-ul respectiv
        # Dacă vrei să extragi mai multe frame-uri din frame (nu are sens aici, dar păstrăm compatibilitatea funcției)
        extract_frames(temp_frame_path, output_folder, num_frames=1)

    frame_count += 1

    if cv2.waitKey(1) == 27:  # ESC pentru a opri
        break

cap.release()
cv2.destroyAllWindows()
