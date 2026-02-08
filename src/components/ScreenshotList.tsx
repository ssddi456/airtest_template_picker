import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Screenshot, Group } from '../types/index';
import {
  uploadScreenshot,
  getScreenshots,
  deleteScreenshot,
} from '../lib/api';

// 分组名称映射
const GROUP_NAMES: Record<Group | 'all', string> = {
  'all': '全部分组',
  'login': '登录',
  'game_main': '游戏主页',
  'gameplay': '游戏玩法',
  'other': '其他',
};

export default function ScreenshotList() {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<Group | 'all'>('all');
  const [uploading, setUploading] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadGroup, setUploadGroup] = useState<Group>('other');
  const [dragOver, setDragOver] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 加载截图列表
  const loadScreenshots = async () => {
    setLoading(true);
    setError(null);
    const result = await getScreenshots(search);
    setLoading(false);

    if (result.success && result.data) {
      setScreenshots(result.data);
    } else {
      setError(result.error || '加载截图失败');
    }
  };

  useEffect(() => {
    loadScreenshots();
  }, [search]);

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    if (!uploadName.trim()) {
      setError('请输入截图名称');
      return;
    }

    setUploading(true);
    setError(null);

    const result = await uploadScreenshot(file, uploadName, uploadGroup);
    setUploading(false);

    if (result.success) {
      setUploadName('');
      setUploadGroup('other');
      loadScreenshots();
    } else {
      setError(result.error || '上传截图失败');
    }
  };

  // 处理拖放
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (file?.type.startsWith('image/')) {
        setUploadName(file.name.replace(/\.[^/.]+$/, ''));
        handleFileUpload(file);
      } else {
        setError('请上传图片文件');
      }
    }
  };

  // 处理删除
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此截图吗？')) {
      return;
    }

    const result = await deleteScreenshot(id);
    if (result.success) {
      loadScreenshots();
    } else {
      setError(result.error || '删除截图失败');
    }
  };

  // 过滤截图
  const filteredScreenshots = screenshots.filter((s) => {
    if (groupFilter === 'all') return true;
    return s.group === groupFilter;
  });

  // 按分组显示
  const groupedScreenshots = filteredScreenshots.reduce((acc, screenshot) => {
    if (!acc[screenshot.group]) {
      acc[screenshot.group] = [];
    }
    acc[screenshot.group]?.push(screenshot);
    return acc;
  }, {} as Record<string, Screenshot[]>);

  const groups: (Group | 'all')[] = ['all', 'login', 'game_main', 'gameplay', 'other'];

  return (
    <div className="flex gap-6 mt-6">
      {/* 左侧：上传区域 */}
      <aside className="w-80 flex-shrink-0">
        <div className="bg-white rounded-lg shadow -6 sticky top-6">
          <h2 className="text-xl font-semibold mb-4">上传截图</h2>

          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                名称
              </label>
              <input
                type="text"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="截图名称"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                分组
              </label>
              <select
                value={uploadGroup}
                onChange={(e) => setUploadGroup(e.target.value as Group)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {groups.filter(g => g !== 'all').map((g) => (
                  <option key={g} value={g}>
                    {GROUP_NAMES[g]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file?.type.startsWith('image/')) {
                  setUploadName(file.name.replace(/\.[^/.]+$/, ''));
                  handleFileUpload(file);
                }
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors w-full"
            >
              {uploading ? '上传中...' : '选择文件或拖放图片'}
            </button>
            <p className="mt-2 text-sm text-gray-600">
              支持 PNG、JPG 等图片格式
            </p>
          </div>
        </div>
      </aside>

      {/* 右侧：截图列表 */}
      <main className="flex-1">
        {/* 搜索和筛选 */}
        <div className="bg-white mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                搜索
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="按名称搜索..."
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

            <div className="md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                视图模式
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  title="网格视图"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  title="列表视图"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
            {error}
          </div>
        )}

        {/* 截图列表 */}
        <div className="bg-white">
          <h2 className="text-xl font-semibold mb-4">
            截图列表 ({filteredScreenshots.length})
          </h2>

          {loading && (
            <div className="text-center py-8 text-gray-600">加载中...</div>
          )}

          {!loading && filteredScreenshots.length === 0 && (
            <div className="text-center py-8 text-gray-600">
              没有找到截图，请上传第一张截图。
            </div>
          )}

          {!loading && filteredScreenshots.length > 0 && (
            <div className="space-y-8">
              {groups.filter((g): g is Group => g !== 'all' && (groupedScreenshots[g]?.length || 0) > 0).map((group) => (
                <div key={group as string}>
                  <h3 className="text-lg font-semibold mb-4 text-gray-700">
                    {GROUP_NAMES[group as Group | 'all']} ({groupedScreenshots[group as string]?.length || 0})
                  </h3>
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(groupedScreenshots[group as string] || []).map((screenshot) => (
                        <div
                          key={screenshot.id}
                          className="border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                        >
                          <Link
                            to={`/screenshots/${screenshot.id}`}
                            className="block aspect-video bg-gray-100 relative"
                          >
                            <img
                              src={`/data/screenshots/${screenshot.filename}`}
                              alt={screenshot.name}
                              className="w-full h-full object-cover"
                            />
                          </Link>

                          <div className="p-4">
                            <h3 className="font-semibold text-lg mb-1">
                              {screenshot.name}
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-1 bg-gray-100 text-xs font-medium rounded">
                                {GROUP_NAMES[screenshot.group]}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(screenshot.uploadTime).toLocaleString('zh-CN')}
                              </span>
                            </div>

                            <div className="flex gap-2">
                              <Link
                                to={`/screenshots/${screenshot.id}`}
                                className="flex-1 px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm text-center"
                              >
                                标注
                              </Link>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleDelete(screenshot.id);
                                }}
                                className="flex-1 px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                              >
                                删除
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(groupedScreenshots[group as string] || []).map((screenshot) => (
                        <div
                          key={screenshot.id}
                          className="border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex"
                        >
                          <Link
                            to={`/screenshots/${screenshot.id}`}
                            className="w-32 aspect-video bg-gray-100 relative"
                          >
                            <img
                              src={`/data/screenshots/${screenshot.filename}`}
                              alt={screenshot.name}
                              className="w-full h-full object-cover"
                            />
                          </Link>

                          <div className="flex-1 p-2 flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold mb-1">
                                {screenshot.name}
                              </h3>
                              <div className="flex items-center gap-3">
                                <span className="px-2 py-1 bg-gray-100 text-xs font-medium rounded">
                                  {GROUP_NAMES[screenshot.group]}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(screenshot.uploadTime).toLocaleString('zh-CN')}
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-2 ml-4">
                              <Link
                                to={`/screenshots/${screenshot.id}`}
                                className="px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                              >
                                标注
                              </Link>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleDelete(screenshot.id);
                                }}
                                className="px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                              >
                                删除
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
