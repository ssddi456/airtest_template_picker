import React, { useState, useEffect } from 'react';
import { generatePython, getAllAnnotations } from '../lib/api';
import type { Annotation, Group } from '../types/index';

export default function PythonPreview() {
  const [pythonCode, setPythonCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // 分组名称映射
  const GROUP_NAMES: Record<Group, string> = {
    'login': '登录',
    'game_main': '游戏主页',
    'gameplay': '游戏玩法',
    'other': '其他',
  };

  // 加载 Python 代码
  const loadPythonCode = async () => {
    setGenerating(true);
    setError(null);

    const result = await generatePython();
    setGenerating(false);

    if (result.success && result.data) {
      setPythonCode(result.data.code || '');
    } else if (result.error) {
      setError(result.error);
    }
  };

  useEffect(() => {
    loadPythonCode();
  }, []);

  // 处理复制
  const handleCopy = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 从标注生成 Python 代码
  const generateFromAnnotations = async () => {
    setLoading(true);
    setError(null);

    const annotationsResult = await getAllAnnotations();

    if (annotationsResult.success && annotationsResult.data) {
      const allAnnotations = annotationsResult.data;

      const groups: Group[] = ['login', 'game_main', 'gameplay', 'other'];

      let code = `# 自动生成的 Airtest Template 代码
# 生成时间: ${new Date().toLocaleString('zh-CN')}
from airtest.core.api import *

Templates = {
`;

      groups.forEach((group) => {
        const groupAnnotations = allAnnotations.filter(
          (item) => item.screenshotId.includes(group) || group === 'other'
        );

        if (groupAnnotations.length > 0) {
          code += `    # ${GROUP_NAMES[group]}\n`;

          groupAnnotations.forEach((data) => {
            data.currentAnnotations.forEach((ann: Annotation) => {
              code += `    '${ann.name}': Template(r'../data/screenshots/${data.screenshotId}', record_pos=(${ann.rect.x}, ${ann.rect.y}, ${ann.rect.width}, ${ann.rect.height}), target_pos=(${ann.relativeRect.x * 800}, ${ann.relativeRect.y * 600}, ${ann.relativeRect.width * 800}, ${ann.relativeRect.height * 600}), resolution=(800, 600)),\n`;
            });
          });
        }
      });

      code += `}\n`;

      setPythonCode(code);
    } else if (annotationsResult.error) {
      setError(annotationsResult.error);
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-2">Python 代码预览</h2>
        <p className="text-gray-600">
          所有标注自动生成的 Airtest Template 代码（只读模式，保存标注时自动更新）
        </p>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-end">
        <button
          onClick={handleCopy}
          disabled={!pythonCode}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {copied ? '已复制！' : '复制到剪贴板'}
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Python 代码 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">生成的代码</h3>

        {pythonCode ? (
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
            <code>{pythonCode}</code>
          </pre>
        ) : (
          <div className="text-center py-8 text-gray-600">
            尚未生成代码。保存标注时会自动更新此页面。
          </div>
        )}
      </div>

      {/* 使用说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3 text-blue-900">
          使用说明
        </h3>

        <ol className="list-decimal list-inside space-y-2 text-blue-800">
          <li>保存标注时会自动生成并更新此页面的 Python 代码</li>
          <li>
            点击"复制到剪贴板"按钮复制代码
          </li>
          <li>
            将代码粘贴到您的 Airtest 测试脚本文件中（通常是{' '}
            <code>output/templates.py</code> 或类似文件）
          </li>
          <li>
            在测试脚本中使用 <code>Templates</code> 字典
          </li>
          <li>
            示例:{' '}
            <pre className="mt-2 bg-white p-2 rounded text-sm overflow-x-auto">
              <code>touch(Templates['登录按钮'])</code>
            </pre>
          </li>
        </ol>
      </div>
    </div>
  );
}
