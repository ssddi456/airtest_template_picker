import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Version } from '../types/index';
import { getVersionHistory, rollbackVersion } from '../lib/api';

export default function ScreenshotHistory() {
  const { id: screenshotId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rollingBack, setRollingBack] = useState(false);

  // 加载历史版本
  const loadVersions = async () => {
    if (!screenshotId) return;

    setLoading(true);
    setError(null);
    const result = await getVersionHistory(screenshotId);
    setLoading(false);

    if (result.success && result.data) {
      setVersions(result.data);
    } else if (result.error) {
      setError(result.error);
    }
  };

  useEffect(() => {
    loadVersions();
  }, [screenshotId]);

  // 处理回滚
  const handleRollback = async (versionIndex: number) => {
    if (!confirm(`确定要回滚到版本 ${versionIndex + 1} 吗？`)) {
      return;
    }

    if (!screenshotId) return;

    setRollingBack(true);
    setError(null);

    try {
      const result = await rollbackVersion(
        screenshotId,
        versionIndex.toString()
      );
      setRollingBack(false);

      if (result.success) {
        alert('回滚成功！');
        loadVersions();
        // 返回标注详情页面
        navigate(`/screenshots/${screenshotId}`);
      } else {
        setError(result.error || '回滚失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '回滚失败');
      setRollingBack(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold mb-2">历史记录</h2>
            <p className="text-gray-600">
              查看和管理标注的历史版本
            </p>
          </div>
          {screenshotId && (
            <button
              onClick={() => navigate(`/screenshots/${screenshotId}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              返回标注详情
            </button>
          )}
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* 版本列表 */}
      <div className="bg-white rounded-lg shadow p-6">
        {loading && (
          <div className="text-center py-8 text-gray-600">加载中...</div>
        )}

        {!loading && versions.length === 0 && (
          <div className="text-center py-8 text-gray-600">
            没有历史版本记录。请先保存一些标注。
          </div>
        )}

        {!loading && versions.length > 0 && (
          <div className="space-y-4">
            {versions.map((version, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {version.description}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(version.timestamp).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRollback(index)}
                    disabled={rollingBack}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    {rollingBack ? '回滚中...' : '回滚'}
                  </button>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    标注 ({version.annotations.length})
                  </h4>

                  <div className="space-y-2">
                    {version.annotations.map((ann) => (
                      <div
                        key={ann.id}
                        className="bg-gray-50 p-3 rounded-md"
                      >
                        <div className="font-medium">{ann.name}</div>
                        <div className="text-sm text-gray-600">
                          位置: ({ann.rect.x}, {ann.rect.y},{' '}
                          {ann.rect.width}, {ann.rect.height})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
