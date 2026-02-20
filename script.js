// 诗词接龙游戏 - MVP版本

<<<<<<< Updated upstream
// 游戏状态
const gameState = {
  poems: [], // { text, x, y, direction, turn }
  cells: new Map(), // key: "x,y", value: { char, poemIndex, charIndex }
  currentTurn: 1,
  draftMode: false,
  draft: null,
  hoveredCell: null,
  highlightedCells: [], // 高亮的可填空格子
  selectedSource: null, // 选中的源字 {x, y, char}
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
=======
// 触摸UI系统
const TouchUI = {
  isEnabled: false,
  virtualButtons: [],
  isVisible: true,
  opacity: 0.7,
  scale: 1.0,

  init() {
    this.isEnabled = InputManager.getTouchDeviceStatus();
    if (this.isEnabled) {
      this.createDefaultButtons();
      this.updateButtonPositions();
    }
  },

  createDefaultButtons() {
    // 创建默认虚拟按钮
    this.virtualButtons = [
      {
        id: 'move_up',
        action: 'move_up',
        label: '↑',
        x: 0,
        y: 0,
        width: 60,
        height: 60,
        visible: true
      },
      {
        id: 'move_down',
        action: 'move_down',
        label: '↓',
        x: 0,
        y: 0,
        width: 60,
        height: 60,
        visible: true
      },
      {
        id: 'move_left',
        action: 'move_left',
        label: '←',
        x: 0,
        y: 0,
        width: 60,
        height: 60,
        visible: true
      },
      {
        id: 'move_right',
        action: 'move_right',
        label: '→',
        x: 0,
        y: 0,
        width: 60,
        height: 60,
        visible: true
      },
      {
        id: 'action_1',
        action: 'action_1',
        label: 'A1',
        x: 0,
        y: 0,
        width: 80,
        height: 80,
        visible: true
      },
      {
        id: 'action_2',
        action: 'action_2',
        label: 'A2',
        x: 0,
        y: 0,
        width: 80,
        height: 80,
        visible: true
      }
    ];
  },

  updateButtonPositions() {
    if (!this.isEnabled) return;

    const canvas = gameCanvas;
    const margin = 20;
    const buttonSize = 60;

    // 左侧方向控制
    const leftX = margin;
    const centerY = canvas.height / 2;

    const moveButtons = this.virtualButtons.filter(b => b.id.startsWith('move_'));
    moveButtons[0].x = leftX; // up
    moveButtons[0].y = centerY - buttonSize - 10;

    moveButtons[1].x = leftX; // down
    moveButtons[1].y = centerY + 10;

    moveButtons[2].x = leftX - buttonSize - 10; // left
    moveButtons[2].y = centerY;

    moveButtons[3].x = leftX + buttonSize + 10; // right
    moveButtons[3].y = centerY;

    // 右侧动作按钮
    const rightX = canvas.width - margin - buttonSize;
    const actionButtons = this.virtualButtons.filter(b => b.id.startsWith('action_'));

    actionButtons[0].x = rightX - buttonSize - 10; // action_1
    actionButtons[0].y = centerY - buttonSize / 2;

    actionButtons[1].x = rightX; // action_2
    actionButtons[1].y = centerY - buttonSize / 2;
  },

  getVirtualButtons() {
    return this.virtualButtons.filter(button => button.visible);
  },

  draw(ctx) {
    if (!this.isEnabled || !this.isVisible) return;

    this.virtualButtons.forEach(button => {
      if (!button.visible) return;

      // 保存当前状态
      ctx.save();

      // 设置透明度
      ctx.globalAlpha = this.opacity;

      // 绘制按钮背景
      ctx.fillStyle = 'rgba(100, 100, 100, 0.8)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2;

      const x = button.x * this.scale;
      const y = button.y * this.scale;
      const width = button.width * this.scale;
      const height = button.height * this.scale;

      // 圆角矩形
      this.roundRect(ctx, x, y, width, height, 8);
      ctx.fill();
      ctx.stroke();

      // 绘制按钮文字
      ctx.fillStyle = 'white';
      ctx.font = `${Math.floor(16 * this.scale)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(button.label, x + width / 2, y + height / 2);

      // 恢复状态
      ctx.restore();
    });
  },

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  },

  setOpacity(opacity) {
    this.opacity = Math.max(0.1, Math.min(1.0, opacity));
  },

  setScale(scale) {
    this.scale = Math.max(0.5, Math.min(2.0, scale));
    this.updateButtonPositions();
  },

  show() {
    this.isVisible = true;
  },

  hide() {
    this.isVisible = false;
  },

  toggle() {
    this.isVisible = !this.isVisible;
  },

  highlightButton(buttonId, highlight) {
    // 简单的按钮高亮功能 - 可以在这里添加视觉效果
    if (highlight) {
      this.highlightedButton = buttonId;
    } else {
      this.highlightedButton = null;
    }
    // 立即重绘以显示高亮效果
    drawCanvas();
  },

  getHighlightedButton() {
    return this.highlightedButton;
  }
};

// 输入管理系统
const InputManager = {
  providers: new Map(),
  eventQueue: [],
  isTouchDevice: false,

  init() {
    this.detectTouchDevice();
    this.registerProvider('mouse', new MouseInputProvider());
    this.registerProvider('keyboard', new KeyboardInputProvider());
    if (this.isTouchDevice) {
      this.registerProvider('touch', new TouchInputProvider());
    }
  },

  detectTouchDevice() {
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },

  registerProvider(name, provider) {
    this.providers.set(name, provider);
    provider.init(this);
    provider.enable(); // 启用输入提供者（修复）
  },

  queueEvent(event) {
    this.eventQueue.push({
      ...event,
      timestamp: performance.now()
    });

    // 保持队列长度合理，移除超过100ms的旧事件
    const now = performance.now();
    this.eventQueue = this.eventQueue.filter(e => now - e.timestamp < 100);
  },

  processEvents() {
    const events = [...this.eventQueue];
    this.eventQueue = [];

    // 按优先级排序处理事件
    events.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const event of events) {
      this.handleEvent(event);
    }
  },

  handleEvent(event) {
    switch (event.type) {
      case 'click':
        handleCanvasClick(event.data);
        break;
      case 'move':
        handleMouseMove(event.data);
        break;
      case 'drag':
        handleMouseDown(event.data);
        break;
      case 'dragMove':
        handleMouseMoveForDrag(event.data);
        break;
      case 'dragEnd':
        handleMouseUp(event.data);
        break;
      case 'zoom':
        handleWheelZoom(event.data);
        break;
      case 'keyDown':
        handleKeyDown(event.data);
        break;
      case 'touchClick':
        this.handleTouchClick(event.data);
        break;
      case 'touchStart':
        this.handleTouchStart(event.data);
        break;
      case 'touchMove':
        this.handleTouchMove(event.data);
        break;
      case 'touchEnd':
        this.handleTouchEnd(event.data);
        break;
      case 'gesture':
        this.handleGesture(event.data);
        break;
    }
  },

  handleTouchClick(data) {
    // 检查是否点击了虚拟按钮
    if (data.zone && data.zone.action === 'virtualButton') {
      this.handleVirtualButtonPress(data.zone.buttonAction);
      return;
    }

    // 否则处理为普通画布点击
    const simulatedEvent = {
      clientX: data.clientX,
      clientY: data.clientY,
      target: gameCanvas
    };
    handleCanvasClick(simulatedEvent);
  },

  handleTouchStart(data) {
    // 触摸开始处理
    if (data.zone && data.zone.action === 'virtualButton') {
      TouchUI.highlightButton(data.zone.buttonId, true);
    }
  },

  handleTouchMove(data) {
    // 触摸移动处理 - 可以添加拖拽逻辑
  },

  handleTouchEnd(data) {
    // 触摸结束处理
    TouchUI.highlightButton(null, false);
  },

  handleGesture(data) {
    // 手势处理
    switch (data.type) {
      case 'pinch':
        this.handlePinchGesture(data);
        break;
    }
  },

  handlePinchGesture(data) {
    // 处理缩放手势
    const scaleFactor = data.scale;
    const simulatedWheelEvent = {
      clientX: data.centerX,
      clientY: data.centerY,
      deltaY: scaleFactor > 1 ? -100 : 100,
      preventDefault: () => {},
      target: gameCanvas
    };
    handleWheelZoom(simulatedWheelEvent);
  },

  handleVirtualButtonPress(action) {
    // 处理虚拟按钮按压
    switch (action) {
      case 'move_up':
        this.simulateKeyPress('ArrowUp');
        break;
      case 'move_down':
        this.simulateKeyPress('ArrowDown');
        break;
      case 'move_left':
        this.simulateKeyPress('ArrowLeft');
        break;
      case 'move_right':
        this.simulateKeyPress('ArrowRight');
        break;
      case 'action_1':
        this.simulateKeyPress('Space');
        break;
      case 'action_2':
        this.simulateKeyPress('Enter');
        break;
    }
  },

  simulateKeyPress(key) {
    const simulatedKeyEvent = {
      key: key,
      preventDefault: () => {},
      target: document
    };
    handleKeyDown(simulatedKeyEvent);
  },

  getTouchDeviceStatus() {
    return this.isTouchDevice;
  }
};

// 输入提供者基类
class InputProvider {
  constructor(name) {
    this.name = name;
    this.inputManager = null;
    this.isActive = false;
  }

  init(inputManager) {
    this.inputManager = inputManager;
  }

  enable() {
    this.isActive = true;
  }

  disable() {
    this.isActive = false;
  }

  emit(event) {
    if (this.isActive && this.inputManager) {
      this.inputManager.queueEvent(event);
    }
  }
}

// 鼠标输入提供者
class MouseInputProvider extends InputProvider {
  constructor() {
    super('mouse');
    this.isDragging = false;
  }

  init(inputManager) {
    super.init(inputManager);
    this.setupEventListeners();
  }

  setupEventListeners() {
    gameCanvas.addEventListener('click', (e) => this.handleClick(e));
    gameCanvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    gameCanvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    gameCanvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    gameCanvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));
    gameCanvas.addEventListener('wheel', (e) => this.handleWheel(e));
  }

  handleClick(e) {
    this.emit({
      type: 'click',
      data: e,
      priority: 10
    });
  }

  handleMouseMove(e) {
    // 使用全局 isDragging 变量（修复作用域问题）
    this.emit({
      type: isDragging ? 'dragMove' : 'move',
      data: e,
      priority: isDragging ? 8 : 5
    });
  }

  handleMouseDown(e) {
    // 使用全局 isDragging，但不立即设置为 true（由 handleMouseDown 全局函数处理）
    this.emit({
      type: 'drag',
      data: e,
      priority: 9
    });
  }

  handleMouseUp(e) {
    // 使用全局 isDragging
    if (isDragging) {
      this.emit({
        type: 'dragEnd',
        data: e,
        priority: 9
      });
    }
  }

  handleWheel(e) {
    this.emit({
      type: 'zoom',
      data: e,
      priority: 7
    });
  }
}

// 键盘输入提供者
class KeyboardInputProvider extends InputProvider {
  constructor() {
    super('keyboard');
  }

  init(inputManager) {
    super.init(inputManager);
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  handleKeyDown(e) {
    this.emit({
      type: 'keyDown',
      data: e,
      priority: 6
    });
  }
}

// 触摸输入提供者
class TouchInputProvider extends InputProvider {
  constructor() {
    super('touch');
    this.activeTouches = new Map();
    this.gestureRecognizer = new GestureRecognizer();
    this.touchZones = new Map();
  }

  init(inputManager) {
    super.init(inputManager);
    this.setupEventListeners();
    this.setupDefaultTouchZones();
  }

  setupEventListeners() {
    gameCanvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    gameCanvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    gameCanvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    gameCanvas.addEventListener('touchcancel', (e) => this.handleTouchCancel(e), { passive: false });
  }

  setupDefaultTouchZones() {
    this.updateTouchZones();
  }

  updateTouchZones() {
    // 清除现有区域
    this.touchZones.clear();

    // 添加全屏画布区域
    this.touchZones.set('canvas', {
      x: 0,
      y: 0,
      width: gameCanvas.width,
      height: gameCanvas.height,
      action: 'canvas'
    });

    // 如果触摸UI启用，添加虚拟按钮区域
    if (TouchUI.isEnabled) {
      this.addVirtualButtonZones();
    }
  }

  addVirtualButtonZones() {
    const buttons = TouchUI.getVirtualButtons();

    buttons.forEach((button, index) => {
      const buttonZone = {
        x: button.x,
        y: button.y,
        width: button.width,
        height: button.height,
        action: 'virtualButton',
        buttonId: button.id,
        buttonAction: button.action
      };

      this.touchZones.set(`button_${button.id}`, buttonZone);
    });
  }

  handleTouchStart(e) {
    e.preventDefault();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const touchData = {
        identifier: touch.identifier,
        clientX: touch.clientX,
        clientY: touch.clientY,
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: performance.now()
      };

      this.activeTouches.set(touch.identifier, touchData);

      // 检查触摸区域
      const zone = this.getTouchZone(touch.clientX, touch.clientY);

      this.emit({
        type: 'touchStart',
        data: {
          ...touchData,
          zone: zone,
          originalEvent: e
        },
        priority: 10
      });
    }

    // 处理手势识别
    if (this.activeTouches.size >= 2) {
      this.gestureRecognizer.startGesture(this.activeTouches);
    }
  }

  handleTouchMove(e) {
    e.preventDefault();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const touchData = this.activeTouches.get(touch.identifier);

      if (touchData) {
        touchData.clientX = touch.clientX;
        touchData.clientY = touch.clientY;
        touchData.lastMoveTime = performance.now();

        this.emit({
          type: 'touchMove',
          data: {
            ...touchData,
            originalEvent: e
          },
          priority: 8
        });
      }
    }

    // 处理手势识别
    if (this.activeTouches.size >= 2) {
      const gesture = this.gestureRecognizer.updateGesture(this.activeTouches);
      if (gesture) {
        this.emit({
          type: 'gesture',
          data: gesture,
          priority: 9
        });
      }
    }
  }

  handleTouchEnd(e) {
    e.preventDefault();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const touchData = this.activeTouches.get(touch.identifier);

      if (touchData) {
        const duration = performance.now() - touchData.startTime;
        const distance = Math.sqrt(
          Math.pow(touch.clientX - touchData.startX, 2) +
          Math.pow(touch.clientY - touchData.startY, 2)
        );

        // 判断是点击还是拖拽
        const isClick = distance < 10 && duration < 200;

        this.emit({
          type: isClick ? 'touchClick' : 'touchEnd',
          data: {
            ...touchData,
            endX: touch.clientX,
            endY: touch.clientY,
            duration: duration,
            distance: distance,
            originalEvent: e
          },
          priority: isClick ? 10 : 7
        });

        this.activeTouches.delete(touch.identifier);
      }
    }

    this.gestureRecognizer.endGesture();
  }

  handleTouchCancel(e) {
    e.preventDefault();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const touchData = this.activeTouches.get(touch.identifier);

      if (touchData) {
        this.emit({
          type: 'touchCancel',
          data: {
            ...touchData,
            originalEvent: e
          },
          priority: 6
        });

        this.activeTouches.delete(touch.identifier);
      }
    }

    this.gestureRecognizer.endGesture();
  }

  getTouchZone(x, y) {
    for (const [name, zone] of this.touchZones) {
      if (x >= zone.x && x <= zone.x + zone.width &&
          y >= zone.y && y <= zone.y + zone.height) {
        return { name, ...zone };
      }
    }
    return null;
  }

  addTouchZone(name, zone) {
    this.touchZones.set(name, zone);
  }

  removeTouchZone(name) {
    this.touchZones.delete(name);
  }
}

// 手势识别器
class GestureRecognizer {
  constructor() {
    this.active = false;
    this.startTime = 0;
    this.gestureType = null;
  }

  startGesture(touches) {
    this.active = true;
    this.startTime = performance.now();
    this.gestureType = null;
  }

  updateGesture(touches) {
    if (!this.active || touches.size < 2) return null;

    const touchArray = Array.from(touches.values());

    // 简单的缩放手势检测
    if (touches.size === 2) {
      const touch1 = touchArray[0];
      const touch2 = touchArray[1];

      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );

      const startDistance = Math.sqrt(
        Math.pow(touch2.startX - touch1.startX, 2) +
        Math.pow(touch2.startY - touch1.startY, 2)
      );

      const scale = currentDistance / startDistance;

      if (Math.abs(scale - 1) > 0.1) {
        return {
          type: 'pinch',
          scale: scale,
          centerX: (touch1.clientX + touch2.clientX) / 2,
          centerY: (touch1.clientY + touch2.clientY) / 2
        };
      }
    }

    return null;
  }

  endGesture() {
    this.active = false;
    this.gestureType = null;
  }
}

// DOM 元素引用
>>>>>>> Stashed changes
const gameCanvas = document.getElementById('game-canvas');
const leftPanel = document.getElementById('left-panel');
const statusLabel = document.getElementById('status-label');
const turnCount = document.getElementById('turn-count');
const poemCount = document.getElementById('poem-count');
const draftBar = document.getElementById('draft-bar');
const poemInput = document.getElementById('poem-input');
const cancelBtn = document.getElementById('cancel-btn');
const confirmBtn = document.getElementById('confirm-btn');

// Overlay 元素
const startGameOverlay = document.getElementById('start-game-overlay');
const inputOriginOverlay = document.getElementById('input-origin-overlay');
const initialPoemInput = document.getElementById('initial-poem-input');
const initError = document.getElementById('init-error');

// 游戏状态
const gameState = {
  poems: [],
  cells: new Map(),
  currentTurn: 1,
  draftMode: false,
  draft: null,
  hoveredCell: null,
  selectedSource: null,
  highlightedCells: [],
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

// 显示开始界面
function showStartOverlay() {
  startGameOverlay.classList.remove('hidden');
  inputOriginOverlay.classList.add('hidden');
}

// 初始诗句配置
const INITIAL_POEM = {
  text: "春江潮水连海平",
  x: 0,
  y: 0,
  direction: "H",
  turn: 1
};

// 显示输入初始诗句界面
function showInputOverlay() {
  startGameOverlay.classList.add('hidden');
  inputOriginOverlay.classList.remove('hidden');
  if (initialPoemInput) {
    initialPoemInput.value = '';
    initialPoemInput.focus();
  }
}

// 开始游戏（输入初始诗句后）
function startGameWithInitialPoem() {
  const text = initialPoemInput.value.trim();
  if (!text || text.length === 0) {
    showInitError('请输入起始诗句');
    return;
  }
  
  // 隐藏 overlay
  inputOriginOverlay.classList.add('hidden');
  
  // 设置初始诗句
  INITIAL_POEM.text = text;
  
  // 初始化游戏
  initGame();
}

// 显示初始输入错误
function showInitError(message) {
  if (initError) {
    initError.textContent = message;
    initError.classList.remove('hidden');
  }
}

// 隐藏初始输入错误
function hideInitError() {
  if (initError) {
    initError.textContent = '';
    initError.classList.add('hidden');
  }
}

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

function startGame() {
  const overlay = document.getElementById('start-game-overlay');
  overlay.classList.add('hidden');
}

function resizeCanvas() {
  gameCanvas.width = window.innerWidth;
  gameCanvas.height = window.innerHeight;
  drawCanvas();
}

//开始界面
function startOverlay() {
  
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

  // 绘制高亮格子（在诗句下层）
  if (gameState.highlightedCells.length > 0) {
    drawHighlightedCells(ctx);
  }

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

// 绘制高亮格子
function drawHighlightedCells(ctx) {
  const centerX = gameCanvas.width / 2 + gameState.canvas.offsetX;
  const centerY = gameCanvas.height / 2 + gameState.canvas.offsetY;
  const scale = gameCanvas.scale;
  
  const baseSize = CELL_SIZE * scale;
  const highlightSize = baseSize * 1.15; // 放大15%
  const offset = (highlightSize - baseSize) / 2;
  
  gameState.highlightedCells.forEach(cell => {
    const pixelX = centerX + cell.x * CELL_SIZE * scale - offset;
    const pixelY = centerY + cell.y * CELL_SIZE * scale - offset;
    
    // 判断是否是源字
    const isSource = gameState.selectedSource && 
                     gameState.selectedSource.x === cell.x && 
                     gameState.selectedSource.y === cell.y;
    
    if (isSource) {
      // 源字：更大 + 深蓝色边框
      const sourceSize = baseSize * 1.3; // 放大30%
      const sourceOffset = (sourceSize - baseSize) / 2;
      const sourceX = centerX + cell.x * CELL_SIZE * scale - sourceOffset;
      const sourceY = centerY + cell.y * CELL_SIZE * scale - sourceOffset;
      
      // 背景：浅蓝色
      ctx.fillStyle = 'rgba(100, 149, 237, 0.25)';
      ctx.fillRect(sourceX, sourceY, sourceSize, sourceSize);
      
      // 边框：深蓝色加粗
      ctx.strokeStyle = '#4169E1';
      ctx.lineWidth = 4 * scale;
      ctx.strokeRect(sourceX, sourceY, sourceSize, sourceSize);
    } else {
      // 普通高亮格子：浅灰蓝色 + 加粗边框
      ctx.fillStyle = 'rgba(176, 196, 222, 0.2)';
      ctx.fillRect(pixelX, pixelY, highlightSize, highlightSize);
      
      ctx.strokeStyle = '#778899';
      ctx.lineWidth = 3 * scale;
      ctx.strokeRect(pixelX, pixelY, highlightSize, highlightSize);
    }
  });
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

      // 判断是否是源字
      const isSource = gameState.selectedSource && 
                       gameState.selectedSource.x === x && 
                       gameState.selectedSource.y === y;

      if (isSource) {
        // 源字：更大的背景 + 深色边框
        const sourceSize = CELL_SIZE * scale * 1.3;
        const offset = (sourceSize - CELL_SIZE * scale) / 2;
        
        ctx.fillStyle = 'rgba(100, 149, 237, 0.15)';
        ctx.fillRect(pixelX - offset, pixelY - offset, sourceSize, sourceSize);
        
        ctx.strokeStyle = '#4169E1';
        ctx.lineWidth = 3;
        ctx.strokeRect(pixelX - offset, pixelY - offset, sourceSize, sourceSize);
        
        // 源字：更大的字体
        ctx.fillStyle = '#1a1a1a';
        ctx.font = `${32 * scale}px "Noto Serif SC", "SimSun", serif`;
      } else {
        // 普通字：正常绘制
        ctx.fillStyle = 'white';
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.fillRect(pixelX, pixelY, CELL_SIZE * scale, CELL_SIZE * scale);
        ctx.strokeRect(pixelX, pixelY, CELL_SIZE * scale, CELL_SIZE * scale);
        
        ctx.fillStyle = '#333';
        ctx.font = `${24 * scale}px "Noto Serif SC", "SimSun", serif`;
      }
      
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
// 页面加载完成后设置事件监听
window.addEventListener('DOMContentLoaded', () => {
  // 开始界面点击事件
  if (startGameOverlay) {
    startGameOverlay.addEventListener('click', () => {
      showInputOverlay();
    });
  }
  
  // 初始诗句输入框事件
  if (initialPoemInput) {
    initialPoemInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        startGameWithInitialPoem();
      } else {
        hideInitError();
      }
    });
  }
  
  // 草稿栏按钮事件
  if (cancelBtn) {
    cancelBtn.addEventListener('click', exitDraftMode);
  }
  if (confirmBtn) {
    confirmBtn.addEventListener('click', confirmDraft);
  }
  if (directionBtn) {
    directionBtn.addEventListener('click', toggleDraftDirection);
  }
  
  // 输入框事件
  if (poemInput) {
    poemInput.addEventListener('input', handleInputChange);
  }
  
  // 显示开始界面
  showStartOverlay();
});