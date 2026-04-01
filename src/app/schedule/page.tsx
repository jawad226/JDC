'use client';

import { Calendar, CheckCircle, Clock } from 'lucide-react';
import { useState } from 'react';

const mockTasks = [
  { id: 1, title: 'Fix timesheet bug', status: 'In Progress', priority: 'High', deadline: '2026-04-03' },
  { id: 2, title: 'Update HR policy document', status: 'Pending', priority: 'Medium', deadline: '2026-04-05' },
  { id: 3, title: 'Review quarterly performance', status: 'Completed', priority: 'Low', deadline: '2026-03-28' },
];

export default function TasksPage() {
  const [tasks] = useState(mockTasks);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-slate-800 tracking-tight flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-blue-500" />
            Task Management
          </h1>
          <p className="text-slate-500 mt-2">Manage your projects and tasks effectively.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm focus:ring-4 focus:ring-blue-100">
          Create New Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['Pending', 'In Progress', 'Completed'].map(status => (
          <div key={status} className="bg-slate-100/50 rounded-2xl p-6 border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">{status}</h2>
            <div className="space-y-4">
              {tasks.filter(t => t.status === status).map(task => (
                <div key={task.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer">
                  <h3 className="font-semibold text-slate-800 mb-2">{task.title}</h3>
                  <div className="flex items-center justify-between mt-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                      task.priority === 'High' ? 'bg-red-100 text-red-700' :
                      task.priority === 'Medium' ? 'bg-orange-100 text-orange-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {task.priority}
                    </span>
                    <span className="flex items-center text-xs text-slate-500 font-medium">
                      <Calendar className="w-3.5 h-3.5 mr-1" />
                      {task.deadline}
                    </span>
                  </div>
                </div>
              ))}
              {tasks.filter(t => t.status === status).length === 0 && (
                <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                  No tasks
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
