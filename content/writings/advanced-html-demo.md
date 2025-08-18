---
title: "Advanced HTML Demo"
description: "A comprehensive demonstration of HTML content with multiple interactive elements, PDF lightboxes, and custom styling."
image: "/julia_0.2841_notext.png"
year: "2024"
pages: "8"
category: "Demo"
contentType: "html"
---

# Advanced HTML Demo

This page demonstrates various HTML capabilities within the writing system.

## Multiple PDF Documents

You can embed multiple PDF documents with different lightbox configurations:

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin: 2rem 0;">
  <div style="text-align: center;">
    <button 
      onclick="openPDFLightbox('/sample-pdf.pdf', 'Document 1')"
      style="
        background-color: #2c5282;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 6px;
        cursor: pointer;
        width: 100%;
        transition: background-color 0.2s ease;
      "
      onmouseenter="this.style.backgroundColor='#1a365d'"
      onmouseleave="this.style.backgroundColor='#2c5282'"
    >
      📄 Research Paper
    </button>
  </div>
  
  <div style="text-align: center;">
    <button 
      onclick="openPDFLightbox('/sample-pdf.pdf', 'Document 2')"
      style="
        background-color: #48bb78;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 6px;
        cursor: pointer;
        width: 100%;
        transition: background-color 0.2s ease;
      "
      onmouseenter="this.style.backgroundColor='#38a169'"
      onmouseleave="this.style.backgroundColor='#48bb78'"
    >
      📊 Technical Report
    </button>
  </div>
  
  <div style="text-align: center;">
    <button 
      onclick="openPDFLightbox('/sample-pdf.pdf', 'Document 3')"
      style="
        background-color: #ed8936;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 6px;
        cursor: pointer;
        width: 100%;
        transition: background-color 0.2s ease;
      "
      onmouseenter="this.style.backgroundColor='#dd6b20'"
      onmouseleave="this.style.backgroundColor='#ed8936'"
    >
      📋 Case Study
    </button>
  </div>
</div>

## Interactive Data Visualization

You can also include interactive charts and visualizations:

<div style="
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 2rem;
  margin: 2rem 0;
  color: white;
">
  <h3 style="margin-bottom: 1rem; color: white;">Interactive Chart Demo</h3>
  <div style="display: flex; justify-content: space-around; margin: 1rem 0;">
    <div style="text-align: center;">
      <div style="
        width: 60px;
        height: 60px;
        background-color: rgba(255,255,255,0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 0.5rem;
        font-size: 1.5rem;
      ">📈</div>
      <div>Data Point 1</div>
    </div>
    <div style="text-align: center;">
      <div style="
        width: 60px;
        height: 60px;
        background-color: rgba(255,255,255,0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 0.5rem;
        font-size: 1.5rem;
      ">📊</div>
      <div>Data Point 2</div>
    </div>
    <div style="text-align: center;">
      <div style="
        width: 60px;
        height: 60px;
        background-color: rgba(255,255,255,0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 0.5rem;
        font-size: 1.5rem;
      ">🎯</div>
      <div>Data Point 3</div>
    </div>
  </div>
</div>

## Custom Form Elements

You can even include interactive forms:

<div style="
  background-color: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 2rem 0;
">
  <h3 style="margin-bottom: 1rem; color: #2c5282;">Feedback Form</h3>
  <form onsubmit="handleFormSubmit(event)">
    <div style="margin-bottom: 1rem;">
      <label style="display: block; margin-bottom: 0.5rem; color: #4a5568;">Name:</label>
      <input 
        type="text" 
        id="name" 
        style="
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          font-size: 1rem;
        "
      />
    </div>
    <div style="margin-bottom: 1rem;">
      <label style="display: block; margin-bottom: 0.5rem; color: #4a5568;">Rating:</label>
      <select 
        id="rating"
        style="
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          font-size: 1rem;
        "
      >
        <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
        <option value="4">⭐⭐⭐⭐ Very Good</option>
        <option value="3">⭐⭐⭐ Good</option>
        <option value="2">⭐⭐ Fair</option>
        <option value="1">⭐ Poor</option>
      </select>
    </div>
    <button 
      type="submit"
      style="
        background-color: #2c5282;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 1rem;
      "
    >
      Submit Feedback
    </button>
  </form>
</div>

## Code Blocks with Syntax Highlighting

You can include code examples with custom styling:

<div style="
  background-color: #1a202c;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 2rem 0;
  overflow-x: auto;
">
  <pre style="color: #e2e8f0; margin: 0; font-family: 'Monaco', 'Menlo', monospace;"><code>// Example JavaScript for PDF Lightbox
function openPDFLightbox(pdfUrl, title = 'Document') {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  const pdfViewer = document.createElement('iframe');
  pdfViewer.src = pdfUrl;
  pdfViewer.style.cssText = `
    width: 90%;
    height: 90%;
    border: none;
    border-radius: 8px;
    background-color: white;
  `;
  
  overlay.appendChild(pdfViewer);
  document.body.appendChild(overlay);
}</code></pre>
</div>

<script>
// Enhanced PDF lightbox function
function openPDFLightbox(pdfUrl, title = 'Document') {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  const container = document.createElement('div');
  container.style.cssText = `
    position: relative;
    width: 90%;
    height: 90%;
    background-color: white;
    border-radius: 8px;
    overflow: hidden;
  `;
  
  const header = document.createElement('div');
  header.style.cssText = `
    background-color: #2c5282;
    color: white;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  header.innerHTML = `<h3 style="margin: 0;">${title}</h3>`;
  
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '✕';
  closeBtn.style.cssText = `
    background: none;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  const pdfViewer = document.createElement('iframe');
  pdfViewer.src = pdfUrl;
  pdfViewer.style.cssText = `
    width: 100%;
    height: calc(100% - 60px);
    border: none;
  `;
  
  closeBtn.onclick = () => {
    document.body.removeChild(overlay);
  };
  
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  };
  
  header.appendChild(closeBtn);
  container.appendChild(header);
  container.appendChild(pdfViewer);
  overlay.appendChild(container);
  document.body.appendChild(overlay);
}

// Form submission handler
function handleFormSubmit(event) {
  event.preventDefault();
  const name = document.getElementById('name').value;
  const rating = document.getElementById('rating').value;
  
  alert(`Thank you for your feedback, ${name}! You rated this ${rating} stars.`);
  
  // Reset form
  event.target.reset();
}
</script> 