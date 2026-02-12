"""
Convert city names to IATA airport codes.
For MVP: Uses a simple dictionary mapping.
Can be enhanced with Amadeus Location API later.
"""
from typing import Optional

# Dictionary mapping city names to their primary IATA airport codes
CITY_TO_IATA = {
    # US Cities
    "portland": "PDX", "pdx": "PDX",
    "new york": "JFK", "nyc": "JFK", "new york city": "JFK", "jfk": "JFK",
    "los angeles": "LAX", "la": "LAX", "lax": "LAX",
    "chicago": "ORD", "chi": "ORD", "ord": "ORD",
    "miami": "MIA", "mia": "MIA",
    "san francisco": "SFO", "sfo": "SFO", "sf": "SFO",
    "seattle": "SEA", "sea": "SEA",
    "boston": "BOS", "bos": "BOS",
    "washington": "DCA", "dc": "DCA", "washington dc": "DCA", "dca": "DCA",
    "atlanta": "ATL", "atl": "ATL",
    "dallas": "DFW", "dfw": "DFW",
    "denver": "DEN", "den": "DEN",
    "phoenix": "PHX", "phx": "PHX",
    "las vegas": "LAS", "las": "LAS", "vegas": "LAS",
    "houston": "IAH", "iah": "IAH",
    "san diego": "SAN", "san": "SAN",
    
    # International Cities
    "paris": "CDG", "cdg": "CDG",
    "london": "LHR", "lon": "LHR", "lhr": "LHR",
    "tokyo": "NRT", "tyo": "NRT", "nrt": "NRT",
    "sydney": "SYD", "syd": "SYD",
    "bangkok": "BKK", "bkk": "BKK",
    "dubai": "DXB", "dxb": "DXB",
    "singapore": "SIN", "sin": "SIN",
    "hong kong": "HKG", "hkg": "HKG",
    "toronto": "YYZ", "yyz": "YYZ",
    "vancouver": "YVR", "yvr": "YVR",
    "mexico city": "MEX", "mex": "MEX",
    "rio de janeiro": "GIG", "gig": "GIG",
    "barcelona": "BCN", "bcn": "BCN",
    "rome": "FCO", "fco": "FCO",
    "amsterdam": "AMS", "ams": "AMS",
    "berlin": "BER", "ber": "BER",
    "madrid": "MAD", "mad": "MAD",
    "cancun": "CUN", "cun": "CUN",
    "punta cana": "PUJ", "puj": "PUJ",
    "bali": "DPS", "dps": "DPS",
    "phuket": "HKT", "hkt": "HKT",
}


def city_to_iata(city_name: str) -> Optional[str]:
    """
    Convert city name to IATA airport code.
    
    Args:
        city_name: City name in natural language (e.g., "New York", "NYC", "JFK")
        
    Returns:
        IATA code (e.g., "JFK") or None if not found
    """
    if not city_name:
        return None
    
    city_lower = city_name.lower().strip()
    
    # Direct lookup
    if city_lower in CITY_TO_IATA:
        return CITY_TO_IATA[city_lower]
    
    # Try partial match (e.g., "new york city" contains "new york")
    for city, code in CITY_TO_IATA.items():
        if city in city_lower or city_lower in city:
            return code
    
    # If already looks like IATA code (3 uppercase letters)
    if len(city_lower) == 3 and city_lower.isalpha():
        return city_lower.upper()
    
    return None

