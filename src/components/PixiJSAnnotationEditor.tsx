import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { getAnnotations, saveAnnotations } from '../lib/api';

interface PixiJSAnnotationEditorProps {
  screenshotId: string;
  screenshotName: string;
  screenshotPath: string;
}

interface AnnotationState {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pixiContainer: PIXI.Container | null;
}

export default function PixiJSAnnotationEditor({
  screenshotId,
  screenshotName,
  screenshotPath,
}: PixiJSAnnotationEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const imageSpriteRef = useRef<PIXI.Sprite | null>(null);
  const drawingRectRef = useRef<PIXI.Graphics | null>(null);
  const annotationsRef = useRef<Map<string, AnnotationState>>(new Map());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // 初始化 PixiJS 应用
  useEffect(() => {
    if (!canvasRef.current || appRef.current) return;

    const initApp = async () => {
      const img = new Image();
      img.onload = async () => {
        const bbox = canvasRef.current?.getBoundingClientRect();
        const width = bbox!.width;
        const height = bbox!.height;
        setImageSize({ width: img.width, height: img.height });

        // 创建 PixiJS 应用
        const app = new PIXI.Application();
        await app.init({
          width,
          height,
          backgroundColor: 0x000000,
          antialias: true,
        });

        if (canvasRef.current) {
          canvasRef.current.appendChild(app.canvas);
          appRef.current = app;
        }

        // 加载图像
        const texture = PIXI.Texture.from(screenshotPath);
        const sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(0, 0);
        sprite.eventMode = 'static';
        sprite.on('pointerdown', handleCanvasClick);

        // 缩放图像以适应画布
        const scaleX = width / img.width;
        const scaleY = height / img.height;
        const scale = Math.min(scaleX, scaleY);
        sprite.scale.set(scale);
        // 填充白色以防透明背景
        sprite.tint = 0xffffff;

        // 居中图像
        sprite.x = (width - img.width * scale) / 2;
        sprite.y = (height - img.height * scale) / 2;
        console.log('Image loaded with size:', img.width, img.height);
        console.log('Canvas size:', width, height);
        console.log('Sprite position:', sprite.x, sprite.y, 'scale:', scale);
        app.stage.addChild(sprite);
        imageSpriteRef.current = sprite;

        // stage 正中增加白色矩形以方便调试
        const debugRect = new PIXI.Graphics();
        debugRect.beginPath();
        debugRect.rect(sprite.x, sprite.y, img.width * scale, img.height * scale);
        debugRect.stroke({ color: 0x00ff00, width: 1 });
        debugRect.alpha = 1; // 设置为几乎透明以不影响视觉
        app.stage.addChildAt(debugRect, 0);

        // 创建绘制矩形图层
        const graphics = new PIXI.Graphics();
        graphics.eventMode = 'static';
        // app.stage.addChild(graphics);
        drawingRectRef.current = graphics;
        app.ticker.add(() => {
          // console.log('Ticker running');
        });
      };
      img.src = screenshotPath;
    };

    initApp();

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  }, [screenshotPath]);

  // 加载标注数据
  useEffect(() => {
    const loadAnnotations = async () => {
      setLoading(true);
      setError(null);

      const result = await getAnnotations(screenshotId);
      setLoading(false);

      if (result.success && result.data) {
        await renderAnnotations(result.data);
      } else if (result.error) {
        setError(result.error);
      }
    };

    loadAnnotations();
  }, [screenshotId]);

  // 渲染标注
  const renderAnnotations = useCallback(
    async (annotations: unknown[]) => {
      if (!appRef.current || !imageSpriteRef.current || !drawingRectRef.current) {
        return;
      }

      const sprite = imageSpriteRef.current;
      if (!sprite) return;

      const scaleX = sprite.scale.x;
      const scaleY = sprite.scale.y;
      const spriteX = sprite.x ?? 0;
      const spriteY = sprite.y ?? 0;

      // 渲染每个标注
      annotations.forEach((ann: any) => {
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

        // 添加角点控制
        const cornerSize = 4;
        const corners = [
          [0, 0],
          [rect.width - cornerSize, 0],
          [0, rect.height - cornerSize],
          [rect.width - cornerSize, rect.height - cornerSize],
        ];
        corners.forEach(([cx, cy]) => {
          rectGraphics.rect(cx ?? 0, cy ?? 0, cornerSize, cornerSize);
          rectGraphics.fill({ color: 0xff0000, alpha: 1 });
        });

        // 添加点击事件
        container.eventMode = 'static';
        container.cursor = 'pointer';
        container.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
          event.stopPropagation();
          selectAnnotation(id, label);
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

        appRef.current?.stage.addChild(container);

        // 保存标注状态
        annotationsRef.current.set(id, {
          id,
          label,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          pixiContainer: container,
        });
      });

      drawingRectRef.current?.lineStyle(0);
    },
    []
  );

  // 选择标注
  const selectAnnotation = (id: string, label: string) => {
    setSelectedAnnotationId(id);
    setEditingLabel(label);

    // 更新视觉效果
    annotationsRef.current.forEach((ann) => {
      if (ann.pixiContainer) {
        const rectGraphics = ann.pixiContainer.getChildAt(0) as PIXI.Graphics;
        if (ann.id === id) {
          // 选中：蓝色
          rectGraphics.clear();
          rectGraphics.rect(0, 0, ann.width, ann.height);
          rectGraphics.fill({ color: 0x3b82f6, alpha: 0.1 });
          rectGraphics.stroke({ color: 0x3b82f6, width: 2 });
        } else {
          // 未选中：红色
          rectGraphics.clear();
          rectGraphics.rect(0, 0, ann.width, ann.height);
          rectGraphics.fill({ color: 0xff0000, alpha: 0.1 });
          rectGraphics.stroke({ color: 0xff0000, width: 2 });
        }
      }
    });
  };

  // 处理画布点击
  const handleCanvasClick = (event: PIXI.FederatedPointerEvent) => {
    if (!imageSpriteRef.current) return;

    const sprite = imageSpriteRef.current;
    const globalX = event.global.x;
    const globalY = event.global.y;

    // 转换到图像坐标
    const localX = (globalX - sprite.x) / sprite.scale.x;
    const localY = (globalY - sprite.y) / sprite.scale.y;

    // 开始绘制
    setIsDrawing(true);
    setDrawStart({ x: localX, y: localY });

    // 绘制临时矩形
    if (drawingRectRef.current) {
      drawingRectRef.current.clear();
    }
  };

  // 处理鼠标移动
  const handleMouseMove = (event: PIXI.FederatedPointerEvent) => {
    if (!isDrawing || !drawStart || !drawingRectRef.current) return;

    const sprite = imageSpriteRef.current;
    if (!sprite) return;

    const globalX = event.global.x;
    const globalY = event.global.y;

    const localX = (globalX - sprite.x) / sprite.scale.x;
    const localY = (globalY - sprite.y) / sprite.scale.y;

    const graphics = drawingRectRef.current;
    graphics.clear();

    // 绘制正在绘制的矩形
    const x = Math.min(drawStart.x, localX);
    const y = Math.min(drawStart.y, localY);
    const width = Math.abs(localX - drawStart.x);
    const height = Math.abs(localY - drawStart.y);

    graphics.rect(
      x * sprite.scale.x + sprite.x,
      y * sprite.scale.y + sprite.y,
      width * sprite.scale.x,
      height * sprite.scale.y
    );
    graphics.stroke({ color: 0x3b82f6, width: 2 });
  };

  // 处理鼠标释放
  const handleMouseUp = (event: PIXI.FederatedPointerEvent) => {
    if (!isDrawing || !drawStart) return;

    setIsDrawing(false);

    const sprite = imageSpriteRef.current;
    if (!sprite) return;

    const globalX = event.global.x;
    const globalY = event.global.y;

    const localX = (globalX - sprite.x) / sprite.scale.x;
    const localY = (globalY - sprite.y) / sprite.scale.y;

    const width = Math.abs(localX - drawStart.x);
    const height = Math.abs(localY - drawStart.y);

    // 忽略太小的矩形
    if (width < 10 || height < 10) {
      setDrawStart(null);
      if (drawingRectRef.current) {
        drawingRectRef.current.clear();
      }
      return;
    }

    // 创建新标注
    const x = Math.min(drawStart.x, localX);
    const y = Math.min(drawStart.y, localY);
    const id = Date.now().toString();
    const label = `Annotation ${annotationsRef.current.size + 1}`;

    // 添加到标注状态
    const newAnnotation: AnnotationState = {
      id,
      label,
      x,
      y,
      width,
      height,
      pixiContainer: null,
    };
    annotationsRef.current.set(id, newAnnotation);

    // 重新渲染标注
    renderAnnotations(Array.from(annotationsRef.current.values()));

    // 选中新标注
    selectAnnotation(id, label);

    setDrawStart(null);
    if (drawingRectRef.current) {
      drawingRectRef.current.clear();
    }
  };

  // 全局鼠标移动和释放事件
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!appRef.current || !isDrawing) return;
      const rect = appRef.current.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // 创建简单的对象来传递坐标
      const event = { global: { x, y } } as unknown as PIXI.FederatedPointerEvent;
      handleMouseMove(event);
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (!appRef.current || !isDrawing) return;
      const rect = appRef.current.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const event = { global: { x, y } } as unknown as PIXI.FederatedPointerEvent;
      handleMouseUp(event);
    };

    if (isDrawing) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDrawing]);

  // 更新标注标签
  const updateAnnotationLabel = (id: string, newLabel: string) => {
    const ann = annotationsRef.current.get(id);
    if (ann) {
      ann.label = newLabel;
      setEditingLabel(newLabel);
    }
  };

  // 删除标注
  const handleDelete = () => {
    if (!selectedAnnotationId) return;

    const ann = annotationsRef.current.get(selectedAnnotationId);
    if (ann?.pixiContainer) {
      ann.pixiContainer.parent?.removeChild(ann.pixiContainer);
    }
    annotationsRef.current.delete(selectedAnnotationId);
    setSelectedAnnotationId(null);
    setEditingLabel('');
  };

  // 保存标注
  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // 转换为旧格式以便保存到 API
      const annotations = Array.from(annotationsRef.current.values()).map((ann) => ({
        id: ann.id,
        name: ann.label,
        rect: {
          x: ann.x,
          y: ann.y,
          width: ann.width,
          height: ann.height,
        },
        relativeRect: {
          x: ann.x / imageSize.width,
          y: ann.y / imageSize.height,
          width: ann.width / imageSize.width,
          height: ann.height / imageSize.height,
        },
        screenshotId,
      }));

      const result = await saveAnnotations(screenshotId, annotations);

      setSaving(false);

      if (result.success) {
        alert('Annotations saved successfully!');
      } else {
        setError(result.error || 'Failed to save annotations');
      }
    } catch (err) {
      setSaving(false);
      setError('Failed to save annotations: ' + (err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-2">
          PixiJS Annotation Editor (gl2D Format)
        </h2>
        <p className="text-gray-600">{screenshotName} - Draw rectangles to annotate UI elements</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* PixiJS Canvas Container */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {imageSize.width > 0 && (
              <span>Image: {imageSize.width} x {imageSize.height} pixels</span>
            )}
          </div>
          <div className="space-x-2">
            {selectedAnnotationId && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete Selected
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save Annotations'}
            </button>
          </div>
        </div>

        <div
          ref={canvasRef}
          className="border border-gray-300 rounded bg-gray-100"
          style={{ width: '100%', height: '600px', overflow: 'hidden' }}
        />

        <p className="mt-2 text-sm text-gray-600">
          Click and drag to draw rectangles. Click on a rectangle to select it.
        </p>
      </div>

      {/* Selected Annotation Details */}
      {selectedAnnotationId && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Selected Annotation</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={editingLabel}
              onChange={(e) => {
                updateAnnotationLabel(selectedAnnotationId, e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {annotationsRef.current.has(selectedAnnotationId) && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  Absolute (Pixels)
                </h5>
                <div className="text-sm space-y-1 text-gray-600">
                  <div>X: {annotationsRef.current.get(selectedAnnotationId)?.x}</div>
                  <div>Y: {annotationsRef.current.get(selectedAnnotationId)?.y}</div>
                  <div>
                    Width: {annotationsRef.current.get(selectedAnnotationId)?.width}
                  </div>
                  <div>
                    Height: {annotationsRef.current.get(selectedAnnotationId)?.height}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  Relative (0-1)
                </h5>
                <div className="text-sm space-y-1 text-gray-600">
                  {annotationsRef.current.get(selectedAnnotationId) && (
                    <>
                      <div>
                        X:{' '}
                        {(
                          (annotationsRef.current.get(selectedAnnotationId)!.x /
                            imageSize.width) *
                          1
                        ).toFixed(3)}
                      </div>
                      <div>
                        Y:{' '}
                        {(
                          (annotationsRef.current.get(selectedAnnotationId)!.y /
                            imageSize.height) *
                          1
                        ).toFixed(3)}
                      </div>
                      <div>
                        Width:{' '}
                        {(
                          (annotationsRef.current.get(selectedAnnotationId)!.width /
                            imageSize.width) *
                          1
                        ).toFixed(3)}
                      </div>
                      <div>
                        Height:{' '}
                        {(
                          (annotationsRef.current.get(selectedAnnotationId)!.height /
                            imageSize.height) *
                          1
                        ).toFixed(3)}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Annotations List */}
      {annotationsRef.current.size > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            All Annotations ({annotationsRef.current.size})
          </h3>

          <div className="space-y-2">
            {Array.from(annotationsRef.current.values()).map((ann) => (
              <div
                key={ann.id}
                onClick={() => selectAnnotation(ann.id, ann.label)}
                className={`p-3 border rounded cursor-pointer transition-colors ${
                  selectedAnnotationId === ann.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">{ann.label}</div>
                <div className="text-sm text-gray-600">
                  ({ann.x}, {ann.y}, {ann.width}, {ann.height})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
