// pages/blacksmithing.js - Blacksmithing page
import Navigation from '../components/Navigation'

export default function Blacksmithing() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <Navigation />

      {/* Main Content */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0rem 10%',
        minHeight: 'calc(100vh - 120px)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: '3rem',
            color: '#2c5282',
            marginBottom: '2rem',
            fontWeight: 'bold'
          }}>
            Blacksmithing
          </h1>
          <p style={{
            fontSize: '1.2rem',
            color: '#4a5568',
            marginBottom: '1rem'
          }}>
            Content coming soon...
          </p>
        </div>
      </div>
    </div>
  )
} 