const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

// Generate a 192x192 icon from the 512x512 icon
async function generateIcon() {
  try {
    console.log('Generating 192x192 icon from 512x512 icon...');
    
    // Load the source image
    const image = await loadImage('./public/icons/icon-512x512.png');
    
    // Create a canvas with the target dimensions
    const canvas = createCanvas(192, 192);
    const ctx = canvas.getContext('2d');
    
    // Draw the image resized to 192x192
    ctx.drawImage(image, 0, 0, 192, 192);
    
    // Save the resized image
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync('./public/icons/icon-192x192.png', buffer);
    
    console.log('✅ Successfully generated icon-192x192.png');
  } catch (error) {
    console.error('Error generating icon:', error);
  }
}

// Run the function
generateIcon();
