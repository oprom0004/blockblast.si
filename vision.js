/**
 * BLOCKBLAST.SI - Pure Frontend AI Canvas Screenshot Scanner
 * Parses 8x8 grid states from uploaded/pasted screenshots with zero backend latency.
 */

class BlockBlastVision {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
  }

  analyzeImage(imgElement) {
    return new Promise((resolve) => {
      const w = (this.canvas.width = imgElement.naturalWidth || imgElement.width);
      const h = (this.canvas.height = imgElement.naturalHeight || imgElement.height);
      this.ctx.drawImage(imgElement, 0, 0, w, h);

      // Crop center 70% of image where 8x8 board typically sits
      const startX = Math.floor(w * 0.1);
      const startY = Math.floor(h * 0.22);
      const boardWidth = Math.floor(w * 0.8);
      const boardHeight = Math.min(boardWidth, Math.floor(h * 0.52));

      const cellW = boardWidth / 8;
      const cellH = boardHeight / 8;

      const detectedGrid = Array.from({ length: 8 }, () => Array(8).fill(0));

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const sampleX = Math.floor(startX + c * cellW + cellW * 0.5);
          const sampleY = Math.floor(startY + r * cellH + cellH * 0.5);

          const pixel = this.ctx.getImageData(sampleX, sampleY, 1, 1).data;
          const [red, green, blue] = pixel;

          // Block Blast background is dark slate (#0c1322 / #111a2e).
          // Active blocks are bright vibrant jewels (yellow, red, blue, green, orange, cyan, purple).
          const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
          const isVibrantColor = (Math.max(red, green, blue) - Math.min(red, green, blue)) > 35;

          if (brightness > 60 && (isVibrantColor || brightness > 120)) {
            detectedGrid[r][c] = 1;
          }
        }
      }

      resolve(detectedGrid);
    });
  }
}

window.blockBlastVision = new BlockBlastVision();
