import { useState, useRef, useEffect } from 'react';
import './ChatInterface.css';
import frog1 from './assets/frog/frog1.jpg';
import frog2 from './assets/frog/frog2.jpg';
import frog3 from './assets/frog/frog3.jpg';
import frog4 from './assets/frog/frog4.jpg';

const FROG_SPRITES = [frog1, frog2, frog3, frog4];

function ChatInterface() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [streamingMessage, setStreamingMessage] = useState(null);
    const [currentFrogSprite, setCurrentFrogSprite] = useState(Math.floor(Math.random() * FROG_SPRITES.length));
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleFrogClick = () => {
        // Cycle to the next sprite
        setCurrentFrogSprite(prev => (prev + 1) % FROG_SPRITES.length);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const messageToSend = input.trim(); // Capture the input before clearing
        const userMessage = { role: 'user', content: messageToSend };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:5001/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: messageToSend,
                    history: messages  // Send conversation history for context
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Stream the response character by character
                const fullResponse = data.response;
                setStreamingMessage({ role: 'assistant', content: '' });
                // Start with a random sprite
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

                        // Semi-randomly change sprite every 3-8 characters
                        spriteChangeCounter++;
                        if (spriteChangeCounter >= Math.floor(Math.random() * 5) + 3) {
                            setCurrentFrogSprite(prev => {
                                // Randomly pick a different sprite
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
                            content: fullResponse
                        }]);
                        setStreamingMessage(null);
                    }
                }, 20); // Adjust speed: lower = faster
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `Error: ${data.error || 'Failed to get response'}`
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
            {/* Frog character at top of chat - always visible */}
            <div className="frog-character">
                <img
                    src={FROG_SPRITES[currentFrogSprite]}
                    alt="L1LY - Travel Assistant"
                    className="frog-sprite"
                    onClick={handleFrogClick}
                    style={{ cursor: 'pointer' }}
                />
            </div>
            <div className="chat-messages">
                {messages.length === 0 && (
                    <div className="chat-empty">
                        <h3>Welcome! I'm L1LY, your travel planning assistant.</h3>
                        <p>Tell me about your travel plans in natural language! For example:</p>
                        <ul className="example-list">
                            <li>"I want to go to Paris for 5 days in March"</li>
                            <li>"Plan a beach vacation to Hawaii with a $2000 budget"</li>
                            <li>"I'm looking for a mountain hiking destination for next summer"</li>
                        </ul>
                        <p className="helper-text">Just describe what you're looking for, and I'll help you plan your perfect trip!</p>
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div key={idx} className={`chat-message ${msg.role}`}>
                        <div className="message-content">
                            {msg.content}
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
                    placeholder="Describe your travel plans in natural language..."
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

