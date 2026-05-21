// ==================== Canvas Drawing ====================
const canvas = elements.drawingCanvas;
const ctx = canvas.getContext('2d');
let lastPos = { x: 0, y: 0 };
let currentDrawing = [];

const resizeCanvas = () => {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
};

const getTouchPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
    };
};

const startDrawing = (e) => {
    e.preventDefault();
    AppState.isDrawing = true;
    const pos = getTouchPos(e);
    lastPos = pos;
    currentDrawing = [{
        x: pos.x,
        y: pos.y,
        color: AppState.currentColor,
        width: AppState.currentTool === 'eraser' ? 20 : 3,
        isEraser: AppState.currentTool === 'eraser'
    }];
};

const draw = (e) => {
    if (!AppState.isDrawing) return;
    e.preventDefault();

    const pos = getTouchPos(e);

    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (AppState.currentTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth = 20;
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = AppState.currentColor;
        ctx.lineWidth = 3;
    }

    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    currentDrawing.push({
        x: pos.x,
        y: pos.y,
        color: AppState.currentColor,
        width: AppState.currentTool === 'eraser' ? 20 : 3,
        isEraser: AppState.currentTool === 'eraser'
    });

    lastPos = pos;
};

const stopDrawing = () => {
    AppState.isDrawing = false;
    currentDrawing = [];
};

// Canvas Events
canvas.addEventListener('touchstart', startDrawing, { passive: false });
canvas.addEventListener('touchmove', draw, { passive: false });
canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseleave', stopDrawing);

// Tool Selection
elements.penTool.addEventListener('click', () => {
    AppState.currentTool = 'pen';
    elements.penTool.classList.add('active');
    elements.eraserTool.classList.remove('active');
    elements.noteTool.classList.remove('active');
});

elements.eraserTool.addEventListener('click', () => {
    AppState.currentTool = 'eraser';
    elements.eraserTool.classList.add('active');
    elements.penTool.classList.remove('active');
    elements.noteTool.classList.remove('active');
});

elements.noteTool.addEventListener('click', () => {
    elements.noteTool.classList.add('active');
    elements.penTool.classList.remove('active');
    elements.eraserTool.classList.remove('active');
});

// Color Selection
elements.colorPicker.addEventListener('click', (e) => {
    const dot = e.target.closest('.color-dot');
    if (dot) {
        elements.colorPicker.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
        dot.classList.add('selected');
        AppState.currentColor = dot.dataset.color;
    }
});
