"""
Amadeus API service for searching flights, hotels, and activities.
"""
import os
from amadeus import Client, ResponseError
from dotenv import load_dotenv

load_dotenv()

amadeus = Client(
    client_id=os.environ.get("AMADEUS_CLIENT_ID", "K6QCViP92zim4YsZQK5IacGNvUa61YzJ"),
    client_secret=os.environ.get("AMADEUS_CLIENT_SECRET", "EsKkiCkzUDalTZJy"),
)

# Coordinates for common cities (used by activities search)
CITY_COORDS = {
    "portland": (45.5152, -122.6784),
    "new york": (40.7128, -74.0060), "nyc": (40.7128, -74.0060),
    "los angeles": (34.0522, -118.2437), "la": (34.0522, -118.2437),
    "chicago": (41.8781, -87.6298),
    "miami": (25.7617, -80.1918),
    "san francisco": (37.7749, -122.4194),
    "seattle": (47.6062, -122.3321),
    "boston": (42.3601, -71.0589),
    "washington dc": (38.9072, -77.0369), "dc": (38.9072, -77.0369),
    "atlanta": (33.7490, -84.3880),
    "dallas": (32.7767, -96.7970),
    "denver": (39.7392, -104.9903),
    "phoenix": (33.4484, -112.0740),
    "las vegas": (36.1699, -115.1398), "vegas": (36.1699, -115.1398),
    "houston": (29.7604, -95.3698),
    "san diego": (32.7157, -117.1611),
    "honolulu": (21.3069, -157.8583), "hawaii": (21.3069, -157.8583),
    "paris": (48.8566, 2.3522),
    "london": (51.5074, -0.1278),
    "tokyo": (35.6762, 139.6503),
    "sydney": (-33.8688, 151.2093),
    "bangkok": (13.7563, 100.5018),
    "dubai": (25.2048, 55.2708),
    "singapore": (1.3521, 103.8198),
    "hong kong": (22.3193, 114.1694),
    "toronto": (43.6532, -79.3832),
    "vancouver": (49.2827, -123.1207),
    "mexico city": (19.4326, -99.1332),
    "cancun": (21.1619, -86.8515),
    "barcelona": (41.3874, 2.1686),
    "rome": (41.9028, 12.4964),
    "amsterdam": (52.3676, 4.9041),
    "berlin": (52.5200, 13.4050),
    "madrid": (40.4168, -3.7038),
    "rio de janeiro": (22.9068, -43.1729),
    "bali": (-8.3405, 115.0920),
    "phuket": (7.8804, 98.3923),
}


# ── Flights ──────────────────────────────────────────────────────────────────

def search_flights(params: dict) -> dict:
    """Search for flight offers using the Amadeus API."""
    try:
        query = {
            "originLocationCode": params["originLocationCode"],
            "destinationLocationCode": params["destinationLocationCode"],
            "departureDate": params["departureDate"],
            "adults": params.get("adults", 1),
            "currencyCode": params.get("currencyCode", "USD"),
            "max": 5,
        }
        if params.get("returnDate"):
            query["returnDate"] = params["returnDate"]
        if params.get("children"):
            query["children"] = params["children"]
        if params.get("infants"):
            query["infants"] = params["infants"]
        if params.get("travelClass"):
            query["travelClass"] = params["travelClass"]
        if params.get("maxPrice"):
            query["maxPrice"] = params["maxPrice"]

        print(f"[Amadeus] Searching flights: {query}")
        response = amadeus.shopping.flight_offers_search.get(**query)
        raw_offers = response.data
        parsed = [parse_flight_offer(offer) for offer in raw_offers[:5]]

        return {"flights": parsed, "raw_count": len(raw_offers), "error": None}

    except ResponseError as e:
        print(f"[Amadeus] Flight API error: {e}")
        return {"flights": [], "raw_count": 0, "error": str(e)}
    except Exception as e:
        print(f"[Amadeus] Unexpected flight error: {e}")
        return {"flights": [], "raw_count": 0, "error": str(e)}


def parse_flight_offer(offer: dict) -> dict:
    """Parse a raw Amadeus flight offer into a clean dictionary."""
    price = offer.get("price", {})
    itineraries = offer.get("itineraries", [])
    traveler_pricings = offer.get("travelerPricings", [])

    cabin = None
    if traveler_pricings:
        segments = traveler_pricings[0].get("fareDetailsBySegment", [])
        if segments:
            cabin = segments[0].get("cabin")

    parsed_itineraries = []
    airlines = set()

    for itin in itineraries:
        segments = itin.get("segments", [])
        for seg in segments:
            airlines.add(seg.get("carrierCode", ""))

        first_seg = segments[0] if segments else {}
        last_seg = segments[-1] if segments else {}

        parsed_itineraries.append({
            "departure_airport": first_seg.get("departure", {}).get("iataCode"),
            "departure_time": first_seg.get("departure", {}).get("at"),
            "arrival_airport": last_seg.get("arrival", {}).get("iataCode"),
            "arrival_time": last_seg.get("arrival", {}).get("at"),
            "duration": itin.get("duration", "").replace("PT", ""),
            "stops": len(segments) - 1,
            "segments": [
                {
                    "carrier": s.get("carrierCode"),
                    "flight_number": f"{s.get('carrierCode', '')}{s.get('number', '')}",
                    "from": s.get("departure", {}).get("iataCode"),
                    "to": s.get("arrival", {}).get("iataCode"),
                    "depart": s.get("departure", {}).get("at"),
                    "arrive": s.get("arrival", {}).get("at"),
                }
                for s in segments
            ],
        })

    return {
        "price": price.get("grandTotal") or price.get("total"),
        "currency": price.get("currency", "USD"),
        "airlines": sorted(airlines),
        "cabin": cabin,
        "itineraries": parsed_itineraries,
    }


# ── Hotels ───────────────────────────────────────────────────────────────────

def search_hotels(city_code: str, check_in: str, check_out: str,
                  adults: int = 1, rooms: int = 1) -> dict:
    """
    Search for hotel offers in a city.
    Two-step process: get hotel list by city, then get offers for those hotels.
    """
    try:
        # Step 1: Get hotels in the city
        print(f"[Amadeus] Searching hotels in city: {city_code}")
        hotel_list = amadeus.reference_data.locations.hotels.by_city.get(
            cityCode=city_code
        )

        if not hotel_list.data:
            return {"hotels": [], "error": "No hotels found in this city"}

        # Take first 20 hotel IDs
        hotel_ids = [h["hotelId"] for h in hotel_list.data[:20]]

        # Step 2: Get offers for those hotels
        print(f"[Amadeus] Getting offers for {len(hotel_ids)} hotels")
        offers_response = amadeus.shopping.hotel_offers_search.get(
            hotelIds=hotel_ids,
            adults=adults,
            checkInDate=check_in,
            checkOutDate=check_out,
            roomQuantity=rooms,
            currencyCode="USD",
        )

        parsed = [parse_hotel_offer(o) for o in offers_response.data[:5]]
        return {"hotels": parsed, "error": None}

    except ResponseError as e:
        print(f"[Amadeus] Hotel API error: {e}")
        return {"hotels": [], "error": str(e)}
    except Exception as e:
        print(f"[Amadeus] Unexpected hotel error: {e}")
        return {"hotels": [], "error": str(e)}


def parse_hotel_offer(offer: dict) -> dict:
    """Parse a raw Amadeus hotel offer into a clean dictionary."""
    hotel = offer.get("hotel", {})
    offers = offer.get("offers", [])
    first_offer = offers[0] if offers else {}
    price = first_offer.get("price", {})
    room = first_offer.get("room", {})

    return {
        "name": hotel.get("name", "Unknown Hotel"),
        "hotel_id": hotel.get("hotelId"),
        "city_code": hotel.get("cityCode"),
        "rating": hotel.get("rating"),
        "price_total": price.get("total"),
        "price_currency": price.get("currency", "USD"),
        "room_type": room.get("typeEstimated", {}).get("bedType"),
        "room_description": room.get("description", {}).get("text", ""),
        "check_in": first_offer.get("checkInDate"),
        "check_out": first_offer.get("checkOutDate"),
    }


# ── Activities ───────────────────────────────────────────────────────────────

def search_activities(city_name: str) -> dict:
    """Search for tours and activities near a city using the Amadeus API."""
    city_lower = city_name.lower().strip()
    coords = CITY_COORDS.get(city_lower)

    if not coords:
        return {
            "activities": [],
            "error": f"No coordinates found for '{city_name}'. Try a major city name.",
        }

    try:
        print(f"[Amadeus] Searching activities near {city_name} ({coords})")
        response = amadeus.shopping.activities.get(
            latitude=coords[0],
            longitude=coords[1],
        )

        parsed = [parse_activity(a) for a in response.data[:10]]
        return {"activities": parsed, "error": None}

    except ResponseError as e:
        print(f"[Amadeus] Activities API error: {e}")
        return {"activities": [], "error": str(e)}
    except Exception as e:
        print(f"[Amadeus] Unexpected activities error: {e}")
        return {"activities": [], "error": str(e)}


def parse_activity(activity: dict) -> dict:
    """Parse a raw Amadeus activity into a clean dictionary."""
    price_info = activity.get("price", {})
    return {
        "name": activity.get("name", "Unknown Activity"),
        "description": activity.get("shortDescription", ""),
        "price": price_info.get("amount"),
        "currency": price_info.get("currencyCode", "USD"),
        "rating": activity.get("rating"),
        "pictures": [p.strip() for p in activity.get("pictures", [])[:1]],
        "booking_link": activity.get("bookingLink"),
    }
