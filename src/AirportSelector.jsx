import { useState, useMemo } from 'react';
import Select from 'react-select';
import airportsData from './data/airports.json';

function AirportSelector({ placeholder = "Select departure city...", value, onChange }) {
    const [inputValue, setInputValue] = useState('');

    // Pre-filter to US only (do this once)
    const usAirports = useMemo(() =>
        Object.values(airportsData).filter(a => a.country === 'US'),
        []
    );

    // Only show options that match what user typed
    const filteredOptions = useMemo(() => {
        if (inputValue.length < 2) return []; // Don't show anything until 2 chars

        const searchLower = inputValue.toLowerCase();

        return usAirports
            .filter(airport =>
                airport.city?.toLowerCase().includes(searchLower) ||
                airport.state?.toLowerCase().includes(searchLower) ||
                airport.iata?.toLowerCase().includes(searchLower)
            )
            .slice(0, 50) // Only show first 50 matches
            .map(airport => ({
                value: airport.iata,
                label: `${airport.city}, ${airport.state} (${airport.iata})`,
                data: airport
            }));
    }, [inputValue, usAirports]);

    return (
        <div className="form-group">
            <Select
                options={filteredOptions}
                onInputChange={setInputValue}
                onChange={onChange}
                value={value}
                placeholder={placeholder}
                isSearchable
                filterOption={null} // Disable default filtering (we're doing it)
                className="airport-select"
            />
        </div>
    );
}

export default AirportSelector;