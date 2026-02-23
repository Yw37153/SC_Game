// 诗词接龙游戏 - MVP版本

// 常量定义
const CELL_SIZE = 50;

// 默认起始诗句
const INITIAL_POEM = {
  text: "春眠不觉晓",
  x: 0,
  y: 0,
  direction: "H"
};

// 交叉流程状态机
class CrossoverFlowState {
  constructor() {
    this.step = 'IDLE'; // IDLE, SELECT_ANCHOR, SELECT_START, INPUT_POEM
    this.anchorPosition = null; // {x, y, character}
    this.startPosition = null;  // {x, y}
    this.inputPath = [];         // 计算出的输入路径数组 [{x, y}, ...]
    this.confirmed = false;
  }

  // 前进到下一步
  nextStep() {
    switch (this.step) {
      case 'IDLE':
        this.step = 'SELECT_ANCHOR';
        break;
      case 'SELECT_ANCHOR':
        this.step = 'SELECT_START';
        break;
      case 'SELECT_START':
        this.step = 'INPUT_POEM';
        break;
      case 'INPUT_POEM':
        this.step = 'IDLE';
        this.clear();
        break;
    }
  }

  // 返回上一步
  previousStep() {
    switch (this.step) {
      case 'SELECT_ANCHOR':
        this.step = 'IDLE';
        this.anchorPosition = null;
        break;
      case 'SELECT_START':
        this.step = 'SELECT_ANCHOR';
        this.startPosition = null;
        this.inputPath = [];
        break;
      case 'INPUT_POEM':
        this.step = 'SELECT_START';
        break;
    }
  }

  // 取消并重置
  cancel() {
    this.step = 'IDLE';
    this.clear();
  }

  // 清除所有选择
  clear() {
    this.anchorPosition = null;
    this.startPosition = null;
    this.inputPath = [];
    this.confirmed = false;
  }

  // 设置锚点位置
  setAnchor(x, y, character) {
    this.anchorPosition = { x, y, character };
    this.nextStep();
  }

  // 设置起始位置
  setStartPosition(x, y) {
    this.startPosition = { x, y };
    this.nextStep();
  }

  // 设置输入路径
  setInputPath(path) {
    this.inputPath = path;
  }

  // 检查是否处于特定状态
  isInStep(step) {
    return this.step === step;
  }

  // 获取当前状态信息
  getStateInfo() {
    return {
      step: this.step,
      hasAnchor: !!this.anchorPosition,
      hasStart: !!this.startPosition,
      pathLength: this.inputPath.length
    };
  }
}

// 路径计算工具函数
class PathCalculator {
  // 检查两个位置是否在同一行或同一列
  static isValidPath(startX, startY, anchorX, anchorY) {
    return startX === anchorX || startY === anchorY;
  }

  // 计算从起始位置到锚点的路径
  static calculatePath(startX, startY, anchorX, anchorY) {
    const path = [];

    if (startX === anchorX) {
      // 垂直路径
      const minY = Math.min(startY, anchorY);
      const maxY = Math.max(startY, anchorY);

      for (let y = minY; y <= maxY; y++) {
        path.push({ x: startX, y });
      }
    } else if (startY === anchorY) {
      // 水平路径
      const minX = Math.min(startX, anchorX);
      const maxX = Math.max(startX, anchorX);

      for (let x = minX; x <= maxX; x++) {
        path.push({ x, y: startY });
      }
    }

    return path;
  }

  // 验证起始位置是否有效（空格子且与锚点在同一行/列）
  static validateStartPosition(startX, startY, anchorX, anchorY) {
    // 检查是否在同一行或同一列
    if (!this.isValidPath(startX, startY, anchorX, anchorY)) {
      return { valid: false, reason: 'not_aligned' };
    }

    // 检查起始位置是否已被占用
    const key = `${startX},${startY}`;
    if (gameState.cells.has(key)) {
      return { valid: false, reason: 'occupied' };
    }

    return { valid: true };
  }

  // 获取锚点周围所有可能的有效起始位置
  static getValidStartPositions(anchorX, anchorY, gridSize = 20) {
    const validPositions = [];

    // 检查同一行的所有位置
    for (let x = -gridSize; x <= gridSize; x++) {
      if (x === anchorX) continue;

      const validation = this.validateStartPosition(x, anchorY, anchorX, anchorY);
      if (validation.valid) {
        validPositions.push({ x, y: anchorY, reason: 'valid' });
      } else {
        validPositions.push({ x, y: anchorY, reason: validation.reason });
      }
    }

    // 检查同一列的所有位置
    for (let y = -gridSize; y <= gridSize; y++) {
      if (y === anchorY) continue;

      const validation = this.validateStartPosition(anchorX, y, anchorX, anchorY);
      if (validation.valid) {
        validPositions.push({ x: anchorX, y, reason: 'valid' });
      } else {
        validPositions.push({ x: anchorX, y, reason: validation.reason });
      }
    }

    return validPositions;
  }
}

// 游戏状态
const gameState = {
  poems: [],
  cells: new Map(),
  poemSet: new Set(),    // 已录入的诗句文本（去重用）
  currentTurn: 1,
  history: [],
  redoStack: [],
  canvas: {
    offsetX: 0,
    offsetY: 0,
    scale: 1
  },
  hoveredCell: null,
  selectedSource: null,
  highlightedCells: [],
  draftMode: false,
  draft: null,
  inputMode: false,
  // 交叉流程状态机
  crossoverFlow: new CrossoverFlowState(),
  // 设置选项
  settings: {
    enableNewCrossoverFlow: true // 是否启用新的三步式交叉流程
  },
  // 保留原有字段以兼容现有代码（后续可逐步移除）
  selectedCell: null, // 当前选中的字（交叉点）
  startPoint: null,   // 起点格子 {x, y, direction}
  selectedDirection: null // selectedDirection: 'H' 或 'V'
};

// 拖拽状态
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

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
const gameCanvas = document.getElementById('game-canvas');
const leftPanel = document.getElementById('left-panel');
const statusLabel = document.getElementById('status-label');
const turnCount = document.getElementById('turn-count');
const poemCount = document.getElementById('poem-count');
const draftBar = document.getElementById('draft-bar');
const poemInput = document.getElementById('poem-input');
const cancelBtn = document.getElementById('cancel-btn');
const backBtn = document.getElementById('back-btn');
const confirmBtn = document.getElementById('confirm-btn');
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');

// Overlay 元素
const startGameOverlay = document.getElementById('start-game-overlay');
const inputOriginOverlay = document.getElementById('input-origin-overlay');
const initialPoemInput = document.getElementById('initial-poem-input');
const initError = document.getElementById('init-error');



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
  gameState.poemSet = new Set([poem.text]);

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
  updatePoemList();
}

// 绘制画布
function drawCanvas() {
  const ctx = gameCanvas.getContext('2d');
  ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

  // 绘制网格
  drawGrid(ctx);

  // 绘制高亮行列（选中字后）
  if (gameState.selectedCell && !gameState.draftMode) {
    drawHighlightedCells(ctx);
  }

  // 绘制诗句
  drawPoems(ctx);

  // 绘制草稿预览
  if (gameState.draftMode && gameState.draft) {
    drawDraftPreview(ctx);
  }

  // 绘制输入方格（在输入模式时）
  if (gameState.inputMode && gameState.draft) {
    drawInputCells(ctx);
  }

  // 绘制交叉流程状态
  drawCrossoverFlowState(ctx);

  // 更新状态提示
  updateStatusText();

  // 更新浮动输入框位置
  if (floatingInput) {
    updateFloatingInputPosition();
  }
}

// 绘制高亮行列 + 方向选择器
function drawHighlightedCells(ctx) {
  if (!gameState.selectedCell) return;

  const centerX = gameCanvas.width / 2 + gameState.canvas.offsetX;
  const centerY = gameCanvas.height / 2 + gameState.canvas.offsetY;
  const scale = gameState.canvas.scale;
  const cellSize = CELL_SIZE * scale;

  const visLeft = Math.floor(-centerX / cellSize) - 1;
  const visRight = Math.ceil((gameCanvas.width - centerX) / cellSize) + 1;
  const visTop = Math.floor(-centerY / cellSize) - 1;
  const visBottom = Math.ceil((gameCanvas.height - centerY) / cellSize) + 1;

  const sx = gameState.selectedCell.x;
  const sy = gameState.selectedCell.y;

  // 方向选择模式：只高亮锚字本身 + 四个相邻空格（带箭头）
  if (gameState.directionPicker) {
    // 高亮锚字
    const spx = centerX + sx * cellSize;
    const spy = centerY + sy * cellSize;
    ctx.fillStyle = 'rgba(100, 149, 237, 0.3)';
    ctx.fillRect(spx, spy, cellSize, cellSize);
    ctx.strokeStyle = '#4169E1';
    ctx.lineWidth = 3;
    ctx.strokeRect(spx, spy, cellSize, cellSize);

    // 四个方向箭头
    const dirs = [
      { dx: -1, dy: 0, arrow: '←' },
      { dx: 1,  dy: 0, arrow: '→' },
      { dx: 0,  dy: -1, arrow: '↑' },
      { dx: 0,  dy: 1,  arrow: '↓' },
    ];
    dirs.forEach(({ dx, dy, arrow }) => {
      const nx = sx + dx, ny = sy + dy;
      const nkey = `${nx},${ny}`;
      if (gameState.cells.has(nkey)) return; // 有字则跳过
      const px = centerX + nx * cellSize;
      const py = centerY + ny * cellSize;
      ctx.fillStyle = 'rgba(100, 149, 237, 0.18)';
      ctx.fillRect(px, py, cellSize, cellSize);
      ctx.strokeStyle = '#4169E1';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.strokeRect(px, py, cellSize, cellSize);
      ctx.fillStyle = '#4169E1';
      ctx.font = `${Math.floor(18 * scale)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(arrow, px + cellSize / 2, py + cellSize / 2);
    });
    return;
  }

  // 普通选中模式：高亮整行整列空格
  for (let gx = visLeft; gx <= visRight; gx++) {
    if (gx === sx) continue;
    if (!gameState.cells.has(`${gx},${sy}`)) {
      const px = centerX + gx * cellSize;
      const py = centerY + sy * cellSize;
      ctx.fillStyle = 'rgba(100, 149, 237, 0.10)';
      ctx.fillRect(px, py, cellSize, cellSize);
      ctx.strokeStyle = 'rgba(100, 149, 237, 0.30)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px, py, cellSize, cellSize);
    }
  }
  for (let gy = visTop; gy <= visBottom; gy++) {
    if (gy === sy) continue;
    if (!gameState.cells.has(`${sx},${gy}`)) {
      const px = centerX + sx * cellSize;
      const py = centerY + gy * cellSize;
      ctx.fillStyle = 'rgba(100, 149, 237, 0.10)';
      ctx.fillRect(px, py, cellSize, cellSize);
      ctx.strokeStyle = 'rgba(100, 149, 237, 0.30)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px, py, cellSize, cellSize);
    }
  }

  // 高亮选中字本身
  const spx = centerX + sx * cellSize;
  const spy = centerY + sy * cellSize;
  ctx.fillStyle = 'rgba(100, 149, 237, 0.25)';
  ctx.fillRect(spx, spy, cellSize, cellSize);
  ctx.strokeStyle = '#4169E1';
  ctx.lineWidth = 3;
  ctx.setLineDash([]);
  ctx.strokeRect(spx, spy, cellSize, cellSize);
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
        // 检查是否是交叉点（与其他诗句共享）
        const key = `${x},${y}`;
        const cell = gameState.cells.get(key);
        const isIntersection = cell && cell.poemIndex !== gameState.poems.indexOf(poem);

        if (isIntersection) {
          // 交叉字符：特殊背景
          ctx.fillStyle = '#e8f5e9'; // Light green background
          ctx.fillRect(pixelX, pixelY, CELL_SIZE * scale, CELL_SIZE * scale);

          // 绘制交叉标记（小圆点）
          ctx.beginPath();
          ctx.arc(pixelX + CELL_SIZE * scale / 2, pixelY + CELL_SIZE * scale - 4 * scale, 3 * scale, 0, Math.PI * 2);
          ctx.fillStyle = '#4CAF50';
          ctx.fill();

          ctx.strokeStyle = '#81c784';
          ctx.lineWidth = 2;
          ctx.strokeRect(pixelX, pixelY, CELL_SIZE * scale, CELL_SIZE * scale);
        } else {
          // 普通字：正常绘制
          ctx.fillStyle = 'white';
          ctx.strokeStyle = '#ccc';
          ctx.lineWidth = 1;
          ctx.fillRect(pixelX, pixelY, CELL_SIZE * scale, CELL_SIZE * scale);
          ctx.strokeRect(pixelX, pixelY, CELL_SIZE * scale, CELL_SIZE * scale);
        }

        ctx.fillStyle = '#333';
        ctx.font = `${24 * scale}px "Noto Serif SC", "SimSun", serif`;
      }
      
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(poem.text[i], pixelX + CELL_SIZE * scale / 2, pixelY + CELL_SIZE * scale / 2);
    }
  });
}

// 绘制草稿预览（由 drawInputCells 处理，此处留空）
function drawDraftPreview(ctx) {
  // inputMode 下由 drawInputCells 负责渲染，无需重复绘制
}

// 绘制方向选择器
function drawDirectionSelector(ctx, cell) {
  if (!cell) return;

  const centerX = gameCanvas.width / 2 + gameState.canvas.offsetX;
  const centerY = gameCanvas.height / 2 + gameState.canvas.offsetY;
  const scale = gameState.canvas.scale;

  const cellPixelX = centerX + cell.x * CELL_SIZE * scale;
  const cellPixelY = centerY + cell.y * CELL_SIZE * scale;
  const cellSize = CELL_SIZE * scale;

  // 在交叉点周围绘制四个方向的可选起点格子
  const directions = [
    { dx: 0, dy: -1, label: '上' },
    { dx: 0, dy: 1, label: '下' },
    { dx: -1, dy: 0, label: '左' },
    { dx: 1, dy: 0, label: '右' }
  ];

  // 绘制虚线箭头提示
  ctx.strokeStyle = 'rgba(76, 175, 80, 0.6)';
  ctx.lineWidth = 2;
  ctx.setLineDash([5 * scale, 5 * scale]);

  directions.forEach(dir => {
    const startX = cellPixelX;
    const startY = cellPixelY;
    const endX = cellPixelX + dir.dx * 1.5 * cellSize;
    const endY = cellPixelY + dir.dy * 1.5 * cellSize;

    // 绘制箭头
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // 绘制箭头头部
    const arrowSize = 10 * scale;
    const angle = Math.atan2(endY - startY, endX - startX);
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowSize * Math.cos(angle - Math.PI / 6),
      endY - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      endX - arrowSize * Math.cos(angle + Math.PI / 6),
      endY - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = 'rgba(76, 175, 80, 0.6)';
    ctx.fill();
  });

  ctx.setLineDash([]); // 重置虚线

  // 显示提示文字
  ctx.fillStyle = 'rgba(76, 175, 80, 0.9)';
  ctx.font = `${14 * scale}px "Noto Serif SC", "SimSun", serif`;
  ctx.textAlign = 'center';
  ctx.fillText('点击选择起点', cellPixelX, cellPixelY + 2.5 * cellSize);
}

// 绘制输入方格
function drawInputCells(ctx) {
  const draft = gameState.draft;
  if (!draft || !draft.inputCells) return;

  const centerX = gameCanvas.width / 2 + gameState.canvas.offsetX;
  const centerY = gameCanvas.height / 2 + gameState.canvas.offsetY;
  const scale = gameState.canvas.scale;
  const cellSize = CELL_SIZE * scale;

  draft.inputCells.forEach((cell, index) => {
    const pixelX = centerX + cell.x * cellSize;
    const pixelY = centerY + cell.y * cellSize;

    const key = `${cell.x},${cell.y}`;
    const existingCell = gameState.cells.get(key);

    let bgColor, borderColor, borderStyle;

    if (cell.locked) {
      // 锚字：绿色锁定
      bgColor = '#c8e6c9';
      borderColor = '#4CAF50';
      borderStyle = 'solid';
    } else if (existingCell && cell.char) {
      bgColor = existingCell.char === cell.char ? '#c8e6c9' : '#ffcdd2';
      borderColor = existingCell.char === cell.char ? '#4CAF50' : '#f44336';
      borderStyle = 'solid';
    } else {
      bgColor = '#fff9c4';
      borderColor = '#ffeb3b';
      borderStyle = 'dashed';
    }

    const isActive = index === draft.currentInputIndex && !cell.locked;
    if (isActive) {
      ctx.shadowColor = 'rgba(76, 175, 80, 0.5)';
      ctx.shadowBlur = 10 * scale;
    }

    ctx.fillStyle = bgColor;
    ctx.fillRect(pixelX, pixelY, cellSize, cellSize);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    ctx.strokeStyle = isActive ? '#4CAF50' : borderColor;
    ctx.lineWidth = isActive ? 3 : 2;
    ctx.setLineDash(borderStyle === 'dashed' ? [5 * scale, 5 * scale] : []);
    ctx.strokeRect(pixelX, pixelY, cellSize, cellSize);
    ctx.setLineDash([]);

    if (cell.char) {
      ctx.fillStyle = cell.locked ? '#555' : '#333';
      ctx.font = `${24 * scale}px "Noto Serif SC", "SimSun", serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(charToDraw, pixelX + cellSize / 2, pixelY + cellSize / 2);
    }
  });
}

// 设置事件监听
function setupEventListeners() {
  gameCanvas.addEventListener('click', handleCanvasClick);
  gameCanvas.addEventListener('mousemove', handleMouseMove);
  gameCanvas.addEventListener('mousedown', handleMouseDown);
  gameCanvas.addEventListener('mousemove', handleMouseMoveForDrag);
  gameCanvas.addEventListener('mouseup', handleMouseUp);
  gameCanvas.addEventListener('mouseleave', handleMouseUp);
  gameCanvas.addEventListener('wheel', handleWheelZoom, { passive: false });
  document.addEventListener('keydown', handleKeyDown);
}

// 处理画布点击
function handleCanvasClick(e) {
  const rect = gameCanvas.getBoundingClientRect();
  const scaleX = gameCanvas.width / rect.width;
  const scaleY = gameCanvas.height / rect.height;
  const clickX = (e.clientX - rect.left) * scaleX;
  const clickY = (e.clientY - rect.top) * scaleY;

  if (gameState.draftMode) return;

  const gridPos = pixelToGrid(clickX, clickY);
  const key = `${gridPos.x},${gridPos.y}`;
  const cell = gameState.cells.get(key);

  // 阶段一：选中一个已有汉字，高亮其所在的行和列
  if (!gameState.selectedCell) {
    if (cell) {
      gameState.selectedCell = { x: gridPos.x, y: gridPos.y, char: cell.char };
      drawCanvas();
    }
    return;
  }

  const sc = gameState.selectedCell;
  const isOnSameRow = gridPos.y === sc.y;
  const isOnSameCol = gridPos.x === sc.x;
  const isSameCell = gridPos.x === sc.x && gridPos.y === sc.y;

  // 再次点击同一个字：切换到方向选择模式
  if (isSameCell) {
    gameState.directionPicker = { x: sc.x, y: sc.y };
    drawCanvas();
    return;
  }

  // 方向选择模式：点击了方向箭头格（锚字上下左右相邻空格）
  if (gameState.directionPicker) {
    const dp = gameState.directionPicker;
    const isAdjacentH = gridPos.y === dp.y && Math.abs(gridPos.x - dp.x) === 1 && !cell;
    const isAdjacentV = gridPos.x === dp.x && Math.abs(gridPos.y - dp.y) === 1 && !cell;
    if (isAdjacentH || isAdjacentV) {
      const direction = isAdjacentH ? 'H' : 'V';
      const sx = gridPos.x - dp.x; // -1 或 1
      const sy = gridPos.y - dp.y;
      gameState.directionPicker = null;
      enterInputMode(dp.x, dp.y, dp.x, dp.y, direction, sx, sy);
      return;
    }
    // 点击了别处，退出方向选择
    gameState.directionPicker = null;
  }

  // 阶段二：点击高亮行列上的空格子作为新诗句起点
  if ((isOnSameRow || isOnSameCol) && !cell) {
    const direction = isOnSameRow ? 'H' : 'V';
    enterInputMode(
      gridPos.x, gridPos.y,
      sc.x, sc.y,
      direction
    );
    return;
  }

  // 点击了另一个已有汉字，切换选中
  if (cell) {
    gameState.selectedCell = { x: gridPos.x, y: gridPos.y, char: cell.char };
    drawCanvas();
    return;
  }

  // 点击空白处取消选中
  gameState.selectedCell = null;
  gameState.highlightedCells = [];
  drawCanvas();
}

// 获取某格子所在行和列的所有格子坐标（用于高亮）
function getLineHighlights(cx, cy) {
  const cells = [];
  const visibleRange = 30; // 高亮延伸范围
  for (let dx = -visibleRange; dx <= visibleRange; dx++) {
    cells.push({ x: cx + dx, y: cy }); // 整行
  }
  for (let dy = -visibleRange; dy <= visibleRange; dy++) {
    if (dy !== 0) cells.push({ x: cx, y: cy + dy }); // 整列（去重中心点）
  }
  return cells;
}

// 进入输入模式
// startX/Y: 新诗句起始格坐标；anchorX/Y: 交叉锚点坐标（已有字）
// stepX/stepY: 可选，强制指定延伸方向（用于起点=锚点的情况）
function enterInputMode(startX, startY, anchorX, anchorY, direction, stepX, stepY) {
  gameState.inputMode = true;
  gameState.selectedCell = null;
  gameState.highlightedCells = [];
  gameState.draftMode = true;

  const anchorOffset = direction === 'H' ? (anchorX - startX) : (anchorY - startY);

  gameState.draft = {
    startX, startY,
    anchorX, anchorY,
    anchorOffset,
    direction,
    forcedStepX: stepX || 0,
    forcedStepY: stepY || 0,
    text: '',
    inputCells: [],
    currentInputIndex: 0
  };

  calculateInputCellPositions();

  statusLabel.textContent = '输入诗句，与锚字交叉';
  draftBar.classList.remove('hidden');
  confirmBtn.disabled = true;

  createFloatingInput();
  drawCanvas();
}

// 处理鼠标移动
function handleMouseMove(e) {
  if (gameState.draftMode || isDragging) {
    if (!isDragging) drawCanvas();
    return;
  }

  const rect = gameCanvas.getBoundingClientRect();
  const scaleX = gameCanvas.width / rect.width;
  const scaleY = gameCanvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;

  const gridPos = pixelToGrid(x, y);
  const key = `${gridPos.x},${gridPos.y}`;
  const cell = gameState.cells.get(key);

  // 鼠标指针：有字 或 在高亮行列的空格上 → pointer
  let isClickable = !!cell;
  if (!isClickable && gameState.selectedCell) {
    const onRow = gridPos.y === gameState.selectedCell.y;
    const onCol = gridPos.x === gameState.selectedCell.x;
    if ((onRow || onCol) && !cell) isClickable = true;
  }

  gameCanvas.style.cursor = isClickable ? 'pointer' : 'default';
  drawCanvas();
}

// 像素坐标转换为网格坐标
function pixelToGrid(pixelX, pixelY) {
  const centerX = gameCanvas.width / 2 + gameState.canvas.offsetX;
  const centerY = gameCanvas.height / 2 + gameState.canvas.offsetY;
  const scale = gameState.canvas.scale;

  const gridX = Math.floor((pixelX - centerX) / (CELL_SIZE * scale));
  const gridY = Math.floor((pixelY - centerY) / (CELL_SIZE * scale));

  return { x: gridX, y: gridY };
}

// 处理输入变化（已废弃，保留以防报错）
function handleInputChange() {}


// 计算输入方格位置
function calculateInputCellPositions() {
  const draft = gameState.draft;
  if (!draft || !draft.path || !draft.path.length) return;

  const maxCells = 20;
  draft.inputCells = [];

  // 确定延伸方向
  let stepX = 0, stepY = 0;
  if (draft.forcedStepX || draft.forcedStepY) {
    stepX = draft.forcedStepX;
    stepY = draft.forcedStepY;
  } else if (draft.direction === 'H') {
    stepX = draft.anchorX >= draft.startX ? 1 : -1;
  } else {
    stepY = draft.anchorY >= draft.startY ? 1 : -1;
  }

  for (let i = 0; i < maxCells; i++) {
    const x = draft.startX + stepX * i;
    const y = draft.startY + stepY * i;

    const key = `${x},${y}`;
    const existing = gameState.cells.get(key);

    draft.inputCells.push({
      x, y,
      char: existing ? existing.char : '',
      locked: !!existing,
      index: i
    });
  }

  draft.currentInputIndex = draft.inputCells.findIndex(c => !c.locked);
  if (draft.currentInputIndex === -1) draft.currentInputIndex = 0;

  draft.stepX = stepX;
  draft.stepY = stepY;
}

// 创建浮动输入框
let floatingInput = null;

function createFloatingInput() {
  // Remove existing floating input if any
  removeFloatingInput();

  // Create new input element
  floatingInput = document.createElement('input');
  floatingInput.type = 'text';
  floatingInput.className = 'floating-cell-input';
  floatingInput.style.cssText = `
    position: absolute;
    width: ${CELL_SIZE}px;
    height: ${CELL_SIZE}px;
    border: 2px solid #4CAF50;
    background: rgba(255, 255, 255, 0.95);
    text-align: center;
    font-size: 24px;
    font-family: "Noto Serif SC", "SimSun", serif;
    padding: 0;
    margin: 0;
    outline: none;
    z-index: 1000;
    pointer-events: auto;
  `;

  // Add event listeners
  floatingInput.addEventListener('input', handleFloatingInput);
  floatingInput.addEventListener('keydown', handleFloatingInputKeyDown);
  floatingInput.addEventListener('compositionstart', () => {
    gameState.isComposing = true;
  });
  floatingInput.addEventListener('compositionend', (e) => {
    gameState.isComposing = false;
    handleFloatingInput(e);
  });

  document.body.appendChild(floatingInput);
  updateFloatingInputPosition();
  floatingInput.focus();
}

// 移除浮动输入框
function removeFloatingInput() {
  if (floatingInput) {
    floatingInput.remove();
    floatingInput = null;
  }
}

// 更新浮动输入框位置
function updateFloatingInputPosition() {
  if (!floatingInput || !gameState.draft || !gameState.draft.inputCells.length) return;

  const draft = gameState.draft;
  const currentCell = draft.inputCells[draft.currentInputIndex];

  const centerX = gameCanvas.width / 2 + gameState.canvas.offsetX;
  const centerY = gameCanvas.height / 2 + gameState.canvas.offsetY;
  const scale = gameState.canvas.scale;

  const pixelX = centerX + currentCell.x * CELL_SIZE * scale;
  const pixelY = centerY + currentCell.y * CELL_SIZE * scale;

  const rect = gameCanvas.getBoundingClientRect();

  floatingInput.style.left = `${rect.left + pixelX}px`;
  floatingInput.style.top = `${rect.top + pixelY}px`;
  floatingInput.style.width = `${CELL_SIZE * scale}px`;
  floatingInput.style.height = `${CELL_SIZE * scale}px`;
  floatingInput.style.fontSize = `${24 * scale}px`;

  // Set current value
  floatingInput.value = currentCell.char || '';
}

// 处理浮动输入框输入
function handleFloatingInput(e) {
  if (gameState.isComposing) return;

  const draft = gameState.draft;
  if (!draft) return;

  const value = e.target.value;
  const currentCell = draft.inputCells[draft.currentInputIndex];
  if (!currentCell || currentCell.locked) return;

  const char = value.slice(-1);
  if (char) {
    currentCell.char = char;
    updateDraftTextFromCells();

    // 移动到下一个非锁定格
    let next = draft.currentInputIndex + 1;
    while (next < draft.inputCells.length && draft.inputCells[next].locked) next++;
    if (next < draft.inputCells.length) {
      draft.currentInputIndex = next;
    }
    updateFloatingInputPosition();
    validateDraft();
    drawCanvas();
  }
}

// 处理浮动输入框键盘事件
function handleFloatingInputKeyDown(e) {
  const draft = gameState.draft;
  if (!draft) return;

  switch (e.key) {
    case 'ArrowLeft':
    case 'ArrowUp': {
      e.preventDefault();
      let prev = draft.currentInputIndex - 1;
      while (prev >= 0 && draft.inputCells[prev].locked) prev--;
      if (prev >= 0) {
        draft.currentInputIndex = prev;
        updateFloatingInputPosition();
        drawCanvas();
      }
      break;
    }
    case 'ArrowRight':
    case 'ArrowDown': {
      e.preventDefault();
      let next = draft.currentInputIndex + 1;
      while (next < draft.inputCells.length && draft.inputCells[next].locked) next++;
      if (next < draft.inputCells.length) {
        draft.currentInputIndex = next;
        updateFloatingInputPosition();
        drawCanvas();
      }
      break;
    }
    case 'Backspace': {
      e.preventDefault();
      const currentCell = draft.inputCells[draft.currentInputIndex];
      if (!currentCell.locked && currentCell.char) {
        currentCell.char = '';
      } else {
        // 退回到上一个非锁定格并清空
        let prev = draft.currentInputIndex - 1;
        while (prev >= 0 && draft.inputCells[prev].locked) prev--;
        if (prev >= 0) {
          draft.currentInputIndex = prev;
          draft.inputCells[prev].char = '';
        }
      }
      updateDraftTextFromCells();
      updateFloatingInputPosition();
      validateDraft();
      drawCanvas();
      break;
    }
    case 'Enter':
      if (!confirmBtn.disabled) confirmDraft();
      break;
    case 'Escape':
      exitDraftMode();
      break;
  }
}

// 从方格更新草稿文本
function updateDraftTextFromCells() {
  const draft = gameState.draft;
  if (!draft) return;

  // 找最后一个有字的格
  let lastFilled = -1;
  for (let i = draft.inputCells.length - 1; i >= 0; i--) {
    if (draft.inputCells[i].char) { lastFilled = i; break; }
  }

  draft.text = draft.inputCells.slice(0, lastFilled + 1).map(c => c.char).join('');
}

// 退出草稿模式
function exitDraftMode() {
  gameState.draftMode = false;
  gameState.inputMode = false;
  gameState.draft = null;
  gameState.selectedCell = null;
  gameState.directionPicker = null;
  gameState.directionSelector = null;

  removeFloatingInput();

  statusLabel.textContent = '点击已有字，选起点，接龙';
  draftBar.classList.add('hidden');
  confirmBtn.disabled = true;

  drawCanvas();
}

// 处理输入变化（已废弃，保留以防报错）
function handleInputChange() {}

// 验证草稿
function validateDraft() {
  const draft = gameState.draft;
  if (!draft || !draft.inputCells) {
    confirmBtn.disabled = true;
    return;
  }

  // 找到最后一个有字的格作为截断
  let lastFilled = -1;
  for (let i = draft.inputCells.length - 1; i >= 0; i--) {
    if (draft.inputCells[i].char) { lastFilled = i; break; }
  }
  if (lastFilled < 0) { confirmBtn.disabled = true; setDraftHint('在格子中逐字输入，与已有字重合即可接龙'); return; }

  const usedCells = draft.inputCells.slice(0, lastFilled + 1);

  let hasOverlap = false;
  let hasConflict = false;
  let hasNewChar = false;

  for (const cell of usedCells) {
    if (!cell.char) {
      confirmBtn.disabled = true;
      setDraftHint('诗句中间不能有空格');
      return;
    }
    const existing = gameState.cells.get(`${cell.x},${cell.y}`);
    if (existing) {
      if (existing.char === cell.char) hasOverlap = true;
      else hasConflict = true;
    } else {
      hasNewChar = true;
    }
  }

  if (hasConflict) { confirmBtn.disabled = true; setDraftHint('与已有文字冲突'); return; }
  if (!hasOverlap) { confirmBtn.disabled = true; setDraftHint('需要与已有字重合'); return; }
  if (!hasNewChar) { confirmBtn.disabled = true; setDraftHint('需要有新的文字'); return; }

  // 重复检测
  const text = usedCells.map(c => c.char).join('');
  if (gameState.poemSet.has(text)) {
    confirmBtn.disabled = true;
    setDraftHint('「' + text + '」已录入过，请换一句');
    return;
  }

  confirmBtn.disabled = false;
  setDraftHint('在格子中逐字输入，与已有字重合即可接龙');
}

function setDraftHint(msg) {
  const hint = document.getElementById('draft-hint');
  if (hint) hint.textContent = msg;
}

// 确认草稿
function confirmDraft() {
  if (confirmBtn.disabled || !gameState.draft) return;

  const draft = gameState.draft;

  // 找到最后一个有字的格
  let lastFilled = -1;
  for (let i = draft.inputCells.length - 1; i >= 0; i--) {
    if (draft.inputCells[i].char) { lastFilled = i; break; }
  }
  if (lastFilled < 0) return;

  const usedCells = draft.inputCells.slice(0, lastFilled + 1);
  const text = usedCells.map(c => c.char).join('');

  const newPoem = {
    text,
    x: usedCells[0].x,
    y: usedCells[0].y,
    direction: draft.direction,
    turn: gameState.currentTurn + 1
  };

  gameState.poems.push(newPoem);
  const newPoemIndex = gameState.poems.length - 1;

  // 记录本回合新增的 cell keys（用于撤销）
  const newKeys = [];
  for (let i = 0; i < usedCells.length; i++) {
    const cell = usedCells[i];
    const key = `${cell.x},${cell.y}`;
    if (!gameState.cells.has(key)) {
      gameState.cells.set(key, {
        char: cell.char,
        poemIndex: gameState.poems.length - 1,
        charIndex: i
      });
      newKeys.push(key);
    }
  }
  gameState.history.push(newKeys);
  gameState.redoStack = [];
  gameState.poemSet.add(text); // 登记诗句

  gameState.currentTurn++;
  updateUI();
  exitDraftMode();
}

// 处理键盘事件
function handleKeyDown(e) {
  const crossoverFlow = gameState.crossoverFlow;

  // 处理交叉流程的键盘事件
  if (crossoverFlow.step !== 'IDLE' && e.key === 'Escape') {
    crossoverFlow.cancel();
    clearOldState();
    drawCanvas();
    return;
  }

  if (gameState.draftMode) {
    if (e.key === 'Escape') {
      exitDraftMode();
    } else if (e.key === 'Enter' && !confirmBtn.disabled) {
      confirmDraft();
    }
  } else {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undoLastPoem();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      redoLastPoem();
    }
  }
}

// 更新UI
function updateUI() {
  turnCount.textContent = gameState.currentTurn;
  poemCount.textContent = gameState.poems.length;
  undoBtn.disabled = gameState.history.length === 0;
  redoBtn.disabled = gameState.redoStack.length === 0;
  updatePoemList();
}

// 更新诗句列表面板
function updatePoemList() {
  const list = document.getElementById('poem-list');
  if (!list) return;
  list.innerHTML = '';
  gameState.poems.forEach((poem, i) => {
    const item = document.createElement('div');
    item.style.cssText = `
      padding: 5px 8px; margin-bottom: 4px; border-radius: 4px;
      font-size: 14px; font-family: "Noto Serif SC","SimSun",serif;
      color: #444; background: ${i === 0 ? '#f8f8f8' : '#fff'};
      border: 1px solid #eee; display: flex; align-items: center; gap: 6px;
    `;
    const num = document.createElement('span');
    num.textContent = i + 1;
    num.style.cssText = 'color:#ccc;font-size:11px;min-width:16px;text-align:right;flex-shrink:0;';
    const text = document.createElement('span');
    text.textContent = poem.text;
    item.appendChild(num);
    item.appendChild(text);
    list.appendChild(item);
  });
}

// 撤销最后一首诗
function undoLastPoem() {
  if (gameState.history.length === 0) return;

  const newKeys = gameState.history.pop();
  const poem = gameState.poems.pop();

  newKeys.forEach(key => gameState.cells.delete(key));
  gameState.poemSet.delete(poem.text);

  gameState.redoStack.push({ poem, newKeys });

  gameState.currentTurn--;
  updateUI();
  updatePoemList();
  drawCanvas();
}

// 重做
function redoLastPoem() {
  if (gameState.redoStack.length === 0) return;

  const { poem, newKeys } = gameState.redoStack.pop();

  gameState.poems.push(poem);
  gameState.poemSet.add(poem.text);

  newKeys.forEach(key => {
    const [x, y] = key.split(',').map(Number);
    const charIndex = poem.direction === 'H' ? x - poem.x : y - poem.y;
    gameState.cells.set(key, {
      char: poem.text[charIndex],
      poemIndex: gameState.poems.length - 1,
      charIndex
    });
  });

  gameState.history.push(newKeys);
  gameState.currentTurn++;
  updateUI();
  updatePoemList();
  drawCanvas();
}
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

// 显示输入错误提示
function showErrorMessage(message) {
  const errorDiv = document.getElementById('init-error');

  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
  }

  // Also show in the input bar if available
  statusLabel.textContent = message;
  statusLabel.style.color = '#c44';
  setTimeout(() => {
    statusLabel.style.color = '#666';
    updateStatusText();
  }, 2000);
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

  // Get canvas bounding rect and calculate exact position
  const rect = gameCanvas.getBoundingClientRect();
  const scaleX = gameCanvas.width / rect.width;
  const scaleY = gameCanvas.height / rect.height;
  const mouseX = (e.clientX - rect.left) * scaleX;
  const mouseY = (e.clientY - rect.top) * scaleY;

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

// ========== 欢迎界面相关函数 ==========

// 显示开始界面
function showStartOverlay() {
  const overlay = document.getElementById('start-game-overlay');
  const inputOverlay = document.getElementById('input-origin-overlay');
  const gameContainer = document.getElementById('game-container');
  
  if (overlay) overlay.classList.remove('hidden');
  if (inputOverlay) inputOverlay.classList.add('hidden');
  if (gameContainer) gameContainer.classList.add('hidden');
}

// 显示输入起始诗句界面
function showInputOverlay() {
  const overlay = document.getElementById('start-game-overlay');
  const inputOverlay = document.getElementById('input-origin-overlay');
  
  if (overlay) overlay.classList.add('hidden');
  if (inputOverlay) {
    inputOverlay.classList.remove('hidden');
    // 聚焦到输入框
    setTimeout(() => {
      const input = document.getElementById('initial-poem-input');
      if (input) {
        input.value = '';
        input.focus();
      }
    }, 100);
  }
  hideInitError();
}

// 隐藏错误提示
function hideInitError() {
  const errorDiv = document.getElementById('init-error');
  const input = document.getElementById('initial-poem-input');
  
  if (errorDiv) errorDiv.classList.add('hidden');
  if (input) input.classList.remove('error');
}

// 显示错误提示
function showInitError(message) {
  const errorDiv = document.getElementById('init-error');
  const input = document.getElementById('initial-poem-input');
  
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
  }
  if (input) input.classList.add('error');
}

// 使用输入的诗句开始游戏
function startGameWithInitialPoem() {
  const input = document.getElementById('initial-poem-input');
  const poemText = input ? input.value.trim() : '';
  
  // 验证输入
  if (!poemText) {
    showInitError('请输入起始诗句');
    return;
  }
  
  if (poemText.length < 2) {
    showInitError('诗句至少需要2个字');
    return;
  }
  
  // 设置起始诗句
  INITIAL_POEM.text = poemText;
  INITIAL_POEM.x = 0;
  INITIAL_POEM.y = 0;
  INITIAL_POEM.direction = "H";
  
  // 隐藏输入界面
  const inputOverlay = document.getElementById('input-origin-overlay');
  if (inputOverlay) inputOverlay.classList.add('hidden');
  
  // 显示游戏界面
  const gameContainer = document.getElementById('game-container');
  if (gameContainer) gameContainer.classList.remove('hidden');
  
  // 初始化游戏
  initGame();
}

// 返回到开始界面
function backToStartOverlay() {
  showStartOverlay();
}

// ========== 导出 / 导入 ==========

function exportGame() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    currentTurn: gameState.currentTurn,
    poems: gameState.poems,
    history: gameState.history,   // 每项是 newKeys 数组
  };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toLocaleDateString('zh-CN').replace(/\//g, '-');
  a.href = url;
  a.download = `诗词接龙_${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importGame(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.poems || !Array.isArray(data.poems) || data.poems.length === 0) {
        alert('存档格式不正确');
        return;
      }
      restoreFromSave(data);
    } catch (err) {
      alert('读取存档失败：' + err.message);
    }
  };
  reader.readAsText(file);
}

function restoreFromSave(data) {
  // 重置状态
  gameState.poems = data.poems;
  gameState.currentTurn = data.currentTurn || data.poems.length;
  gameState.history = data.history || [];
  gameState.redoStack = [];
  gameState.cells = new Map();
  gameState.poemSet = new Set();
  gameState.selectedCell = null;
  gameState.directionPicker = null;
  gameState.draftMode = false;
  gameState.inputMode = false;
  gameState.draft = null;
  removeFloatingInput();

  // 从 poems 重建 cells 和 poemSet
  gameState.poems.forEach((poem, poemIndex) => {
    gameState.poemSet.add(poem.text);
    for (let i = 0; i < poem.text.length; i++) {
      const x = poem.x + (poem.direction === 'H' ? i : 0);
      const y = poem.y + (poem.direction === 'V' ? i : 0);
      const key = `${x},${y}`;
      if (!gameState.cells.has(key)) {
        gameState.cells.set(key, { char: poem.text[i], poemIndex, charIndex: i });
      }
    }
  });

  // 显示游戏界面（如果还在欢迎页就跳过去）
  document.getElementById('start-game-overlay')?.classList.add('hidden');
  document.getElementById('input-origin-overlay')?.classList.add('hidden');
  document.getElementById('game-container')?.classList.remove('hidden');

  // 初始化画布（如果还没初始化）
  if (gameCanvas.width === 0) initCanvas();

  draftBar.classList.add('hidden');
  updateUI();
  drawCanvas();
}

// 初始化游戏
// 页面加载完成后设置事件监听
window.addEventListener('DOMContentLoaded', () => {
  // 初始化触摸优化
  initializeTouchOptimization();

  // 初始化默认模式
  initializeDefaultMode();

  // 开始界面 - 点击任意处继续
  const startOverlay = document.getElementById('start-game-overlay');
  if (startOverlay) {
    startOverlay.addEventListener('click', () => {
      showInputOverlay();
    });
  }
  
  // 返回按钮
  const backBtn = document.getElementById('back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      backToStartOverlay();
    });
  }
  
  // 开始游戏按钮
  const beginGameBtn = document.getElementById('begin-game-btn');
  if (beginGameBtn) {
    beginGameBtn.addEventListener('click', () => {
      startGameWithInitialPoem();
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
    
    initialPoemInput.addEventListener('input', () => {
      hideInitError();
    });
  }
  
  // 撤销/重做按钮
  if (undoBtn) undoBtn.addEventListener('click', undoLastPoem);
  if (redoBtn) redoBtn.addEventListener('click', redoLastPoem);

  // 导出/导入按钮
  document.getElementById('export-btn')?.addEventListener('click', exportGame);
  const importFileInput = document.getElementById('import-file');
  document.getElementById('import-btn')?.addEventListener('click', () => importFileInput?.click());
  importFileInput?.addEventListener('change', (e) => {
    importGame(e.target.files[0]);
    e.target.value = ''; // 允许重复导入同一文件
  });

  // 草稿栏按钮事件
  if (cancelBtn) {
    cancelBtn.addEventListener('click', exitDraftMode);
  }
  if (confirmBtn) {
    confirmBtn.addEventListener('click', confirmDraft);
  }
  
  // 显示开始界面
  showStartOverlay();
});