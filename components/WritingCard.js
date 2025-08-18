// components/WritingCard.js - Reusable writing card component
import Link from 'next/link'

export default function WritingCard({ 
  id, 
  title, 
  description, 
  image, 
  year, 
  pages, 
  category 
}) {
  return (
    <Link href={`/writing/${id}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ 
        cursor: 'pointer', 
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)'
      }}>
        {/* Image */}
        <div style={{
          height: '200px',
          overflow: 'hidden',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px'
        }}>
          <img 
            src={image} 
            alt={title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>
        
        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          <h3 style={{
            fontSize: '1.25rem',
            color: '#2c5282',
            marginBottom: '0.5rem',
            fontWeight: '600'
          }}>
            {title}
          </h3>
          <p style={{
            fontSize: '0.9rem',
            color: '#4a5568',
            marginBottom: '1rem',
            lineHeight: '1.5'
          }}>
            {description}
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{
              fontSize: '0.8rem',
              color: '#718096',
              backgroundColor: '#f7fafc',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px'
            }}>
              {category} • {pages} pages
            </span>
            <span style={{
              fontSize: '0.8rem',
              color: '#718096'
            }}>
              {year}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
} 