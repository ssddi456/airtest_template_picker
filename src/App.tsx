import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ScreenshotList from './components/ScreenshotList';
import AnnotationList from './components/AnnotationList';
import AnnotationDetail from './components/AnnotationDetail';
import ScreenshotHistory from './components/ScreenshotHistory';
import PythonPreview from './components/PythonPreview';

export default function App() {
  return (
    <Layout>
      <Routes>
        {/* 默认路由重定向到截图列表 */}
        <Route path="/" element={<Navigate to="/screenshots" replace />} />
        
        {/* 截图列表页面 */}
        <Route path="/screenshots" element={<ScreenshotList />} />
        
        {/* 截图标注详情页面 */}
        <Route path="/screenshots/:id" element={<AnnotationDetail />} />
        
        {/* 截图历史记录页面 */}
        <Route path="/screenshots/:id/history" element={<ScreenshotHistory />} />
        
        {/* 标注列表页面 */}
        <Route path="/annotations" element={<AnnotationList />} />
        
        {/* 通过标注ID跳转到标注详情 */}
        <Route path="/annotations/:id" element={<NavigateToDetail />} />
        
        {/* Python 代码预览页面 */}
        <Route path="/python" element={<PythonPreview />} />
      </Routes>
    </Layout>
  );
}

// 组件：通过标注ID跳转到对应的标注详情页面
function NavigateToDetail() {
  return <Navigate to="/screenshots" replace />;
}
