"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Calendar, User, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp, PieChart as PieChartIcon, BookOpen } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

export default function StudentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const student = useLiveQuery(() => db.students.get(studentId), [studentId]);
  const classEntity = useLiveQuery(() => student ? db.classes.get(student.classId) : undefined, [student]);
  
  // All attendance records for this student
  const attendanceRecords = useLiveQuery(
    () => db.attendance.where('studentId').equals(studentId).reverse().sortBy('date'),
    [studentId]
  );

  if (student === undefined) {
    return <div className="p-8 text-center text-text-muted">لوڈ ہو رہا ہے...</div>;
  }

  if (student === null) {
    return (
      <div className="p-8 text-center bg-surface-base rounded-xl border border-border-subtle max-w-md mx-auto mt-12">
        <User className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-text-primary mb-2">طالب علم نہیں ملا</h2>
        <p className="text-text-muted mb-6">اس آئی ڈی کے ساتھ کوئی طالب علم موجود نہیں ہے۔</p>
        <button 
          onClick={() => router.back()}
          className="px-6 py-2 bg-surface-light hover:bg-surface-light/80 text-text-primary rounded-xl transition-colors border border-border-subtle"
        >
          واپس جائیں
        </button>
      </div>
    );
  }

  // Calculate stats
  const totalDays = attendanceRecords?.length || 0;
  let presentDays = 0;
  let absentDays = 0;
  let leaveDays = 0;
  let skippedDays = 0;

  attendanceRecords?.forEach(record => {
    if (record.status === 'حاضر') presentDays++;
    else if (record.status === 'غیر حاضر') absentDays++;
    else if (record.status === 'رخصت') leaveDays++;
    else if (record.status === 'skip') skippedDays++;
  });

  const presentPercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
  
  const pieData = [
    { name: 'حاضر', value: presentDays, color: '#10b981' }, // emerald-500
    { name: 'رخصت', value: leaveDays, color: '#3b82f6' },   // blue-500
    { name: 'غیر حاضر', value: absentDays, color: '#ef4444' } // red-500
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={() => router.back()}
          className="p-2 bg-surface-base hover:bg-surface-light border border-border-subtle rounded-xl text-text-muted hover:text-text-primary transition-all"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="text-sm font-medium text-text-muted">
          <Link href="/students" className="hover:text-accent transition-colors">طلباء</Link>
          <span className="mx-2">/</span>
          <span className="text-text-primary">تفصیلات</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="glass-card stat-card-glow p-6 lg:col-span-1 border-border-subtle flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-surface-light/50 rounded-full border-2 border-accent/30 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(var(--color-accent),0.1)]">
            <User className="w-10 h-10 text-accent/80" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">{student.name}</h2>
          <p className="font-mono text-accent font-medium mt-1 mb-6 text-lg">{student.rollNo}</p>
          
          <div className="w-full space-y-3 bg-bg-base/30 p-4 rounded-xl border border-border-subtle text-right">
            <div className="flex justify-between items-center pb-2 border-b border-border-subtle/50">
              <span className="text-text-muted text-sm flex items-center gap-2"><BookOpen className="w-4 h-4" /> کلاس</span>
              <span className="font-semibold text-text-primary">{classEntity?.name || 'نامعلوم'}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-border-subtle/50">
              <span className="text-text-muted text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4" /> سٹیٹس</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${student.status === 'جاری' ? 'bg-accent/10 text-accent' : 'bg-surface-light text-text-muted'}`}>
                {student.status}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-muted text-sm flex items-center gap-2"><Clock className="w-4 h-4" /> اندراج</span>
              <span className="text-text-primary text-sm">{format(new Date(student.enrolledAt), 'dd MMM yyyy')}</span>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-card p-4 border border-border-subtle text-center">
              <p className="text-text-muted text-sm font-medium mb-1">کل ایام</p>
              <p className="text-2xl font-bold text-text-primary">{totalDays}</p>
            </div>
            <div className="glass-card p-4 border border-border-subtle text-center bg-emerald-500/5">
              <p className="text-emerald-500 text-sm font-medium mb-1">حاضر</p>
              <p className="text-2xl font-bold text-emerald-400">{presentDays}</p>
            </div>
            <div className="glass-card p-4 border border-border-subtle text-center bg-blue-500/5">
              <p className="text-blue-500 text-sm font-medium mb-1">رخصت</p>
              <p className="text-2xl font-bold text-blue-400">{leaveDays}</p>
            </div>
            <div className="glass-card p-4 border border-border-subtle text-center bg-red-500/5">
              <p className="text-red-500 text-sm font-medium mb-1">غیر حاضر</p>
              <p className="text-2xl font-bold text-red-400">{absentDays}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 border border-border-subtle flex flex-col items-center justify-center">
              <h3 className="text-lg font-bold text-text-primary mb-4 w-full text-right flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-accent" /> حاضری کا تناسب
              </h3>
              
              {totalDays > 0 && presentPercentage > 0 ? (
                <div className="relative w-48 h-48">
                  <div className="absolute inset-0 flex items-center justify-center flex-col z-10">
                    <span className="text-3xl font-bold text-text-primary">{presentPercentage}%</span>
                    <span className="text-xs text-text-muted">حاضری</span>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: 'var(--color-surface-base)', borderColor: 'var(--color-border-subtle)', color: 'var(--color-text-primary)', borderRadius: '0.5rem' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center">
                  <AlertCircle className="w-10 h-10 text-surface-light mb-2" />
                  <p className="text-text-muted">کافی ڈیٹا موجود نہیں</p>
                </div>
              )}
            </div>

            <div className="glass-card p-0 border border-border-subtle flex flex-col h-full max-h-80">
              <div className="p-4 border-b border-border-subtle bg-surface-light/30">
                <h3 className="font-bold text-text-primary flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-accent" /> حالیہ ریکارڈ
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {attendanceRecords && attendanceRecords.length > 0 ? (
                  <div className="space-y-2">
                    {attendanceRecords.map(record => {
                       let statusIcon;
                       let statusClass = "";
                       
                       if (record.status === 'حاضر') {
                         statusIcon = <CheckCircle className="w-4 h-4" />;
                         statusClass = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                       } else if (record.status === 'غیر حاضر') {
                         statusIcon = <XCircle className="w-4 h-4" />;
                         statusClass = "text-red-400 bg-red-500/10 border-red-500/20";
                       } else if (record.status === 'رخصت') {
                         statusIcon = <AlertCircle className="w-4 h-4" />;
                         statusClass = "text-blue-400 bg-blue-500/10 border-blue-500/20";
                       } else {
                         statusIcon = <Calendar className="w-4 h-4" />;
                         statusClass = "text-orange-400 bg-orange-500/10 border-orange-500/20";
                       }

                       return (
                         <div key={record.id} className="flex items-center justify-between p-3 rounded-xl border border-border-subtle hover:bg-surface-light/30 transition-colors">
                           <span className="text-text-primary text-sm font-medium" dir="ltr">
                             {format(new Date(record.date), 'dd MMM yyyy')}
                           </span>
                           <span className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${statusClass}`}>
                             {statusIcon}
                             {record.status === 'skip' ? 'منسوخ' : record.status}
                           </span>
                         </div>
                       );
                    })}
                  </div>
                ) : (
                  <div className="h-full flex flex-col justify-center items-center text-text-muted py-10">
                    <Calendar className="w-8 h-8 opacity-20 mb-2" />
                    <p className="text-sm">کوئی حاضری ریکارڈ نہیں ملا</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
