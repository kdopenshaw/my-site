---
title: "HTML Example with PDF Lightbox"
description: "A demonstration of how to embed HTML content with PDF lightboxes in the writing system."
image: "/julia_0.2841_notext.png"
year: "2024"
pages: "5"
category: "Demo"
contentType: "html"
---

# HTML Example with PDF Lightbox

This is a demonstration of how to embed HTML content with PDF lightboxes in the writing system.

## PDF Document

Below is a PDF document embedded in a lightbox:

<div style="text-align: center; margin: 2rem 0;">
  <button 
    onclick="openPDFLightbox('/sample-pdf.pdf')"
    style="
      background-color: #2c5282;
      color: white;
      border: none;
      padding: 1rem 2rem;
      border-radius: 8px;
      font-size: 1.1rem;
      cursor: pointer;
      transition: background-color 0.2s ease;
    "
    onmouseenter="this.style.backgroundColor='#1a365d'"
    onmouseleave="this.style.backgroundColor='#2c5282'"
  >
    📄 View PDF Document
  </button>
</div>

## Interactive Elements

You can also include other interactive HTML elements:

<div style="
  background-color: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 2rem 0;
">
  <h3 style="margin-bottom: 1rem; color: #2c5282;">Interactive Demo</h3>
  <p>This is an example of custom HTML styling within the markdown content.</p>
  <button 
    onclick="alert('Hello from HTML!')"
    style="
      background-color: #48bb78;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 1rem;
    "
  >
    Click Me!
  </button>
</div>

## Code Example

Here's how you can embed a PDF lightbox:

```html
<div style="text-align: center;">
  <button onclick="openPDFLightbox('/path/to/your.pdf')">
    📄 View PDF
  </button>
</div>
```

<script>
function openPDFLightbox(pdfUrl) {
  // Create lightbox overlay
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
  
  // Create PDF viewer
  const pdfViewer = document.createElement('iframe');
  pdfViewer.src = pdfUrl;
  pdfViewer.style.cssText = `
    width: 90%;
    height: 90%;
    border: none;
    border-radius: 8px;
    background-color: white;
  `;
  
  // Create close button
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '✕';
  closeBtn.style.cssText = `
    position: absolute;
    top: 20px;
    right: 20px;
    background-color: white;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    font-size: 20px;
    cursor: pointer;
    z-index: 1001;
  `;
  
  closeBtn.onclick = () => {
    document.body.removeChild(overlay);
  };
  
  // Close on overlay click
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  };
  
  overlay.appendChild(pdfViewer);
  overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);
}
</script> 