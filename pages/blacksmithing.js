import { useEffect, useState } from 'react';
import Head from 'next/head';
import fs from 'fs';
import path from 'path';
import { useGLightbox } from '../hooks/useGLightbox';
import Navigation from '../components/Navigation';

export default function BlacksmithingPage({ initialImages, initialFeatures }) {
  
  // galleries: stores our image galleries (starts as empty array [])
  const [galleries, setGalleries] = useState([]);
  const [features, setFeatures] = useState({});

  useGLightbox();

  useEffect(() => {
    // Process Gallery Images using configuration
    setGalleries(initialImages);

    // Process features as before
    const featuresData = {};
    initialFeatures.forEach(feature => {
      featuresData[feature.id] = {
        ...feature,
        currentIndex: 0
      };
    });
    setFeatures(featuresData);
    
  }, [initialImages, initialFeatures]);

  const navigateFeature = (featureId, direction) => {
    const feature = features[featureId];
    if (!feature) return;
    
    const images = feature.data.images;
    const currentIndex = feature.currentIndex;
    let newIndex;
    
    if (typeof direction === 'number') {
      newIndex = direction;
    } else if (direction === 'prev') {
      newIndex = (currentIndex - 1 + images.length) % images.length;
    } else {
      newIndex = (currentIndex + 1) % images.length;
    }
    
    setFeatures(prev => ({
      ...prev,
      [featureId]: {
        ...prev[featureId],
        currentIndex: newIndex
      }
    }));
  };

  return (
    <>
      <Navigation />
      
      <Head>
        <title>Blacksmith Portfolio</title>
        <meta name="description" content="Professional blacksmith work showcasing swords, axes, and custom metalwork" />
      </Head>

      <main className="blacksmith-page">
        <h1>Blacksmith Work</h1>
        
        {/* Show sword feature if it exists */}
        {features.sword && (
          <FeatureSection 
            featureId="sword"
            featureData={features.sword}
            onNavigate={navigateFeature}
          />
        )}
        
        {/* Show first gallery (images from config) */}
        <GallerySection images={galleries[0]} />
        
        {/* Show axe feature between galleries if desired */}
        {features.axe && (
          <FeatureSection 
            featureId="axe"
            featureData={features.axe}
            onNavigate={navigateFeature}
          />
        )}
        
        {/* Show second gallery */}
        <GallerySection images={galleries[1]} />
        
        {/* Show third gallery */}
        <GallerySection images={galleries[2]} />

      </main>
    </>
  );
}

// Updated FeatureSection component (same as before)
function FeatureSection({ featureId, featureData, onNavigate }) {
  const { data, currentIndex } = featureData;
  
  if (!data || !data.images || data.images.length === 0) {
    return null;
  }
  
  const currentImage = data.images[currentIndex];

  return (
    <section className="featured-section">
      <div className="feature-content">
        <div className="feature-box">
          <a 
            href={currentImage.src}
            className="glightbox"
            data-gallery={`feature-${featureId}`}
            data-title={currentImage.heading}
            data-description={currentImage.description}
          >
            <img 
              src={currentImage.src}
              alt={currentImage.alt}
            />
          </a>
          
          {data.images.map((image, index) => {
            if (index !== currentIndex) {
              return (
                <a
                  key={index}
                  href={image.src}
                  className="glightbox"
                  data-gallery={`feature-${featureId}`}
                  data-title={image.heading}
                  data-description={image.description}
                  style={{ display: 'none' }}
                >
                </a>
              );
            }
            return null;
          })}
          
          <button 
            className="nav-arrow prev"
            onClick={() => onNavigate(featureId, 'prev')}
            aria-label="Previous image"
          >
            ‹
          </button>
          
          <button 
            className="nav-arrow next"
            onClick={() => onNavigate(featureId, 'next')}
            aria-label="Next image"
          >
            ›
          </button>
          
          <div className="feature-dots">
            {data.images.map((image, index) => (
              <button
                key={index}
                className={`dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => onNavigate(featureId, index)}
                aria-label={`Show image ${index + 1}`}
              />
            ))}
          </div>
        </div>
        
        <div className="feature-text">
          <h2 className='feature-title'>{data.title}</h2>
          <h3>{currentImage.heading}</h3>
          <p>{currentImage.description}</p>
        </div>
      </div>
    </section>
  );
}

// Updated GallerySection component (back to original)
function GallerySection({ images }) {
  if (!images || images.length === 0) return null;

  return (
    <section className="gallery-wrap">
      <div className="gallery">
        {images.map((image, index) => {
          const caption = image.caption || image.name?.replace(/\.[a-z]+$/i, '').replace(/[_-]+/g, ' ');
          return (
            <a
              key={index}
              href={image.url}
              className="glightbox"
              data-gallery="blacksmith"
              data-caption={caption}
            >
              <img
                src={image.url}
                alt={caption}
                loading="lazy"
                decoding="async"
                sizes="(max-width: 520px) 100vw,
                       (max-width: 840px) 50vw,
                       (max-width: 1100px) 33vw,
                       25vw"
                srcSet={`${image.url} 800w`}
              />
            </a>
          );
        })}
      </div>
    </section>
  );
}

// Updated getStaticProps to load gallery configuration
export async function getStaticProps() {
  try {
    const publicDir = path.join(process.cwd(), 'public/blacksmithing');
    
    // --- Load Gallery Images from Folders ---
    let galleries = [];
    
    // Look for gallery folders in /galleries/ subdirectory
    const galleriesDir = path.join(publicDir, 'galleries');
    const galleryFolders = ['gallery1', 'gallery2', 'gallery3', 'gallery4', 'gallery5'];
    
    if (fs.existsSync(galleriesDir)) {
      for (const folderName of galleryFolders) {
        const galleryDir = path.join(galleriesDir, folderName);
        
        if (fs.existsSync(galleryDir)) {
          // Read all image files from this gallery folder
          const imageFiles = fs.readdirSync(galleryDir)
            .filter(file => file.match(/\.(jpg|jpeg|png|gif)$/i))
            .sort() // Alphabetical order within each gallery
            .map(filename => ({
              name: filename,
              url: `/blacksmithing/galleries/${folderName}/${filename}`
            }));
          
          // Only add non-empty galleries
          if (imageFiles.length > 0) {
            galleries.push(imageFiles);
          }
        }
      }
    }
    
    // Fallback: if no gallery folders exist, use the old method with /images folder
    if (galleries.length === 0) {
      const imagesDir = path.join(publicDir, 'images');
      if (fs.existsSync(imagesDir)) {
        const imageFiles = fs.readdirSync(imagesDir)
          .filter(file => file.match(/\.(jpg|jpeg|png|gif)$/i))
          .sort()
          .map(filename => ({
            name: filename,
            url: `/blacksmithing/images/${filename}`
          }));
        
        // Split into galleries of 8 images each
        const gallerySections = [];
        for (let i = 0; i < imageFiles.length; i += 8) {
          gallerySections.push(imageFiles.slice(i, i + 8));
        }
        galleries = gallerySections;
      }
    }

    // --- Load Features (same as before) ---
    let features = [];
    const featuresDir = path.join(publicDir, 'features');
    const featureIds = ['sword', 'axe'];

    if (fs.existsSync(featuresDir)) {
      for (const featureId of featureIds) {
        const featureDir = path.join(featuresDir, featureId);
        
        if (fs.existsSync(featureDir)) {
          try {
            const jsonPath = path.join(featureDir, 'images.json');
            if (fs.existsSync(jsonPath)) {
              const imageData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
              features.push({
                id: featureId,
                data: imageData
              });
            }
          } catch (error) {
            console.error(`Error reading feature ${featureId}:`, error);
          }
        }
      }
    }

    return {
      props: {
        initialImages: galleries,
        initialFeatures: features
      },
      revalidate: 3600
    };
    
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    return {
      props: {
        initialImages: [],
        initialFeatures: []
      }
    };
  }
}