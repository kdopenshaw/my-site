// pages/index.js - Your main portfolio page with inline styles (working version)
import Link from 'next/link'

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      {/* Navigation Bar */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 2rem',
        backgroundColor: 'white',
        borderBottom: '1px solid #e0e0e0'
      }}>
        {/* Logo */}
        <div style={{ color: '#4A90E2', fontSize: '1.5rem', fontWeight: 'bold' }}>
          <img src="/logo.png" alt="logo" style={{ width: '60px', height: '60px' }} />
        </div>
        
        {/* Navigation Links */}
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <Link href="/" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>
            Home
          </Link>
          <div style={{ position: 'relative' }}>
            <span style={{ color: '#333', fontWeight: '500', cursor: 'pointer' }}>
              Research & Writing ▼
            </span>
          </div>
          <Link href="/blacksmithing" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>
            Blacksmithing
          </Link>
          <Link href="/fractals" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>
            Fractal Generator
          </Link>
          <div style={{ color: '#333', fontSize: '1.2rem', cursor: 'pointer' }}>
            🔍
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0rem 14%'
      }}>
        {/* Left Content */}
        <div style={{ flex: 1, minWidth: '50%', padding: '0rem 1rem' }}>
          <h1 style={{
            fontSize: '3.5rem',
            color: '#2c5282',
            marginBottom: '1rem',
            fontWeight: 'bold'
          }}>
            Hi, I'm Keith!
          </h1>
          
          <p style={{
            fontSize: '1.2rem',
            color: '#4a5568',
            marginBottom: '1rem',
            lineHeight: '1.6'
          }}>
            I have a lot of interests.
          </p>
          
          <p style={{
            fontSize: '1.1rem',
            color: '#4a5568',
            marginBottom: '1rem',
            lineHeight: '1.6'
          }}>
            Some of them are on this site. Check it out!
          </p>
          
          {/* LinkedIn Button */}
          <a href="https://linkedin.com/in/yourprofile"><img src="/linkedin.png" alt="linkedin" style={{ width: '30px', height: '30px' }} />
          </a>
        </div>

        {/* Right Content - Fractal Background */}
        <div style={{ flex: 1, padding: '0rem 1rem' }}>
          <img src="/julia_0.2841_notext.png" alt="fractal" style={{ width: '100%', height: '100%' }} />
        </div>
      </div>
    </div>
  )
}