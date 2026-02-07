import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { updateAnnotationGraphics } from './updateAnnotationGraphics';
import { v4 as uuidv4 } from 'uuid';

export interface AnnotationData {
  id: string;
  name: string;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface PixiJSCoreCallbacks {
  onAnnotationSelected?: (id: string, label: string) => void;
  onAnnotationCreated?: (annotation: AnnotationData) => void;
  onAnnotationUpdated?: (id: string, rect: AnnotationData['rect']) => void;
  onImageLoaded?: (width: number, height: number) => void;
}

export type HandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface InternalAnnotationState {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pixiContainer: PIXI.Container | null;
}

enum MouseMode {
  move,
  select,
}

let instanceCounter = 0;
export class PixiJSCore {
  private app: PIXI.Application | null = null;
  private imageSprite: PIXI.Sprite | null = null;
  private viewport: Viewport | null = null;
  private drawingRect: PIXI.Graphics | null = null;
  private annotations: AnnotationData[] = [];
  private annotationStates: Map<string, InternalAnnotationState> = new Map();
  private callbacks: PixiJSCoreCallbacks = {};

  // 交互状态
  private _isDrawing = false;
  private _drawStart: { x: number; y: number } | null = null;
  private isDragging = false;

  get isDrawing(): boolean {
    return this._isDrawing;
  }

  set isDrawing(value: boolean) {
    this._isDrawing = value;
    this.log('isDrawing changed to:', value);
  }

  get drawStart(): { x: number; y: number } | null {
    return this._drawStart;
  }

  set drawStart(value: { x: number; y: number } | null) {
    this._drawStart = value;
    this.log('drawStart changed to:', value);
  }

  private isResizing = false;
  private dragStart: { x: number; y: number } | null = null;
  private originalPosition: { x: number; y: number; width: number; height: number } | null = null;
  private selectedAnnotationId: string | null = null;
  private resizeHandle: HandleType | null = null;

  private mouseMode = MouseMode.select;

  private instanceId: string = `PixiJSCore_${++instanceCounter}`;

  log = (...args: any[]) => {
    console.log(`[${this.instanceId}]`, ...args);
  };

  constructor(callbacks: PixiJSCoreCallbacks = {}) {
    this.callbacks = callbacks;
    this.log('instance created with callbacks:', this, callbacks);
  }

  updateCallbacks(callbacks: PixiJSCoreCallbacks): void {
    this.callbacks = callbacks;
    this.log('Callbacks updated:', this, callbacks);
  }

  /**
   * 初始化 PixiJS 应用
   */
  async initialize(containerElement: HTMLElement, imagePath: string): Promise<void> {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // 添加跨域支持
    img.onload = async () => {
      try {
        const bbox = containerElement.getBoundingClientRect();
        const width = bbox.width;
        const height = bbox.height;

        // 通知 React 图像已加载
        this.callbacks.onImageLoaded?.(img.width, img.height);

        // 创建 PixiJS 应用
        const app = new PIXI.Application();
        await app.init({
          width,
          height,
          backgroundColor: 0xf0f0f0,
          antialias: true,
        });

        if (containerElement) {
          containerElement.appendChild(app.canvas);
          this.app = app;
        }

        // 创建 viewport（支持缩放和平移）
        const viewport = new Viewport({
          screenWidth: width,
          screenHeight: height,
          worldWidth: img.width,
          worldHeight: img.height,
          events: app.renderer.events,
          passiveWheel: false,
        });
        this.viewport = viewport;

        // 配置 viewport 插件
        viewport
          .drag({
            pressDrag: true,
            factor: 1,
            mouseButtons: 'left',
          })
          .wheel({
            percent: 0.1,
            center: null,
            wheelZoom: true,
          })
          .clampZoom({
            minScale: 0.5,
            maxScale: 3,
          })
          .decelerate({
            friction: 0.95,
          });
        
        viewport.plugins.pause('drag');

        app.stage.addChild(viewport);

        // 使用已加载的图片创建纹理
        const texture = PIXI.Texture.from(img);
        const sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(0, 0);
        viewport.addChild(sprite);
        this.imageSprite = sprite;


        // 创建绘制矩形图层
        const graphics = new PIXI.Graphics();
        graphics.eventMode = 'static';
        app.stage.addChild(graphics);
        this.drawingRect = graphics;

        // app basic layers created
        
        // 设置画布点击事件
        this.setupCanvasEvents();

        this.renderAnnotations(this.annotations);

        this.log('Image loaded with size:', img.width, img.height);
        this.log('Viewport initialized with world size:', viewport.worldWidth, viewport.worldHeight);
        this.log('Sprite added to viewport:', sprite.width, sprite.height);
      } catch (error) {
        console.error('Error initializing PixiJS:', error);
        this.callbacks.onImageLoaded?.(0, 0);
      }
    };

    img.onerror = () => {
      console.error('Failed to load image:', imagePath);
      this.callbacks.onImageLoaded?.(0, 0);
    };

    img.src = imagePath;
  }

  /**
   * 设置画布事件
   */
  private setupCanvasEvents(): void {
    if (!this.app) return;

    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;
    this.app.stage.on('pointerdown', event => this.handleCanvasClick(event));
    this.app.stage.on('pointermove', (event: PIXI.FederatedPointerEvent) => {
      this.handleAnnotationPointerMove(event, this.selectedAnnotationId);
    });

    window.addEventListener('keydown', this.handleSpaceKeyDown);

    window.addEventListener('keyup', this.handleSpaceKeyUp);

  }

  handleSpaceKeyDown = (e: KeyboardEvent): void => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (e.repeat === false) {
        this.isDragging = false;
        this.log('Space key pressed - switching to move mode');
        this.viewport!.plugins.resume('drag');
        this.mouseMode = MouseMode.move;
      }
    }
  }

  handleSpaceKeyUp = (e: KeyboardEvent): void => {
    if (e.code === 'Space') {
      e.preventDefault();
      this.log('Space key released - switching to select mode');
      this.viewport!.plugins.pause('drag');
      this.mouseMode = MouseMode.select;
    }
  }

  setAnnotations(annotations: AnnotationData[]): void {
    console.log('Setting annotations:', annotations);
    this.annotations = annotations;
    this.renderAnnotations(annotations);
  }
  /**
   * 渲染标注
   */
  renderAnnotations(annotations: AnnotationData[]): void {
    if (!this.app || !this.imageSprite || !this.drawingRect) {
      return;
    }

    console.log('Rendering annotations:', annotations);

    const sprite = this.imageSprite;
    const graphics = this.drawingRect;
    graphics.clear();

    // 清除旧的标注容器
    this.annotationStates.forEach((ann) => {
      if (ann.pixiContainer && ann.pixiContainer.parent) {
        ann.pixiContainer.parent.removeChild(ann.pixiContainer);
      }
    });
    this.annotationStates.clear();

    const scaleX = sprite.scale.x;
    const scaleY = sprite.scale.y;
    const spriteX = sprite.x ?? 0;
    const spriteY = sprite.y ?? 0;

    // 渲染每个标注
    annotations.forEach((ann) => {
      const rect = ann.rect;
      const id = ann.id;
      const label = ann.name;

      // 创建标注容器
      const container = new PIXI.Container();
      container.x = rect.x * scaleX + spriteX;
      container.y = rect.y * scaleY + spriteY;
      container.scale.set(scaleX, scaleY);
      container.zIndex = 0;

      // 创建矩形图形
      const rectGraphics = new PIXI.Graphics();
      updateAnnotationGraphics(rectGraphics, this.selectedAnnotationId === id, rect.width, rect.height);
      container.addChild(rectGraphics);

      // 添加标签文本
      const text = new PIXI.Text(label, {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: 0x000000,
        fontWeight: 'bold',
      });
      text.x = 0;
      text.y = -16;
      container.addChild(text);

      this.viewport!.addChild(container);

      // 保存标注状态
      this.annotationStates.set(id, {
        id,
        label,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        pixiContainer: container,
      });
    });

    graphics.lineStyle(0);
  }

  /**
   * 选择标注
   */
  selectAnnotation(id: string, label: string): void {
    if (this.selectedAnnotationId === id) {
      return;
    }
    this.selectedAnnotationId = id;
    this.callbacks.onAnnotationSelected?.(id, label);

    // 更新视觉效果
    this.annotationStates.forEach((ann) => {
      if (ann.pixiContainer) {
        const rectGraphics = ann.pixiContainer.getChildAt(0) as PIXI.Graphics;
        if (rectGraphics) {
          updateAnnotationGraphics(rectGraphics, this.selectedAnnotationId === ann.id, ann.width, ann.height);
        }
      }
    });
  }

  /**
   * 处理画布点击
   */
  private async handleCanvasClick(event: PIXI.FederatedPointerEvent): Promise<void> {
    if (!this.imageSprite) return;

    this.log('Canvas clicked at:', this, event.global.x, event.global.y);
    if (this.mouseMode === MouseMode.move) {
      return;
    }

    // 检查是否点到其他标注上
    await new Promise(resolve => setTimeout(resolve, 100)); // 等待事件冒泡完成
    if (this.selectedAnnotationId) {
      this.log('Clicked on annotation, not starting new one');
      return;
    }

    const sprite = this.imageSprite;
    const globalX = event.global.x;
    const globalY = event.global.y;

    // 转换到图像坐标
    const localX = (globalX - (sprite.x ?? 0)) / sprite.scale.x;
    const localY = (globalY - (sprite.y ?? 0)) / sprite.scale.y;

    // 开始绘制
    this.isDrawing = true;
    this.drawStart = { x: localX, y: localY };

    // 清除绘制矩形
    if (this.drawingRect) {
      this.drawingRect.clear();
    }

  }

  /**
   * 处理鼠标移动（绘制）
   */
  handleMouseMove(event: PIXI.FederatedPointerEvent): void {
    if (!this.isDrawing || !this.drawStart || !this.drawingRect) return;
    
    const sprite = this.imageSprite;
    if (!sprite) return;

    this.log('Global mouse move:', event.global.x, event.global.y);
    this.log('Is drawing:', this, this.isDrawing, 'Draw start:', this.drawStart);

    const globalX = event.global.x;
    const globalY = event.global.y;

    const localX = (globalX - (sprite.x ?? 0)) / sprite.scale.x;
    const localY = (globalY - (sprite.y ?? 0)) / sprite.scale.y;

    const graphics = this.drawingRect;
    graphics.clear();
    graphics.fillStyle = 0x3b82f6;
    // 绘制正在绘制的矩形
    const x = Math.min(this.drawStart.x, localX);
    const y = Math.min(this.drawStart.y, localY);
    const width = Math.abs(localX - this.drawStart.x);
    const height = Math.abs(localY - this.drawStart.y);

    graphics.rect(
      x * sprite.scale.x + (sprite.x ?? 0),
      y * sprite.scale.y + (sprite.y ?? 0),
      width * sprite.scale.x,
      height * sprite.scale.y
    );
    console.log('Drawing rectangle at:', x, y, width, height);
    graphics.stroke({ color: 0x3b82f6, width: 2 });
  }

  /**
   * 处理鼠标释放（创建新标注）
   */
  handleMouseUp(event: PIXI.FederatedPointerEvent): void {
    if (!this.isDrawing || !this.drawStart) return;

    this.isDrawing = false;

    const sprite = this.imageSprite;
    if (!sprite) return;

    const globalX = event.global.x;
    const globalY = event.global.y;

    const localX = (globalX - (sprite.x ?? 0)) / sprite.scale.x;
    const localY = (globalY - (sprite.y ?? 0)) / sprite.scale.y;

    const width = Math.abs(localX - this.drawStart.x);
    const height = Math.abs(localY - this.drawStart.y);

    // 忽略太小的矩形
    if (width < 10 || height < 10) {
      this.drawStart = null;
      if (this.drawingRect) {
        this.drawingRect.clear();
      }
      return;
    }

    // 创建新标注
    const x = Math.min(this.drawStart.x, localX);
    const y = Math.min(this.drawStart.y, localY);
    const id = uuidv4();
    const label = `Annotation ${this.annotationStates.size + 1}`;

    // 选中新标注
    this.selectAnnotation(id, label);

    // 通知 React 新标注已创建
    this.callbacks.onAnnotationCreated?.({
      id,
      name: label,
      rect: { x, y, width, height },
    });

    this.drawStart = null;
    if (this.drawingRect) {
      this.drawingRect.clear();
    }
  }

  /**
   * 处理标注容器指针移动
   */
  handleAnnotationPointerMove(event: PIXI.FederatedPointerEvent, annotationId: string | null): void {
    if (!annotationId) return;

    const ann = this.annotationStates.get(annotationId);
    if (!ann) return;

    const sprite = this.imageSprite;
    if (!sprite) return;

    event.stopPropagation();

    const globalX = event.global.x;
    const globalY = event.global.y;

    if (this.isResizing && this.originalPosition) {
      // 调整大小
      const dx = (globalX - this.dragStart!.x) / sprite.scale.x;
      const dy = (globalY - this.dragStart!.y) / sprite.scale.y;

      const handle = this.resizeHandle!;
      let newWidth = this.originalPosition.width;
      let newHeight = this.originalPosition.height;
      let newX = this.originalPosition.x;
      let newY = this.originalPosition.y;

      switch (handle) {
        case 'nw':
          newWidth = Math.max(20, this.originalPosition.width + dx);
          newHeight = Math.max(20, this.originalPosition.height + dy);
          break;
        case 'n':
          newHeight = Math.max(20, this.originalPosition.height + dy);
          break;
        case 'ne':
          newWidth = Math.max(20, this.originalPosition.width - dx);
          newHeight = Math.max(20, this.originalPosition.height + dy);
          break;
        case 'e':
          newWidth = Math.max(20, this.originalPosition.width - dx);
          break;
        case 'se':
          newWidth = Math.max(20, this.originalPosition.width - dx);
          newHeight = Math.max(20, this.originalPosition.height - dy);
          break;
        case 's':
          newHeight = Math.max(20, this.originalPosition.height - dy);
          break;
        case 'sw':
          newX = this.originalPosition.x + dx;
          newHeight = Math.max(20, this.originalPosition.height - dy);
          break;
        case 'w':
          newX = this.originalPosition.x + dx;
          newHeight = Math.max(20, this.originalPosition.height - dy);
          break;
        default:
          this.updateAnnotationPosition(annotationId, ann.x + dx, ann.y + dy, ann.width, ann.height);
          return;
      }

      // 更新标注
    } 
    this.callbacks.onAnnotationUpdated?.(annotationId, { x: ann.x, y: ann.y, width: ann.width, height: ann.height });
  }

  /**
   * 更新标注位置
   */
  private updateAnnotationPosition(
    id: string,
    newX: number,
    newY: number,
    newWidth: number,
    newHeight: number
  ): void {
    const ann = this.annotationStates.get(id);
    if (!ann || !ann.pixiContainer) return;

    const sprite = this.imageSprite;
    if (!sprite) return;

    const scaleX = sprite.scale.x;
    const scaleY = sprite.scale.y;

    // 更新容器位置
    ann.pixiContainer.x = newX * scaleX + (sprite.x ?? 0);
    ann.pixiContainer.y = newY * scaleY + (sprite.y ?? 0);

    // 更新标注数据
    this.annotationStates.set(id, {
      ...ann,
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    });

    // 重新绘制标注图形
    const rectGraphics = ann.pixiContainer.getChildAt(0) as PIXI.Graphics;
    if (rectGraphics) {
      rectGraphics.clear();
      updateAnnotationGraphics(rectGraphics, true, newWidth, newHeight);
    }

    // 通知 React 标注已更新
    this.callbacks.onAnnotationUpdated?.(id, { x: newX, y: newY, width: newWidth, height: newHeight });
  }

  /**
   * 处理指针释放
   */
  handleAnnotationPointerUp(): void {
    this.isDragging = false;
    this.isResizing = false;
    this.selectedAnnotationId = null;
    this.resizeHandle = null;
    this.originalPosition = null;
    this.dragStart = null;
  }

  /**
   * 更新标注标签
   */
  updateAnnotationLabel(id: string, newLabel: string): void {
    const ann = this.annotationStates.get(id);
    if (ann) {
      ann.label = newLabel;

      // 更新标签文本
      if (ann.pixiContainer) {
        const text = ann.pixiContainer.getChildAt(1) as PIXI.Text;
        if (text) {
          text.text = newLabel;
        }
      }
    }
  }

  /**
   * 删除标注
   */
  deleteAnnotation(id: string): void {
    const ann = this.annotationStates.get(id);
    if (ann?.pixiContainer) {
      ann.pixiContainer.parent?.removeChild(ann.pixiContainer);
    }
    this.annotationStates.delete(id);
  }

  /**
   * 获取所有标注数据
   */
  getAllAnnotations(): AnnotationData[] {
    return Array.from(this.annotationStates.values()).map((ann) => ({
      id: ann.id,
      name: ann.label,
      rect: { x: ann.x, y: ann.y, width: ann.width, height: ann.height },
    }));
  }

  /**
   * 获取指定标注数据
   */
  getAnnotation(id: string): AnnotationData | null {
    const ann = this.annotationStates.get(id);
    if (!ann) return null;

    return {
      id: ann.id,
      name: ann.label,
      rect: { x: ann.x, y: ann.y, width: ann.width, height: ann.height },
    };
  }

  /**
   * 重置视图到初始状态
   */
  resetView(): void {
    if (!this.viewport) return;

    // 重置缩放和位置到初始状态
    this.viewport.setZoom(1);
    this.viewport.moveCorner(0, 0);
  }

  /**
   * 销毁 PixiJS 应用
   */
  destroy(): void {
    this.log('PixiJSCore Destroying PixiJS application and cleaning up resources');
    if (this.app) {
      this.app.destroy(true);
      this.app = null;
    }
    this.imageSprite = null;
    this.viewport = null;
    this.drawingRect = null;
    this.annotationStates.clear();

    window.removeEventListener('keydown', this.handleSpaceKeyDown);  
    window.removeEventListener('keyup', this.handleSpaceKeyUp);
  }
}
