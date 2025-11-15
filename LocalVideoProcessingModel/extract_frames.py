"""
Simple script to extract frames from a video file for testing
"""
import cv2
import os
import sys

def extract_frames(video_path, output_folder, num_frames=5):
    """
    Extract frames from a video file
    
    Args:
        video_path: Path to the video file
        output_folder: Directory to save extracted frames
        num_frames: Number of frames to extract (default: 5)
    """
    # Check if video exists
    if not os.path.exists(video_path):
        print(f"Error: Video file not found: {video_path}")
        return False
    
    # Create output folder if it doesn't exist
    os.makedirs(output_folder, exist_ok=True)
    
    # Open the video
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        print(f"Error: Could not open video: {video_path}")
        return False
    
    # Get video properties
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    duration = total_frames / fps if fps > 0 else 0
    
    print(f"\nVideo Info:")
    print(f"  Total frames: {total_frames}")
    print(f"  FPS: {fps:.2f}")
    print(f"  Duration: {duration:.2f} seconds")
    print(f"\nExtracting {num_frames} frames...")
    
    # Calculate frame intervals
    if num_frames > total_frames:
        num_frames = total_frames
    
    frame_interval = total_frames // num_frames
    
    extracted = 0
    for i in range(num_frames):
        # Calculate frame position
        frame_pos = i * frame_interval
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_pos)
        
        ret, frame = cap.read()
        if ret:
            # Save the frame
            filename = f"frame_{i+1:03d}.jpg"
            filepath = os.path.join(output_folder, filename)
            cv2.imwrite(filepath, frame)
            print(f"  ✓ Saved: {filename} (frame {frame_pos}/{total_frames})")
            extracted += 1
        else:
            print(f"  ✗ Failed to read frame at position {frame_pos}")
    
    cap.release()
    print(f"\nDone! Extracted {extracted} frames to: {output_folder}")
    return True


if __name__ == "__main__":
    # Default paths
    video_folder = "videos"
    output_folder = "test_images"
    
    # Check if videos folder has any video files
    if not os.path.exists(video_folder):
        print(f"Error: '{video_folder}' folder not found!")
        print("Please create the 'videos' folder and add a video file.")
        sys.exit(1)
    
    # Find video files
    video_extensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm']
    video_files = [f for f in os.listdir(video_folder) 
                   if any(f.lower().endswith(ext) for ext in video_extensions)]
    
    if not video_files:
        print(f"\nNo video files found in '{video_folder}' folder!")
        print("Please add a video file (mp4, avi, mov, mkv, or webm)")
        print("\nSupported formats: " + ", ".join(video_extensions))
        sys.exit(1)
    
    # Use the first video file found
    video_file = video_files[0]
    video_path = os.path.join(video_folder, video_file)
    
    print(f"Found video: {video_file}")
    
    # Ask user how many frames to extract
    try:
        num_frames = input("\nHow many frames to extract? (default: 5): ").strip()
        num_frames = int(num_frames) if num_frames else 5
    except ValueError:
        num_frames = 5
    
    # Extract frames
    extract_frames(video_path, output_folder, num_frames)
