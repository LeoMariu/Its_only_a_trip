class View2D {
  constructor(canvas, data) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.data = data;
    this.dragX = 0;
    this.dragY = 0;
    this.zoom = 1;
    this.isDragging = false;
    this.lastX = 0; 
    this.lastY = 0;
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastX = e.offsetX;
      this.lastY = e.offsetY; 
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this.dragX += e.offsetX - this.lastX;
        this.dragY += e.offsetY - this.lastY;
        this.lastX = e.offsetX;
        this.lastY = e.offsetY;
        this.render();
      }
    });

    this.canvas.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const scale = e.deltaY > 0 ? 0.9 : 1.1;
      this.zoom *= scale;
      this.zoom = Math.max(0.1, Math.min(5, this.zoom));
      this.render();
    });
  }

  drawAltitudeView() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Sort by altitude
    const sorted = [...this.data].sort((a, b) => a.altitude - b.altitude);
    const minAlt = Math.min(...sorted.map(d => d.altitude));
    const maxAlt = Math.max(...sorted.map(d => d.altitude));

    const padding = 50;
    const plotWidth = this.canvas.width - padding * 2;
    const plotHeight = this.canvas.height - padding * 2;

    this.ctx.save();
    this.ctx.translate(this.dragX + padding, this.dragY + padding);
    this.ctx.scale(this.zoom, this.zoom);

    // Draw axis
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#fff';
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(0, plotHeight);
    this.ctx.lineTo(plotWidth, plotHeight);
    this.ctx.stroke();

    // Plot points
    sorted.forEach((d, i) => {
      const x = (i / sorted.length) * plotWidth;
      const y = plotHeight - ((d.altitude - minAlt) / (maxAlt - minAlt)) * plotHeight;
      
      this.ctx.beginPath();
      this.ctx.fillStyle = 'rgba(255,255,255,0.7)';
      this.ctx.arc(x, y, 3, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.ctx.restore();
  }

  drawGPSView() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const lats = this.data.map(d => d.latitude);
    const longs = this.data.map(d => d.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLong = Math.min(...longs);
    const maxLong = Math.max(...longs);

    const padding = 50;
    const plotWidth = this.canvas.width - padding * 2;
    const plotHeight = this.canvas.height - padding * 2;

    this.ctx.save();
    this.ctx.translate(this.dragX + padding, this.dragY + padding);
    this.ctx.scale(this.zoom, this.zoom);

    // Draw points
    this.data.forEach(d => {
      const x = ((d.longitude - minLong) / (maxLong - minLong)) * plotWidth;
      const y = plotHeight - ((d.latitude - minLat) / (maxLat - minLat)) * plotHeight;

      this.ctx.beginPath();
      this.ctx.fillStyle = 'rgba(255,255,255,0.7)';
      this.ctx.arc(x, y, 3, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.ctx.restore();
  }

  render(mode = 'altitude') {
    if (mode === 'altitude') {
      this.drawAltitudeView();
    } else {
      this.drawGPSView();
    }
  }
}