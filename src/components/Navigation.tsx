import React from 'react';

interface NavigationProps {
  currentView: 'screenshots' | 'annotations' | 'history' | 'python';
  onViewChange: (view: 'screenshots' | 'annotations' | 'history' | 'python') => void;
}

export default function Navigation({ currentView, onViewChange }: NavigationProps) {
  const views = [
    { id: 'screenshots', label: 'Screenshots', icon: '📷' },
    { id: 'annotations', label: 'Annotations', icon: '📝' },
    { id: 'history', label: 'Version History', icon: '📜' },
    { id: 'python', label: 'Python Code', icon: '🐍' },
  ] as const;

  return (
    <nav className="flex space-x-4">
      {views.map((view) => (
        <button
          key={view.id}
          onClick={() => onViewChange(view.id as any)}
          className={`px-4 py-2 rounded-md transition-colors duration-200 ${
            currentView === view.id
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <span className="mr-2">{view.icon}</span>
          <span>{view.label}</span>
        </button>
      ))}
    </nav>
  );
}
