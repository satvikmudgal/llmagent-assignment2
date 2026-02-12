# Travel Assistant - LLM Chat Interface

A travel planning assistant powered by Google Gemini function calling and React. The agent uses an agentic loop to search for flights, hotels, and activities using the Amadeus API.

## Setup

### Backend (Python/Flask)

**Requirements:** Python 3.8+ (no conda required - works with standard Python/pip)

1. (Optional but recommended) Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Set up your API key:
   - Create a `.env` file in the project root:
     ```bash
     echo "GOOGLE_API_KEY=your-actual-api-key-here" > .env
     ```
   - Or edit `.env` manually and add:
     ```
     GOOGLE_API_KEY=your-actual-api-key-here
     ```
   - Alternatively, export it directly in your shell:
     ```bash
     export GOOGLE_API_KEY="your-actual-api-key-here"
     ```
   - Get your API key from: https://makersuite.google.com/app/apikey
   - **Important**: After updating your API key, restart the Flask server completely (kill the old process and start fresh) for the new key to take effect.

4. Run the Flask server:
```bash
python app.py
```

The server will run on `http://localhost:5001` (port 5000 is used by macOS AirPlay)

**Note on Rate Limits**: The Gemini API free tier has strict rate limits (typically 15-20 requests per day). If you encounter rate limit errors:
- Wait a few minutes between requests
- Check your quota at https://ai.dev/rate-limit
- The agent makes multiple API calls per user message (up to 5 iterations), so use it sparingly on the free tier

### Frontend (React)

1. Install Node dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

The app will run on `http://localhost:5173` (or another port if 5173 is in use)

## Architecture

- **Frontend**: React chat interface (`src/ChatInterface.jsx`)
- **Backend**: Flask API server (`app.py`)
- **Agent**: Gemini function calling agent (`agent.py`) that uses an agentic loop to decide which tools to call
- **Tools**: Amadeus API integration for flights, hotels, and activities (`amadeus_service.py`)

The chat interface sends user messages to the Flask API, which processes them through the Gemini agent. The agent uses function calling to decide when to search for flights, hotels, or activities, and can make multiple iterations to complete a request.

## Files

- `src/ChatInterface.jsx` - Main chat component
- `app.py` - Flask API server
- `agent.py` - Gemini function calling agent with agentic loop
- `amadeus_service.py` - Amadeus API integration for flights, hotels, and activities
- `iata_converter.py` - City name to IATA airport code converter
- `requirements.txt` - Python dependencies
