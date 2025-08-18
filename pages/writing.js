// pages/writing.js - Writing and Works page
import Link from 'next/link'

export default function Writing() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      {/* Navigation Bar */}
      <nav className="nav">
        {/* Logo */}
        <div className="nav-logo">
          <img src="/logo.png" alt="logo" style={{ width: '60px', height: '60px' }} />
        </div>
        
        {/* Navigation Links */}
        <div className="nav-links">
          <Link href="/" className="nav-link">
            Home
          </Link>
          <div style={{ position: 'relative' }}>
            <span className="nav-link active" style={{ cursor: 'pointer' }}>
              Research & Writing ▼
            </span>
          </div>
          <Link href="/blacksmithing" className="nav-link">
            Blacksmithing
          </Link>
          <Link href="/fractals" className="nav-link">
            Fractal Generator
          </Link>
          <div className="search-icon">
            🔍
          </div>
        </div>
      </nav>

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
            Research & Writing
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