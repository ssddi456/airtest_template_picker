import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Screenshot, Group, Annotation } from '../types/index';
import {
  getScreenshots,
  getAnnotations,
} from '../lib/api';

// 分组名称映射
const GROUP_NAMES: Record<Group | 'all', string> = {
  'all': '全部分组',
  'login': '登录',
  'game_main': '游戏主页',
  'gameplay': '游戏玩法',
  'other': '其他',
};

// 扩展的截图信息，包含标注
interface ScreenshotWithAnnotations extends Screenshot {
  annotations: Annotation[];
}

export default function AnnotationList() {
  const [screenshotsWithAnnotations, setScreenshotsWithAnnotations] = useState<ScreenshotWithAnnotations[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupFilter, setGroupFilter] = useState<Group | 'all'>('all');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // 加载所有截图和标注
  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 获取所有截图
      const screenshotsResult = await getScreenshots();
      if (!screenshotsResult.success || !screenshotsResult.data) {
        throw new Error(screenshotsResult.error || '加载截图失败');
      }

      // 获取每个截图的标注
      const data = await Promise.all(
        screenshotsResult.data.map(async (screenshot) => {
          const annotationsResult = await getAnnotations(screenshot.id);
          return {
            ...screenshot,
            annotations: annotationsResult.success && annotationsResult.data ? annotationsResult.data : [],
          };
        })
      );

      setScreenshotsWithAnnotations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 过滤和搜索
  const filteredData = screenshotsWithAnnotations.filter((item) => {
    // 按分组筛选
    if (groupFilter !== 'all' && item.group !== groupFilter) {
      return false;
    }

    // 按搜索词筛选（标注名称或截图名称）
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesAnnotation = item.annotations.some(
        (ann) => ann.name.toLowerCase().includes(searchLower)
      );
      const matchesScreenshot = item.name.toLowerCase().includes(searchLower);
      return matchesAnnotation || matchesScreenshot;
    }

    return true;
  });

  // 按分组显示标注
  const groupedAnnotations = filteredData.reduce((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = [];
    }
    if (item.annotations.length > 0) {
      item.annotations.forEach((ann) => {
        acc[item.group]?.push({
          ...ann,
          screenshotName: item.name,
          screenshotId: item.id,
        });
      });
    }
    return acc;
  }, {} as Record<string, Array<Annotation & { screenshotName: string; screenshotId: string }>>);

  const groups: (Group | 'all')[] = ['all', 'login', 'game_main', 'gameplay', 'other'];

  // 点击标注跳转到标注详情
  const handleAnnotationClick = (screenshotId: string, annotationId: string) => {
    navigate(`/screenshots/${screenshotId}`, { state: { selectedAnnotationId: annotationId } });
  };

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-2">标注列表</h2>
        <p className="text-gray-600">
          查看所有截图的标注信息，点击标注可进入对应的标注详情页面
        </p>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              搜索
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="按标注名称或截图名称搜索..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              按分组筛选
            </label>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value as Group | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {groups.map((g) => (
                <option key={g} value={g}>
                  {GROUP_NAMES[g]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* 标注列表 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          标注信息 ({filteredData.reduce((sum, item) => sum + item.annotations.length, 0)})
        </h2>

        {loading && (
          <div className="text-center py-8 text-gray-600">加载中...</div>
        )}

        {!loading && filteredData.length === 0 && (
          <div className="text-center py-8 text-gray-600">
            没有找到标注信息。请先上传截图并添加标注。
          </div>
        )}

        {!loading && filteredData.length > 0 && (
          <div className="space-y-8">
            {groups.filter((g): g is Group => g !== 'all' && (groupedAnnotations[g]?.length || 0) > 0).map((group) => (
              <div key={group}>
                <h3 className="text-lg font-semibold mb-4 text-gray-700">
                  {GROUP_NAMES[group]} ({(groupedAnnotations[group]?.length || 0)})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedAnnotations[group]?.map((ann) => (
                    <div
                      key={ann.id}
                      onClick={() => handleAnnotationClick(ann.screenshotId, ann.id)}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-400 transition-all cursor-pointer"
                    >
                      <h4 className="font-semibold text-lg mb-2">{ann.name}</h4>
                      <div className="text-sm text-gray-600 mb-2">
                        截图: {ann.screenshotName}
                      </div>
                      <div className="text-sm text-gray-500">
                        位置: ({ann.rect.x}, {ann.rect.y}, {ann.rect.width}, {ann.rect.height})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
