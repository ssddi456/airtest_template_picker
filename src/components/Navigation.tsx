import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navigation() {
  const location = useLocation();

  const views = [
    { id: '/screenshots', label: '截图', icon: '📷' },
    { id: '/annotations', label: '标注', icon: '📝' },
    { id: '/python', label: 'Python 代码', icon: '🐍' },
  ] as const;

  return (
    <nav className="flex space-x-1">
      {views.map((view) => (
        <Link
          key={view.id}
          to={view.id}
          className={`px-2 py-1 transition-colors duration-200 ${
            location.pathname.startsWith(view.id) || (view.id === '/screenshots' && location.pathname === '/')
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <span className="mr-2">{view.icon}</span>
          <span>{view.label}</span>
        </Link>
      ))}
    </nav>
  );
}

