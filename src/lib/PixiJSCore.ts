import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';


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

type HandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface InternalAnnotationState {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pixiContainer: PIXI.Container | null;
}

export class PixiJSCore {
  private app: PIXI.Application | null = null;
  private imageSprite: PIXI.Sprite | null = null;
  private viewport: any | null = null;
  private drawingRect: PIXI.Graphics | null = null;
  private annotations: Map<string, InternalAnnotationState> = new Map();

  private containerElement: HTMLElement | null = null;
  private imagePath: string = '';
  private callbacks: PixiJSCoreCallbacks = {};

  // 交互状态
  private isDrawing = false;
  private drawStart: { x: number; y: number } | null = null;
  private isDragging = false;
  private isResizing = false;
  private dragStart: { x: number; y: number } | null = null;
  private originalPosition: { x: number; y: number; width: number; height: number } | null = null;
  private resizeHandle: HandleType | null = null;

  constructor(callbacks: PixiJSCoreCallbacks = {}) {
    this.callbacks = callbacks;
  }

  /**
   * 初始化 PixiJS 应用
   */
  async initialize(containerElement: HTMLElement, imagePath: string): Promise<void> {
    this.containerElement = containerElement;
    this.imagePath = imagePath;

    const img = new Image();
    img.onload = async () => {
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

      app.stage.addChild(viewport);

      // 加载图像
      const texture = PIXI.Texture.from(imagePath);
      const sprite = new PIXI.Sprite(texture);
      sprite.anchor.set(0, 0);
      viewport.addChild(sprite);
      this.imageSprite = sprite;

      // 创建绘制矩形图层
      const graphics = new PIXI.Graphics();
      graphics.eventMode = 'static';
      app.stage.addChild(graphics);
      this.drawingRect = graphics;

      // 设置画布点击事件
      this.setupCanvasEvents();

      console.log('Image loaded with size:', img.width, img.height);
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
    this.app.stage.on('pointerdown', this.handleCanvasClick.bind(this));
  }

  /**
   * 渲染标注
   */
  renderAnnotations(annotations: AnnotationData[]): void {
    if (!this.app || !this.imageSprite || !this.drawingRect) {
      return;
    }

    const sprite = this.imageSprite;
    const graphics = this.drawingRect;
    graphics.clear();

    // 清除旧的标注容器
    this.annotations.forEach((ann) => {
      if (ann.pixiContainer && ann.pixiContainer.parent) {
        ann.pixiContainer.parent.removeChild(ann.pixiContainer);
      }
    });
    this.annotations.clear();

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
      rectGraphics.rect(0, 0, rect.width, rect.height);
      rectGraphics.fill({ color: 0xff0000, alpha: 0.1 });
      rectGraphics.stroke({ color: 0xff0000, width: 2 });

      // 添加角点控制（用于调整大小）
      const cornerSize = 8;
      const halfHandle = cornerSize / 2;

      // 绘制8个调整手柄
      const handles: HandleType[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
      handles.forEach((handle) => {
        let cx, cy;
        switch (handle) {
          case 'nw':
            cx = -halfHandle;
            cy = -halfHandle;
            break;
          case 'n':
            cx = rect.width / 2 - halfHandle;
            cy = -halfHandle;
            break;
          case 'ne':
            cx = rect.width - halfHandle;
            cy = -halfHandle;
            break;
          case 'e':
            cx = rect.width - halfHandle;
            cy = rect.height / 2 - halfHandle;
            break;
          case 'se':
            cx = rect.width - halfHandle;
            cy = rect.height - halfHandle;
            break;
          case 's':
            cx = rect.width / 2 - halfHandle;
            cy = rect.height - halfHandle;
            break;
          case 'sw':
            cx = -halfHandle;
            cy = rect.height / 2 - halfHandle;
            break;
          case 'w':
            cx = -halfHandle;
            cy = rect.height / 2 - halfHandle;
            break;
        }
        rectGraphics.rect(cx ?? 0, cy ?? 0, cornerSize, cornerSize);
        rectGraphics.fill({ color: 0xff0000, alpha: 1 });
      });

      // 添加点击事件
      container.eventMode = 'static';
      container.cursor = 'pointer';
      container.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
        event.stopPropagation();
        this.selectAnnotation(id, label);
        this.handleAnnotationPointerDown(event, id);
      });

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

      this.app?.stage.addChild(container);

      // 保存标注状态
      this.annotations.set(id, {
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
    this.callbacks.onAnnotationSelected?.(id, label);

    // 更新视觉效果
    this.annotations.forEach((ann) => {
      if (ann.pixiContainer) {
        const rectGraphics = ann.pixiContainer.getChildAt(0) as PIXI.Graphics;
        if (rectGraphics) {
          if (ann.id === id) {
            // 选中：蓝色 + 调整手柄
            this.updateAnnotationGraphics(rectGraphics, true, ann.width, ann.height);
          } else {
            // 未选中：红色
            this.updateAnnotationGraphics(rectGraphics, false, ann.width, ann.height);
          }
        }
      }
    });
  }

  /**
   * 更新标注图形（选中/未选中状态）
   */
  private updateAnnotationGraphics(
    graphics: PIXI.Graphics,
    isSelected: boolean,
    width: number,
    height: number
  ): void {
    graphics.clear();

    // 绘制矩形
    graphics.rect(0, 0, width, height);
    graphics.fill({ color: isSelected ? 0x3b82f6 : 0xff0000, alpha: 0.1 });
    graphics.stroke({ color: isSelected ? 0x3b82f6 : 0xff0000, width: isSelected ? 3 : 2 });

    const cornerSize = 8;
    const halfHandle = cornerSize / 2;

    // 绘制角点（未选中时）
    if (!isSelected) {
      const corners = [
        [0, 0],
        [width - cornerSize, 0],
        [0, height - cornerSize],
        [width - cornerSize, height - cornerSize],
      ];
      corners.forEach(([cx, cy]) => {
        graphics.rect(cx ?? 0, cy ?? 0, cornerSize, cornerSize);
        graphics.fill({ color: 0xff0000, alpha: 1 });
      });
    }

    // 绘制8个调整手柄（仅选中时）
    if (isSelected) {
      const handles: HandleType[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
      handles.forEach((handle) => {
        let cx, cy;
        switch (handle) {
          case 'nw':
            cx = -halfHandle;
            cy = -halfHandle;
            break;
          case 'n':
            cx = width / 2 - halfHandle;
            cy = -halfHandle;
            break;
          case 'ne':
            cx = width - halfHandle;
            cy = -halfHandle;
            break;
          case 'e':
            cx = width - halfHandle;
            cy = height / 2 - halfHandle;
            break;
          case 'se':
            cx = width - halfHandle;
            cy = height - halfHandle;
            break;
          case 's':
            cx = width / 2 - halfHandle;
            cy = height - halfHandle;
            break;
          case 'sw':
            cx = -halfHandle;
            cy = height / 2 - halfHandle;
            break;
          case 'w':
            cx = -halfHandle;
            cy = height / 2 - halfHandle;
            break;
        }
        graphics.rect(cx ?? 0, cy ?? 0, cornerSize, cornerSize);
        graphics.fill({ color: 0x3b82f6, alpha: 1 });
      });
    }
  }

  /**
   * 处理画布点击
   */
  private handleCanvasClick(event: PIXI.FederatedPointerEvent): void {
    if (!this.imageSprite) return;

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

    const globalX = event.global.x;
    const globalY = event.global.y;

    const localX = (globalX - (sprite.x ?? 0)) / sprite.scale.x;
    const localY = (globalY - (sprite.y ?? 0)) / sprite.scale.y;

    const graphics = this.drawingRect;
    graphics.clear();

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
    const id = Date.now().toString();
    const label = `Annotation ${this.annotations.size + 1}`;

    // 添加到标注状态
    const newAnnotation: InternalAnnotationState = {
      id,
      label,
      x,
      y,
      width,
      height,
      pixiContainer: null,
    };
    this.annotations.set(id, newAnnotation);

    // 重新渲染标注
    this.renderAnnotations(Array.from(this.annotations.values()).map((ann) => ({
      id: ann.id,
      name: ann.label,
      rect: { x: ann.x, y: ann.y, width: ann.width, height: ann.height },
    })));

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
   * 处理标注容器点击（选择或开始拖拽）
   */
  private handleAnnotationPointerDown(event: PIXI.FederatedPointerEvent, annotationId: string): void {
    const ann = this.annotations.get(annotationId);
    if (!ann) return;

    const sprite = this.imageSprite;
    if (!sprite) return;

    const globalX = event.global.x;
    const globalY = event.global.y;

    // 检测是否点击了调整手柄
    const localX = (globalX - (sprite.x ?? 0)) / sprite.scale.x;
    const localY = (globalY - (sprite.y ?? 0)) / sprite.scale.y;

    const handle = this.detectResizeHandle(localX, localY, ann.width, ann.height);
    if (handle) {
      // 开始调整大小
      this.isResizing = true;
      this.resizeHandle = handle;
      this.originalPosition = { x: ann.x, y: ann.y, width: ann.width, height: ann.height };
      return;
    }

    // 否则选择或开始拖拽
    this.isDragging = true;
    this.dragStart = { x: globalX, y: globalY };
  }

  /**
   * 检测调整手柄
   */
  private detectResizeHandle(
    localX: number,
    localY: number,
    width: number,
    height: number
  ): HandleType | null {
    const cornerSize = 8;
    const halfHandle = cornerSize / 2;
    const tolerance = 10;

    // 检查8个手柄
    if (Math.abs(localX + halfHandle) <= tolerance && Math.abs(localY + halfHandle) <= tolerance) {
      return 'nw';
    }
    if (Math.abs(localX - width / 2) <= tolerance && Math.abs(localY + halfHandle) <= tolerance) {
      return 'n';
    }
    if (Math.abs(localX - width + halfHandle) <= tolerance && Math.abs(localY + halfHandle) <= tolerance) {
      return 'ne';
    }
    if (Math.abs(localX - width + halfHandle) <= tolerance && Math.abs(localY - height / 2) <= tolerance) {
      return 'e';
    }
    if (Math.abs(localX - width + halfHandle) <= tolerance && Math.abs(localY - height + halfHandle) <= tolerance) {
      return 'se';
    }
    if (Math.abs(localX + halfHandle) <= tolerance && Math.abs(localY - height / 2) <= tolerance) {
      return 's';
    }
    if (Math.abs(localX - width / 2) <= tolerance && Math.abs(localY - height + halfHandle) <= tolerance) {
      return 'sw';
    }
    if (Math.abs(localX + halfHandle) <= tolerance && Math.abs(localY - height + halfHandle) <= tolerance) {
      return 'w';
    }

    return null;
  }

  /**
   * 处理标注容器指针移动
   */
  handleAnnotationPointerMove(event: PIXI.FederatedPointerEvent, annotationId: string): void {
    const ann = this.annotations.get(annotationId);
    if (!ann) return;

    const sprite = this.imageSprite;
    if (!sprite) return;

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
      }

      // 更新标注
      this.updateAnnotationPosition(annotationId, newX, newY, newWidth, newHeight);
    } else if (this.isDragging && this.dragStart) {
      // 拖拽移动
      const dx = (globalX - this.dragStart.x) / sprite.scale.x;
      const dy = (globalY - this.dragStart.y) / sprite.scale.y;

      this.updateAnnotationPosition(
        annotationId,
        ann.x + dx,
        ann.y + dy,
        ann.width,
        ann.height
      );
    }
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
    const ann = this.annotations.get(id);
    if (!ann || !ann.pixiContainer) return;

    const sprite = this.imageSprite;
    if (!sprite) return;

    const scaleX = sprite.scale.x;
    const scaleY = sprite.scale.y;

    // 更新容器位置
    ann.pixiContainer.x = newX * scaleX + (sprite.x ?? 0);
    ann.pixiContainer.y = newY * scaleY + (sprite.y ?? 0);

    // 更新标注数据
    this.annotations.set(id, {
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
      rectGraphics.rect(0, 0, newWidth, newHeight);
      rectGraphics.fill({ color: 0x3b82f6, alpha: 0.1 });
      rectGraphics.stroke({ color: 0x3b82f6, width: 2 });

      // 更新调整手柄位置
      const cornerSize = 8;
      const halfHandle = cornerSize / 2;

      const handles: HandleType[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
      handles.forEach((handle) => {
        let cx, cy;
        switch (handle) {
          case 'nw':
            cx = -halfHandle;
            cy = -halfHandle;
            break;
          case 'n':
            cx = newWidth / 2 - halfHandle;
            cy = -halfHandle;
            break;
          case 'ne':
            cx = newWidth - halfHandle;
            cy = -halfHandle;
            break;
          case 'e':
            cx = newWidth - halfHandle;
            cy = newHeight / 2 - halfHandle;
            break;
          case 'se':
            cx = newWidth - halfHandle;
            cy = newHeight - halfHandle;
            break;
          case 's':
            cx = newWidth / 2 - halfHandle;
            cy = newHeight - halfHandle;
            break;
          case 'sw':
            cx = -halfHandle;
            cy = newHeight / 2 - halfHandle;
            break;
          case 'w':
            cx = -halfHandle;
            cy = newHeight / 2 - halfHandle;
            break;
        }
        rectGraphics.rect(cx ?? 0, cy ?? 0, cornerSize, cornerSize);
        rectGraphics.fill({ color: 0x3b82f6, alpha: 1 });
      });
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
    this.resizeHandle = null;
    this.originalPosition = null;
    this.dragStart = null;
  }

  /**
   * 更新图像容器缩放和平移（已由 pixi-viewport 自动处理，保留方法以兼容现有代码）
   */
  setScaleAndOffset(scale: number, offset: { x: number; y: number }): void {
    // pixi-viewport 会自动处理缩放和平移，此方法已弃用
    // 如果需要手动设置视图位置和缩放，可以使用 viewport API
    // this.viewport?.moveCenter(offset.x, offset.y);
    // this.viewport?.setZoom(scale);
  }

  /**
   * 更新标注标签
   */
  updateAnnotationLabel(id: string, newLabel: string): void {
    const ann = this.annotations.get(id);
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
    const ann = this.annotations.get(id);
    if (ann?.pixiContainer) {
      ann.pixiContainer.parent?.removeChild(ann.pixiContainer);
    }
    this.annotations.delete(id);
  }

  /**
   * 获取所有标注数据
   */
  getAllAnnotations(): AnnotationData[] {
    return Array.from(this.annotations.values()).map((ann) => ({
      id: ann.id,
      name: ann.label,
      rect: { x: ann.x, y: ann.y, width: ann.width, height: ann.height },
    }));
  }

  /**
   * 获取指定标注数据
   */
  getAnnotation(id: string): AnnotationData | null {
    const ann = this.annotations.get(id);
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
    if (this.app) {
      this.app.destroy(true);
      this.app = null;
    }
    this.imageSprite = null;
    this.viewport = null;
    this.drawingRect = null;
    this.annotations.clear();
  }
}
