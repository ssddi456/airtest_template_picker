import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { Annotation, Rect } from '../types/index';
import { getAnnotations, saveAnnotations, generatePython } from '../lib/api';

interface ExtendedAnnotation extends Annotation {
  id: string;
  name: string;
  rect: Rect;
  relativeRect: Rect;
  screenshotId: string;
}

export default function AnnotationDetail() {
  const { id: screenshotId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { selectedAnnotationId?: string } | null;

  const [screenshotData, setScreenshotData] = useState<ScreenshotData | null>(null);
  const [annotations, setAnnotations] = useState<ExtendedAnnotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(
    state?.selectedAnnotationId || null
  );
  const [editingName, setEditingName] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<Rect | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [offset, setOffset] = useState({ x: 0, y: 0, scale: 1 });
  const [hoveredAnnotation, setHoveredAnnotation] = useState<string | null>(null);
  const [spacePressed, setSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ clientX: number; clientY: number } | null>(null);
  const [panOffsetStart, setPanOffsetStart] = useState({ x: 0, y: 0 });

  // 撤销/重做历史栈
  const [history, setHistory] = useState<ExtendedAnnotation[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 标注调整状态
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [moveStart, setMoveStart] = useState<{ x: number; y: number } | null>(null);
  const [originalRect, setOriginalRect] = useState<Rect | null>(null);

  // 加载截图和标注数据
  const loadAnnotations = async () => {
    if (!screenshotId) return;

    setLoading(true);
    setError(null);
    const result = await getAnnotations(screenshotId);
    setLoading(false);

    if (result.success && result.data) {
      setAnnotations(result.data);
      // 初始化历史栈
      setHistory([result.data]);
      setHistoryIndex(0);
    } else if (result.error) {
      setError(result.error);
    }
  };

  // 撤销/重做快捷键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setSpacePressed(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [historyIndex]);

  // 保存到历史栈
  const saveToHistory = (newAnnotations: ExtendedAnnotation[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAnnotations);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // 撤销
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const prevAnnotations = history[newIndex];
      if (prevAnnotations) {
        setAnnotations(prevAnnotations);
        setHistoryIndex(newIndex);
        setSelectedAnnotation(null);
      }
    }
  };

  // 重做
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextAnnotations = history[newIndex];
      if (nextAnnotations) {
        setAnnotations(nextAnnotations);
        setHistoryIndex(newIndex);
        setSelectedAnnotation(null);
      }
    }
  };

  useEffect(() => {
    if (screenshotId) {
      loadAnnotations();

      // 获取截图信息
      fetch(`/api/screenshots/${screenshotId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setScreenshotData(data.data);
            // 加载图片
            const img = new Image();
            img.onload = () => {
              const imgWidth = img.width;
              const imgHeight = img.height;
              setImageSize({ width: imgWidth, height: imgHeight });
              setImageLoaded(true);
            };
            img.src = `/data/screenshots/${data.data.filename}`;
            imageRef.current = img;
          }
        })
        .catch(err => {
          setError('加载截图信息失败');
        });
    }
  }, [screenshotId]);

  // 监听容器 resize 事件，更新 canvasSize
  useEffect(() => {
    if (!containerRef.current) return;

    const updateCanvasSize = () => {
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.clientWidth;
      const maxWidth = 1200;
      const maxHeight = 800;

      // 使用容器宽度，但不超过 maxWidth
      let canvasWidth = Math.min(containerWidth, maxWidth);
      let canvasHeight = Math.round(canvasWidth * 0.75); // 默认 4:3 比例

      // 确保不超过 maxHeight
      if (canvasHeight > maxHeight) {
        canvasHeight = maxHeight;
        canvasWidth = Math.round(canvasHeight * (4/3));
      }

      setCanvasSize({ width: canvasWidth, height: canvasHeight });
      setOffset({ x: 0, y: 0, scale: 1 });
    };

    // 初始计算
    updateCanvasSize();

    // 监听容器尺寸变化
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [screenshotId, imageLoaded]);

  // 计算图片在画布中的绘制位置和大小
  const getImageDrawInfo = () => {
    const img = imageRef.current;
    if (!img) return null;


    const scaledWidth = canvasSize.width * offset.scale;
    const scaledHeight = canvasSize.height * offset.scale;

    let drawWidth, drawHeight, drawX, drawY;

    drawWidth = scaledWidth;
    drawHeight = scaledHeight;
    
    drawX = offset.x;
    drawY = offset.y;

    return { drawX, drawY, drawWidth, drawHeight };
  };

  // 绘制画布
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    const container = containerRef.current;
    if (!canvas || !img || !imageLoaded || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    ctx.save();
    // 应用平移
    ctx.translate(offset.x, offset.y);

    // 获取图片绘制信息
    const drawInfo = getImageDrawInfo();
    if (!drawInfo) {
      ctx.restore();
      return;
    }

    const { drawX, drawY, drawWidth, drawHeight } = drawInfo;

    // 绘制图片
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    // 绘制标注
    annotations.forEach((ann) => {
      const isSelected = ann.id === selectedAnnotation;
      const isHovered = ann.id === hoveredAnnotation;
      const relativeRect = ann.relativeRect;

      // 将相对坐标转换为画布上的绝对坐标（基于图片的实际绘制位置）
      const rect = {
        x: drawX + relativeRect.x * drawWidth,
        y: drawY + relativeRect.y * drawHeight,
        width: relativeRect.width * drawWidth,
        height: relativeRect.height * drawHeight,
      };

      // 根据状态设置样式
      if (isSelected) {
        ctx.strokeStyle = '#3b82f6';
        ctx.fillStyle = '#3b82f6';
        ctx.lineWidth = 3;

        // 绘制8个调整手柄
        const handleSize = 8;
        const halfHandle = handleSize / 2;

        // 角点手柄
        ctx.fillRect(rect.x - halfHandle, rect.y - halfHandle, handleSize, handleSize);
        ctx.fillRect(rect.x + rect.width - halfHandle, rect.y - halfHandle, handleSize, handleSize);
        ctx.fillRect(rect.x - halfHandle, rect.y + rect.height - halfHandle, handleSize, handleSize);
        ctx.fillRect(rect.x + rect.width - halfHandle, rect.y + rect.height - halfHandle, handleSize, handleSize);

        // 边缘中点手柄
        ctx.fillRect(rect.x + rect.width / 2 - halfHandle, rect.y - halfHandle, handleSize, handleSize);
        ctx.fillRect(rect.x + rect.width / 2 - halfHandle, rect.y + rect.height - halfHandle, handleSize, handleSize);
        ctx.fillRect(rect.x - halfHandle, rect.y + rect.height / 2 - halfHandle, handleSize, handleSize);
        ctx.fillRect(rect.x + rect.width - halfHandle, rect.y + rect.height / 2 - halfHandle, handleSize, handleSize);
      } else if (isHovered) {
        ctx.strokeStyle = '#22c55e';
        ctx.fillStyle = '#22c55e';
        ctx.lineWidth = 3;

        // 绘制4个角点
        const cornerSize = 4;
        ctx.fillRect(rect.x - cornerSize / 2, rect.y - cornerSize / 2, cornerSize, cornerSize);
        ctx.fillRect(rect.x + rect.width - cornerSize / 2, rect.y - cornerSize / 2, cornerSize, cornerSize);
        ctx.fillRect(rect.x - cornerSize / 2, rect.y + rect.height - cornerSize / 2, cornerSize, cornerSize);
        ctx.fillRect(rect.x + rect.width - cornerSize / 2, rect.y + rect.height - cornerSize / 2, cornerSize, cornerSize);
      } else {
        ctx.strokeStyle = '#ef4444';
        ctx.fillStyle = '#ef4444';
        ctx.lineWidth = 2;
      }

      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

      // 绘制名称
      ctx.fillStyle = '#000000';
      ctx.font = '12px sans-serif';
      ctx.fillText(ann.name, rect.x, rect.y - 6);
    });

    // 绘制当前矩形（绘制时）
    if (currentRect) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        currentRect.x,
        currentRect.y,
        currentRect.width,
        currentRect.height
      );
    }

    ctx.restore();
  };

  useEffect(() => {
    drawCanvas();
  }, [annotations, selectedAnnotation, hoveredAnnotation, currentRect, imageLoaded, canvasSize, offset, resizeHandle]);

  useEffect(() => {
    if (canvasRef.current) {
      const wheelHandler = (e: WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();

        handleWheel(e)
      };
      canvasRef.current.addEventListener('wheel', wheelHandler, { passive: false });
      return () => {
        canvasRef.current?.removeEventListener('wheel', wheelHandler);
      };
    }
  }, [canvasRef.current]);

  // 检测是否点击了调整手柄
  const getResizeHandle = (x: number, y: number, rect: Rect): string | null => {
    const handleSize = 12;
    const halfHandle = handleSize / 2;

    // 检查8个手柄
    const handles = [
      { name: 'nw', x: rect.x, y: rect.y },
      { name: 'ne', x: rect.x + rect.width, y: rect.y },
      { name: 'sw', x: rect.x, y: rect.y + rect.height },
      { name: 'se', x: rect.x + rect.width, y: rect.y + rect.height },
      { name: 'n', x: rect.x + rect.width / 2, y: rect.y },
      { name: 's', x: rect.x + rect.width / 2, y: rect.y + rect.height },
      { name: 'w', x: rect.x, y: rect.y + rect.height / 2 },
      { name: 'e', x: rect.x + rect.width, y: rect.y + rect.height / 2 },
    ];

    for (const handle of handles) {
      if (
        Math.abs(x - handle.x) <= handleSize &&
        Math.abs(y - handle.y) <= handleSize
      ) {
        return handle.name;
      }
    }

    return null;
  };

  // 处理画布事件
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!imageLoaded || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const displayScale = canvas.width / rect.width;

    // 转换屏幕坐标到画布坐标
    const canvasX = (e.clientX - rect.left) * displayScale;
    const canvasY = (e.clientY - rect.top) * displayScale;

    // 转换到平移后的坐标系
    const x = canvasX - offset.x;
    const y = canvasY - offset.y;

    // 获取图片绘制信息
    const drawInfo = getImageDrawInfo();
    if (!drawInfo) return;

    const { drawX, drawY, drawWidth, drawHeight } = drawInfo;

    // 转换到图片的相对坐标（0-1）
    const relativeX = (x - drawX) / drawWidth;
    const relativeY = (y - drawY) / drawHeight;

    // 空格键按下 - 拖动视图模式
    if (spacePressed) {
      setIsPanning(true);
      setPanStart({ clientX: e.clientX, clientY: e.clientY });
      setPanOffsetStart({ x: offset.x, y: offset.y });
      return;
    }

    // 检查是否点击了现有标注
    const clickedAnnotation = annotations.find(
      (ann) => {
        const relRect = ann.relativeRect;
        return (
          relativeX >= relRect.x &&
          relativeX <= relRect.x + relRect.width &&
          relativeY >= relRect.y &&
          relativeY <= relRect.y + relRect.height
        );
      }
    );

    if (clickedAnnotation) {
      // 检查是否点击了调整手柄
      if (selectedAnnotation === clickedAnnotation.id) {
        // 将手柄坐标转换为画布坐标
        const relRect = clickedAnnotation.relativeRect;
        const annDrawX = drawX + relRect.x * drawWidth;
        const annDrawY = drawY + relRect.y * drawHeight;
        const annDrawWidth = relRect.width * drawWidth;
        const annDrawHeight = relRect.height * drawHeight;

        const handle = getResizeHandle(x, y, {
          x: annDrawX,
          y: annDrawY,
          width: annDrawWidth,
          height: annDrawHeight,
        });

        if (handle) {
          setResizeHandle(handle);
          setOriginalRect({ ...clickedAnnotation.relativeRect });
          setDrawStart({ x: relativeX, y: relativeY });
          return;
        }
      }

      // 移动标注
      setSelectedAnnotation(clickedAnnotation.id);
      setEditingName(clickedAnnotation.name);
      setIsMoving(true);
      setMoveStart({ x: relativeX, y: relativeY });
      setOriginalRect({ ...clickedAnnotation.relativeRect });
    } else {
      setSelectedAnnotation(null);
      setIsDrawing(true);
      setDrawStart({ x: relativeX, y: relativeY });
      setCurrentRect({ x: relativeX, y: relativeY, width: 0, height: 0 });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const canvasRect = canvas.getBoundingClientRect();
    const displayScale = canvas.width / canvasRect.width;

    // 转换屏幕坐标到画布坐标
    const canvasX = (e.clientX - canvasRect.left) * displayScale;
    const canvasY = (e.clientY - canvasRect.top) * displayScale;

    // 转换到平移后的坐标系
    const x = canvasX - offset.x;
    const y = canvasY - offset.y;

    // 获取图片绘制信息
    const drawInfo = getImageDrawInfo();
    if (!drawInfo) return;

    const { drawX, drawY, drawWidth, drawHeight } = drawInfo;

    // 转换到图片的相对坐标（0-1）
    const relativeX = (x - drawX) / drawWidth;
    const relativeY = (y - drawY) / drawHeight;

    // 空格拖动视图模式
    if (isPanning && panStart) {
      const dx = (e.clientX - panStart.clientX) * displayScale;
      const dy = (e.clientY - panStart.clientY) * displayScale;
      setOffset({
        x: panOffsetStart.x + dx,
        y: panOffsetStart.y + dy,
        scale: offset.scale,
      });
      return;
    }

    // 调整标注大小
    if (resizeHandle && selectedAnnotation && originalRect) {
      const ann = annotations.find((a) => a.id === selectedAnnotation);
      if (ann) {
        let newRect = { ...ann.relativeRect };
        const handle = resizeHandle;

        if (handle.includes('n')) {
          const newHeight = originalRect.height + (originalRect.y - relativeY);
          newRect.y = relativeY;
          newRect.height = Math.max(0.01, newHeight);
        }
        if (handle.includes('s')) {
          newRect.height = Math.max(0.01, relativeY - newRect.y);
        }
        if (handle.includes('w')) {
          const newWidth = originalRect.width + (originalRect.x - relativeX);
          newRect.x = relativeX;
          newRect.width = Math.max(0.01, newWidth);
        }
        if (handle.includes('e')) {
          newRect.width = Math.max(0.01, relativeX - newRect.x);
        }

        setAnnotations(
          annotations.map((a) =>
            a.id === selectedAnnotation
              ? { ...a, relativeRect: newRect }
              : a
          )
        );
      }
      return;
    }

    // 移动标注
    if (isMoving && selectedAnnotation && moveStart && originalRect) {
      const dx = relativeX - moveStart.x;
      const dy = relativeY - moveStart.y;

      const newRect = {
        x: originalRect.x + dx,
        y: originalRect.y + dy,
        width: originalRect.width,
        height: originalRect.height,
      };

      setAnnotations(
        annotations.map((a) =>
          a.id === selectedAnnotation
            ? { ...a, relativeRect: newRect }
            : a
        )
      );
      return;
    }

    // 检测hover状态（仅在未绘制时）
    if (!isDrawing) {
      const hovered = annotations.find(
        (ann) => {
          const relRect = ann.relativeRect;
          return (
            relativeX >= relRect.x &&
            relativeX <= relRect.x + relRect.width &&
            relativeY >= relRect.y &&
            relativeY <= relRect.y + relRect.height
          );
        }
      );
      setHoveredAnnotation(hovered ? hovered.id : null);
    }

    // 绘制状态处理
    if (isDrawing && drawStart) {
      const width = relativeX - drawStart.x;
      const height = relativeY - drawStart.y;

      setCurrentRect({
        x: width < 0 ? relativeX : drawStart.x,
        y: height < 0 ? relativeY : drawStart.y,
        width: Math.abs(width),
        height: Math.abs(height),
      });
    }
  };

  const handleMouseUp = () => {
    // 拖动视图结束
    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
      return;
    }

    // 调整大小结束
    if (resizeHandle && selectedAnnotation) {
      saveToHistory(annotations);
      setResizeHandle(null);
      setOriginalRect(null);
      setDrawStart(null);
      return;
    }

    // 移动标注结束
    if (isMoving && selectedAnnotation) {
      saveToHistory(annotations);
      setIsMoving(false);
      setMoveStart(null);
      setOriginalRect(null);
      return;
    }

    // 创建新标注
    if (!isDrawing || !currentRect || !screenshotId) return;

    setIsDrawing(false);

    // 不要创建太小的矩形
    const minSize = 0.01;
    if (currentRect.width < minSize || currentRect.height < minSize) {
      setCurrentRect(null);
      setDrawStart(null);
      return;
    }

    // currentRect 已经是相对坐标了（0-1）
    const relativeRect = currentRect;

    // 创建新标注
    const newAnnotation: ExtendedAnnotation = {
      id: Date.now().toString(),
      name: `标注 ${annotations.length + 1}`,
      rect: { x: 0, y: 0, width: 0, height: 0 }, // 不再使用
      relativeRect,
      screenshotId,
    };

    const newAnnotations = [...annotations, newAnnotation];
    setAnnotations(newAnnotations);
    setSelectedAnnotation(newAnnotation.id);
    setEditingName(newAnnotation.name);
    setCurrentRect(null);
    setDrawStart(null);

    // 保存到历史
    saveToHistory(newAnnotations);
  };

  // 计算光标样式
  const getCursorStyle = () => {
    if (spacePressed) return 'grab';
    if (isPanning) return 'grabbing';
    if (resizeHandle) {
      const cursorMap: { [key: string]: string } = {
        'n': 'ns-resize',
        's': 'ns-resize',
        'e': 'ew-resize',
        'w': 'ew-resize',
        'ne': 'nesw-resize',
        'sw': 'nesw-resize',
        'nw': 'nwse-resize',
        'se': 'nwse-resize',
      };
      return cursorMap[resizeHandle] || 'default';
    }
    if (isMoving) return 'move';
    return 'crosshair';
  };

  // 处理滚轮缩放
  const handleWheel = (e: WheelEvent) => {

    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const img = imageRef.current;
    const rect = canvas.getBoundingClientRect();

    // 计算新的缩放比例
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(offset.scale * delta, 0.5), 3);

    // 转换屏幕坐标到画布坐标
    const mouseX = (e.clientX - rect.left) * offset.scale;
    const mouseY = (e.clientY - rect.top) * offset.scale;
    // 计算图片在画布中的绘制位置（考虑平移和缩放）

    let imgDrawHeight = img.height * offset.scale;
    let imgDrawWidth = (img.width * offset.scale);
    let imgDrawX = offset.x + (img.width * offset.scale - imgDrawWidth) / 2;
    let imgDrawY = offset.y;


    const newImgDrawHeight = img.height * newScale;
    const newImgDrawWidth = img.width * newScale;

    // 计算鼠标在图片上的相对位置（0-1）
    const relativeX = (mouseX - imgDrawX) / imgDrawWidth;
    const relativeY = (mouseY - imgDrawY) / imgDrawHeight;

    // 计算新的偏移量，使鼠标在图片上的相对位置保持不变
    const newOffsetX = mouseX - relativeX * newImgDrawWidth;
    const newOffsetY = mouseY - relativeY * newImgDrawHeight;

    setOffset({ x: newOffsetX, y: newOffsetY, scale: newScale });
  };

  // 处理删除
  const handleDelete = () => {
    if (!selectedAnnotation) return;

    const newAnnotations = annotations.filter((ann) => ann.id !== selectedAnnotation);
    setAnnotations(newAnnotations);
    setSelectedAnnotation(null);
    setEditingName('');

    // 保存到历史
    saveToHistory(newAnnotations);
  };

  // 处理保存
  const handleSave = async () => {
    if (!screenshotId) return;

    setSaving(true);
    setError(null);

    try {
      // 保存标注
      const result = await saveAnnotations(
        screenshotId,
        annotations.map((ann) => {
          // 计算绝对坐标（基于图片尺寸）
          const rect = {
            x: Math.round(ann.relativeRect.x * imageSize.width),
            y: Math.round(ann.relativeRect.y * imageSize.height),
            width: Math.round(ann.relativeRect.width * imageSize.width),
            height: Math.round(ann.relativeRect.height * imageSize.height),
          };

          return {
            id: ann.id,
            name: ann.name,
            rect,
            relativeRect: ann.relativeRect,
            screenshotId: ann.screenshotId,
          };
        })
      );

      if (result.success) {
        // 自动更新 Python 代码
        await generatePython();

        // 显示成功提示
        alert('标注保存成功！历史记录已创建，Python 代码已更新。');
      } else {
        setError(result.error || '保存标注失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存标注失败');
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8 text-gray-600">加载中...</div>
        </div>
      </div>
    );
  }

  if (!screenshotData) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8 text-gray-600">加载截图信息失败</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold mb-2">标注编辑器</h2>
            <p className="text-gray-600">
              {screenshotData.name} - 在图片上绘制矩形来标注 UI 元素
            </p>
          </div>
          <button
            onClick={() => navigate(`/screenshots/${screenshotId}/history`)}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            查看历史记录
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* 画布 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {imageLoaded && (
              <span>
                图片尺寸: {imageSize.width} x {imageSize.height} 像素 |
                缩放: {Math.round(offset.scale * 100)}%
              </span>
            )}
          </div>
          <div className="space-x-2">
            <button
              onClick={() => {
                setOffset({ x: 0, y: 0, scale: 1 });
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              disabled={!imageLoaded}
            >
              重置视图
            </button>
            <button
              onClick={undo}
              disabled={historyIndex <= 0 || !imageLoaded}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              title="撤销 (Ctrl+Z)"
            >
              撤销
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1 || !imageLoaded}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              title="重做 (Ctrl+Y)"
            >
              重做
            </button>
            {selectedAnnotation && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                删除选中
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !imageLoaded}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? '保存中...' : '保存标注'}
            </button>
          </div>
        </div>

        <div
          ref={containerRef}
          className={`
            border border-gray-300 rounded overflow-hidden w-full mx-auto max-h-[80vh]
            ${!imageLoaded ? 'bg-gray-100 animate-pulse' : ''}
            flex justify-center items-center
            bg-white-gray-50
            `
          }

          onScroll={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseMove={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              handleMouseUp();
              setHoveredAnnotation(null);
            }}
            style={{
              width: '100%',
              height: '100%',
              imageRendering: 'auto',
              cursor: getCursorStyle()
            }}
          />
        </div>

        <p className="mt-2 text-sm text-gray-600">
          点击并拖动以绘制矩形。点击矩形以选择它，拖动可移动位置，拖动角点可调整大小。
          使用鼠标滚轮缩放图片。按住空格键可拖动视图。
          快捷键: Ctrl+Z 撤销, Ctrl+Y 重做。
        </p>
      </div>

      {/* 选中的标注详情 */}
      {selectedAnnotation && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">选中的标注</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                名称
              </label>
              <input
                type="text"
                value={editingName}
                onChange={(e) => {
                  const newName = e.target.value;
                  setEditingName(newName);
                  const newAnnotations = annotations.map((ann) =>
                    ann.id === selectedAnnotation
                      ? { ...ann, name: newName }
                      : ann
                  );
                  setAnnotations(newAnnotations);
                  saveToHistory(newAnnotations);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID
              </label>
              <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-600">
                {selectedAnnotation}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">坐标</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  绝对坐标（像素）
                </h5>
                {imageLoaded && annotations
                  .find((ann) => ann.id === selectedAnnotation)
                  ?.relativeRect && (
                  <div className="text-sm space-y-1 text-gray-600">
                    <div>
                      X: {Math.round(annotations.find((a) => a.id === selectedAnnotation)?.relativeRect.x! * imageSize.width)}
                    </div>
                    <div>
                      Y: {Math.round(annotations.find((a) => a.id === selectedAnnotation)?.relativeRect.y! * imageSize.height)}
                    </div>
                    <div>
                      宽度:{' '}
                      {Math.round(annotations.find((a) => a.id === selectedAnnotation)?.relativeRect.width! * imageSize.width)}
                    </div>
                    <div>
                      高度:{' '}
                      {Math.round(annotations.find((a) => a.id === selectedAnnotation)?.relativeRect.height! * imageSize.height)}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  相对坐标（0-1）
                </h5>
                {annotations
                  .find((ann) => ann.id === selectedAnnotation)
                  ?.relativeRect && (
                  <div className="text-sm space-y-1 text-gray-600">
                    <div>
                      X:{' '}
                      {annotations.find((a) => a.id === selectedAnnotation)
                        ?.relativeRect.x.toFixed(3)}
                    </div>
                    <div>
                      Y:{' '}
                      {annotations.find((a) => a.id === selectedAnnotation)
                        ?.relativeRect.y.toFixed(3)}
                    </div>
                    <div>
                      宽度:{' '}
                      {annotations.find((a) => a.id === selectedAnnotation)
                        ?.relativeRect.width.toFixed(3)}
                    </div>
                    <div>
                      高度:{' '}
                      {annotations.find((a) => a.id === selectedAnnotation)
                        ?.relativeRect.height.toFixed(3)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 所有标注列表 */}
      {annotations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            所有标注 ({annotations.length})
          </h3>

          <div className="space-y-2">
            {annotations.map((ann) => (
              <div
                key={ann.id}
                onClick={() => setSelectedAnnotation(ann.id)}
                className={`p-3 border rounded cursor-pointer transition-colors ${
                  selectedAnnotation === ann.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">{ann.name}</div>
                {imageLoaded && (
                  <div className="text-sm text-gray-600">
                    ({Math.round(ann.relativeRect.x * imageSize.width)}, {Math.round(ann.relativeRect.y * imageSize.height)}, {Math.round(ann.relativeRect.width * imageSize.width)}, {Math.round(ann.relativeRect.height * imageSize.height)})
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 截图数据接口
interface ScreenshotData {
  id: string;
  filename: string;
  name: string;
  group: string;
  uploadTime: string;
}
