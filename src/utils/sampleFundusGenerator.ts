/**
 * Procedural HTML5 Canvas Retinal Fundus Generator
 * Generates synthetic, clinically realistic high-resolution retinal fundus photographs
 * with realistic choroidal background, optic disc & cup, vascular arcades, fovea,
 * and pathology lesions (microaneurysms, hard exudates, cotton wool spots, neovascularization).
 */

export type DRStage = 'normal' | 'mild' | 'moderate' | 'severe' | 'pdr';
export type EyeLaterality = 'OD' | 'OS';

export interface GeneratedFundusResult {
  dataUrl: string;
  stage: DRStage;
  eye: EyeLaterality;
  lesionCount: {
    microaneurysms: number;
    hardExudates: number;
    hemorrhages: number;
    cottonWoolSpots: number;
    neovascularFronds: number;
  };
}

export function generateSyntheticFundus(
  stage: DRStage = 'normal',
  eye: EyeLaterality = 'OD',
  canvasWidth: number = 768,
  canvasHeight: number = 768
): GeneratedFundusResult {
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not supported');
  }

  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;
  const radius = Math.min(canvasWidth, canvasHeight) * 0.46;

  // Track lesion counts for metadata
  const lesionCount = {
    microaneurysms: 0,
    hardExudates: 0,
    hemorrhages: 0,
    cottonWoolSpots: 0,
    neovascularFronds: 0,
  };

  // 1. Black outer background (aperture mask)
  ctx.fillStyle = '#060A0F';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Clip to circular fundus aperture
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();

  // 2. Deep orange-red retinal background with choroidal radial gradient
  const bgGrad = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius);
  bgGrad.addColorStop(0, '#C24D1E');   // Bright warm red-orange center
  bgGrad.addColorStop(0.35, '#A63813'); // Mid retina
  bgGrad.addColorStop(0.75, '#82240A'); // Deep retinal pigment epithelium
  bgGrad.addColorStop(0.95, '#561404'); // Peripheral choroid
  bgGrad.addColorStop(1, '#2E0901');    // Ora serrata edge
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 3. Subtle choroidal texture / vascular tessellation
  ctx.save();
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 400; i++) {
    const rx = cx + (Math.random() - 0.5) * radius * 1.9;
    const ry = cy + (Math.random() - 0.5) * radius * 1.9;
    const rDist = Math.hypot(rx - cx, ry - cy);
    if (rDist < radius) {
      ctx.fillStyle = Math.random() > 0.5 ? '#FF8C42' : '#3D0A02';
      ctx.beginPath();
      ctx.ellipse(
        rx,
        ry,
        Math.random() * 14 + 4,
        Math.random() * 6 + 2,
        Math.random() * Math.PI,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
  ctx.restore();

  // 4. Optic Disc & Cup Coordinates
  // In OD (Right Eye): Disc is Nasal (Left in photograph, ~32% X). Macula is Temporal (~58% X).
  // In OS (Left Eye): Disc is Nasal (Right in photograph, ~68% X). Macula is Temporal (~42% X).
  const isOD = eye === 'OD';
  const discX = isOD ? cx - radius * 0.42 : cx + radius * 0.42;
  const discY = cy + (Math.random() - 0.5) * 20;
  const discRadius = radius * 0.17;

  const maculaX = isOD ? cx + radius * 0.22 : cx - radius * 0.22;
  const maculaY = cy + 10;
  const maculaRadius = radius * 0.18;

  // 5. Render Macula & Fovea Avascular Zone (FAZ)
  // Darker pigmented circular region temporally
  const maculaGrad = ctx.createRadialGradient(maculaX, maculaY, 2, maculaX, maculaY, maculaRadius);
  maculaGrad.addColorStop(0, '#3A0D04');    // Deep foveal pit
  maculaGrad.addColorStop(0.3, '#571607');  // Fovea
  maculaGrad.addColorStop(0.7, '#752009');  // Parafovea
  maculaGrad.addColorStop(1, 'transparent'); // Blend out
  ctx.fillStyle = maculaGrad;
  ctx.beginPath();
  ctx.arc(maculaX, maculaY, maculaRadius, 0, Math.PI * 2);
  ctx.fill();

  // Foveal reflex (tiny central glint in healthy/mild)
  if (stage === 'normal' || stage === 'mild') {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 235, 200, 0.45)';
    ctx.beginPath();
    ctx.arc(maculaX, maculaY, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 6. Render Optic Disc & Physiological Cup
  // Bright yellowish-pink circular/oval region
  const discGrad = ctx.createRadialGradient(discX, discY, discRadius * 0.2, discX, discY, discRadius);
  discGrad.addColorStop(0, '#FFF5C2');    // Internal pale cup
  discGrad.addColorStop(0.5, '#FCE49C');  // Cup margin
  discGrad.addColorStop(0.85, '#E6A862'); // Disc rim (neuroretinal rim)
  discGrad.addColorStop(1, '#B85820');    // Outer margin with choroidal halo
  ctx.fillStyle = discGrad;
  ctx.beginPath();
  ctx.arc(discX, discY, discRadius, 0, Math.PI * 2);
  ctx.fill();

  // Physiological optic cup (central paler depression, CDR ~0.38)
  const cupRadius = discRadius * 0.42;
  const cupGrad = ctx.createRadialGradient(discX, discY, 1, discX, discY, cupRadius);
  cupGrad.addColorStop(0, '#FFFFEE');
  cupGrad.addColorStop(1, 'rgba(252, 228, 156, 0.3)');
  ctx.fillStyle = cupGrad;
  ctx.beginPath();
  ctx.arc(discX, discY, cupRadius, 0, Math.PI * 2);
  ctx.fill();

  // 7. Retinal Vascular Tree (Arterioles and Venules)
  // Major superior & inferior temporal and nasal arcades branching out from optic cup
  const drawVesselArcade = (
    startX: number,
    startY: number,
    ctrl1X: number,
    ctrl1Y: number,
    ctrl2X: number,
    ctrl2Y: number,
    endX: number,
    endY: number,
    color: string,
    width: number
  ) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, endX, endY);
    ctx.stroke();

    // Branchlets
    for (let t = 0.25; t <= 0.85; t += 0.2) {
      // Point on bezier curve
      const bx = (1 - t) ** 3 * startX + 3 * (1 - t) ** 2 * t * ctrl1X + 3 * (1 - t) * t ** 2 * ctrl2X + t ** 3 * endX;
      const by = (1 - t) ** 3 * startY + 3 * (1 - t) ** 2 * t * ctrl1Y + 3 * (1 - t) * t ** 2 * ctrl2Y + t ** 3 * endY;
      
      const angle = Math.atan2(endY - startY, endX - startX) + (Math.random() > 0.5 ? 0.6 : -0.6);
      const branchLen = width * 14 * Math.random() + 20;

      ctx.lineWidth = width * 0.55;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(
        bx + Math.cos(angle) * branchLen * 0.5 + (Math.random() - 0.5) * 8,
        by + Math.sin(angle) * branchLen * 0.5 + (Math.random() - 0.5) * 8,
        bx + Math.cos(angle) * branchLen,
        by + Math.sin(angle) * branchLen
      );
      ctx.stroke();
    }
    ctx.restore();
  };

  const xDir = isOD ? 1 : -1;

  // Colors: Venules are thicker & darker crimson/wine red; Arterioles are thinner & brighter red
  const venuleColor = '#500505';
  const venuleMidColor = '#720808';
  const arterioleColor = '#A31818';
  const arterioleBright = '#BA2323';

  // Superior Temporal Arcade (Venule + Arteriole)
  drawVesselArcade(
    discX, discY,
    discX + xDir * radius * 0.2, discY - radius * 0.5,
    maculaX + xDir * radius * 0.05, cy - radius * 0.65,
    maculaX + xDir * radius * 0.45, cy - radius * 0.45,
    venuleColor,
    5.2
  );
  drawVesselArcade(
    discX, discY,
    discX + xDir * radius * 0.22, discY - radius * 0.46,
    maculaX + xDir * radius * 0.08, cy - radius * 0.6,
    maculaX + xDir * radius * 0.48, cy - radius * 0.4,
    arterioleColor,
    3.2
  );

  // Inferior Temporal Arcade (Venule + Arteriole)
  drawVesselArcade(
    discX, discY,
    discX + xDir * radius * 0.2, discY + radius * 0.5,
    maculaX + xDir * radius * 0.05, cy + radius * 0.65,
    maculaX + xDir * radius * 0.45, cy + radius * 0.45,
    venuleMidColor,
    5.0
  );
  drawVesselArcade(
    discX, discY,
    discX + xDir * radius * 0.22, discY + radius * 0.46,
    maculaX + xDir * radius * 0.08, cy + radius * 0.6,
    maculaX + xDir * radius * 0.48, cy + radius * 0.4,
    arterioleBright,
    3.0
  );

  // Superior Nasal Arcade (Heading to nasal periphery)
  drawVesselArcade(
    discX, discY,
    discX - xDir * radius * 0.15, discY - radius * 0.35,
    discX - xDir * radius * 0.3, cy - radius * 0.55,
    discX - xDir * radius * 0.42, cy - radius * 0.45,
    venuleColor,
    3.8
  );
  drawVesselArcade(
    discX, discY,
    discX - xDir * radius * 0.12, discY - radius * 0.32,
    discX - xDir * radius * 0.28, cy - radius * 0.52,
    discX - xDir * radius * 0.4, cy - radius * 0.42,
    arterioleColor,
    2.4
  );

  // Inferior Nasal Arcade
  drawVesselArcade(
    discX, discY,
    discX - xDir * radius * 0.15, discY + radius * 0.35,
    discX - xDir * radius * 0.3, cy + radius * 0.55,
    discX - xDir * radius * 0.42, cy + radius * 0.45,
    venuleMidColor,
    3.6
  );
  drawVesselArcade(
    discX, discY,
    discX - xDir * radius * 0.12, discY + radius * 0.32,
    discX - xDir * radius * 0.28, cy + radius * 0.52,
    discX - xDir * radius * 0.4, cy + radius * 0.42,
    arterioleBright,
    2.2
  );

  // Small macular feeder arterioles arching towards macula without crossing FAZ
  ctx.save();
  ctx.strokeStyle = arterioleColor;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(discX + xDir * discRadius * 0.7, discY - 5);
  ctx.quadraticCurveTo(
    discX + xDir * (radius * 0.16), discY - 12,
    maculaX - xDir * (maculaRadius * 0.7), maculaY - 15
  );
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(discX + xDir * discRadius * 0.7, discY + 6);
  ctx.quadraticCurveTo(
    discX + xDir * (radius * 0.16), discY + 14,
    maculaX - xDir * (maculaRadius * 0.7), maculaY + 15
  );
  ctx.stroke();
  ctx.restore();

  // 8. PATHOLOGY LESION SYNTHESIS ACCORDING TO REQUESTED DR STAGE
  // Helper for pseudo-random placement near macular and arcade zones
  const getLesionCoords = (zone: 'macula' | 'arcade' | 'periphery') => {
    let lx = 0;
    let ly = 0;
    if (zone === 'macula') {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * maculaRadius * 1.5 + maculaRadius * 0.4;
      lx = maculaX + Math.cos(angle) * dist;
      ly = maculaY + Math.sin(angle) * dist;
    } else if (zone === 'arcade') {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius * 0.5 + radius * 0.2;
      lx = cx + Math.cos(angle) * dist;
      ly = cy + Math.sin(angle) * dist;
    } else {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius * 0.8 + radius * 0.1;
      lx = cx + Math.cos(angle) * dist;
      ly = cy + Math.sin(angle) * dist;
    }
    return { lx, ly };
  };

  // Helper: Draw microaneurysm (tiny dark red pinpoint dots)
  const drawMicroaneurysm = (x: number, y: number) => {
    ctx.save();
    ctx.fillStyle = '#400202';
    ctx.beginPath();
    ctx.arc(x, y, Math.random() * 1.6 + 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    lesionCount.microaneurysms++;
  };

  // Helper: Draw hard lipid exudates (bright yellowish glistening speckles)
  const drawHardExudateCluster = (x: number, y: number, count: number = 8) => {
    ctx.save();
    for (let i = 0; i < count; i++) {
      const ox = x + (Math.random() - 0.5) * 22;
      const oy = y + (Math.random() - 0.5) * 22;
      const exGrad = ctx.createRadialGradient(ox, oy, 0.5, ox, oy, Math.random() * 2.5 + 1.5);
      exGrad.addColorStop(0, '#FFFFD0');
      exGrad.addColorStop(0.7, '#F7D046');
      exGrad.addColorStop(1, 'rgba(212, 160, 23, 0)');
      ctx.fillStyle = exGrad;
      ctx.beginPath();
      ctx.arc(ox, oy, Math.random() * 2.8 + 1.2, 0, Math.PI * 2);
      ctx.fill();
      lesionCount.hardExudates++;
    }
    ctx.restore();
  };

  // Helper: Draw flame hemorrhage / blot hemorrhage
  const drawHemorrhage = (x: number, y: number, type: 'dot_blot' | 'flame' | 'preretinal') => {
    ctx.save();
    ctx.fillStyle = '#480303';
    if (type === 'dot_blot') {
      ctx.beginPath();
      ctx.ellipse(x, y, Math.random() * 4 + 3, Math.random() * 3 + 2, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'flame') {
      ctx.beginPath();
      ctx.ellipse(x, y, Math.random() * 12 + 6, Math.random() * 3 + 2, Math.random() * 0.8 + 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Boat-shaped preretinal hemorrhage
      ctx.fillStyle = '#360202';
      ctx.beginPath();
      ctx.ellipse(x, y, 22, 10, 0, 0, Math.PI);
      ctx.lineTo(x - 22, y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    lesionCount.hemorrhages++;
  };

  // Helper: Cotton wool spot (fluffy white/cream microinfarct)
  const drawCottonWoolSpot = (x: number, y: number) => {
    ctx.save();
    const cwsGrad = ctx.createRadialGradient(x, y, 2, x, y, Math.random() * 9 + 7);
    cwsGrad.addColorStop(0, 'rgba(255, 252, 235, 0.85)');
    cwsGrad.addColorStop(0.5, 'rgba(240, 230, 205, 0.55)');
    cwsGrad.addColorStop(1, 'rgba(220, 200, 175, 0)');
    ctx.fillStyle = cwsGrad;
    ctx.beginPath();
    ctx.ellipse(x, y, 12, 8, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    lesionCount.cottonWoolSpots++;
  };

  // Helper: Neovascularization fronds (fine disorganized tangled vessels)
  const drawNeovascularFronds = (x: number, y: number) => {
    ctx.save();
    ctx.strokeStyle = '#8E0D0D';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      const angle = (i / 7) * Math.PI * 2 + Math.random() * 0.4;
      const len = Math.random() * 20 + 12;
      ctx.quadraticCurveTo(
        x + Math.cos(angle) * (len * 0.5) + (Math.random() - 0.5) * 6,
        y + Math.sin(angle) * (len * 0.5) + (Math.random() - 0.5) * 6,
        x + Math.cos(angle) * len,
        y + Math.sin(angle) * len
      );
      ctx.stroke();
    }
    ctx.restore();
    lesionCount.neovascularFronds++;
  };

  // Synthesize lesions based on clinical stage:
  if (stage === 'mild') {
    // Stage 1: Mild NPDR — isolated microaneurysms only
    for (let i = 0; i < 12; i++) {
      const { lx, ly } = getLesionCoords('macula');
      drawMicroaneurysm(lx, ly);
    }
    for (let i = 0; i < 6; i++) {
      const { lx, ly } = getLesionCoords('arcade');
      drawMicroaneurysm(lx, ly);
    }
  } else if (stage === 'moderate') {
    // Stage 2: Moderate NPDR — microaneurysms + hard exudate circinate rings + blot hemorrhages
    for (let i = 0; i < 24; i++) {
      const { lx, ly } = getLesionCoords('macula');
      drawMicroaneurysm(lx, ly);
    }
    // Hard exudate clusters around macula
    for (let i = 0; i < 6; i++) {
      const { lx, ly } = getLesionCoords('macula');
      drawHardExudateCluster(lx, ly, 10);
    }
    // Blot hemorrhages
    for (let i = 0; i < 8; i++) {
      const { lx, ly } = getLesionCoords('arcade');
      drawHemorrhage(lx, ly, 'dot_blot');
    }
  } else if (stage === 'severe') {
    // Stage 3: Severe NPDR — 4-2-1 rule lesions (blot hemorrhages in all 4 quadrants, cotton wool spots, venous beading)
    for (let i = 0; i < 35; i++) {
      const { lx, ly } = getLesionCoords('arcade');
      drawMicroaneurysm(lx, ly);
    }
    for (let i = 0; i < 18; i++) {
      const { lx, ly } = getLesionCoords('periphery');
      drawHemorrhage(lx, ly, Math.random() > 0.5 ? 'flame' : 'dot_blot');
    }
    for (let i = 0; i < 7; i++) {
      const { lx, ly } = getLesionCoords('arcade');
      drawCottonWoolSpot(lx, ly);
    }
    for (let i = 0; i < 8; i++) {
      const { lx, ly } = getLesionCoords('macula');
      drawHardExudateCluster(lx, ly, 14);
    }
  } else if (stage === 'pdr') {
    // Stage 4: Proliferative DR — Neovascularization, severe hemorrhages, preretinal bleed, exudate plaques
    for (let i = 0; i < 40; i++) {
      const { lx, ly } = getLesionCoords('periphery');
      drawHemorrhage(lx, ly, 'flame');
    }
    // Neovascularization at disc (NVD) and elsewhere (NVE)
    drawNeovascularFronds(discX, discY - discRadius * 0.7);
    drawNeovascularFronds(discX + xDir * discRadius * 0.8, discY + 10);
    drawNeovascularFronds(maculaX + xDir * 40, cy - radius * 0.4);
    drawNeovascularFronds(maculaX - xDir * 30, cy + radius * 0.35);

    // Preretinal boat hemorrhage
    drawHemorrhage(maculaX + xDir * 25, maculaY + 50, 'preretinal');

    // Cotton wool spots & heavy exudates
    for (let i = 0; i < 8; i++) {
      const { lx, ly } = getLesionCoords('arcade');
      drawCottonWoolSpot(lx, ly);
    }
    for (let i = 0; i < 10; i++) {
      const { lx, ly } = getLesionCoords('macula');
      drawHardExudateCluster(lx, ly, 16);
    }
  }

  // 9. Soft Edge Vignetting / Camera Aperture Glow
  const vignetteGrad = ctx.createRadialGradient(cx, cy, radius * 0.88, cx, cy, radius);
  vignetteGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignetteGrad.addColorStop(0.7, 'rgba(10, 2, 0, 0.55)');
  vignetteGrad.addColorStop(1, 'rgba(0, 0, 0, 0.98)');
  ctx.fillStyle = vignetteGrad;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.restore(); // Restore clip

  // 10. Outer aperture clean mask border
  ctx.save();
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Export high quality JPEG base64
  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

  return {
    dataUrl,
    stage,
    eye,
    lesionCount,
  };
}
