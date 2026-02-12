import { searchFlightOffers, searchFlightInspiration, getHotelsByCity, fullPrettyOffers } from './api.js';


async function testFlightSearch() {
  try {
    const flights = await fullPrettyOffers({
      originLocationCode: 'LAX',
      destinationLocationCode: 'JFK',
      departureDate: '2026-02-20',
      returnDate: '2026-04-01',
      adults: 1,
      max: 3
    });
    console.log(flights);
  } catch (err) {
      console.error(err);
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

// Test 3: Hotel List
async function testHotelList() {
  try {
    const hotels = await getHotelsByCity({
      cityCode: 'NYC',
      radius: 20,
      radiusUnit: 'MILE',
      // checkInDate: '2026-06-15',
      // checkOutDate: '2026-06-18',
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
  await testHotelList();
})();
