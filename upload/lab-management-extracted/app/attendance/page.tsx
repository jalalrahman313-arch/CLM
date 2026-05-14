"use client";

import { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { Calendar, CheckSquare, Save, Users, AlertCircle, RefreshCw, BookOpen, CheckCircle2, HelpCircle } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  
  // Storing unsaved attendance state temporarily before saving
  const [attendanceState, setAttendanceState] = useState<Record<string, 'حاضر' | 'رخصت' | 'غیر حاضر' | 'skip'>>({});

  const classes = useLiveQuery(() => db.classes.filter(c => c.isActive).toArray(), []);
  
  // Selected class's students
  const students = useLiveQuery(
    () => selectedClassId ? db.students.where('classId').equals(selectedClassId).and(s => s.status === 'جاری').toArray() : [],
    [selectedClassId]
  );

  // Existing attendance for the selected date & class
  const existingAttendance = useLiveQuery(
    () => selectedClassId ? db.attendance.where({ classId: selectedClassId, date: selectedDate }).toArray() : [],
    [selectedClassId, selectedDate]
  );

  // All attendance for the selected date to show indicators on class buttons
  const allDateAttendance = useLiveQuery(
    () => db.attendance.where('date').equals(selectedDate).toArray(),
    [selectedDate]
  );

  // Auto-populate state when external data maps
  useEffect(() => {
    if (existingAttendance && existingAttendance.length > 0) {
      const newState: Record<string, 'حاضر' | 'رخصت' | 'غیر حاضر' | 'skip'> = {};
      existingAttendance.forEach(a => {
        newState[a.studentId] = a.status as any;
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAttendanceState(newState);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAttendanceState({});
    }
  }, [existingAttendance]);

  // Re-sync attendanceState when existingAttendance changes
  const handleClassSelection = (clsId: string) => {
    setSelectedClassId(clsId);
    setAttendanceState({}); // reset temporary
  };

  const setStudentStatus = (studentId: string, status: 'حاضر' | 'رخصت' | 'غیر حاضر') => {
    setAttendanceState(prev => ({ ...prev, [studentId]: status }));
  };

  const markAllAsPresent = () => {
    if (!students) return;
    const newState = { ...attendanceState };
    students.forEach(s => {
      newState[s.id] = 'حاضر';
    });
    setAttendanceState(newState);
  };

  const handleSave = async () => {
    if (!selectedClassId || !students) return;
    
    // We need to upsert. Since we might have existing attendance records, we should manage them.
    const promises = students.map(student => {
      const existingRecord = existingAttendance?.find(a => a.studentId === student.id);
      const status = attendanceState[student.id];
      
      if (!status) return Promise.resolve(); // Don't save if not marked
      
      if (existingRecord) {
        return db.attendance.update(existingRecord.id, { status });
      } else {
        return db.attendance.add({
          id: generateId(),
          classId: selectedClassId,
          studentId: student.id,
          date: selectedDate,
          status: status
        });
      }
    });

    await Promise.all(promises);
    alert('حاضری کامیابی سے محفوظ ہو گئی۔');
  };

  const markDayAsSkipped = async () => {
    if (!selectedClassId || !students) return;
    if (!confirm('کیا آپ واقعی اس دن کو "کلاس نہیں ہوئی" کے طور پر محفوظ کرنا چاہتے ہیں؟ اس سے تمام طلباء کی حاضری سکپ ہو جائے گی۔')) return;

    const promises = students.map(student => {
      const existingRecord = existingAttendance?.find(a => a.studentId === student.id);
      if (existingRecord) {
        return db.attendance.update(existingRecord.id, { status: 'skip' });
      } else {
        return db.attendance.add({
          id: generateId(),
          classId: selectedClassId,
          studentId: student.id,
          date: selectedDate,
          status: 'skip'
        });
      }
    });

    await Promise.all(promises);
    setAttendanceState(students.reduce((acc, s) => ({...acc, [s.id]: 'skip'}), {}));
    alert('اس دن کے لیے کلاس منسوخ کر دی گئی ہے۔');
  };

  const isSkipped = Object.values(attendanceState).every(val => val === 'skip') && Object.keys(attendanceState).length > 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass-card p-6 border-border-subtle">
        <div>
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <CheckSquare className="text-accent" />
            روزانہ حاضری
          </h2>
          <p className="text-text-muted mt-1">منتخب دن اور کلاس کی حاضری کا اندراج کریں۔</p>
        </div>
        <div className="relative w-full md:w-auto">
           <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Calendar className="h-5 w-5 text-accent" />
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="block w-full md:w-auto pr-10 pl-4 py-2.5 bg-bg-base border border-border-subtle rounded-xl focus:ring-1 focus:ring-accent focus:border-accent outline-none font-bold text-text-primary transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {classes?.map(cls => {
          let attendanceStatus = 'pending';
          if (allDateAttendance) {
            const clsAttendance = allDateAttendance.filter(a => a.classId === cls.id);
            if (clsAttendance.length > 0) {
              if (clsAttendance.some(a => a.status === 'skip')) {
                attendanceStatus = 'skipped';
              } else {
                attendanceStatus = 'taken';
              }
            }
          }

          return (
            <button
              key={cls.id}
              onClick={() => handleClassSelection(cls.id)}
              className={`p-4 rounded-xl transition-all shadow-sm border text-right focus:outline-none flex flex-col gap-2 ${
                selectedClassId === cls.id 
                  ? 'bg-accent/10 border-accent text-text-primary ring-1 ring-accent shadow-[0_0_15px_rgba(var(--color-accent),0.1)]'
                  : 'bg-surface-base text-text-muted border-border-subtle hover:border-accent/40 hover:bg-surface-light'
              }`}
            >
              <div className="flex items-center justify-between font-bold w-full">
                <div className="flex items-center gap-2">
                  <Users className={`w-5 h-5 ${selectedClassId === cls.id ? 'text-accent' : 'text-text-muted/70'}`} />
                  <span className="truncate">{cls.name}</span>
                </div>
                <div title={
                  attendanceStatus === 'taken' ? "حاضری ہو گئی" :
                  attendanceStatus === 'skipped' ? "آج کلاس نہیں ہوئی" :
                  "حاضری نہیں ہوئی"
                }>
                  {attendanceStatus === 'taken' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                  {attendanceStatus === 'pending' && <HelpCircle className="w-5 h-5 text-text-muted opacity-50" />}
                  {attendanceStatus === 'skipped' && <AlertCircle className="w-5 h-5 text-orange-400" />}
                </div>
              </div>
              <span className={`text-xs ${selectedClassId === cls.id ? 'text-accent/80' : 'text-surface-light'}`}>پریس کریں</span>
            </button>
          );
        })}
        {classes?.length === 0 && (
          <div className="col-span-full py-4 text-center text-text-muted font-medium">کوئی فعال کلاس موجود نہیں</div>
        )}
      </div>

      {selectedClassId && (
        <div className="glass-card stat-card-glow overflow-hidden transition-all duration-300 border-border-subtle">
          <div className="p-4 bg-surface-light/30 border-b border-border-subtle flex justify-between items-center flex-wrap gap-4">
             <div className="flex gap-2">
                <button 
                  onClick={markAllAsPresent}
                  disabled={isSkipped}
                  className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  سب حاضر
                </button>
                <button 
                  onClick={markDayAsSkipped}
                  className="px-4 py-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl text-sm font-medium hover:bg-orange-500/20 transition-colors flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  آج کلاس نہیں ہوئی
                </button>
             </div>
             
             <button 
                onClick={handleSave}
                disabled={isSkipped && Object.keys(attendanceState).length === 0}
                className="three-d-button flex items-center gap-2 px-6 py-2 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <Save className="w-5 h-5" />
                محفوظ کریں
             </button>
          </div>

          <div className="p-0">
            {isSkipped && (
              <div className="p-8 text-center text-orange-400 bg-orange-500/5 border-b border-orange-500/10 flex flex-col items-center justify-center">
                 <AlertCircle className="w-12 h-12 mb-2 opacity-80" />
                 <h3 className="text-xl font-bold text-text-primary">اس کلاس کے لیے آج کی حاضری منسوخ (Skip) ہے۔</h3>
                 <p className="mt-1 text-orange-400/80 font-medium text-sm">یہ حاضری رپورٹس کے اعدادوشمار میں شمار نہیں کی جائے گی۔</p>
                 <button 
                    onClick={() => {
                        if(confirm('کیا آپ حاضری کو ری سیٹ کرنا چاہتے ہیں؟')){
                           setAttendanceState({});
                        }
                    }}
                    className="mt-4 px-4 py-2 bg-surface-light border border-border-subtle text-text-primary rounded-lg text-sm flex items-center gap-2 hover:bg-surface-light/80 transition-colors"
                 >
                    <RefreshCw className="w-4 h-4" />
                    دوبارہ حاضری لگائیں
                 </button>
              </div>
            )}

            {!isSkipped && students && students.length > 0 ? (
              <div className="divide-y divide-border-subtle max-h-[60vh] overflow-y-auto custom-scrollbar">
                {students.map((student, idx) => {
                  const status = attendanceState[student.id];
                  
                  return (
                    <div key={student.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-surface-light/20 transition-colors">
                       <div className="flex items-center gap-4">
                          <span className="w-8 h-8 rounded-full bg-surface-light text-text-muted flex items-center justify-center text-sm font-bold flex-shrink-0 border border-border-subtle">
                            {idx + 1}
                          </span>
                          <div>
                            <Link href={`/students/${student.id}`} className="font-bold text-text-primary text-lg hover:text-accent transition-colors">
                              {student.name}
                            </Link>
                            <p className="text-sm text-accent font-mono">{student.rollNo}</p>
                          </div>
                       </div>
                       
                       <div className="flex bg-surface-light/50 p-1 rounded-xl border border-border-subtle gap-1 overflow-x-auto max-w-full">
                          <button
                            onClick={() => setStudentStatus(student.id, 'حاضر')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                              status === 'حاضر' ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'text-text-muted hover:bg-surface-light hover:text-text-primary'
                            }`}
                          >
                            حاضر
                          </button>
                          <button
                            onClick={() => setStudentStatus(student.id, 'رخصت')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                              status === 'رخصت' ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.1)]' : 'text-text-muted hover:bg-surface-light hover:text-text-primary'
                            }`}
                          >
                            رخصت
                          </button>
                          <button
                            onClick={() => setStudentStatus(student.id, 'غیر حاضر')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                              status === 'غیر حاضر' ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'text-text-muted hover:bg-surface-light hover:text-text-primary'
                            }`}
                          >
                            غیر حاضر
                          </button>
                       </div>
                    </div>
                  );
                })}
              </div>
            ) : (!isSkipped && (
              <div className="p-12 text-center text-text-muted">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-20 text-accent" />
                <p>اس کلاس میں کوئی طالب علم موجود نہیں</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {!selectedClassId && (
        <div className="glass-card p-12 text-center border-dashed border-border-subtle flex flex-col items-center justify-center">
          <BookOpen className="w-16 h-16 text-accent/20 mb-4" />
          <h3 className="text-xl font-bold text-text-primary">کوئی کلاس منتخب نہیں</h3>
          <p className="text-text-muted mt-2">حاضری شروع کرنے کے لیے اوپر سے کسی کلاس کا انتخاب کریں۔</p>
        </div>
      )}
    </div>
  );
}
