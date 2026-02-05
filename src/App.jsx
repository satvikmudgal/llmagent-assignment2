import { useState } from 'react'
import './App.css'
import TripForm from './TripForm';

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">you tripping bro?</h1>
        <p className="subtitle">dont have a bad trip maaaan </p>
      </header>

      <main className="main-content">
        <div className="card">
          <div className="card-header">
            <h2>Trip Form</h2>
          </div>
          <div className="card-body">
            <TripForm />
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>whatcha reading this for nerd</p>
      </footer>
    </div>
  )
}

export default App
