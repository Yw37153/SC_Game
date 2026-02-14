// 诗词接龙游戏 - MVP版本

// 游戏状态
const gameState = {
  poems: [], // { text, x, y, direction, turn }
  cells: new Map(), // key: "x,y", value: { char, poemIndex, charIndex }
  currentTurn: 1,
  draftMode: false,
  draft: null,
  hoveredCell: null,
  canvas: {
    scale: 1,
    offsetX: 0,
    offsetY: 0
  }
};

// 拖拽状态
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

// 常量
const CELL_SIZE = 60;
const INITIAL_POEM = {
  text: "春江潮水连海平",
  x: 0,
  y: 0,
  direction: "H",
  turn: 1
};

// DOM元素
const gameCanvas = document.getElementById('game-canvas');
const leftPanel = document.getElementById('left-panel');
const statusLabel = document.getElementById('status-label');
const turnCount = document.getElementById('turn-count');
const poemCount = document.getElementById('poem-count');
const draftBar = document.getElementById('draft-bar');
const poemInput = document.getElementById('poem-input');
const cancelBtn = document.getElementById('cancel-btn');
const confirmBtn = document.getElementById('confirm-btn');

// 初始化游戏
function initGame() {
  // 初始化画布
  initCanvas();

  // 添加首句
  addInitialPoem();

  // 设置事件监听
  setupEventListeners();

  // 更新UI
  updateUI();
}

// 初始化画布
function initCanvas() {
  const ctx = gameCanvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
  gameCanvas.width = window.innerWidth;
  gameCanvas.height = window.innerHeight;
  drawCanvas();
}

// 添加首句
function addInitialPoem() {
  const poem = INITIAL_POEM;
  gameState.poems = [poem];
  gameState.currentTurn = 1;

  // 添加到cells
  for (let i = 0; i < poem.text.length; i++) {
    const x = poem.x + (poem.direction === "H" ? i : 0);
    const y = poem.y + (poem.direction === "V" ? i : 0);
    const key = `${x},${y}`;
    gameState.cells.set(key, {
      char: poem.text[i],
      poemIndex: 0,
      charIndex: i
    });
  }

  drawCanvas();
}

// 绘制画布
function drawCanvas() {
  const ctx = gameCanvas.getContext('2d');
  ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

  // 绘制网格
  drawGrid(ctx);

  // 绘制诗句
  drawPoems(ctx);

  // 绘制草稿预览
  if (gameState.draftMode && gameState.draft) {
    drawDraftPreview(ctx);
  }

  // 绘制方向选择器
  if (gameState.hoveredCell && !gameState.draftMode) {
    drawDirectionSelector(ctx);
  }
}

// 绘制网格
function drawGrid(ctx) {
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1;

  const centerX = gameCanvas.width / 2 + gameState.canvas.offsetX;
  const centerY = gameCanvas.height / 2 + gameState.canvas.offsetY;
  const scale = gameState.canvas.scale;

  const cellSize = CELL_SIZE * scale;
  const startX = Math.floor(-centerX / cellSize) * cellSize + centerX;
  const startY = Math.floor(-centerY / cellSize) * cellSize + centerY;

  // 垂直线
  for (let x = startX; x < gameCanvas.width; x += cellSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, gameCanvas.height);
    ctx.stroke();
  }

  // 水平线
  for (let y = startY; y < gameCanvas.height; y += cellSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(gameCanvas.width, y);
    ctx.stroke();
  }
}

// 绘制诗句
function drawPoems(ctx) {
  const centerX = gameCanvas.width / 2 + gameState.canvas.offsetX;
  const centerY = gameCanvas.height / 2 + gameState.canvas.offsetY;
  const scale = gameState.canvas.scale;

  gameState.poems.forEach(poem => {
    for (let i = 0; i < poem.text.length; i++) {
      const x = poem.x + (poem.direction === "H" ? i : 0);
      const y = poem.y + (poem.direction === "V" ? i : 0);

      const pixelX = centerX + x * CELL_SIZE * scale;
      const pixelY = centerY + y * CELL_SIZE * scale;

      // 绘制单元格背景
      ctx.fillStyle = 'white';
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 1;
      ctx.fillRect(pixelX, pixelY, CELL_SIZE * scale, CELL_SIZE * scale);
      ctx.strokeRect(pixelX, pixelY, CELL_SIZE * scale, CELL_SIZE * scale);

      // 绘制文字
      ctx.fillStyle = '#333';
      ctx.font = `${24 * scale}px "Noto Serif SC", "SimSun", serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(poem.text[i], pixelX + CELL_SIZE * scale / 2, pixelY + CELL_SIZE * scale / 2);
    }
  });
}

// 绘制草稿预览
function drawDraftPreview(ctx) {
  const draft = gameState.draft;
  if (!draft || !draft.text) return;

  const centerX = gameCanvas.width / 2 + gameState.canvas.offsetX;
  const centerY = gameCanvas.height / 2 + gameState.canvas.offsetY;
  const scale = gameState.canvas.scale;

  // 计算起始位置
  let startX = draft.anchorX - draft.offset;
  let startY = draft.anchorY;

  if (draft.direction === "V") {
    startX = draft.anchorX;
    startY = draft.anchorY - draft.offset;
  }

  // 绘制每个字符
  for (let i = 0; i < draft.text.length; i++) {
    const x = startX + (draft.direction === "H" ? i : 0);
    const y = startY + (draft.direction === "V" ? i : 0);

    const pixelX = centerX + x * CELL_SIZE * scale;
    const pixelY = centerY + y * CELL_SIZE * scale;

    const char = draft.text[i];
    const key = `${x},${y}`;
    const existingCell = gameState.cells.get(key);

    // 确定背景颜色
    let bgColor = '#fff9c4'; // 黄色草稿背景
    let borderColor = '#ffeb3b';

    if (existingCell) {
      if (existingCell.char === char) {
        bgColor = '#c8e6c9'; // 绿色有效重合
        borderColor = '#4CAF50';
      } else {
        bgColor = '#ffcdd2'; // 红色冲突
        borderColor = '#f44336';
      }
    }

    // 绘制背景
    ctx.fillStyle = bgColor;
    ctx.fillRect(pixelX, pixelY, CELL_SIZE * scale, CELL_SIZE * scale);

    // 绘制边框
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(pixelX, pixelY, CELL_SIZE * scale, CELL_SIZE * scale);

    // 绘制文字
    ctx.fillStyle = '#333';
    ctx.font = `${24 * scale}px "Noto Serif SC", "SimSun", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, pixelX + CELL_SIZE * scale / 2, pixelY + CELL_SIZE * scale / 2);
  }
}

// 绘制方向选择器
function drawDirectionSelector(ctx) {
  const cell = gameState.hoveredCell;
  if (!cell) return;

  const centerX = gameCanvas.width / 2 + gameState.canvas.offsetX;
  const centerY = gameCanvas.height / 2 + gameState.canvas.offsetY;
  const scale = gameState.canvas.scale;

  const cellPixelX = centerX + cell.x * CELL_SIZE * scale;
  const cellPixelY = centerY + cell.y * CELL_SIZE * scale;
  const cellSize = CELL_SIZE * scale;

  // 绘制四个方向的箭头
  const directions = [
    { dx: 0, dy: -1, text: '↑', dir: 'V' },
    { dx: 0, dy: 1, text: '↓', dir: 'V' },
    { dx: -1, dy: 0, text: '←', dir: 'H' },
    { dx: 1, dy: 0, text: '→', dir: 'H' }
  ];

  ctx.font = `${20 * scale}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  directions.forEach(dir => {
    const arrowX = cellPixelX + CELL_SIZE * scale / 2 + dir.dx * CELL_SIZE * scale;
    const arrowY = cellPixelY + CELL_SIZE * scale / 2 + dir.dy * CELL_SIZE * scale;

    // 绘制按钮背景
    ctx.fillStyle = 'white';
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(arrowX, arrowY, 15 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 绘制箭头
    ctx.fillStyle = '#4CAF50';
    ctx.fillText(dir.text, arrowX, arrowY);
  });
}

// 设置事件监听
function setupEventListeners() {
  // 画布点击事件
  gameCanvas.addEventListener('click', handleCanvasClick);

  // 鼠标移动事件
  gameCanvas.addEventListener('mousemove', handleMouseMove);

  // 鼠标拖拽事件
  gameCanvas.addEventListener('mousedown', handleMouseDown);
  gameCanvas.addEventListener('mousemove', handleMouseMoveForDrag);
  gameCanvas.addEventListener('mouseup', handleMouseUp);
  gameCanvas.addEventListener('mouseleave', handleMouseUp);

  // 滚轮缩放事件
  gameCanvas.addEventListener('wheel', handleWheelZoom);

  // 输入框事件
  poemInput.addEventListener('input', handleInputChange);

  // 按钮事件
  cancelBtn.addEventListener('click', exitDraftMode);
  confirmBtn.addEventListener('click', confirmDraft);

  // 键盘事件
  document.addEventListener('keydown', handleKeyDown);
}

// 处理画布点击
function handleCanvasClick(e) {
  const rect = gameCanvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  if (gameState.draftMode) {
    // 草稿模式下不处理点击
    return;
  }

  if (gameState.hoveredCell) {
    // 检查是否点击了方向选择器箭头（使用像素坐标进行精确检测）
    const directions = [
      { dx: 0, dy: -1, dir: 'V' },
      { dx: 0, dy: 1, dir: 'V' },
      { dx: -1, dy: 0, dir: 'H' },
      { dx: 1, dy: 0, dir: 'H' }
    ];

    const centerX = gameCanvas.width / 2 + gameState.canvas.offsetX;
    const centerY = gameCanvas.height / 2 + gameState.canvas.offsetY;
    const scale = gameState.canvas.scale;
    const cellSize = CELL_SIZE * scale;
    const arrowRadius = 15 * scale;

    for (const dir of directions) {
      // 计算箭头在画布上的像素位置
      const arrowPixelX = centerX + gameState.hoveredCell.x * cellSize + cellSize / 2 + dir.dx * cellSize;
      const arrowPixelY = centerY + gameState.hoveredCell.y * cellSize + cellSize / 2 + dir.dy * cellSize;

      // 计算点击位置与箭头中心的距离
      const distance = Math.sqrt(
        Math.pow(clickX - arrowPixelX, 2) +
        Math.pow(clickY - arrowPixelY, 2)
      );

      // 如果点击在箭头圆形区域内
      if (distance <= arrowRadius) {
        console.log('Arrow clicked:', dir.dir, 'at distance:', distance.toFixed(2));
        enterDraftMode(gameState.hoveredCell.x, gameState.hoveredCell.y, gameState.hoveredCell.char, dir.dir);
        return;
      }
    }
  }
}

// 处理鼠标移动
function handleMouseMove(e) {
  if (gameState.draftMode || isDragging) {
    gameState.hoveredCell = null;
    if (!isDragging) {
      drawCanvas();
    }
    return;
  }

  const rect = gameCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const gridPos = pixelToGrid(x, y);
  const key = `${gridPos.x},${gridPos.y}`;

  const cell = gameState.cells.get(key);
  if (cell) {
    gameState.hoveredCell = {
      x: gridPos.x,
      y: gridPos.y,
      char: cell.char
    };
    gameCanvas.style.cursor = 'pointer';
  } else {
    gameState.hoveredCell = null;
    gameCanvas.style.cursor = 'default';
  }

  drawCanvas();
}

// 像素坐标转换为网格坐标
function pixelToGrid(pixelX, pixelY) {
  const centerX = gameCanvas.width / 2 + gameState.canvas.offsetX;
  const centerY = gameCanvas.height / 2 + gameState.canvas.offsetY;
  const scale = gameState.canvas.scale;

  const gridX = Math.round((pixelX - centerX) / (CELL_SIZE * scale));
  const gridY = Math.round((pixelY - centerY) / (CELL_SIZE * scale));

  return { x: gridX, y: gridY };
}

// 进入草稿模式
function enterDraftMode(anchorX, anchorY, anchorChar, direction) {
  gameState.draftMode = true;
  gameState.draft = {
    anchorX,
    anchorY,
    anchorChar,
    direction,
    text: '',
    offset: 0
  };

  statusLabel.textContent = '编辑诗句';
  draftBar.classList.remove('hidden');
  poemInput.value = '';
  poemInput.focus();
  confirmBtn.disabled = true;

  drawCanvas();
}

// 退出草稿模式
function exitDraftMode() {
  gameState.draftMode = false;
  gameState.draft = null;

  statusLabel.textContent = '选择连接点';
  draftBar.classList.add('hidden');
  poemInput.value = '';
  confirmBtn.disabled = true;

  drawCanvas();
}

// 处理输入变化
function handleInputChange() {
  if (!gameState.draft) return;

  gameState.draft.text = poemInput.value;

  // 验证输入
  validateDraft();

  drawCanvas();
}

// 验证草稿
function validateDraft() {
  const draft = gameState.draft;
  if (!draft || !draft.text) {
    confirmBtn.disabled = true;
    return;
  }

  // 计算起始位置
  let startX = draft.anchorX - draft.offset;
  let startY = draft.anchorY;

  if (draft.direction === "V") {
    startX = draft.anchorX;
    startY = draft.anchorY - draft.offset;
  }

  // 检查重合和冲突
  let hasOverlap = false;
  let hasConflict = false;
  let hasNewChar = false;

  for (let i = 0; i < draft.text.length; i++) {
    const x = startX + (draft.direction === "H" ? i : 0);
    const y = startY + (draft.direction === "V" ? i : 0);
    const key = `${x},${y}`;

    const existingCell = gameState.cells.get(key);
    if (existingCell) {
      if (existingCell.char === draft.text[i]) {
        hasOverlap = true;
      } else {
        hasConflict = true;
      }
    } else {
      hasNewChar = true;
    }
  }

  // 启用确认按钮的条件：有重合、无冲突、有新字符
  confirmBtn.disabled = !(hasOverlap && !hasConflict && hasNewChar);
}

// 确认草稿
function confirmDraft() {
  if (confirmBtn.disabled || !gameState.draft) return;

  const draft = gameState.draft;

  // 计算起始位置
  let startX = draft.anchorX - draft.offset;
  let startY = draft.anchorY;

  if (draft.direction === "V") {
    startX = draft.anchorX;
    startY = draft.anchorY - draft.offset;
  }

  // 创建新诗句
  const newPoem = {
    text: draft.text,
    x: startX,
    y: startY,
    direction: draft.direction,
    turn: gameState.currentTurn + 1
  };

  // 添加到游戏状态
  gameState.poems.push(newPoem);

  // 更新cells
  for (let i = 0; i < draft.text.length; i++) {
    const x = startX + (draft.direction === "H" ? i : 0);
    const y = startY + (draft.direction === "V" ? i : 0);
    const key = `${x},${y}`;

    gameState.cells.set(key, {
      char: draft.text[i],
      poemIndex: gameState.poems.length - 1,
      charIndex: i
    });
  }

  // 更新回合数
  gameState.currentTurn++;

  // 更新UI
  updateUI();

  // 退出草稿模式
  exitDraftMode();
}

// 处理键盘事件
function handleKeyDown(e) {
  if (gameState.draftMode) {
    if (e.key === 'Escape') {
      exitDraftMode();
    } else if (e.key === 'Enter' && !confirmBtn.disabled) {
      confirmDraft();
    }
  }
}

// 更新UI
function updateUI() {
  turnCount.textContent = gameState.currentTurn;
  poemCount.textContent = gameState.poems.length;
}

// 处理鼠标按下（开始拖拽）
function handleMouseDown(e) {
  if (gameState.draftMode) return;
  if (e.button !== 0) return; // 只处理左键

  isDragging = true;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;

  // 改变鼠标样式
  gameCanvas.style.cursor = 'grabbing';
}

// 处理鼠标移动（拖拽中）
function handleMouseMoveForDrag(e) {
  if (!isDragging || gameState.draftMode) return;

  const deltaX = e.clientX - lastMouseX;
  const deltaY = e.clientY - lastMouseY;

  // 更新画布偏移
  gameState.canvas.offsetX += deltaX;
  gameState.canvas.offsetY += deltaY;

  lastMouseX = e.clientX;
  lastMouseY = e.clientY;

  // 重绘画布
  drawCanvas();
}

// 处理鼠标抬起（结束拖拽）
function handleMouseUp() {
  isDragging = false;

  // 恢复鼠标样式
  if (!gameState.draftMode) {
    gameCanvas.style.cursor = 'default';
  }
}

// 处理滚轮缩放
function handleWheelZoom(e) {
  if (gameState.draftMode) return;

  e.preventDefault();

  const rect = gameCanvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // 计算缩放因子
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  const newScale = gameState.canvas.scale * delta;

  // 限制缩放范围 (0.3x 到 3x)
  if (newScale < 0.3 || newScale > 3) return;

  // 计算鼠标在画布上的相对位置
  const centerX = gameCanvas.width / 2 + gameState.canvas.offsetX;
  const centerY = gameCanvas.height / 2 + gameState.canvas.offsetY;

  // 计算鼠标相对于画布中心的偏移
  const mouseOffsetX = mouseX - centerX;
  const mouseOffsetY = mouseY - centerY;

  // 更新缩放
  gameState.canvas.scale = newScale;

  // 调整偏移以保持鼠标位置不变
  gameState.canvas.offsetX += mouseOffsetX * (1 - delta);
  gameState.canvas.offsetY += mouseOffsetY * (1 - delta);

  // 重绘画布
  drawCanvas();
}

// 重置视图到中心
function resetView() {
  gameState.canvas.scale = 1;
  gameState.canvas.offsetX = 0;
  gameState.canvas.offsetY = 0;
  drawCanvas();
}

// 初始化游戏
window.addEventListener('DOMContentLoaded', initGame);