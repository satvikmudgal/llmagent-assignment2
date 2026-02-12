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
 * Searches for hotels by city and then retrieves booking offers for those hotels
 * @param {Object} listParams - Parameters for hotel list search
 * @param {Object} searchParams - Parameters for hotel offer search
 * @returns {Promise<Object>} Simplified hotel offers with distance and details
 */
export async function searchHotelOffersByCity(listParams, searchParams = {}) {
  const hotelList = await getHotelsByCity(listParams);

  if (!hotelList || hotelList.length === 0) {
    return [];
  }

  // Sort hotels by distance (ascending)
  // Hotel list API returns distance in the format: { value: number, unit: string }
  const sortedHotels = hotelList.sort((a, b) => {
    const distA = a.distance?.value ?? Infinity;
    const distB = b.distance?.value ?? Infinity;
    return distA - distB;
  });

  // Create a map of hotelId to hotel list info for quick lookup
  const hotelInfoMap = new Map();
  sortedHotels.forEach(hotel => {
    hotelInfoMap.set(hotel.hotelId, hotel);
  });

  const allOffers = [];
  const minOffers = 3;
  const batchSize = 10;

  // Iterate through batches of 20 hotels until we get at least 5 offers
  for (let i = 0; i < sortedHotels.length && allOffers.length < minOffers; i += batchSize) {
    const batch = sortedHotels.slice(i, i + batchSize);
    const hotelIds = batch.map(hotel => hotel.hotelId).join(',');

    try {
      console.log(`Fetching offers for batch starting at index ${i}...`)
      const offers = await searchHotels({
        hotelIds,
        ...searchParams
      });

      if (offers && offers.length > 0) {
        allOffers.push(...offers);
      }
    } catch (err) {
      // Continue to next batch if this one fails
      console.error(`Error fetching offers for batch starting at index ${i}:`, err.message);
      // console.error(err);
    }
  }

  // Transform to simplified format - one object per offer
  return allOffers.flatMap(offerInfo => {
    const hotelListInfo = hotelInfoMap.get(offerInfo.hotel.hotelId);

    console.log(hotelListInfo);

    return (offerInfo.offers || []).map(offer => ({
      chainCode: offerInfo.hotel?.chainCode,
      name: offerInfo.hotel?.name,
      rating: hotelListInfo.rating,
      distance: hotelListInfo?.distance,
      offerId: offer.id,
      checkInDate: offer.checkInDate,
      checkOutDate: offer.checkOutDate,
      guests: offer.guests,
      price: offer.price?.total,
      roomType: offer.room?.typeEstimated,
      roomDescription: offer.room?.description?.text
    }));
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
 * @param {number|string} [params.radius] - Search radius (default: 20)
 * @param {string} [params.radiusUnit] - Unit of measurement: "KM" or "MILE" (default: "MILE")
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

  const queryParams = {
    cityCode: params.cityCode,
    radius: String(params.radius ?? 20),
    radiusUnit: params.radiusUnit ?? 'MILE',
  };

  if (params.chainCodes) queryParams.chainCodes = params.chainCodes;
  if (params.amenities) queryParams.amenities = params.amenities;
  if (params.ratings) queryParams.ratings = params.ratings;
  if (params.hotelSource) queryParams.hotelSource = params.hotelSource;

  const response = await amadeus.referenceData.locations.hotels.byCity.get(queryParams);
  return response.data;
}


/*
 * @param {string} params.cityCode - IATA city code (e.g., "NYC")
 * @param {number|string} [params.radius] - Search radius (default: 20)
 * @param {string} [params.radiusUnit] - Unit of measurement: "KM" or "MILE" (default: "MILE")
 * @param {string} [params.chainCodes] - Hotel chain codes (e.g., "MC")
 * @param {string} [params.amenities] - Amenities (e.g., "SWIMMING_POOL,SPA")
 * @param {string} [params.ratings] - Star ratings (e.g., "1,2,3,4,5")
 * @param {string} [params.hotelSource] - Hotel source: "BEDBANK" or "DIRECTCHAIN"
*/

/*
 * @param {number|string} [params.adults] - Number of adults per room (1-9, default: 1)
 * @param {string} [params.checkInDate] - Check-in date (YYYY-MM-DD, default: today)
 * @param {string} [params.checkOutDate] - Check-out date (YYYY-MM-DD, default: checkInDate + 1)
 * @param {string} [params.countryOfResidence] - ISO 3166-1 alpha-2 country code (e.g., "US")
 * @param {number|string} [params.roomQuantity] - Number of rooms (1-9, default: 1)
 * @param {string} [params.priceRange] - Price range filter (e.g., "100-500", "-300", "200")
 * @param {string} [params.currency] - ISO 4217 currency code (e.g., "USD")
 * @param {string} [params.paymentPolicy] - Payment policy: "GUARANTEE", "DEPOSIT", or "NONE"
 * @param {string} [params.boardType] - Board type: "ROOM_ONLY", "BREAKFAST", "HALF_BOARD", "FULL_BOARD", "ALL_INCLUSIVE"
 * @param {boolean} [params.includeClosed] - Include temporarily closed hotels
 * @param {boolean} [params.bestRateOnly] - Return only cheapest offer per hotel (default: true)
 * @param {string} [params.lang] - Language code for descriptions (e.g., "en", "fr-FR")
*/

/**
 * @param {Object} params - Hotel search parameters
 * @param {string} params.hotelIds - Comma-separated Amadeus hotel IDs (e.g., "MCLONGHM")
 * @param {number|string} [params.adults] - Number of adults per room (1-9, default: 1)
 * @param {string} [params.checkInDate] - Check-in date (YYYY-MM-DD, default: today)
 * @param {string} [params.checkOutDate] - Check-out date (YYYY-MM-DD, default: checkInDate + 1)
 * @param {string} [params.countryOfResidence] - ISO 3166-1 alpha-2 country code (e.g., "US")
 * @param {number|string} [params.roomQuantity] - Number of rooms (1-9, default: 1)
 * @param {string} [params.priceRange] - Price range filter (e.g., "100-500", "-300", "200")
 * @param {string} [params.currency] - ISO 4217 currency code (e.g., "USD")
 * @param {string} [params.paymentPolicy] - Payment policy: "GUARANTEE", "DEPOSIT", or "NONE"
 * @param {string} [params.boardType] - Board type: "ROOM_ONLY", "BREAKFAST", "HALF_BOARD", "FULL_BOARD", "ALL_INCLUSIVE"
 * @param {boolean} [params.includeClosed] - Include temporarily closed hotels
 * @param {boolean} [params.bestRateOnly] - Return only cheapest offer per hotel (default: true)
 * @param {string} [params.lang] - Language code for descriptions (e.g., "en", "fr-FR")
 * @returns {Promise<Object>} Hotel offers data
 */
export async function searchHotels(params) {
  if (!params || typeof params !== 'object') {
    throw new Error('params must be an object');
  }
  if (!params.hotelIds || typeof params.hotelIds !== 'string') {
    throw new Error('hotelIds is required and must be a string');
  }

  // Validate adults if provided
  if (params.adults !== undefined) {
    const adults = Number(params.adults);
    if (isNaN(adults) || adults < 1 || adults > 9) {
      throw new Error('adults must be a number between 1 and 9');
    }
  }

  // Validate roomQuantity if provided
  if (params.roomQuantity !== undefined) {
    const rooms = Number(params.roomQuantity);
    if (isNaN(rooms) || rooms < 1 || rooms > 9) {
      throw new Error('roomQuantity must be a number between 1 and 9');
    }
  }

  // Validate date format if provided
  if (params.checkInDate && !/^\d{4}-\d{2}-\d{2}$/.test(params.checkInDate)) {
    throw new Error('checkInDate must be in YYYY-MM-DD format');
  }
  if (params.checkOutDate && !/^\d{4}-\d{2}-\d{2}$/.test(params.checkOutDate)) {
    throw new Error('checkOutDate must be in YYYY-MM-DD format');
  }

  // Validate countryOfResidence if provided
  if (params.countryOfResidence && !/^[A-Z]{2}$/i.test(params.countryOfResidence)) {
    throw new Error('countryOfResidence must be a 2-letter ISO 3166-1 alpha-2 country code');
  }

  // Validate currency if provided
  if (params.currency && !/^[A-Z]{3}$/i.test(params.currency)) {
    throw new Error('currency must be a 3-letter ISO 4217 currency code');
  }

  // Validate paymentPolicy if provided
  if (params.paymentPolicy && !['GUARANTEE', 'DEPOSIT', 'NONE'].includes(params.paymentPolicy)) {
    throw new Error('paymentPolicy must be one of: GUARANTEE, DEPOSIT, NONE');
  }

  // Validate boardType if provided
  if (params.boardType && !['ROOM_ONLY', 'BREAKFAST', 'HALF_BOARD', 'FULL_BOARD', 'ALL_INCLUSIVE'].includes(params.boardType)) {
    throw new Error('boardType must be one of: ROOM_ONLY, BREAKFAST, HALF_BOARD, FULL_BOARD, ALL_INCLUSIVE');
  }

  // Validate lang if provided
  if (params.lang && !/^[a-zA-Z0-9-]{2,5}$/.test(params.lang)) {
    throw new Error('lang must be a valid ISO 639 language code (2-5 characters)');
  }

  const queryParams = {
    hotelIds: params.hotelIds,
    roomQuantity: String(params.roomQuantity ?? 1),
    currency: params.currency ?? 'USD',
    bestRateOnly: params.bestRateOnly ?? true,
    lang: params.lang ?? "en"
  };

  if (params.adults !== undefined) queryParams.adults = String(params.adults);
  if (params.checkInDate) queryParams.checkInDate = params.checkInDate;
  if (params.checkOutDate) queryParams.checkOutDate = params.checkOutDate;
  if (params.countryOfResidence) queryParams.countryOfResidence = params.countryOfResidence;
  if (params.priceRange) queryParams.priceRange = params.priceRange;
  if (params.paymentPolicy) queryParams.paymentPolicy = params.paymentPolicy;
  if (params.boardType) queryParams.boardType = params.boardType;
  if (params.includeClosed !== undefined) queryParams.includeClosed = params.includeClosed;
  if (params.lang) queryParams.lang = params.lang;

  const response = await amadeus.shopping.hotelOffersSearch.get(queryParams);
  return response.data;
}



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