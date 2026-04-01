'use client';

import { useStore, TaskStatus } from '@/lib/store';
import { Play, Square, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const { currentUser, timesheets, clockIn, clockOut, tasks, updateTaskStatus } = useStore();
  const [now, setNow] = useState(new Date());
  
  // Find current active timesheet
  const activeTimesheet = timesheets.find(t => t.userId === currentUser?.id && !t.clockOut);
  const isClockedIn = !!activeTimesheet;

  // Filter tasks for this user
  const userTasks = tasks.filter(t => t.assignedTo === currentUser?.id);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hello Card mimicking the reference image */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col md:flex-row items-center justify-between mb-8 gap-6 md:gap-0">
        <div>
          <h1 className="text-4xl font-light text-slate-800 tracking-tight">
            Hello, <span className="font-semibold text-black">{currentUser?.name.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">
            {format(now, "EEE MMMM d yyyy-HH:mm")}
          </p>
          {activeTimesheet?.lateMark && (
            <div className="mt-4 flex items-center space-x-2 text-rose-500 bg-rose-50 px-3 py-1.5 rounded-full w-fit">
               <AlertCircle size={16} />
               <span className="text-sm font-semibold">Late Mark Applied</span>
            </div>
          )}
        </div>
        
        {/* Huge Add/Start Button */}
        <div>
          {!isClockedIn ? (
            <button
              onClick={clockIn}
              className="group relative flex flex-col items-center justify-center w-36 h-36 bg-blue-500 rounded-full text-white shadow-lg hover:bg-blue-600 transition-all hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              <div className="absolute inset-0 rounded-full bg-blue-400 opacity-20 blur-xl group-hover:opacity-40 transition-opacity"></div>
              <Play className="h-10 w-10 ml-2 mb-1" fill="currentColor" />
              <span className="text-xl font-bold mt-1">Start</span>
            </button>
          ) : (
            <button
              onClick={clockOut}
              className="group relative flex flex-col items-center justify-center w-36 h-36 bg-red-500 rounded-full text-white shadow-lg hover:bg-red-600 transition-all hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-red-100"
            >
              <div className="absolute inset-0 rounded-full bg-red-400 opacity-20 blur-xl group-hover:opacity-40 transition-opacity"></div>
              <Square className="h-8 w-8 mb-2" fill="currentColor" />
              <span className="text-xl font-bold mt-1">Stop</span>
              <span className="text-xs opacity-80 mt-1">
                Started {format(new Date(activeTimesheet.clockIn), "HH:mm")}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Tasks Section */}
      <div>
        <h2 className="text-xl font-semibold text-blue-400 mb-6">My Assigned Tasks</h2>
        
        {userTasks.length === 0 ? (
          <div className="flex items-center justify-center h-64 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
            <p className="text-2xl text-slate-600 font-light">No tasks assigned yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userTasks.map(task => (
              <div key={task.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-slate-800 text-lg leading-tight">{task.title}</h3>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    task.priority === 'High' ? 'bg-rose-100 text-rose-700' :
                    task.priority === 'Medium' ? 'bg-orange-100 text-orange-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {task.priority}
                  </span>
                </div>
                <p className="text-slate-500 text-sm mb-6 flex-1">{task.description}</p>
                
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                  <div className="flex items-center text-xs text-slate-400">
                    <Clock size={14} className="mr-1" />
                    {format(new Date(task.deadline), 'MMM d, yyyy')}
                  </div>
                  
                  <select 
                    value={task.status}
                    onChange={(e) => {
                       updateTaskStatus(task.id, e.target.value as TaskStatus);
                       alert(`Task status updated to ${e.target.value}`);
                    }}
                    className={`text-sm font-semibold border-none bg-slate-50 rounded-lg px-2 py-1 outline-none ring-0 cursor-pointer ${
                      task.status === 'Completed' ? 'text-green-600' : 
                      task.status === 'In Progress' ? 'text-blue-600' : 'text-slate-600'
                    }`}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
