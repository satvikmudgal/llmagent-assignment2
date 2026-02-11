import './App.css'
import ChatInterface from './ChatInterface';

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1 className="title">WanderL1ly</h1>
        <p className="subtitle">Your AI Travel Planning Assistant</p>
      </header>

      <main className="main-content">
        <div className="card">
          <div className="card-header">
            <h2>Chat with L1LY</h2>
          </div>
          <div className="card-body">
            <ChatInterface />
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>WanderL1ly - Your Personal Travel Planning Assistant</p>
      </footer>
    </div>
  )
}

export default App
