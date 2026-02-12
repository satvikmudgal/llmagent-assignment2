import { useState, useRef, useEffect } from 'react';
import './ChatInterface.css';
import frog1 from './assets/frog/frog1.jpg';
import frog2 from './assets/frog/frog2.jpg';
import frog3 from './assets/frog/frog3.jpg';
import frog4 from './assets/frog/frog4.jpg';

const FROG_SPRITES = [frog1, frog2, frog3, frog4];

const AIRLINE_NAMES = {
    'AA': 'American Airlines', 'DL': 'Delta', 'UA': 'United', 'WN': 'Southwest',
    'B6': 'JetBlue', 'AS': 'Alaska Airlines', 'NK': 'Spirit', 'F9': 'Frontier',
    'AF': 'Air France', 'BA': 'British Airways', 'LH': 'Lufthansa', 'KL': 'KLM',
    'VS': 'Virgin Atlantic', 'IB': 'Iberia', 'AY': 'Finnair', 'SK': 'SAS',
    'LX': 'Swiss', 'OS': 'Austrian', 'TK': 'Turkish Airlines', 'EK': 'Emirates',
    'QR': 'Qatar Airways', 'EY': 'Etihad', 'SQ': 'Singapore Airlines',
    'CX': 'Cathay Pacific', 'JL': 'Japan Airlines', 'NH': 'ANA',
    'AC': 'Air Canada', 'WS': 'WestJet', 'AM': 'Aeromexico',
};

function formatTime(isoString) {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDate(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDuration(dur) {
    if (!dur) return '—';
    const match = dur.match(/(\d+)H(?:(\d+)M)?/);
    if (!match) return dur;
    const h = match[1];
    const m = match[2] || '0';
    return `${h}h ${m}m`;
}

function airlineName(code) {
    return AIRLINE_NAMES[code] || code;
}

function FlightCard({ flight, index }) {
    const itin = flight.itineraries?.[0];
    if (!itin) return null;
    const airlines = (flight.airlines || []).map(a => airlineName(a)).join(', ');
    const stops = itin.stops === 0 ? 'Nonstop' : `${itin.stops} stop${itin.stops > 1 ? 's' : ''}`;

    return (
        <div className="flight-card">
            <div className="flight-card-header">
                <span className="flight-card-rank">#{index + 1}</span>
                <span className="flight-card-airline">{airlines}</span>
                <span className="flight-card-price">${flight.price} <span className="flight-card-currency">{flight.currency}</span></span>
            </div>
            <div className="flight-card-route">
                <div className="flight-card-endpoint">
                    <span className="flight-card-time">{formatTime(itin.departure_time)}</span>
                    <span className="flight-card-airport">{itin.departure_airport}</span>
                    <span className="flight-card-date">{formatDate(itin.departure_time)}</span>
                </div>
                <div className="flight-card-path">
                    <span className="flight-card-duration">{formatDuration(itin.duration)}</span>
                    <div className="flight-card-line">
                        <div className="flight-card-dot" />
                        <div className="flight-card-dash" />
                        {itin.stops > 0 && <div className="flight-card-stop-dot" />}
                        {itin.stops > 1 && <div className="flight-card-stop-dot" />}
                        <div className="flight-card-dash" />
                        <div className="flight-card-dot" />
                    </div>
                    <span className="flight-card-stops">{stops}</span>
                </div>
                <div className="flight-card-endpoint">
                    <span className="flight-card-time">{formatTime(itin.arrival_time)}</span>
                    <span className="flight-card-airport">{itin.arrival_airport}</span>
                    <span className="flight-card-date">{formatDate(itin.arrival_time)}</span>
                </div>
            </div>
            {flight.cabin && (
                <div className="flight-card-cabin">{flight.cabin}</div>
            )}
        </div>
    );
}

function HotelCard({ hotel, index }) {
    const stars = hotel.rating ? '★'.repeat(Number(hotel.rating)) : '';

    return (
        <div className="hotel-card">
            <div className="hotel-card-header">
                <span className="hotel-card-rank">#{index + 1}</span>
                <span className="hotel-card-name">{hotel.name}</span>
                {hotel.price_total && (
                    <span className="hotel-card-price">
                        ${hotel.price_total} <span className="hotel-card-currency">{hotel.price_currency}</span>
                    </span>
                )}
            </div>
            <div className="hotel-card-details">
                {stars && <span className="hotel-card-rating">{stars}</span>}
                {hotel.room_type && <span className="hotel-card-room">{hotel.room_type}</span>}
            </div>
            {hotel.room_description && (
                <p className="hotel-card-desc">{hotel.room_description}</p>
            )}
            {hotel.check_in && hotel.check_out && (
                <div className="hotel-card-dates">{hotel.check_in} → {hotel.check_out}</div>
            )}
        </div>
    );
}

function ActivityCard({ activity, index }) {
    return (
        <div className="activity-card">
            <div className="activity-card-header">
                <span className="activity-card-rank">#{index + 1}</span>
                <span className="activity-card-name">{activity.name}</span>
                {activity.price && (
                    <span className="activity-card-price">
                        ${activity.price} <span className="activity-card-currency">{activity.currency}</span>
                    </span>
                )}
            </div>
            {activity.description && (
                <p className="activity-card-desc">{activity.description}</p>
            )}
            {activity.rating && (
                <span className="activity-card-meta">Rating: {activity.rating}/5</span>
            )}
        </div>
    );
}

function ChatInterface() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [streamingMessage, setStreamingMessage] = useState(null);
    const [currentFrogSprite, setCurrentFrogSprite] = useState(Math.floor(Math.random() * FROG_SPRITES.length));
    const [sessionId] = useState(() => `session_${Date.now()}`);
    const messagesEndRef = useRef(null);
    const chatMessagesRef = useRef(null);

    const scrollToBottom = () => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        if (messages.length > 0 || streamingMessage) {
            scrollToBottom();
        }
    }, [messages, streamingMessage]);

    const handleFrogClick = () => {
        setCurrentFrogSprite(prev => (prev + 1) % FROG_SPRITES.length);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const messageToSend = input.trim();
        const userMessage = { role: 'user', content: messageToSend };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:5001/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: messageToSend,
                    session_id: sessionId,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                const fullResponse = data.message || '';
                const flights = data.flights || [];
                const hotels = data.hotels || [];
                const activities = data.activities || [];

                // Stream the text response
                setStreamingMessage({ role: 'assistant', content: '' });
                setCurrentFrogSprite(Math.floor(Math.random() * FROG_SPRITES.length));

                let currentIndex = 0;
                let spriteChangeCounter = 0;
                const streamInterval = setInterval(() => {
                    if (currentIndex < fullResponse.length) {
                        setStreamingMessage({
                            role: 'assistant',
                            content: fullResponse.substring(0, currentIndex + 1)
                        });
                        currentIndex++;

                        spriteChangeCounter++;
                        if (spriteChangeCounter >= Math.floor(Math.random() * 5) + 3) {
                            setCurrentFrogSprite(prev => {
                                let newIndex;
                                do {
                                    newIndex = Math.floor(Math.random() * FROG_SPRITES.length);
                                } while (newIndex === prev && FROG_SPRITES.length > 1);
                                return newIndex;
                            });
                            spriteChangeCounter = 0;
                        }
                    } else {
                        clearInterval(streamInterval);
                        setMessages(prev => [...prev, {
                            role: 'assistant',
                            content: fullResponse,
                            flights,
                            hotels,
                            activities,
                        }]);
                        setStreamingMessage(null);
                    }
                }, 20);
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `Error: ${data.error || data.message || 'Failed to get response'}`
                }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Error: ${error.message}`
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="chat-container">
            <div className="frog-character">
                <img
                    src={FROG_SPRITES[currentFrogSprite]}
                    alt="L1LY - Travel Assistant"
                    className="frog-sprite"
                    onClick={handleFrogClick}
                    style={{ cursor: 'pointer' }}
                />
            </div>
            <div className="chat-messages" ref={chatMessagesRef}>
                {messages.length === 0 && (
                    <div className="chat-empty">
                        <h3>Hi! I'm L1LY! Welcome to my LaunchPad!</h3>
                        <p>I'm your personal travel planning assistant. Tell me about your travel plans in natural language! For example:</p>
                        <ul className="example-list">
                            <li>"Plan a family vacation to somewhere sunny in mid-March for 2 adults and 2 teens from Portland. Budget $3,000."</li>
                            <li>"I want to fly from NYC to Paris for 5 days in April. Find me hotels and fun activities too."</li>
                            <li>"Find me a beach trip to Cancun next month for 2 people under $2,000 including activities."</li>
                        </ul>
                        <p className="helper-text">I can search for real flights, hotels, and activities to help plan your perfect trip!</p>
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div key={idx} className={`chat-message ${msg.role}`}>
                        <div className="message-content">
                            {msg.content}
                            {msg.flights?.length > 0 && (
                                <div className="result-section">
                                    <div className="result-section-title">Flights</div>
                                    <div className="flight-results">
                                        {msg.flights.map((f, i) => (
                                            <FlightCard key={i} flight={f} index={i} />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {msg.hotels?.length > 0 && (
                                <div className="result-section">
                                    <div className="result-section-title">Hotels</div>
                                    <div className="hotel-results">
                                        {msg.hotels.map((h, i) => (
                                            <HotelCard key={i} hotel={h} index={i} />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {msg.activities?.length > 0 && (
                                <div className="result-section">
                                    <div className="result-section-title">Activities</div>
                                    <div className="activity-results">
                                        {msg.activities.map((a, i) => (
                                            <ActivityCard key={i} activity={a} index={i} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {streamingMessage && (
                    <div className="chat-message assistant">
                        <div className="message-content">
                            {streamingMessage.content}
                            <span className="cursor-blink">|</span>
                        </div>
                    </div>
                )}
                {isLoading && !streamingMessage && (
                    <div className="chat-message assistant">
                        <div className="message-content">
                            <span className="typing-indicator">L1LY is thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <form className="chat-input-form" onSubmit={handleSubmit}>
                <input
                    type="text"
                    className="chat-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Describe your travel plans..."
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="chat-send-button"
                    disabled={isLoading || !input.trim()}
                >
                    Send
                </button>
            </form>
        </div>
    );
}

export default ChatInterface;
