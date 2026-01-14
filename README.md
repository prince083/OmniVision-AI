# OmniVision AI - Browser Extension

A powerful Chrome extension for extracting text from screenshots and web content using AI-powered OCR.

## 🚀 Features

- **Screen Capture OCR**: Select any region of your screen and extract text instantly
- **Image Upload OCR**: Upload any image file for instant text extraction
- **Tesseract Integration**: Professional-grade text recognition
- **Clean UI**: Intuitive popup interface with dark mode/code support
- **HiDPI Support**: Accurate capture on high-resolution displays

## 📁 Project Structure

```
OmniVision/
├── extension/               # Chrome Extension
│   ├── src/                 # React source files
│   │   └── App.jsx          # Main popup component
│   ├── scripts/             # Build scripts
│   │   └── build-extension.ps1
│   ├── background.js        # Service worker
│   ├── contentScript.js     # Overlay & cropping
│   ├── manifest.json        # Extension config
│   └── dist-extension/      # Built extension (load this in Chrome)
│
├── backend/                 # Django REST API
│   ├── api/
│   │   ├── views.py         # OCR endpoint
│   │   └── urls.py          # API routes
│   ├── requirements.txt     # Python dependencies
│   └── manage.py
│
├── PROGRESS.md              # Development tracking
└── README.md                # This file
```

## 🛠️ Setup Instructions

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.12+
- **Tesseract OCR** (auto-installed via `winget`)

### Backend Setup

1. Create virtual environment:
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate  # Windows
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Install Tesseract OCR:
   ```bash
   winget install UB-Mannheim.TesseractOCR
   ```

4. Run server:
   ```bash
   python manage.py runserver
   ```
   Server runs at: `http://127.0.0.1:8000`

### Extension Setup

1. Install dependencies:
   ```bash
   cd extension
   npm install
   ```

2. Build extension:
   ```bash
   npm run build-extension
   ```

3. Load in Chrome:
   - Open `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension/dist-extension` folder

## 📖 Usage

1. **Capture Screen**:
   - Click the OmniVision icon in Chrome
   - Click "📸 Capture Screen Area"
   - Select the region you want to extract text from

2. **Upload & Extract**:
   - Click "🖼 Extract Text from Image"
   - Select an image file from your computer
   - Click "⚡ Extract Text"

3. **View & Copy**:
   - View the captured or uploaded image
   - Click "⚡ Extract Text" (if not already done)
   - Click "📋 Copy to Clipboard" to save the result

4. **Clear & Retry**:
   - Click "🗑 Clear Capture" (or "← Back" for uploads) to start over

## 🔧 Development

### Build Extension
```bash
cd extension
npm run build-extension
```

### Run Backend in Development
```bash
cd backend
python manage.py runserver
```

### File Watching
The Django server auto-reloads on file changes.
For extension changes, run `npm run build-extension` and reload the extension in Chrome.

## 📦 Dependencies

### Backend
- Django 6.0.1
- Django REST Framework
- Tesseract OCR
- OpenCV (headless)
- Pillow

### Extension
- React 19
- Vite 7.2

## 🐛 Troubleshooting

**"OCR Error: Tesseract not found"**
- Ensure Tesseract is installed: `winget install UB-Mannheim.TesseractOCR`
- Restart your terminal after installation

**"Overlay doesn't appear"**
- Reload the extension in `chrome://extensions`
- Refresh the target web page (F5)

**"No text detected"**
- Try capturing a clearer region
- Ensure the image has sufficient contrast
- Check that text is not too small or stylized

## 📝 API Endpoints

- `GET /api/` - Health check
- `GET /api/health/` - Service status
- `POST /api/ocr/` - Extract text from image
  - Body: `{ "image": "data:image/png;base64,..." }`
  - Response: `{ "text": "...", "confidence": 1.0 }`

## 🎯 Roadmap

See [PROGRESS.md](PROGRESS.md) for detailed task tracking.

**Coming Soon:**
- YouTube transcription support
- Extraction history
- Multi-language support

## 📄 License

MIT License - see LICENSE file for details

## 👨‍💻 Author

Built with ❤️ by the OmniVision team

---

**Last Updated:** January 14, 2026
