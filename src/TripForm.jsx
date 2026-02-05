import { useState } from 'react';
import DatePicker from 'react-datepicker';
import AirportSelector from './AirportSelector';
import 'react-datepicker/dist/react-datepicker.css';

function TripForm() {
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [departureAirport, setDepartureAirport] = useState(null);
    const [arrivalAirport, setArrivalAirport] = useState(null);
    const [destinationType, setDestinationType] = useState('none'); // 'none', 'specific', 'natural'
    const [naturalLanguageDestination, setNaturalLanguageDestination] = useState('');
    const [budget, setBudget] = useState('');
    const [tripJson, setTripJson] = useState(null);

    return (
        <div className="trip-form">
            <div className="form-group">
                <label>Departure</label>
                <AirportSelector
                    placeholder="Enter departure city..."
                    value={departureAirport}
                    onChange={setDepartureAirport}
                />
            </div>
            <div className="form-group">
                <label>Destination (Optional)</label>
                <div className="destination-options">
                    <label className="radio-option">
                        <input
                            type="radio"
                            name="destinationType"
                            value="none"
                            checked={destinationType === 'none'}
                            onChange={(e) => {
                                setDestinationType(e.target.value);
                                setArrivalAirport(null);
                                setNaturalLanguageDestination('');
                            }}
                        />
                        <span>No specific destination</span>
                    </label>
                    <label className="radio-option">
                        <input
                            type="radio"
                            name="destinationType"
                            value="specific"
                            checked={destinationType === 'specific'}
                            onChange={(e) => {
                                setDestinationType(e.target.value);
                                setNaturalLanguageDestination('');
                            }}
                        />
                        <span>Specific location</span>
                    </label>
                    <label className="radio-option">
                        <input
                            type="radio"
                            name="destinationType"
                            value="natural"
                            checked={destinationType === 'natural'}
                            onChange={(e) => {
                                setDestinationType(e.target.value);
                                setArrivalAirport(null);
                            }}
                        />
                        <span>Describe the kind of place</span>
                    </label>
                </div>
                {destinationType === 'specific' && (
                    <AirportSelector
                        placeholder="Enter destination city..."
                        value={arrivalAirport}
                        onChange={setArrivalAirport}
                    />
                )}
                {destinationType === 'natural' && (
                    <input
                        type="text"
                        className="date-picker-input"
                        placeholder="e.g., a beach resort, mountain hiking destination, cultural city..."
                        value={naturalLanguageDestination}
                        onChange={(e) => setNaturalLanguageDestination(e.target.value)}
                    />
                )}
            </div>
            <div className="form-group">
                <label>Start Date</label>
                <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    placeholderText="Select start date"
                    className="date-picker-input"
                />
            </div>
            <div className="form-group">
                <label>End Date</label>
                <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    placeholderText="Select end date"
                    className="date-picker-input"
                />
            </div>
            <div className="form-group">
                <label>Budget (Optional)</label>
                <div className="budget-input-wrapper">
                    <span className="currency-symbol">$</span>
                    <input
                        type="number"
                        className="date-picker-input budget-input"
                        placeholder="Enter your budget (e.g., 1500)"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        min="0"
                        step="0.01"
                    />
                </div>
            </div>
            <button
                className="btn btn-primary"
                onClick={() => {
                    const travelDays = startDate && endDate
                        ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
                        : null;

                    const json = {
                        departure: departureAirport ? departureAirport.label : null,
                        ...(destinationType === 'specific' && arrivalAirport
                            ? { destination: arrivalAirport.label }
                            : {}),
                        ...(destinationType === 'natural' && naturalLanguageDestination
                            ? { naturalLanguage: naturalLanguageDestination }
                            : {}),
                        startDate: startDate ? startDate.toISOString().split('T')[0] : null,
                        endDate: endDate ? endDate.toISOString().split('T')[0] : null,
                        ...(travelDays !== null ? { travelDays } : {}),
                        ...(budget && budget.trim() !== '' ? { budget: parseFloat(budget) } : {})
                    };

                    setTripJson(json);
                }}
            >
                Generate Trip JSON
            </button>

            {tripJson && (
                <div className="json-display">
                    <h3>Trip Information (JSON)</h3>
                    <pre>{JSON.stringify(tripJson, null, 2)}</pre>
                    <button
                        className="btn btn-outline"
                        onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(tripJson, null, 2));
                            alert('JSON copied to clipboard!');
                        }}
                    >
                        Copy JSON
                    </button>
                </div>
            )}

            {(startDate || endDate || departureAirport || arrivalAirport || naturalLanguageDestination || budget) && (
                <div className="date-airport-range-display">
                    <div className="date-range-display">
                        {startDate && <p>Start: {startDate.toLocaleDateString()}</p>}
                        {endDate && <p>End: {endDate.toLocaleDateString()}</p>}
                        {startDate && endDate && (
                            <p>Travel days: {Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))}</p>
                        )}
                        {departureAirport && <p>Departure: {departureAirport.label}</p>}
                        {arrivalAirport && <p>Destination: {arrivalAirport.label}</p>}
                        {naturalLanguageDestination && <p>Looking for: {naturalLanguageDestination}</p>}
                        {budget && budget.trim() !== '' && (
                            <p>Budget: ${parseFloat(budget).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default TripForm;