import { searchFlightOffers, searchFlightInspiration, searchHotels } from './api.js';

async function testFlightSearch() {
  try {
    const flights = await searchFlightOffers({
      originLocationCode: 'LAX',
      destinationLocationCode: 'JFK',
      departureDate: '2026-02-10',
      adults: 1,
      max: 3
    });
    console.log(`${flights.length} flights LAX -> JFK`);
    console.log(flights[0])
    console.log(flights[0].itineraries[0])
  } catch (err) {
      console.error('Error! Description:', err.description);
  }
}

// Test 2: Flight Inspiration Search
async function testFlightInspiration() {
  try {
    const destinations = await searchFlightInspiration({
      origin: 'LAX',
      maxPrice: 500
    });
    console.log(`${destinations.length} destinations under $500`);
    console.log(destinations[0]);
  } catch (err) {
      console.error('Error! Description:', err.description);
  }
}

// Test 3: Hotel Search
async function testHotelSearch() {
  try {
    const hotels = await searchHotels({
      cityCode: 'NYC',
      checkInDate: '2026-06-15',
      checkOutDate: '2026-06-18',
      adults: 2,
      roomQuantity: 1
    });
    console.log(`NYC hotels: ${hotels.length}`);
    console.log(hotels[0]);
  }
  catch (err) {
    console.error('Error! Description:', err.description);
  }
}

// Run all tests
(async () => {
  await testFlightSearch();
  await testFlightInspiration();
  await testHotelSearch(); // todo: check that it works, test flight booking and amenities search.
})();
