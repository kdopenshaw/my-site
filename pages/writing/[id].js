// pages/writing/[id].js - Individual writing page
import { useRouter } from 'next/router'
import Navigation from '../../components/Navigation'
import { getAllWritingIds, getWritingData } from '../../lib/writings'

export default function WritingDetail({ writingData }) {
  const router = useRouter()
  
  // Debug logging
  console.log('Writing data:', writingData)
  console.log('Content HTML:', writingData?.contentHtml)

  if (router.isFallback) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
        <Navigation />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 120px)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ color: '#2c5282', marginBottom: '1rem' }}>Loading...</h1>
          </div>
        </div>
      </div>
    )
  }

  if (!writingData) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
        <Navigation />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 120px)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ color: '#2c5282', marginBottom: '1rem' }}>Writing Not Found</h1>
            <p style={{ color: '#4a5568' }}>The requested writing could not be found.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <Navigation />

      {/* Main Content */}
      <div style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '2rem 10%'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            <img 
              src={writingData.image} 
              alt={writingData.title}
              style={{
                width: '120px',
                height: '120px',
                objectFit: 'cover',
                borderRadius: '12px'
              }}
            />
            <div>
              <h1 style={{
                fontSize: '2.5rem',
                color: '#2c5282',
                marginBottom: '0.5rem',
                fontWeight: 'bold'
              }}>
                {writingData.title}
              </h1>
              <p style={{
                fontSize: '1.1rem',
                color: '#4a5568',
                marginBottom: '1rem'
              }}>
                {writingData.description}
              </p>
              <div style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '0.9rem',
                  color: '#718096',
                  backgroundColor: '#f7fafc',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px'
                }}>
                  {writingData.category} • {writingData.pages} pages
                </span>
                <span style={{
                  fontSize: '0.9rem',
                  color: '#718096'
                }}>
                  {writingData.year}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="card" style={{ padding: '2rem' }}>
          <div 
            style={{
              fontSize: '1.1rem',
              lineHeight: '1.8',
              color: '#2d3748'
            }}
            dangerouslySetInnerHTML={{ __html: writingData.contentHtml }}
          />
        </div>

        {/* Back Button */}
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <button 
            onClick={() => router.back()}
            style={{
              backgroundColor: '#2c5282',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#1a365d'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#2c5282'}
          >
            ← Back to Writings
          </button>
        </div>
      </div>
    </div>
  )
}

export async function getStaticPaths() {
  const paths = getAllWritingIds()
  return {
    paths,
    fallback: false
  }
}

export async function getStaticProps({ params }) {
  const writingData = await getWritingData(params.id)
  return {
    props: {
      writingData
    }
  }
} 