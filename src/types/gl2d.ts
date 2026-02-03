// gl2D Annotation Format Specification
// 基于 PixiJS/WebGL 的 2D 标注格式

/**
 * gl2D 标注数据格式
 * 参考 LabelMe 格式并扩展以支持 WebGL/PixiJS 渲染
 */
export interface GL2DAnnotationData {
  // 格式版本
  version: string;
  // 格式类型标识
  format: 'gl2d';
  // 渲染引擎信息
  renderer: {
    engine: 'pixijs';
    version: string;
  };
  // 标注元数据
  metadata: {
    // 图像路径
    imagePath: string;
    // 图像尺寸
    imageWidth: number;
    imageHeight: number;
    // 创建时间
    createdAt: string;
    // 更新时间
    updatedAt: string;
  };
  // 标注形状列表
  shapes: GL2DShape[];
  // 附加标记
  flags: Record<string, unknown>;
}

/**
 * gl2D 标注形状
 */
export interface GL2DShape {
  // 形状唯一 ID
  id: string;
  // 形状标签名称
  label: string;
  // 形状类型
  shapeType: 'rectangle' | 'polygon' | 'circle' | 'point' | 'line';
  // 形状坐标（像素）
  // rectangle: [[x1, y1], [x2, y2]] (左上角和右下角)
  // polygon: [[x1, y1], [x2, y2], ...] (多边形顶点)
  // circle: [[centerX, centerY], [radius]]
  // point: [[x, y]]
  // line: [[x1, y1], [x2, y2]]
  points: number[][];
  // 相对坐标（0-1 范围）
  relativePoints: number[][];
  // 形状样式
  style: GL2DShapeStyle;
  // 分组 ID（可选）
  groupId: string | null;
  // 形状级别的标记
  flags: Record<string, unknown>;
  // 可见性
  visible: boolean;
  // Z-index 层级
  zIndex: number;
}

/**
 * gl2D 形状样式
 */
export interface GL2DShapeStyle {
  // 描边颜色（十六进制，如 #ff0000）
  strokeColor: string;
  // 描边宽度
  strokeWidth: number;
  // 填充颜色（十六进制，如 rgba(255, 0, 0, 0.3)）
  fillColor: string;
  // 填充透明度（0-1）
  fillAlpha: number;
  // 虚线模式（可选）
  dashPattern?: number[];
  // 箭头样式（用于线条，可选）
  arrowStyle?: 'none' | 'start' | 'end' | 'both';
}

/**
 * 默认形状样式
 */
export const DEFAULT_SHAPE_STYLE: GL2DShapeStyle = {
  strokeColor: '#ff0000',
  strokeWidth: 2,
  fillColor: '#ff0000',
  fillAlpha: 0.1,
};

/**
 * gl2D 矩形标注（简化接口）
 */
export interface GL2DRectangle {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style?: Partial<GL2DShapeStyle>;
  visible?: boolean;
  zIndex?: number;
}

/**
 * 转换为完整的 GL2DShape
 */
export function rectangleToGL2DShape(
  rect: GL2DRectangle,
  imageWidth: number,
  imageHeight: number
): GL2DShape {
  return {
    id: rect.id,
    label: rect.label,
    shapeType: 'rectangle',
    points: [[rect.x, rect.y], [rect.x + rect.width, rect.y + rect.height]],
    relativePoints: [
      [rect.x / imageWidth, rect.y / imageHeight],
      [(rect.x + rect.width) / imageWidth, (rect.y + rect.height) / imageHeight],
    ],
    style: { ...DEFAULT_SHAPE_STYLE, ...rect.style },
    groupId: null,
    flags: {},
    visible: rect.visible !== undefined ? rect.visible : true,
    zIndex: rect.zIndex !== undefined ? rect.zIndex : 0,
  };
}

/**
 * 从 GL2DShape 提取矩形数据
 */
export function gl2dShapeToRectangle(shape: GL2DShape): GL2DRectangle | null {
  if (shape.shapeType !== 'rectangle') {
    return null;
  }

  const [[x1, y1], [x2, y2]] = shape.points;
  return {
    id: shape.id,
    label: shape.label,
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
    style: shape.style,
    visible: shape.visible,
    zIndex: shape.zIndex,
  };
}

/**
 * 创建空的 gl2D 标注数据
 */
export function createEmptyGL2DAnnotation(
  imagePath: string,
  imageWidth: number,
  imageHeight: number
): GL2DAnnotationData {
  const now = new Date().toISOString();
  return {
    version: '1.0.0',
    format: 'gl2d',
    renderer: {
      engine: 'pixijs',
      version: '8.0.0',
    },
    metadata: {
      imagePath,
      imageWidth,
      imageHeight,
      createdAt: now,
      updatedAt: now,
    },
    shapes: [],
    flags: {},
  };
}

/**
 * 更新 gl2D 标注的时间戳
 */
export function updateGL2DAnnotationTimestamp(data: GL2DAnnotationData): GL2DAnnotationData {
  return {
    ...data,
    metadata: {
      ...data.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
}
