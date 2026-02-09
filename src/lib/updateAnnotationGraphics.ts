import * as PIXI from 'pixi.js';
import { HandleType } from './PixiJSCore';
import { Rect } from '../types';

const cornerSize = 8;
const halfHandle = cornerSize / 2;

/**
 * 更新标注图形（选中/未选中状态）
 */
export function updateAnnotationGraphics(
  graphics: PIXI.Graphics,
  isSelected: boolean,
  width: number,
  height: number): void {
  graphics.clear();

  // 绘制矩形
  graphics.rect(0, 0, width, height);
  graphics.fill({ color: isSelected ? 0x3b82f6 : 0xff0000, alpha: 0.1 });
  graphics.stroke({ color: isSelected ? 0x3b82f6 : 0xff0000, width: isSelected ? 3 : 2 });

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
          cy = height - halfHandle;
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

export function getHandleTypeAtPosition(
  localX: number,
  localY: number,
  {
    x,
    y,
    width,
    height
  }: Rect
): HandleType | null {
  const handles: { type: HandleType; x: number; y: number }[] = [
    { type: 'nw', x: 0, y: 0 },
    { type: 'n', x: width / 2 - halfHandle, y: 0 },
    { type: 'ne', x: width - cornerSize, y: 0 },
    { type: 'e', x: width - cornerSize, y: height / 2 - halfHandle },
    { type: 'se', x: width - cornerSize, y: height - cornerSize },
    { type: 's', x: width / 2 - halfHandle, y: height - cornerSize },
    { type: 'sw', x: 0, y: height - cornerSize },
    { type: 'w', x: 0, y: height / 2 - halfHandle },
  ].map(handle => ({
    type: handle.type as HandleType,
    x: handle.x + x,
    y: handle.y + y
  }));

  for (const handle of handles) {
    if (
      localX >= handle.x &&
      localX <= handle.x + cornerSize &&
      localY >= handle.y &&
      localY <= handle.y + cornerSize
    ) {
      return handle.type;
    }
  }

  return null;
}