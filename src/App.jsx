import './App.css'
import ChatInterface from './ChatInterface';

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1 className="title">Travel Assistant</h1>
        <p className="subtitle">Ask me anything about travel planning</p>
      </header>

      <main className="main-content">
        <div className="card">
          <div className="card-header">
            <h2>Chat</h2>
          </div>
          <div className="card-body">
            <ChatInterface />
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>Powered by DSPy</p>
      </footer>
    </div>
  )
}

export default App
