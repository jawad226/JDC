'use client';

import { PersonalStats, TimesheetTable } from '@/app/timesheet/page';
import { useStore, useShallow } from '@/lib/store';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  Target,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, type ComponentType } from 'react';

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  color: string;
  bg: string;
}) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm group hover:shadow-md transition-all">
      <div className={`${bg} ${color} w-10 h-10 rounded-xl flex items-center justify-center mb-4`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
    </div>
  );
}

export default function TeamDataPage() {
  const router = useRouter();
  const { currentUser, users, timesheets, tasks } = useStore(
    useShallow((s) => ({
      currentUser: s.currentUser,
      users: s.users,
      timesheets: s.timesheets,
      tasks: s.tasks,
    }))
  );

  useEffect(() => {
    if (currentUser && currentUser.role !== 'Team Leader') {
      router.replace('/');
    }
  }, [currentUser, router]);

  if (!currentUser || currentUser.role !== 'Team Leader') {
    return (
      <div className="max-w-6xl mx-auto py-16 text-center text-slate-500 text-sm">
        Loading…
      </div>
    );
  }

  const now = new Date();
  const myTeam = currentUser.team;
  const teamMembers = users.filter((u) => u.team === myTeam && u.role !== 'Pending User');
  const teamTasks = tasks.filter((t) => teamMembers.some((m) => m.id === t.assignedTo));
  const completedTasks = teamTasks.filter((t) => t.status === 'Approved').length;
  const inProgressTasks = teamTasks.filter((t) => t.status === 'In Progress').length;
  const overdueTasks = teamTasks.filter(
    (t) => t.status !== 'Approved' && new Date(t.deadline) < now
  ).length;

  const teamTimesheets = timesheets
    .filter((t) => teamMembers.some((m) => m.id === t.userId))
    .sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime());

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-12">
      <div>
        <h1 className="text-3xl font-light text-slate-800 tracking-tight">Team Data</h1>
        <p className="mt-2 text-slate-500 font-medium">
          {myTeam ? (
            <>
              <span className="font-semibold text-slate-700">{myTeam}</span>
              {' · '}
              Work progress and attendance for your team.
            </>
          ) : (
            'Assign a team to your profile to see roster data.'
          )}
        </p>
      </div>

      <section className="space-y-6">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Target className="w-5 h-5 text-indigo-500" />
          Work progress
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <StatCard icon={Users} label="Team size" value={teamMembers.length} color="text-blue-500" bg="bg-blue-50" />
          <StatCard
            icon={BarChart3}
            label="In progress"
            value={inProgressTasks}
            color="text-indigo-500"
            bg="bg-indigo-50"
          />
          <StatCard
            icon={CheckCircle2}
            label="Completed"
            value={completedTasks}
            color="text-emerald-500"
            bg="bg-emerald-50"
          />
          <StatCard icon={AlertCircle} label="Overdue" value={overdueTasks} color="text-rose-500" bg="bg-rose-50" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Member performance
            </h3>
            <div className="space-y-5">
              {teamMembers.length === 0 ? (
                <p className="text-sm text-slate-400">No team members yet.</p>
              ) : (
                teamMembers.map((member) => {
                  const memberTasks = tasks.filter((t) => t.assignedTo === member.id);
                  const done = memberTasks.filter((t) => t.status === 'Approved').length;
                  const total = memberTasks.length;
                  const pct = total > 0 ? (done / total) * 100 : 0;
                  const isActive = timesheets.some((t) => t.userId === member.id && !t.clockOut);

                  return (
                    <div key={member.id}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                              {member.name.charAt(0)}
                            </div>
                            <div
                              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                isActive ? 'bg-emerald-500' : 'bg-slate-300'
                              }`}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700">{member.name}</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-400">
                          {done}/{total}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(pct, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-blue-100">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2">Team status</h3>
              <p className="text-blue-100 text-xs leading-relaxed mb-4 font-medium">
                {teamMembers.filter((m) => timesheets.some((t) => t.userId === m.id && !t.clockOut)).length} of{' '}
                {teamMembers.length} members clocked in now.
              </p>
              <div className="flex flex-wrap gap-2">
                {teamMembers.map((m) => {
                  const isActive = timesheets.some((t) => t.userId === m.id && !t.clockOut);
                  return (
                    <div
                      key={m.id}
                      title={m.name}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold border-2 ${
                        isActive
                          ? 'bg-white/20 border-white/40 text-white'
                          : 'bg-white/5 border-white/10 text-white/30'
                      }`}
                    >
                      {m.name.charAt(0)}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Clock className="w-5 h-5 text-blue-500" />
          Attendance
        </h2>
        <p className="text-sm text-slate-500 -mt-2">
          Your weekly totals and the full team log (same view as Timesheet → team scope).
        </p>

        <PersonalStats userId={currentUser.id} timesheets={timesheets} />

        <TimesheetTable
          timesheets={teamTimesheets}
          users={teamMembers}
          title={myTeam ? `${myTeam} — team log` : 'Team attendance log'}
        />
      </section>
    </div>
  );
}
