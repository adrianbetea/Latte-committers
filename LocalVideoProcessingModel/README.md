# Gemini Flash 2.5 Image Analysis for Parking Violations

Simple project to test Google's Gemini Flash 2.5 model with video frames for parking violation detection.

## 🎯 What This Does

1. Extract frames from a video file
2. Send frames to Gemini Flash 2.5 API
3. Get AI analysis for illegal parking detection

## 📋 Prerequisites

1. **Google AI API Key** from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. **Python** 3.8 or higher
3. **A video file** to test with

## 🚀 Quick Setup

### Step 1: Install Python Dependencies

```bash
cd LocalVideoProcessingModel
pip install -r requirements.txt
```

### Step 2: Configure API Key

1. Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey) (free)
2. Open the `.env` file
3. Replace `your_api_key_here` with your actual API key

### Step 3: Add Your Video

Put a video file (mp4, avi, mov, etc.) in the `videos/` folder.

## 📖 How to Use

### 1. Extract Frames from Video

```bash
python extract_frames.py
```

This will:
- Find the video in `videos/` folder
- Ask how many frames you want to extract
- Save frames to `test_images/` folder

### 2. Test with Gemini

```bash
python test_gemini.py
```

Choose:
- **Option 1**: Automatic parking violation analysis
- **Option 2**: Ask your own question about the images

## 📁 Project Structure

```
LocalVideoProcessingModel/
├── extract_frames.py       # Extract frames from video
├── test_gemini.py          # Test Gemini with images
├── requirements.txt        # Python dependencies
├── .env                    # API key configuration
├── videos/                 # Put your video files here
└── test_images/            # Extracted frames go here
```

## 🎓 Example Output

When analyzing an image:

```
Analizare: frame_001.jpg
============================================================
Se trimite la Gemini... (poate dura 5-15 secunde)

────────────────────────────────────────────────────────────
REZULTAT:
────────────────────────────────────────────────────────────
ÎNCĂLCARE: DA
NUMĂR_ÎNMATRICULARE: NECITIBIL
DESCRIERE_VEHICUL: mașină neagră SUV
LOCAȚIE_ÎNCĂLCARE: parcată pe zona hașurată
────────────────────────────────────────────────────────────
```

## 🛠️ Troubleshooting

**"API Key lipsește"**
- Open the `.env` file
- Get an API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
- Replace `your_api_key_here` with your key

**"Error connecting to Gemini"**
- Check that your API key is correct
- Verify internet connection
- Check API quota at [Google AI Studio](https://aistudio.google.com/)

**"No video found"**
- Put a video file in the `videos/` folder
- Supported: mp4, avi, mov, mkv, webm

**"No images found"**
- Run `extract_frames.py` first to create images

## 📝 Notes

- Gemini Flash 2.5 is fast (5-15 seconds per image)
- Free tier includes generous quota
- Model accuracy is excellent with clear images
- Works best with clear, well-lit images
- API key should be kept private (don't commit `.env` to git)

## ⚡ Next Steps

Once testing works well, you can:
- Add real-time camera capture
- Integrate with API for alerts
- Add automated processing
- Deploy on a server