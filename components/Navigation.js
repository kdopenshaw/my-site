// components/Navigation.js - Reusable navigation component
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Navigation() {
  const router = useRouter()
  
  // Helper function to check if a link is active
  const isActive = (path) => {
    if (path === '/') {
      return router.pathname === '/'
    }
    return router.pathname === path
  }

  return (
    <nav className="nav">
      {/* Logo */}
      <div className="nav-logo">
        <img src="/logo.png" alt="logo" style={{ width: '60px', height: '60px' }} />
      </div>
      
      {/* Navigation Links */}
      <div className="nav-links">
        <Link href="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
          Home
        </Link>
        <div style={{ position: 'relative' }}>
          <Link href="/writing" className={`nav-link ${isActive('/writing') ? 'active' : ''}`}>
            Research & Writing
          </Link>
        </div>
        <Link href="/blacksmithing" className={`nav-link ${isActive('/blacksmithing') ? 'active' : ''}`}>
          Blacksmithing
        </Link>
        <Link href="/fractals" className={`nav-link ${isActive('/fractals') ? 'active' : ''}`}>
          Fractal Generator
        </Link>
        <div className="search-icon">
          🔍
        </div>
      </div>
    </nav>
  )
} 