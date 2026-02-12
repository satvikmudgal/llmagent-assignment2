import Amadeus from 'amadeus';

const amadeus = new Amadeus({
  clientId: 'K6QCViP92zim4YsZQK5IacGNvUa61YzJ',
  clientSecret: 'EsKkiCkzUDalTZJy'
});

export async function fullPrettyOffers(params) {
  return (await searchFlightOffers(params)).map((flightOfferObject) => {
    let getHopInfo = (itinerary) => {
      const hopList = [];
      for (const hop of itinerary.segments) {
        hopList.push({
          carrierCode: hop.carrierCode,
          departurePort: hop.departure.iataCode,
          arrivalPort: hop.arrival.iataCode,
          departureDateTime: hop.departure.at,
          arrivalDateTime: hop.arrival.at,
          duration: hop.duration
        });
      }
      return hopList;
    };

    let infoObj = {
      oneWay: flightOfferObject.oneWay, // whether the flight is one- or two-way; not ENTIRELY sure what this means.
      lastTicketingDateTime: flightOfferObject.lastTicketingDateTime, // date you must book by for the offer to be valid (ex.: 2018-06-19T15:00:00)
      price: flightOfferObject.price.total, // total price in USD (decimal)
      leaveDuration: flightOfferObject.itineraries[0].duration, // duration in [ISO8601](https://en.wikipedia.org/wiki/ISO_8601) PnYnMnDTnHnMnS format, e.g. PT2H10M for a duration of 2h10m
      leaveHops: getHopInfo(flightOfferObject.itineraries[0]),
    };

    if (flightOfferObject.itineraries.length > 1) {
      infoObj.returnDuration = flightOfferObject.itineraries[1].duration;
      infoObj.returnHops = getHopInfo(flightOfferObject.itineraries[1]);
    }

    return infoObj;
  });
}


/**
 * @param {Object} params - Flight search parameters
 * @param {string} params.originLocationCode - IATA code (e.g., "LAX")
 * @param {string} params.destinationLocationCode - IATA code (e.g., "JFK")
 * @param {string} params.departureDate - Date in YYYY-MM-DD format
 * @param {number|string} params.adults - Number of adults (default: 1)
 * @param {string} [params.returnDate] - Return date for round-trip
 * @param {number|string} [params.children] - Number of children
 * @param {number|string} [params.infants] - Number of infants
 * @param {string} [params.travelClass] - "ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"
 * @param {boolean} [params.nonStop] - Non-stop flights only
 * @param {string} [params.currencyCode] - Currency (default: "USD")
 * @param {number|string} [params.max] - Max results (default: 250)
 * @returns {Promise<Object>} Flight offers data
 */
export async function searchFlightOffers(params) {
  if (!params || typeof params !== 'object') {
    throw new Error('params must be an object');
  }
  if (!params.originLocationCode || typeof params.originLocationCode !== 'string') {
    throw new Error('originLocationCode is required and must be a string');
  }
  if (!params.destinationLocationCode || typeof params.destinationLocationCode !== 'string') {
    throw new Error('destinationLocationCode is required and must be a string');
  }
  if (!params.departureDate || typeof params.departureDate !== 'string') {
    throw new Error('departureDate is required and must be a string in YYYY-MM-DD format');
  }

  const queryParams = {
    originLocationCode: params.originLocationCode,
    destinationLocationCode: params.destinationLocationCode,
    departureDate: params.departureDate,
    adults: String(params.adults || 1),
    currencyCode: params.currencyCode || 'USD'
  };

  // optional params
  if (params.returnDate) queryParams.returnDate = params.returnDate;
  if (params.children) queryParams.children = String(params.children);
  if (params.infants) queryParams.infants = String(params.infants);
  if (params.travelClass) queryParams.travelClass = params.travelClass;
  if (params.includedAirlineCodes) queryParams.includedAirlineCodes = params.includedAirlineCodes;
  if (params.excludedAirlineCodes) queryParams.excludedAirlineCodes = params.excludedAirlineCodes;
  if (params.nonStop !== undefined) queryParams.nonStop = params.nonStop;
  if (params.max) queryParams.max = String(params.max);
  if (params.maxPrice) queryParams.maxPrice = String(params.maxPrice);

  const response = await amadeus.shopping.flightOffersSearch.get(queryParams);
  return response.data;
}

// NOTE: THIS ENDPOINT MAY BE BROKEN?
// IT SEEMS TO BE RETURNING ERRORS.
/**
 * @param {Object} params - Flight inspiration parameters
 * @param {string} params.origin - IATA code (e.g., "LAX")
 * @param {string} [params.departureDate] - Date in YYYY-MM-DD format
 * @param {boolean} [params.oneWay] - One-way trips only
 * @param {number|string} [params.duration] - Trip duration in days
 * @param {boolean} [params.nonStop] - Non-stop flights only
 * @param {number|string} [params.maxPrice] - Maximum price
 * @returns {Promise<Object>} Flight destinations data
 */
export async function searchFlightInspiration(params) {
  if (!params || typeof params !== 'object') {
    throw new Error('params must be an object');
  }
  if (!params.origin || typeof params.origin !== 'string') {
    throw new Error('origin is required and must be a string');
  }

  const queryParams = { origin: params.origin };

  if (params.departureDate) queryParams.departureDate = params.departureDate;
  if (params.oneWay !== undefined) queryParams.oneWay = params.oneWay;
  if (params.duration) queryParams.duration = String(params.duration);
  if (params.nonStop !== undefined) queryParams.nonStop = params.nonStop;
  if (params.maxPrice) queryParams.maxPrice = String(params.maxPrice);
  if (params.viewBy) queryParams.viewBy = params.viewBy;

  const response = await amadeus.shopping.flightDestinations.get(queryParams);
  return response.data;
}

/**
 * @param {Object} params - Flight booking parameters
 * @param {Object} params.flightOffer - Flight offer objects from search results
 * @param {Array} params.travelers - Traveler information
 * @returns {Promise<Object>} Flight booking confirmation
 */
export async function bookFlight(params) {
  if (!params || typeof params !== 'object') {
    throw new Error('params must be an object');
  }
  if (!params.flightOffer || typeof params.flightOffer !== 'object') {
    throw new Error('flightOffer is required and must be an object');
  }
  if (!params.travelers || !Array.isArray(params.travelers) || params.travelers.length === 0) {
    throw new Error('travelers is required and must be a non-empty array');
  }

  const bookingData = {
    data: {
      type: 'flight-order',
      flightOffers: [params.flightOffer],
      travelers: params.travelers
    }
  };

  const response = await amadeus.booking.flightOrders.post(JSON.stringify(bookingData));
  return response.data;
}

/**
 * @param {Object} params - Hotel list search by city parameters
 * @param {string} params.cityCode - IATA city code (e.g., "NYC")
 * @param {number|string} [params.radius] - Search radius
 * @param {string} [params.radiusUnit] - Unit of measurement: "KM" or "MILE"
 * @param {string} [params.chainCodes] - Hotel chain codes (e.g., "MC")
 * @param {string} [params.amenities] - Amenities (e.g., "SWIMMING_POOL,SPA")
 * @param {string} [params.ratings] - Star ratings (e.g., "1,2,3,4,5")
 * @param {string} [params.hotelSource] - Hotel source: "BEDBANK" or "DIRECTCHAIN"
 * @returns {Promise<Object>} Hotel list data
 */
export async function getHotelsByCity(params) {
  if (!params || typeof params !== 'object') {
    throw new Error('params must be an object');
  }
  if (!params.cityCode || typeof params.cityCode !== 'string') {
    throw new Error('cityCode is required and must be a string');
  }

  const queryParams = { cityCode: params.cityCode };

  if (params.radius !== undefined) queryParams.radius = String(params.radius);
  if (params.radiusUnit) queryParams.radiusUnit = params.radiusUnit;
  if (params.chainCodes) queryParams.chainCodes = params.chainCodes;
  if (params.amenities) queryParams.amenities = params.amenities;
  if (params.ratings) queryParams.ratings = params.ratings;
  if (params.hotelSource) queryParams.hotelSource = params.hotelSource;

  const response = await amadeus.referenceData.locations.hotels.byCity.get(queryParams);
  return response.data;
}

// /**
//  * @param {Object} params - Hotel list search by geocode parameters
//  * @param {number} params.latitude - Latitude of the location
//  * @param {number} params.longitude - Longitude of the location
//  * @param {number|string} [params.radius] - Search radius (default: 5)
//  * @param {string} [params.radiusUnit] - Unit of measurement: "KM" or "MILE"
//  * @param {string} [params.chainCodes] - Hotel chain codes
//  * @param {string} [params.amenities] - Amenities
//  * @param {string} [params.ratings] - Star ratings
//  * @param {string} [params.hotelSource] - Hotel source
//  * @returns {Promise<Object>} Hotel list data
//  */
// export async function getHotelsByGeocode(params) {
//   if (!params || typeof params !== 'object') {
//     throw new Error('params must be an object');
//   }
//   if (params.latitude === undefined || typeof params.latitude !== 'number') {
//     throw new Error('latitude is required and must be a number');
//   }
//   if (params.longitude === undefined || typeof params.longitude !== 'number') {
//     throw new Error('longitude is required and must be a number');
//   }

//   const queryParams = {
//     latitude: params.latitude,
//     longitude: params.longitude
//   };

//   if (params.radius !== undefined) queryParams.radius = String(params.radius);
//   if (params.radiusUnit) queryParams.radiusUnit = params.radiusUnit;
//   if (params.chainCodes) queryParams.chainCodes = params.chainCodes;
//   if (params.amenities) queryParams.amenities = params.amenities;
//   if (params.ratings) queryParams.ratings = params.ratings;
//   if (params.hotelSource) queryParams.hotelSource = params.hotelSource;

//   const response = await amadeus.referenceData.locations.hotels.byGeocode.get(queryParams);
//   return response.data;
// }

// /**
//  * @param {Object} params - Hotel list search by hotel IDs parameters
//  * @param {string} params.hotelIds - Comma-separated Amadeus hotel IDs (e.g., "RTPAR001,RTPAR002")
//  * @returns {Promise<Object>} Hotel list data
//  */
// export async function getHotelsByIds(params) {
//   if (!params || typeof params !== 'object') {
//     throw new Error('params must be an object');
//   }
//   if (!params.hotelIds || typeof params.hotelIds !== 'string') {
//     throw new Error('hotelIds is required and must be a string');
//   }

//   const queryParams = { hotelIds: params.hotelIds };

//   const response = await amadeus.referenceData.locations.hotels.byHotels.get(queryParams);
//   return response.data;
// }


/**
 * @param {Object} params - Hotel booking parameters
 * @param {string} params.offerId - Offer ID from search results
 * @param {Array} params.guests - Guest information
 * @param {Object} params.payment - Payment information
 * @returns {Promise<Object>} Booking confirmation
 */
export async function bookHotel(params) {
  if (!params || typeof params !== 'object') {
    throw new Error('params must be an object');
  }
  if (!params.offerId || typeof params.offerId !== 'string') {
    throw new Error('offerId is required and must be a string');
  }
  if (!params.guests || !Array.isArray(params.guests) || params.guests.length === 0) {
    throw new Error('guests is required and must be a non-empty array');
  }
  if (!params.payment || typeof params.payment !== 'object') {
    throw new Error('payment is required and must be an object');
  }

  const bookingData = {
    data: {
      offerId: params.offerId,
      guests: params.guests,
      payments: [params.payment]
    }
  };

  const response = await amadeus.booking.hotelBookings.post(JSON.stringify(bookingData));
  return response.data;
}

export {
  amadeus,
};