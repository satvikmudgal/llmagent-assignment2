import './App.css'
import ChatInterface from './ChatInterface';
import lilypad1 from './assets/lilypad flowers/lily-pad-clipart-xl.png';
import lilypad2 from './assets/lilypad flowers/lily-pad-clipart-xl.png';

function App() {
  return (
    <div className="app">
      <header className="header">
        <div className="header-box">
          <h1 className="title">LaunchPad with L1ly</h1>
        </div>
      </header>

      <main className="main-content">
        <img src={lilypad1} alt="" className="lilypad-decoration lilypad-top-right" />
        <img src={lilypad2} alt="" className="lilypad-decoration lilypad-bottom-left" />
        <div className="card">
          <div className="card-header">
            <h2></h2>
          </div>
          <div className="card-body">
            <ChatInterface />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
