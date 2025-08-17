# api/generate-fractal.py - Your Python computation
import json
import numpy as np
import matplotlib.pyplot as plt
import io
import base64
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # Get request data
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        # Your fractal math here
        width, height = 400, 400
        iterations = data.get('iterations', 100)
        
        # Simple Mandelbrot set calculation
        def mandelbrot(c, max_iter):
            z = 0
            for n in range(max_iter):
                if abs(z) > 2:
                    return n
                z = z*z + c
            return max_iter
        
        # Generate fractal
        x = np.linspace(-2, 2, width)
        y = np.linspace(-2, 2, height)
        fractal = np.zeros((height, width))
        
        for i in range(height):
            for j in range(width):
                c = complex(x[j], y[i])
                fractal[i, j] = mandelbrot(c, iterations)
        
        # Convert to image
        plt.figure(figsize=(6, 6))
        plt.imshow(fractal, extent=[-2, 2, -2, 2], cmap='hot')
        plt.colorbar()
        
        # Save to base64
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png')
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        plt.close()
        
        # Return response
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        response = json.dumps({
            'image': image_base64,
            'iterations': iterations
        })
        
        self.wfile.write(response.encode())