"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { 
  Users, 
  BookOpen, 
  CheckCircle, 
  UserCheck, 
  TrendingUp,
  Clock,
  ClipboardList
} from "lucide-react";
import { format, subDays, parseISO } from "date-fns";
import { useDashboardSettings } from "@/hooks/use-dashboard-settings";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

const COLORS = ['#10b981', '#f43f5e', '#eab308']; // Green, Red, Yellow for present, absent, leave
const TASK_COLORS = ['#3b82f6', '#10b981']; // Blue for pending, Green for completed

export default function Dashboard() {
  const { enabledWidgets, isLoaded } = useDashboardSettings();

  const stats = useLiveQuery(async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const classesCount = await db.classes.count();
    const studentsActive = await db.students.where('status').equals('جاری').count();
    const studentsGraduated = await db.students.where('status').equals('فارغ').count();
    const coursesCount = await db.courses.count();
    const todayAttendance = await db.attendance.where('date').equals(today).and(a => a.status === 'حاضر').count();
    
    // Total skills vs completed skills
    const totalTracking = await db.skillTracking.count();
    const completedTracking = await db.skillTracking.where('status').equals('Completed').count();
    const skillsProgress = totalTracking > 0 ? Math.round((completedTracking / totalTracking) * 100) : 0;

    // Weekly Attendance
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const dayData = await db.attendance.where('date').equals(d).toArray();
      let present = 0, absent = 0, leave = 0;
      dayData.forEach(a => {
        if (a.status === 'حاضر') present++;
        else if (a.status === 'غیر حاضر') absent++;
        else if (a.status === 'رخصت') leave++;
      });
      weeklyData.push({
        name: format(parseISO(d), 'MMM dd'),
        حاضر: present,
        'غیر حاضر': absent,
        رخصت: leave
      });
    }

    // Tasks overview
    const pendingTasks = await db.tasks.where('status').equals('Pending').count();
    const completedTasks = await db.tasks.where('status').equals('Completed').count();
    const tasksData = [
      { name: 'Pending', value: pendingTasks },
      { name: 'Completed', value: completedTasks }
    ];

    return {
      classesCount,
      studentsActive,
      studentsGraduated,
      coursesCount,
      todayAttendance,
      skillsProgress,
      totalTracking,
      completedTracking,
      weeklyData,
      tasksData
    };
  }, []);

  if (!stats || !isLoaded) {
    return <div className="flex h-full items-center justify-center"><div className="animate-pulse flex flex-col items-center"><div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div><p className="mt-4 text-gray-500 font-medium">لوڈ ہو رہا ہے...</p></div></div>;
  }

  const statCards = [
    { title: "کل کلاسز", value: stats.classesCount, icon: Users, color: "bg-blue-500", light: "bg-blue-50", text: "text-blue-600" },
    { title: "جاری طلباء", value: stats.studentsActive, icon: UserCheck, color: "bg-teal-500", light: "bg-teal-50", text: "text-teal-600" },
    { title: "فارغ طلباء", value: stats.studentsGraduated, icon: CheckCircle, color: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-600" },
    { title: "کل کورسز", value: stats.coursesCount, icon: BookOpen, color: "bg-purple-500", light: "bg-purple-50", text: "text-purple-600" },
  ];

  return (
    <div className="space-y-6 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Stats Grid */}
      {enabledWidgets.includes('summaryCards') && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, idx) => {
            return (
              <div key={idx} className="glass-card p-5 stat-card-glow flex flex-col group">
                <p className="text-text-muted text-sm font-medium mb-1">{card.title}</p>
                <h3 className="text-3xl font-bold mt-1 text-text-primary">{card.value}</h3>
                <p className="text-accent text-xs mt-2 flex items-center gap-1">
                  ↑ <span className="opacity-80">اپ ڈیٹ شدہ</span>
                </p>
              </div>
            );
          })}
        </section>
      )}

      {/* Primary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's Attendance */}
        {enabledWidgets.includes('attendanceOverview') && (
          <div className="col-span-1 lg:col-span-2 glass-card p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-lg text-text-primary">آج کی کل حاضری</h4>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-5xl font-bold text-text-primary">{stats.todayAttendance}</span>
              <span className="text-sm text-text-muted">طلباء حاضر ہیں</span>
            </div>
            <div className="mt-auto p-4 bg-surface-light border border-border-subtle rounded-xl flex items-center justify-between">
               <div className="text-sm text-text-muted">مزید تفصیلی حاضری کا ریکارڈ رپورٹس میں دیکھیں۔</div>
               <Clock className="w-6 h-6 text-accent opacity-50" />
            </div>
          </div>
        )}

        {/* Skills Progress */}
        {enabledWidgets.includes('skillsProgress') && (
          <div className="col-span-1 glass-card p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-text-primary">سکلز تکمیل کی صورتحال</h4>
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
            <div className="flex flex-col gap-1 mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-text-muted">مجموعی پیشرفت</span>
                <span className="font-bold text-text-primary">{stats.skillsProgress}%</span>
              </div>
              <div className="w-full h-2 bg-surface-light rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent shadow-[0_0_10px_var(--color-accent)] transition-all duration-1000 ease-out" 
                  style={{ width: `${stats.skillsProgress}%` }}
                ></div>
              </div>
            </div>
            <div className="mt-4 text-xs text-text-muted">
              <span className="text-text-primary font-bold">{stats.completedTracking}</span> سکلز مکمل ہو چکی ہیں، کل <span className="text-text-primary font-bold">{stats.totalTracking}</span> میں سے۔
            </div>
          </div>
        )}
      </div>

      {/* Secondary Row for Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Weekly Attendance Chart */}
        {enabledWidgets.includes('weeklyAttendance') && (
          <div className="glass-card p-6 h-96 flex flex-col">
            <h4 className="font-bold text-lg text-text-primary mb-6">ہفتہ وار حاضری کا رجحان</h4>
            <div className="flex-1 min-h-0 w-full" style={{ fontFamily: 'var(--font-sans)', fontSize: '12px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: 'rgba(0,0,0,0.05)'}}
                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend />
                  <Bar dataKey="حاضر" stackId="a" fill={COLORS[0]} radius={[0, 0, 4, 4]} />
                  <Bar dataKey="رخصت" stackId="a" fill={COLORS[2]} />
                  <Bar dataKey="غیر حاضر" stackId="a" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tasks Overview Chart */}
        {enabledWidgets.includes('tasksOverview') && (
          <div className="glass-card p-6 h-96 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-bold text-lg text-text-primary">ٹاسکس کی صورتحال</h4>
              <ClipboardList className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1 min-h-0 w-full" style={{ fontFamily: 'var(--font-sans)', fontSize: '12px' }}>
              {stats.tasksData.reduce((acc, curr) => acc + curr.value, 0) === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-text-muted">
                  کوئی ٹاسک موجود نہیں
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.tasksData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {stats.tasksData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={TASK_COLORS[index % TASK_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)' }} 
                      itemStyle={{ color: '#333' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
