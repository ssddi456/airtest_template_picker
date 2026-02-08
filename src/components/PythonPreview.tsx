import React, { useState, useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import { generatePython, getPythonCode } from '../lib/api';

interface CodeMirrorEditorProps {
  code: string;
}

function CodeMirrorEditor({ code }: CodeMirrorEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    // 销毁旧实例
    if (viewRef.current) {
      viewRef.current.destroy();
    }

    // 创建新的编辑器状态
    const state = EditorState.create({
      doc: code,
      extensions: [
        basicSetup,
        python(),
        oneDark,
        EditorView.editable.of(false), // 只读模式
        EditorView.theme({
          '&': { height: '100%' },
          '.cm-scroller': { fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace' },
        }),
      ],
    });

    // 创建编辑器视图
    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, [code]);

  return (
    <div
      ref={editorRef}
      className="h-[600px] rounded-lg overflow-hidden border border-gray-300"
    />
  );
}

export default function PythonPreview() {
  const [pythonCode, setPythonCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 加载 Python 代码
  const loadPythonCode = async () => {
    setLoading(true);
    setError(null);

    const result = await getPythonCode();
    setLoading(false);

    if (result.success && result.data) {
      if (result.data.code) {
        setPythonCode(result.data.code);
      } else {
        setPythonCode('');
        // 显示消息而不是错误
        setError(result.data.message || '尚未生成代码。保存标注后会自动生成。');
      }
    } else if (result.error) {
      setError(result.error);
    }
  };

  const regeneratePythonCode = async () => {
    setLoading(true);
    setError(null);

    const result = await generatePython();
    setLoading(false);

    if (result.success) {
      await loadPythonCode();
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

  return (
    <div className="space-y-2">
      {/* 标题 */}
      <div className="bg-white m-4">
        <h2 className="text-xl font-semibold mb-2">Python 代码预览</h2>
        {/* 操作按钮 */}
        <div className="flex justify-start items-center">
          <button
            onClick={regeneratePythonCode}
            disabled={loading}
            className={`
              px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors
              rounded-r-none
              `}
          >
            {loading ? '刷新中...' : '刷新代码'}
          </button>
          <button
            onClick={handleCopy}
            disabled={!pythonCode}
            className={`
              px-2 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors
              rounded-l-none
            `}
          >
            {copied ? '已复制！' : '复制到剪贴板'}
          </button>
        </div>
      </div>


      {/* 错误提示 */}
      {error && (
        <div className="m-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
            {error}
          </div>
        </div>
      )}

      {/* Python 代码 */}
      <div className="bg-white rounded-lg shadow m-4">
        <h3 className="text-lg font-semibold mb-4">生成的代码</h3>

        {pythonCode ? (
          <CodeMirrorEditor code={pythonCode} />
        ) : (
          <div className="text-center py-8 text-gray-600">
            尚未生成代码。保存标注后会自动生成。
          </div>
        )}
      </div>

      {/* 使用说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg m-4 p-4">
        <h3 className="text-lg font-semibold mb-3 text-blue-900">
          使用说明
        </h3>

        <ol className="list-decimal list-inside space-y-2 text-blue-800">
          <li>保存标注时会自动生成并更新 Python 代码文件</li>
          <li>此页面每5秒自动刷新一次代码</li>
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
