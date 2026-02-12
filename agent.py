"""
Travel agent powered by Gemini function calling.
The LLM decides what to do — search flights, hotels, activities — via tool use.
"""
import json
import os
import time
from datetime import date

from google import genai
from google.genai import types
from dotenv import load_dotenv

from amadeus_service import (
    search_flights as amadeus_search_flights,
    search_hotels as amadeus_search_hotels,
    search_activities as amadeus_search_activities,
)
from iata_converter import city_to_iata

load_dotenv()

SYSTEM_PROMPT = f"""You are L1ly, a friendly and knowledgeable travel planning assistant. \
You help users plan complete trips including flights, hotels, and recreational activities.

You have access to real search tools for flights, hotels, and activities. Use them to find \
actual options with real prices.

Guidelines:
- When a user describes a trip, figure out what they need and search for it.
- If key information is missing (destination, dates, number of travelers), ask naturally.
- For vague destinations like "somewhere sunny", suggest 3-5 specific cities and ask which they prefer, then search.
- Use get_iata_code to convert city names to airport codes before searching flights.
- Search for flights, hotels, and activities as appropriate for the request.
- Consider budget constraints — break down costs across flights, hotels, and activities.
- Present results in a clear, organized way with itemized costs.
- For activities, suggest real activities available at the destination. If the tool returns results, use those. \
If the activities tool has no results, use your knowledge to suggest real activities with estimated prices.
- When presenting multiple trip options, make each option distinct (different price points, different styles).
- Be conversational and helpful. Follow up on user preferences.
- Today's date is {date.today().isoformat()}. Use this for relative date references like "next week" or "mid-March".
- Dates must be in YYYY-MM-DD format when calling tools.
- Always provide a return_date for round trips. If the user says "5 days", calculate the return date.
"""

# ── Tool declarations ────────────────────────────────────────────────────────

TOOL_DECLARATIONS = [
    types.FunctionDeclaration(
        name="search_flights",
        description="Search for available flights between two airports. Returns up to 5 flight options with prices, airlines, times, and stops.",
        parameters=types.Schema(
            type=types.Type.OBJECT,
            properties={
                "origin": types.Schema(
                    type=types.Type.STRING,
                    description="Origin IATA airport code (e.g. PDX, JFK, LAX). Use get_iata_code first if you only have a city name.",
                ),
                "destination": types.Schema(
                    type=types.Type.STRING,
                    description="Destination IATA airport code (e.g. MIA, CDG, NRT).",
                ),
                "departure_date": types.Schema(
                    type=types.Type.STRING,
                    description="Departure date in YYYY-MM-DD format.",
                ),
                "adults": types.Schema(
                    type=types.Type.INTEGER,
                    description="Number of adult passengers.",
                ),
                "return_date": types.Schema(
                    type=types.Type.STRING,
                    description="Return date in YYYY-MM-DD format for round trips. Omit for one-way.",
                ),
                "children": types.Schema(
                    type=types.Type.INTEGER,
                    description="Number of child passengers (age 2-11).",
                ),
                "travel_class": types.Schema(
                    type=types.Type.STRING,
                    description="Cabin class: ECONOMY, PREMIUM_ECONOMY, BUSINESS, or FIRST.",
                ),
                "max_price": types.Schema(
                    type=types.Type.INTEGER,
                    description="Maximum price per person in USD.",
                ),
            },
            required=["origin", "destination", "departure_date", "adults"],
        ),
    ),
    types.FunctionDeclaration(
        name="search_hotels",
        description="Search for available hotels in a city with check-in/check-out dates. Returns up to 5 hotel options with prices and room details.",
        parameters=types.Schema(
            type=types.Type.OBJECT,
            properties={
                "city_code": types.Schema(
                    type=types.Type.STRING,
                    description="IATA city code (e.g. MIA, PAR, LON). Usually the same as the airport code.",
                ),
                "check_in_date": types.Schema(
                    type=types.Type.STRING,
                    description="Check-in date in YYYY-MM-DD format.",
                ),
                "check_out_date": types.Schema(
                    type=types.Type.STRING,
                    description="Check-out date in YYYY-MM-DD format.",
                ),
                "adults": types.Schema(
                    type=types.Type.INTEGER,
                    description="Number of adult guests.",
                ),
                "rooms": types.Schema(
                    type=types.Type.INTEGER,
                    description="Number of rooms needed. Default 1.",
                ),
            },
            required=["city_code", "check_in_date", "check_out_date", "adults"],
        ),
    ),
    types.FunctionDeclaration(
        name="search_activities",
        description="Search for tours, excursions, and recreational activities near a city. Returns activities with descriptions and prices.",
        parameters=types.Schema(
            type=types.Type.OBJECT,
            properties={
                "city_name": types.Schema(
                    type=types.Type.STRING,
                    description="City name in English (e.g. Miami, Paris, Tokyo).",
                ),
            },
            required=["city_name"],
        ),
    ),
    types.FunctionDeclaration(
        name="get_iata_code",
        description="Convert a city name to its IATA airport code. Use this before searching flights if you only have a city name.",
        parameters=types.Schema(
            type=types.Type.OBJECT,
            properties={
                "city_name": types.Schema(
                    type=types.Type.STRING,
                    description="City name (e.g. Portland, New York, Paris).",
                ),
            },
            required=["city_name"],
        ),
    ),
]


# ── Tool execution ───────────────────────────────────────────────────────────

def _execute_tool(name: str, args: dict) -> dict:
    """Execute a tool call and return the result as a dict."""
    if name == "search_flights":
        params = {
            "originLocationCode": args["origin"],
            "destinationLocationCode": args["destination"],
            "departureDate": args["departure_date"],
            "adults": args.get("adults", 1),
        }
        if args.get("return_date"):
            params["returnDate"] = args["return_date"]
        if args.get("children"):
            params["children"] = args["children"]
        if args.get("travel_class"):
            params["travelClass"] = args["travel_class"]
        if args.get("max_price"):
            params["maxPrice"] = args["max_price"]
        return amadeus_search_flights(params)

    elif name == "search_hotels":
        return amadeus_search_hotels(
            city_code=args["city_code"],
            check_in=args["check_in_date"],
            check_out=args["check_out_date"],
            adults=args.get("adults", 1),
            rooms=args.get("rooms", 1),
        )

    elif name == "search_activities":
        return amadeus_search_activities(city_name=args["city_name"])

    elif name == "get_iata_code":
        code = city_to_iata(args["city_name"])
        if code:
            return {"iata_code": code, "city": args["city_name"]}
        return {"error": f"Could not find IATA code for '{args['city_name']}'. Try the full city name or provide the 3-letter code directly."}

    return {"error": f"Unknown tool: {name}"}


# ── Agent ────────────────────────────────────────────────────────────────────

class TravelAgent:
    """Agentic travel planner using Gemini with function calling."""

    def __init__(self):
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is required")
        # Debug: show first and last 4 chars of API key to verify it's loaded
        key_preview = f"{api_key[:4]}...{api_key[-4:]}" if len(api_key) > 8 else "***"
        print(f"[Agent] Initializing with API key: {key_preview}")
        self.client = genai.Client(api_key=api_key)
        self.sessions: dict[str, list] = {}
        self.tools = [types.Tool(function_declarations=TOOL_DECLARATIONS)]

    def run(self, message: str, session_id: str = "default") -> dict:
        """
        Process a user message through the agentic loop.

        Returns:
            {
                "message": str,       # Agent's text response
                "flights": [...],     # Flight results (if any tools returned them)
                "hotels": [...],      # Hotel results (if any)
                "activities": [...]   # Activity results (if any)
            }
        """
        if session_id not in self.sessions:
            self.sessions[session_id] = []

        history = self.sessions[session_id]
        history.append(
            types.Content(role="user", parts=[types.Part.from_text(text=message)])
        )

        collected = {"flights": [], "hotels": [], "activities": []}
        max_iterations = 5  # Reduced from 10 to limit API calls and avoid rate limits

        for iteration in range(max_iterations):
            # Retry with backoff for rate limits
            response = None
            for attempt in range(3):
                try:
                    response = self.client.models.generate_content(
                        model="gemini-2.0-flash",
                        contents=history,
                        config=types.GenerateContentConfig(
                            system_instruction=SYSTEM_PROMPT,
                            tools=self.tools,
                            temperature=0.7,
                        ),
                    )
                    break
                except Exception as e:
                    err_str = str(e)
                    if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                        # Extract retry delay from error if available
                        retry_delay = 60  # Default to 60 seconds
                        if "retryDelay" in err_str or "retry in" in err_str.lower():
                            # Try to extract the delay time
                            import re
                            delay_match = re.search(r'retry in ([\d.]+)s', err_str.lower())
                            if delay_match:
                                retry_delay = max(int(float(delay_match.group(1))), 30)
                        
                        if attempt < 2:
                            wait = retry_delay if attempt == 0 else retry_delay * 2
                            print(f"[Agent] Rate limited/quota exceeded, retrying in {wait}s (attempt {attempt + 1}/3)")
                            print(f"[Agent] Error details: {err_str[:200]}")
                            time.sleep(wait)
                        else:
                            print(f"[Agent] Gemini API quota exhausted after 3 attempts: {err_str[:300]}")
                            return {
                                "message": "I've hit my API rate limit. This usually means the free tier quota has been exhausted. Please wait a few minutes and try again, or check your API key quota at https://ai.dev/rate-limit",
                                **collected,
                            }
                    else:
                        print(f"[Agent] Gemini API error: {e}")
                        return {
                            "message": f"Sorry, I encountered an error. Please try again in a moment.",
                            **collected,
                        }
            if response is None:
                return {"message": "Sorry, I couldn't reach my brain after multiple tries. Please try again.", **collected}

            candidate = response.candidates[0]
            parts = candidate.content.parts

            # Check if there are any function calls
            function_calls = [p for p in parts if p.function_call]

            if not function_calls:
                # Pure text response — we're done
                history.append(candidate.content)
                self.sessions[session_id] = history
                text = ""
                for p in parts:
                    if hasattr(p, "text") and p.text:
                        text += p.text
                return {"message": text, **collected}

            # There are function calls — execute them and loop back
            history.append(candidate.content)

            fn_response_parts = []
            for part in function_calls:
                name = part.function_call.name
                args = dict(part.function_call.args)
                print(f"[Agent] Iteration {iteration}: calling {name}({json.dumps(args)})")

                result = _execute_tool(name, args)
                print(f"[Agent] {name} returned: {json.dumps(result, default=str)[:300]}")

                # Collect structured data for the frontend to render as cards
                if name == "search_flights" and result.get("flights"):
                    collected["flights"].extend(result["flights"])
                elif name == "search_hotels" and result.get("hotels"):
                    collected["hotels"].extend(result["hotels"])
                elif name == "search_activities" and result.get("activities"):
                    collected["activities"].extend(result["activities"])

                fn_response_parts.append(
                    types.Part.from_function_response(name=name, response=result)
                )

            # Add function results back into conversation
            history.append(types.Content(role="user", parts=fn_response_parts))

        # Exhausted iterations
        self.sessions[session_id] = history
        return {
            "message": "I've been working hard on your request but need a bit more direction. Could you simplify or clarify what you're looking for?",
            **collected,
        }

    def reset(self, session_id: str):
        """Clear conversation history for a session."""
        self.sessions.pop(session_id, None)


# Singleton agent instance
agent = TravelAgent()
