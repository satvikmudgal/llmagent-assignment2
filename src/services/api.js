import Amadeus from 'amadeus';

const amadeus = new Amadeus({
  clientId: 'K6QCViP92zim4YsZQK5IacGNvUa61YzJ',
  clientSecret: 'EsKkiCkzUDalTZJy'
});

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
 * @param {string} [params.currencyCode] - Currency (default: "USD")
 * @param {number|string} [params.max] - Max results (default: 250)
 * @returns {Promise<Object>} Flight offers data
 */
export async function searchFlightOffers(params) {
  if (!params.originLocationCode || !params.destinationLocationCode || !params.departureDate) {
    throw new Error('originLocationCode, destinationLocationCode, and departureDate are required');
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
  if (!params.origin) {
    throw new Error('origin is required');
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
  if (!params.flightOffer) {
    throw new Error('flightOffer is required');
  }
  if (!params.travelers || !Array.isArray(params.travelers) || params.travelers.length === 0) {
    throw new Error('travelers array is required');
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
 * @param {Object} params - Hotel search parameters
 * @param {string} [params.cityCode] - IATA city code (e.g., "NYC")
 * @param {string} [params.hotelIds] - Comma-separated hotel IDs
 * @param {string} params.checkInDate - Check-in date (YYYY-MM-DD)
 * @param {string} params.checkOutDate - Check-out date (YYYY-MM-DD)
 * @param {number|string} [params.adults] - Adults per room (default: 1)
 * @param {number|string} [params.roomQuantity] - Number of rooms (default: 1)
 * @param {string} [params.currency] - Currency code
 * @returns {Promise<Object>} Hotel offers data
 */
export async function searchHotels(params) {
  if (!params.cityCode && !params.hotelIds) {
    throw new Error('Either cityCode or hotelIds is required');
  }
  if (!params.checkInDate || !params.checkOutDate) {
    throw new Error('checkInDate and checkOutDate are required');
  }

  const queryParams = {
    checkInDate: params.checkInDate,
    checkOutDate: params.checkOutDate,
    adults: params.adults || 1,
    roomQuantity: params.roomQuantity || 1
  };

  if (params.cityCode) queryParams.cityCode = params.cityCode;
  if (params.hotelIds) queryParams.hotelIds = params.hotelIds;
  if (params.radius) queryParams.radius = params.radius;
  if (params.radiusUnit) queryParams.radiusUnit = params.radiusUnit;
  if (params.amenities) queryParams.amenities = params.amenities;
  if (params.ratings) queryParams.ratings = params.ratings;
  if (params.priceRange) queryParams.priceRange = params.priceRange;
  if (params.currency) queryParams.currency = params.currency;


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
  if (!params.offerId) {
    throw new Error('offerId is required');
  }
  if (!params.guests || !Array.isArray(params.guests) || params.guests.length === 0) {
    throw new Error('guests array is required');
  }
  if (!params.payment) {
    throw new Error('payment information is required');
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

export { amadeus };