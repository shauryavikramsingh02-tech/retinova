// RetinaScan AI - Interactive Retinal Fundus Canvas Engine

export class RetinalCanvas {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.options = options;

    // Image & Transformation state
    this.image = null;
    this.imageUrl = '';
    this.scale = 1.0;
    this.minScale = 0.5;
    this.maxScale = 4.0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;

    // Filters
    this.brightness = 0; // -50 to 50
    this.contrast = 0;   // -50 to 50
    this.redFree = false; // Green-channel optical filter

    // Biomarker overlay state
    this.biomarkers = [];
    this.activeBiomarkerTypes = {
      microaneurysm: true,
      hard_exudate: true,
      hemorrhage: true,
      cotton_wool: true,
      neovascularization: true
    };
    this.showEtdrsGrid = false;
    this.heatmapOpacity = 0.65; // 0.0 to 1.0
    this.showHeatmap = true;
    this.selectedFinding = null;

    this.initEvents();
  }

  initEvents() {
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    window.addEventListener('mouseup', () => this.handleMouseUp());
    this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });

    // Touch support for tablets and touch displays
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', () => this.handleMouseUp());

    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Internal resolution
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.render();
  }

  loadImage(url, biomarkers = []) {
    this.imageUrl = url;
    this.biomarkers = biomarkers;
    this.image = new Image();
    this.image.crossOrigin = 'anonymous';
    this.image.onload = () => {
      this.resetTransform();
      this.resize();
    };
    this.image.src = url;
  }

  resetTransform() {
    if (!this.image || !this.canvas.parentElement) return;
    const parent = this.canvas.parentElement.getBoundingClientRect();
    const w = parent.width || 600;
    const h = parent.height || 500;

    const scaleX = w / this.image.width;
    const scaleY = h / this.image.height;
    this.scale = Math.min(scaleX, scaleY) * 0.95;
    this.offsetX = (w - this.image.width * this.scale) / 2;
    this.offsetY = (h - this.image.height * this.scale) / 2;
    this.selectedFinding = null;
    this.render();
  }

  zoom(factor) {
    const parent = this.canvas.parentElement.getBoundingClientRect();
    const cx = parent.width / 2;
    const cy = parent.height / 2;

    const newScale = Math.min(Math.max(this.scale * factor, this.minScale), this.maxScale);
    this.offsetX = cx - (cx - this.offsetX) * (newScale / this.scale);
    this.offsetY = cy - (cy - this.offsetY) * (newScale / this.scale);
    this.scale = newScale;
    this.render();
  }

  focusOnLocation(x, y) {
    const parent = this.canvas.parentElement.getBoundingClientRect();
    const cx = parent.width / 2;
    const cy = parent.height / 2;
    this.scale = 2.2;
    this.offsetX = cx - x * this.scale;
    this.offsetY = cy - y * this.scale;
    this.render();
  }

  setFilters({ brightness = 0, contrast = 0, redFree = false }) {
    this.brightness = brightness;
    this.contrast = contrast;
    this.redFree = redFree;
    this.render();
  }

  setHeatmapOpacity(val) {
    this.heatmapOpacity = Math.max(0, Math.min(1, val));
    this.render();
  }

  toggleBiomarker(type, active) {
    this.activeBiomarkerTypes[type] = active;
    this.render();
  }

  toggleEtdrsGrid(active) {
    this.showEtdrsGrid = active;
    this.render();
  }

  handleMouseDown(e) {
    this.isDragging = true;
    this.dragStartX = e.clientX - this.offsetX;
    this.dragStartY = e.clientY - this.offsetY;
  }

  handleMouseMove(e) {
    if (!this.isDragging) return;
    this.offsetX = e.clientX - this.dragStartX;
    this.offsetY = e.clientY - this.dragStartY;
    this.render();
  }

  handleMouseUp() {
    this.isDragging = false;
  }

  handleTouchStart(e) {
    if (e.touches.length === 1) {
      e.preventDefault();
      this.isDragging = true;
      this.dragStartX = e.touches[0].clientX - this.offsetX;
      this.dragStartY = e.touches[0].clientY - this.offsetY;
    }
  }

  handleTouchMove(e) {
    if (!this.isDragging || e.touches.length !== 1) return;
    e.preventDefault();
    this.offsetX = e.touches[0].clientX - this.dragStartX;
    this.offsetY = e.touches[0].clientY - this.dragStartY;
    this.render();
  }

  handleWheel(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const newScale = Math.min(Math.max(this.scale * zoomFactor, this.minScale), this.maxScale);
    this.offsetX = mx - (mx - this.offsetX) * (newScale / this.scale);
    this.offsetY = my - (my - this.offsetY) * (newScale / this.scale);
    this.scale = newScale;
    this.render();
  }

  render() {
    const ctx = this.ctx;
    const parent = this.canvas.parentElement ? this.canvas.parentElement.getBoundingClientRect() : { width: 800, height: 600 };
    const w = parent.width;
    const h = parent.height;

    // Clear background
    ctx.save();
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, w, h);

    if (!this.image) {
      ctx.fillStyle = '#64748B';
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Ingesting High-Resolution Fundus Matrix...', w / 2, h / 2);
      ctx.restore();
      return;
    }

    // Apply Filter Matrix
    let filterString = `brightness(${100 + this.brightness}%) contrast(${100 + this.contrast}%)`;
    if (this.redFree) {
      // Monochromatic Green-Channel Optical Filter simulation
      filterString += ' saturate(0%) hue-rotate(90deg) contrast(140%) brightness(110%)';
    }
    ctx.filter = filterString;

    // Draw Fundus Image with Pan & Zoom transform
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);
    ctx.drawImage(this.image, 0, 0);

    // Reset filter for vector overlays
    ctx.filter = 'none';

    // Draw Heatmap Overlay if active
    if (this.showHeatmap && this.heatmapOpacity > 0.02) {
      this.drawHeatmap(ctx);
    }

    // Draw ETDRS Macular Grid Overlay
    if (this.showEtdrsGrid) {
      this.drawEtdrsGrid(ctx);
    }

    // Draw Biomarker Annotations
    this.drawBiomarkers(ctx);

    ctx.restore();
  }

  drawHeatmap(ctx) {
    ctx.save();
    ctx.globalAlpha = this.heatmapOpacity;
    ctx.globalCompositeOperation = 'screen';

    // Collect all biomarker locations
    for (const group of this.biomarkers) {
      if (!this.activeBiomarkerTypes[group.type]) continue;
      for (const loc of group.locations) {
        const rad = loc.r * 5;
        const grad = ctx.createRadialGradient(loc.x, loc.y, 2, loc.x, loc.y, rad);
        if (group.type === 'microaneurysm' || group.type === 'hemorrhage') {
          grad.addColorStop(0, 'rgba(239, 68, 68, 0.9)');
          grad.addColorStop(0.5, 'rgba(249, 115, 22, 0.5)');
          grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        } else if (group.type === 'hard_exudate') {
          grad.addColorStop(0, 'rgba(234, 179, 8, 0.9)');
          grad.addColorStop(0.6, 'rgba(245, 158, 11, 0.4)');
          grad.addColorStop(1, 'rgba(234, 179, 8, 0)');
        } else {
          grad.addColorStop(0, 'rgba(13, 148, 136, 0.8)');
          grad.addColorStop(1, 'rgba(13, 148, 136, 0)');
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(loc.x, loc.y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawEtdrsGrid(ctx) {
    ctx.save();
    // Center of Macula (approximately pixel 440, 310 on standard 800x600 fundus)
    const cx = 440;
    const cy = 310;
    ctx.strokeStyle = '#06B6D4';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    // Central foveal zone (1mm ~ 35px), Inner ring (3mm ~ 105px), Outer ring (6mm ~ 210px)
    const rings = [35, 105, 210];
    rings.forEach((r, idx) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(6, 182, 212, 0.85)';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(idx === 0 ? 'Fovea (1mm)' : idx === 1 ? 'Inner (3mm)' : 'Outer (6mm)', cx + r + 4, cy);
    });

    // Quadrant crosshairs
    ctx.beginPath();
    ctx.moveTo(cx - 210, cy);
    ctx.lineTo(cx + 210, cy);
    ctx.moveTo(cx, cy - 210);
    ctx.lineTo(cx, cy + 210);
    ctx.stroke();

    ctx.restore();
  }

  drawBiomarkers(ctx) {
    ctx.save();

    for (const group of this.biomarkers) {
      if (!this.activeBiomarkerTypes[group.type]) continue;

      for (const loc of group.locations) {
        const isSelected = this.selectedFinding && this.selectedFinding.label === loc.label;
        
        ctx.strokeStyle = group.color;
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.fillStyle = group.color + '22'; // 14% transparent fill

        // Draw bounding target circle
        ctx.beginPath();
        ctx.arc(loc.x, loc.y, loc.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Corner crosshair ticks
        const tick = 4;
        ctx.beginPath();
        ctx.moveTo(loc.x - loc.r - tick, loc.y);
        ctx.lineTo(loc.x - loc.r, loc.y);
        ctx.moveTo(loc.x + loc.r, loc.y);
        ctx.lineTo(loc.x + loc.r + tick, loc.y);
        ctx.moveTo(loc.x, loc.y - loc.r - tick);
        ctx.lineTo(loc.x, loc.y - loc.r);
        ctx.moveTo(loc.x, loc.y + loc.r);
        ctx.lineTo(loc.x, loc.y + loc.r + tick);
        ctx.stroke();

        // Label pill
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(loc.x + loc.r + 4, loc.y - 8, 38, 16);
        ctx.strokeStyle = group.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(loc.x + loc.r + 4, loc.y - 8, 38, 16);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.fillText(loc.label, loc.x + loc.r + 8, loc.y + 4);
      }
    }

    ctx.restore();
  }
}
