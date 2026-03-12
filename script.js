// ====== DOM ELEMENTS ======
// Navigation
const navBtns = document.querySelectorAll('.nav-btn');
const viewSections = document.querySelectorAll('.view-section');

// Globals
let currentView = 'home';
let userScore = 0;
let unlockedLevels = {1: false, 2: false, 3: false}; // true means completed

// Quick Links
document.getElementById('btn-go-training').addEventListener('click', () => switchView('training'));
document.getElementById('btn-go-arena').addEventListener('click', () => switchView('arena'));

// ====== SPA ROUTING ======
function switchView(viewId) {
    if (isAnimating && currentView === 'arena') return; // Don't switch during animation
    
    currentView = viewId;
    
    // Update Sidebar Nav
    navBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-view') === viewId) {
            btn.classList.add('active');
        }
    });
    
    // Hide all views, show targeted view
    viewSections.forEach(sec => sec.classList.add('hidden'));
    document.getElementById(`view-${viewId}`).classList.remove('hidden');
    
    if (viewId === 'arena') {
        resizeArena();
        loadArenaLevel(currentArenaLevel);
    } else if (viewId === 'training') {
        initTrainingSim();
    } else if (viewId === 'leaderboard') {
        updateLeaderboardUI();
    }
}

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        switchView(btn.getAttribute('data-view'));
    });
});

// ====== TRAINING SIMULATION ======
const tCanvas = document.getElementById('trainingCanvas');
let tCtx = null;
if (tCanvas) tCtx = tCanvas.getContext('2d');
let tIsDragging = false;
let tVector = { x: 4, y: -3 }; // Initial vector (Origin is center)
const tScale = 30; // px per unit

function initTrainingSim() {
    if (!tCanvas) return;
    tCanvas.width = 600;
    tCanvas.height = 300;
    
    tCanvas.addEventListener('mousedown', tOnPointerDown);
    tCanvas.addEventListener('mousemove', tOnPointerMove);
    tCanvas.addEventListener('mouseup', tOnPointerUp);
    tCanvas.addEventListener('mouseleave', tOnPointerUp);
    
    // touch support
    tCanvas.addEventListener('touchstart', (e)=> { e.preventDefault(); tOnPointerDown(e.touches[0]); }, {passive: false});
    tCanvas.addEventListener('touchmove', (e)=> { e.preventDefault(); tOnPointerMove(e.touches[0]); }, {passive: false});
    tCanvas.addEventListener('touchend', tOnPointerUp);
    
    drawTraining();
}

function getPosT(e) {
    const rect = tCanvas.getBoundingClientRect();
    const sfX = tCanvas.width / rect.width;
    const sfY = tCanvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * sfX,
        y: (e.clientY - rect.top) * sfY
    };
}

function tOnPointerDown(e) {
    tIsDragging = true;
    tOnPointerMove(e);
}
function tOnPointerMove(e) {
    if (!tIsDragging) return;
    const pos = getPosT(e);
    const originX = 100;
    const originY = tCanvas.height / 2;
    
    tVector.x = (pos.x - originX) / tScale;
    tVector.y = -(pos.y - originY) / tScale; // Invert Y
    
    // Limit vector length
    if (tVector.x < 0) tVector.x = 0; 
    if (tVector.x > 15) tVector.x = 15;
    if (tVector.y > 4) tVector.y = 4;
    if (tVector.y < -4) tVector.y = -4;
    
    drawTraining();
}
function tOnPointerUp() {
    tIsDragging = false;
}

function drawTraining() {
    tCtx.clearRect(0,0, tCanvas.width, tCanvas.height);
    const originX = 100;
    const originY = tCanvas.height / 2;
    
    // Grid
    tCtx.strokeStyle = 'rgba(255,255,255,0.1)';
    tCtx.lineWidth = 1;
    tCtx.beginPath();
    for(let i=0; i<tCanvas.width; i+=tScale) { tCtx.moveTo(i,0); tCtx.lineTo(i,tCanvas.height); }
    for(let i=0; i<tCanvas.height; i+=tScale) { tCtx.moveTo(0,i); tCtx.lineTo(tCanvas.width,i); }
    tCtx.stroke();
    
    // Axis
    tCtx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
    tCtx.beginPath();
    tCtx.moveTo(originX, 0); tCtx.lineTo(originX, tCanvas.height);
    tCtx.moveTo(0, originY); tCtx.lineTo(tCanvas.width, originY);
    tCtx.stroke();
    
    const endX = originX + (tVector.x * tScale);
    const endY = originY - (tVector.y * tScale);
    
    // Arrow
    drawArrow(tCtx, originX, originY, endX, endY, '#ff0844', 3);
    
    // Ship
    tCtx.save();
    tCtx.translate(endX, endY);
    tCtx.rotate(Math.atan2(-tVector.y, tVector.x));
    tCtx.fillStyle = '#fff';
    tCtx.beginPath();
    tCtx.moveTo(15, 0); tCtx.lineTo(-10, 10); tCtx.lineTo(-5, 0); tCtx.lineTo(-10, -10);
    tCtx.closePath();
    tCtx.fill();
    tCtx.restore();
    
    // Update labels
    const mag = Math.sqrt(tVector.x*tVector.x + tVector.y*tVector.y).toFixed(2);
    document.getElementById('train-vec-val').textContent = `${tVector.x.toFixed(1)}i ${tVector.y >=0 ? '+':''} ${tVector.y.toFixed(1)}j`;
    document.getElementById('train-mag-val').textContent = mag;
}

function drawArrow(context, fromX, fromY, toX, toY, color = '#00f2fe', width = 2, label = '') {
    const headlen = 10;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = width;
    context.beginPath();
    context.moveTo(fromX, fromY);
    context.lineTo(toX, toY);
    context.stroke();
    
    context.beginPath();
    context.moveTo(toX, toY);
    context.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    context.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    context.closePath();
    context.fill();

    if (label) {
        context.font = '14px "Inter"';
        const midX = fromX + dx/2;
        const midY = fromY + dy/2;
        context.fillText(label, midX + 10, midY - 10);
    }
}


// ====== ARENA (MAIN SIMULATION) ======
const canvas = document.getElementById('spaceCanvas');
const ctx = canvas.getContext('2d');
const hudCoords = document.getElementById('hud-coords');

let width, height, centerX, centerY;
let currentArenaLevel = 1;
let isAnimating = false;

const ship = { x: 0, y: 0, angle: 0, path: [], radius: 12 };

const levels = {
    1: {
        startX: 0, startY: 0,
        targetX: 5, targetY: 12,
        tolerance: 0.5,
        desc: "Kapal berada di asalan (0,0). Angkasawan terkandas di koordinat (5, 12). Kira jarak (magnitud) menggunakan formula \\(\\sqrt{x^2 + y^2}\\) untuk merancang misi berlepas.",
        scaleFactor: 15
    },
    2: {
        startX: -6, startY: -4,
        targetX: 4, targetY: 5,
        initialVector: { x: 2, y: 3 },
        asteroid: { x: 0, y: 5, radius: 1.5 },
        tolerance: 0.5,
        desc: "Vektor awal kapal angkasa \\(\\mathbf{u} = 2\\mathbf{i} + 3\\mathbf{j}\\). Terdapat asteroid di laluan. Cari vektor \\(\\mathbf{v}\\) supaya kapal menukar arah ke titik selamat.",
        scaleFactor: 30
    },
    3: {
        startX: -8, startY: 0,
        targetX: 8, targetY: 0,
        stormVector: { x: 0, y: -4 },
        tolerance: 0.5,
        desc: "Daya luaran (arus ruang angkasa) menolak ke bawah. Gunakan Hukum Segi Empat Selari untuk melukis vektor kemudi paduan yang akan melawan arus tersebut dan membawa kapal ke stesen.",
        scaleFactor: 18
    }
};

const lvlBtns = document.querySelectorAll('.lvl-btn');
const controlPanels = document.querySelectorAll('.level-control');
const missionText = document.getElementById('mission-text');
const arenaBriefing = document.getElementById('arena-briefing');
const startBtn = document.getElementById('start-btn');
const eduPanel = document.getElementById('edu-panel');

const resultModal = document.getElementById('result-modal');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const modalScore = document.getElementById('modal-score');
const modalBtn = document.getElementById('modal-btn');

function resizeArena() {
    if (currentView !== 'arena') return;
    const container = canvas.parentElement;
    width = container.clientWidth;
    height = container.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    centerX = width / 2;
    centerY = height / 2;
    draw();
}
window.addEventListener('resize', resizeArena);

lvlBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (isAnimating) return;
        const level = parseInt(btn.getAttribute('data-level'));
        loadArenaLevel(level);
    });
});

startBtn.addEventListener('click', () => {
    eduPanel.classList.add('hidden');
    arenaBriefing.classList.remove('hidden');
    draw();
});

modalBtn.addEventListener('click', () => {
    resultModal.classList.add('hidden');
    if (modalTitle.className === 'success-text' && currentArenaLevel < 3) {
        loadArenaLevel(currentArenaLevel + 1);
    } else if (modalTitle.className === 'success-text' && currentArenaLevel === 3) {
        switchView('leaderboard');
    } else {
        resetShip();
    }
});

function loadArenaLevel(level) {
    currentArenaLevel = level;
    isAnimating = false;

    lvlBtns.forEach(b => {
        b.classList.remove('active');
        if (parseInt(b.getAttribute('data-level')) === level) b.classList.add('active');
    });

    controlPanels.forEach(p => p.classList.remove('active'));
    document.getElementById(`control-l${level}`).classList.add('active');

    missionText.textContent = levels[level].desc;
    resetShip();
}

function resetShip() {
    isAnimating = false;
    ship.x = levels[currentArenaLevel].startX;
    ship.y = levels[currentArenaLevel].startY;
    ship.path = [];
    if(window.MathJax) { MathJax.typesetPromise(); }
    draw();
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const sf = levels[currentArenaLevel].scaleFactor;
    ctx.beginPath();
    for(let x = centerX % sf; x < width; x += sf) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
    for(let y = centerY % sf; y < height; y += sf) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 242, 254, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height);
    ctx.moveTo(0, centerY); ctx.lineTo(width, centerY);
    ctx.stroke();
}

function drawSpacecraft() {
    const sf = levels[currentArenaLevel].scaleFactor;
    const screenX = centerX + ship.x * sf;
    const screenY = centerY - ship.y * sf;
    
    if (ship.path.length > 0) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(centerX + ship.path[0].x * sf, centerY - ship.path[0].y * sf);
        for(let i=1; i<ship.path.length; i++) ctx.lineTo(centerX + ship.path[i].x * sf, centerY - ship.path[i].y * sf);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(ship.angle);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(15, 0); ctx.lineTo(-10, 10); ctx.lineTo(-5, 0); ctx.lineTo(-10, -10);
    ctx.closePath();
    ctx.fill();
    
    if (isAnimating) {
        ctx.fillStyle = '#ff0844';
        ctx.shadowColor = '#ff0844';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(-8, 0, 4 + Math.random()*2, 0, Math.PI*2);
        ctx.fill();
    }
    ctx.restore();
}

function drawTargets() {
    const sf = levels[currentArenaLevel].scaleFactor;
    const lvl = levels[currentArenaLevel];
    const tx = centerX + lvl.targetX * sf;
    const ty = centerY - lvl.targetY * sf;

    if (currentArenaLevel === 1) { 
        const pulse = Math.sin(Date.now() / 200) * 3;
        ctx.fillStyle = '#ff8800';
        ctx.beginPath(); ctx.arc(tx, ty - 5, 4, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#ff8800'; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(tx, ty - 1); ctx.lineTo(tx, ty + 6);
        ctx.moveTo(tx - 5, ty + 2); ctx.lineTo(tx + 5, ty + 2);
        ctx.moveTo(tx, ty + 6); ctx.lineTo(tx - 3, ty + 12);
        ctx.moveTo(tx, ty + 6); ctx.lineTo(tx + 3, ty + 12);
        ctx.stroke();
        ctx.fillStyle = 'white'; ctx.font = '12px "Orbitron"';
        ctx.fillText('SOS', tx - 12, ty - 15 + pulse);
    } else { 
        ctx.strokeStyle = '#00f2fe'; ctx.lineWidth = 2;
        const pulse = Math.sin(Date.now() / 200) * 5;
        ctx.beginPath(); ctx.arc(tx, ty, lvl.tolerance * sf + pulse, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(0, 242, 254, 0.2)'; ctx.fill();
        ctx.beginPath();
        ctx.moveTo(tx - 10, ty); ctx.lineTo(tx + 10, ty);
        ctx.moveTo(tx, ty - 10); ctx.lineTo(tx, ty + 10);
        ctx.stroke();
    }
}

function drawObstacles() {
    if (currentArenaLevel !== 2) return;
    const sf = levels[2].scaleFactor;
    const ast = levels[2].asteroid;
    const ax = centerX + ast.x * sf;
    const ay = centerY - ast.y * sf;
    const r = ast.radius * sf;
    
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath();
    for(let i=0; i<Math.PI*2; i+=0.5) {
        const noise = Math.random() * (0.2 * sf) - (0.1 * sf);
        const x = ax + (r + noise) * Math.cos(i);
        const y = ay + (r + noise) * Math.sin(i);
        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function drawPreview() {
    const sf = levels[currentArenaLevel].scaleFactor;
    const sx = centerX + ship.x * sf;
    const sy = centerY - ship.y * sf;

    if (currentArenaLevel === 1) {
        const tx = centerX + levels[1].targetX * sf;
        const ty = centerY - levels[1].targetY * sf;
        ctx.strokeStyle = '#94a3b8'; ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(tx, ty); ctx.stroke();
        ctx.setLineDash([]);
        
        const distVal = document.getElementById('distance-input').value;
        if (distVal > 0) {
            const angle = Math.atan2(levels[1].targetY, levels[1].targetX);
            const previewX = Math.cos(angle) * distVal;
            const previewY = Math.sin(angle) * distVal;
            drawArrow(ctx, sx, sy, sx + previewX * sf, sy - previewY * sf, '#00f2fe', 3, `|v| = ${distVal}`);
        }
    }
    else if (currentArenaLevel === 2) {
        const u = levels[2].initialVector;
        drawArrow(ctx, sx, sy, sx + u.x * sf, sy - u.y * sf, '#ff0844', 3, 'u (Awal)');
        const vx = parseFloat(document.getElementById('l2-i-input').value) || 0;
        const vy = parseFloat(document.getElementById('l2-j-input').value) || 0;
        if (vx !== 0 || vy !== 0) {
            const uEndX = sx + u.x * sf;
            const uEndY = sy - u.y * sf;
            drawArrow(ctx, uEndX, uEndY, uEndX + vx * sf, uEndY - vy * sf, '#00f2fe', 3, 'v (Tujahan)');
            drawArrow(ctx, sx, sy, sx + (u.x + vx) * sf, sy - (u.y + vy) * sf, '#00b09b', 4, 'Laluan');
        }
    }
    else if (currentArenaLevel === 3) {
        const storm = levels[3].stormVector;
        drawArrow(ctx, sx, sy, sx + storm.x * sf, sy - storm.y * sf, '#ff0844', 3, 'Ribut (F_env)');
        const tx = parseFloat(document.getElementById('l3-i-input').value) || 0;
        const ty = parseFloat(document.getElementById('l3-j-input').value) || 0;
        if (tx !== 0 || ty !== 0) {
            drawArrow(ctx, sx, sy, sx + tx * sf, sy - ty * sf, '#00f2fe', 3, 'Tujahan');
            ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            const stormEndX = sx + storm.x * sf; const stormEndY = sy - storm.y * sf;
            const tEndX = sx + tx * sf; const tEndY = sy - ty * sf;
            ctx.beginPath();
            ctx.moveTo(stormEndX, stormEndY); ctx.lineTo(sx + (storm.x + tx) * sf, sy - (storm.y + ty) * sf);
            ctx.moveTo(tEndX, tEndY); ctx.lineTo(sx + (storm.x + tx) * sf, sy - (storm.y + ty) * sf);
            ctx.stroke(); ctx.setLineDash([]);
            drawArrow(ctx, sx, sy, sx + (storm.x + tx) * sf, sy - (storm.y + ty) * sf, '#00b09b', 4, 'Paduan');
        }
    }
}

function draw() {
    if (currentView !== 'arena') return;
    ctx.clearRect(0, 0, width, height);
    drawGrid();
    drawTargets();
    drawObstacles();
    if (!isAnimating) {
        drawPreview();
        if(currentArenaLevel===1) ship.angle = Math.atan2(levels[1].targetY, levels[1].targetX);
        else if(currentArenaLevel===2) ship.angle = Math.atan2(levels[2].initialVector.y + (parseFloat(document.getElementById('l2-j-input').value)||0), levels[2].initialVector.x + (parseFloat(document.getElementById('l2-i-input').value)||0));
        else ship.angle = Math.atan2(levels[3].stormVector.y + (parseFloat(document.getElementById('l3-j-input').value)||0), levels[3].stormVector.x + (parseFloat(document.getElementById('l3-i-input').value)||0));
    }
    drawSpacecraft();
    if(isAnimating) requestAnimationFrame(draw); 
}

canvas.addEventListener('mousemove', (e) => {
    if(currentView !== 'arena') return;
    const rect = canvas.getBoundingClientRect();
    const sf = levels[currentArenaLevel].scaleFactor;
    const x = Math.round((e.clientX - rect.left - centerX) / sf);
    const y = Math.round(-(e.clientY - rect.top - centerY) / sf);
    hudCoords.textContent = `X: ${x} Y: ${y}`;
    if(!isAnimating) draw();
});

['distance-input','l2-i-input','l2-j-input','l3-i-input','l3-j-input'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => { if(!isAnimating) draw(); });
});

function collisionCheck(x, y) {
    if (currentArenaLevel !== 2) return false;
    const ast = levels[2].asteroid;
    const sf = levels[2].scaleFactor;
    const dx = x - ast.x; const dy = y - ast.y;
    return Math.sqrt(dx*dx + dy*dy) < ast.radius + (ship.radius/sf);
}

function showResult(success, message, ptAwarded = 0) {
    resultModal.classList.remove('hidden');
    modalTitle.textContent = success ? "MISSION SUCCESS" : "MISSION FAILED";
    modalTitle.className = success ? "success-text" : "fail-text";
    modalDesc.textContent = message;
    
    if (success) {
        userScore += ptAwarded;
        unlockedLevels[currentArenaLevel] = true;
        modalScore.textContent = `+${ptAwarded} Markah XP`;
        document.getElementById('total-score').textContent = userScore;
        modalBtn.textContent = currentArenaLevel < 3 ? "SETERUSNYA" : "LIHAT KEPUTUSAN";
    } else {
        modalScore.textContent = ``;
        modalBtn.textContent = "CUBA LAGI";
    }
}

function finalizeMove() {
    const lvl = levels[currentArenaLevel];
    const dx = ship.x - lvl.targetX;
    const dy = ship.y - lvl.targetY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    if (dist <= lvl.tolerance) {
        let pts = 1000 - Math.floor(dist * 100);
        showResult(true, "Misi Berjaya. Tahniah Komander!", pts);
    } else {
        const err = Math.round(dist - lvl.tolerance);
        showResult(false, `Tersasar dr sasaran sebanyak ${err} unit.`);
    }
}

function animatePath(vx, vy, callback) {
    isAnimating = true;
    const steps = 60;
    let step = 0;
    const startX = ship.x; const startY = ship.y;
    ship.path.push({x: startX, y: startY});
    ship.angle = Math.atan2(vy, vx);

    function frame() {
        step++;
        const ease = 1 - Math.pow(1 - (step/steps), 2);
        ship.x = startX + vx * ease;
        ship.y = startY + vy * ease;
        draw();
        
        if (collisionCheck(ship.x, ship.y)) {
            isAnimating = false;
            showResult(false, "Pelanggaran dengan asteroid dikesan!");
            return;
        }

        if (step < steps) requestAnimationFrame(frame);
        else {
            ship.path.push({x: ship.x, y: ship.y});
            isAnimating = false;
            if(callback) callback();
        }
    }
    requestAnimationFrame(frame);
}

document.getElementById('launch-l1').addEventListener('click', () => {
    const dist = parseFloat(document.getElementById('distance-input').value) || 0;
    if(dist===0) { showResult(false, "Sila masukkan nilai jarak."); return; }
    
    const angle = Math.atan2(12, 5);
    const vx = Math.cos(angle) * dist;
    const vy = Math.sin(angle) * dist;
    animatePath(vx, vy, finalizeMove);
});

document.getElementById('launch-l2').addEventListener('click', () => {
    const vx = parseFloat(document.getElementById('l2-i-input').value) || 0;
    const vy = parseFloat(document.getElementById('l2-j-input').value) || 0;
    const u = levels[2].initialVector;
    
    isAnimating = true;
    const startX = ship.x; const startY = ship.y;
    ship.path.push({x: startX, y: startY});
    ship.angle = Math.atan2(u.y, u.x);

    let stepU = 0;
    function frameU() {
        stepU++;
        ship.x = startX + u.x * (stepU/30);
        ship.y = startY + u.y * (stepU/30);
        draw();
        
        if (collisionCheck(ship.x, ship.y)) {
            isAnimating = false; showResult(false, "Terhempas pada asteroid!"); return;
        }

        if (stepU < 30) requestAnimationFrame(frameU);
        else {
            ship.path.push({x: ship.x, y: ship.y});
            let stepV = 0;
            const resX = u.x + vx; const resY = u.y + vy;
            ship.angle = Math.atan2(resY, resX);
            const midX = ship.x; const midY = ship.y;
            function frameV() {
                stepV++;
                ship.x = midX + vx * (stepV/30);
                ship.y = midY + vy * (stepV/30);
                draw();
                if (collisionCheck(ship.x, ship.y)) {
                    isAnimating = false; showResult(false, "Terhempas pada asteroid!"); return;
                }
                if (stepV < 30) requestAnimationFrame(frameV);
                else {
                    ship.path.push({x: ship.x, y: ship.y});
                    isAnimating = false; finalizeMove();
                }
            }
            requestAnimationFrame(frameV);
        }
    }
    requestAnimationFrame(frameU);
});

document.getElementById('launch-l3').addEventListener('click', () => {
    const tx = parseFloat(document.getElementById('l3-i-input').value) || 0;
    const ty = parseFloat(document.getElementById('l3-j-input').value) || 0;
    const storm = levels[3].stormVector;
    animatePath(storm.x + tx, storm.y + ty, finalizeMove);
});

// ====== LEADERBOARD ======
function updateLeaderboardUI() {
    document.getElementById('final-score-lb').textContent = userScore;
    
    if (unlockedLevels[1]) {
        document.getElementById('badge-lvl1').classList.remove('locked');
        document.getElementById('badge-lvl1').classList.add('unlocked');
    }
    if (unlockedLevels[2]) {
        document.getElementById('badge-lvl2').classList.remove('locked');
        document.getElementById('badge-lvl2').classList.add('unlocked');
    }
    if (unlockedLevels[3]) {
        document.getElementById('badge-lvl3').classList.remove('locked');
        document.getElementById('badge-lvl3').classList.add('unlocked');
    }
    
    document.getElementById('claim-cert-btn').onclick = () => {
        if (!unlockedLevels[3]) {
            alert("Selesaikan ketiga-tiga misi di Arena untuk dapatkan sijil!");
            return;
        }
        
        // --- GOOGLE FORMS INTEGRATION (AUTOCRAT) ---
        // Sila tukar URL ini dengan link 'Get pre-filled link' dari Google Form anda
        // Contoh: https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform?usp=pp_url&entry.1234567=
        const formBaseURL = "https://docs.google.com/forms/d/e/1FAIpQLSc_CONTOH_FORM_ID_SILA_TUKAR/viewform?usp=pp_url";
        const entryIdForScore = "&entry.123456789="; // Tukar nombor ini dengan ID entry markah form anda
        
        const finalFormURL = formBaseURL + entryIdForScore + userScore;
        
        alert(`Tahniah! Anda akan dibawa ke Google Form untuk menuntut e-sijil.\nMarkah XP anda (${userScore}) akan diisi secara automatik.`);
        window.open(finalFormURL, '_blank');
    };
}

// ====== INIT ======
window.onload = () => {
    switchView('home');
};
