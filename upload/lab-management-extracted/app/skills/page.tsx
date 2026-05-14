"use client";

import { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { Network, CheckCircle, Clock, Check, CalendarIcon, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function SkillsPage() {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const classes = useLiveQuery(() => db.classes.filter(c => c.isActive).toArray(), []);
  const courses = useLiveQuery(() => db.courses.toArray(), []);
  
  // Get active selected class
  const selectedClass = classes?.find(c => c.id === selectedClassId);
  const selectedCourse = courses?.find(c => c.id === selectedClass?.currentCourseId);

  // Get current skill tracking records for the class
  const skillTrackings = useLiveQuery(
    () => selectedClassId ? db.skillTracking.where('classId').equals(selectedClassId).toArray() : [],
    [selectedClassId]
  );

  const handleClassSelection = (clsId: string) => {
    setSelectedClassId(clsId);
  };

  const syncCourseSkillsToTracking = async () => {
    if (!selectedClass || !selectedCourse) return;
    
    const existingTrackingIds = skillTrackings?.map(st => st.skillId) || [];
    
    // Auto-create tracking records for skills that don't have one yet
    const newTrackings = selectedCourse.skills
      .filter(skill => !existingTrackingIds.includes(skill.id))
      .map((skill, index) => ({
        id: generateId(),
        classId: selectedClass.id,
        courseId: selectedCourse.id,
        skillId: skill.id,
        skillName: skill.name,
        // The first un-tracked skill starts automatically if no skills exist, but let's just make everything "Pending" or standard logic.
        // Actually prompt says "اگلی سکل خودبخود In Progress ہو جائے گی". I'll initialize all as "Pending" practically, or first as In Progress if array is empty
        status: (index === 0 && existingTrackingIds.length === 0) ? 'In Progress' as const : 'Pending' as any,
        startDate: (index === 0 && existingTrackingIds.length === 0) ? new Date().toISOString() : '',
        endDate: null
      }));

    if (newTrackings.length > 0) {
      await db.skillTracking.bulkAdd(newTrackings);
    }
  };

  // We run sync when user selects a class so tracking records are created
  useEffect(() => {
    if (selectedClassId && selectedCourse && skillTrackings !== undefined) {
       syncCourseSkillsToTracking();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId, selectedCourse, skillTrackings]);

  const markStatus = async (tracking: any, newStatus: 'Pending' | 'In Progress' | 'Completed') => {
    const isCompleted = newStatus === 'Completed';
    await db.skillTracking.update(tracking.id, {
      status: newStatus,
      startDate: newStatus === 'Pending' ? '' : (tracking.startDate || new Date().toISOString()),
      endDate: isCompleted ? new Date().toISOString() : null
    });

    if (isCompleted && selectedCourse) {
      // Find the next "Pending" skill in the ordered course list and mark it as "In Progress"
      // Course skills are in order. Find current index:
      const currentCourseSkillIndex = selectedCourse.skills.findIndex(s => s.id === tracking.skillId);
      if (currentCourseSkillIndex >= 0 && currentCourseSkillIndex < selectedCourse.skills.length - 1) {
        const nextSkillId = selectedCourse.skills[currentCourseSkillIndex + 1].id;
        const nextTracking = skillTrackings?.find(st => st.skillId === nextSkillId);
        if (nextTracking && nextTracking.status !== 'Completed' && nextTracking.status !== 'In Progress') {
          await db.skillTracking.update(nextTracking.id, {
            status: 'In Progress',
            startDate: new Date().toISOString()
          });
        }
      }
    }
  };

  // Stats calculation
  const totalSkills = selectedCourse?.skills.length || 0;
  const completedSkills = skillTrackings?.filter(st => st.status === 'Completed').length || 0;
  const progressPercent = totalSkills > 0 ? Math.round((completedSkills / totalSkills) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass-card p-6 border-border-subtle">
        <div>
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Network className="text-accent" />
            سکلز ٹریکر
          </h2>
          <p className="text-text-muted mt-1">کلاس کے لحاظ سے کورس اور سکلز کی پیشرفت ٹریک کریں۔</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {classes?.map(cls => (
          <button
            key={cls.id}
            onClick={() => handleClassSelection(cls.id)}
            className={`p-4 rounded-xl transition-all shadow-sm border text-right focus:outline-none flex flex-col gap-2 ${
              selectedClassId === cls.id 
                ? 'bg-accent/10 border-accent text-text-primary ring-1 ring-accent shadow-[0_0_15px_rgba(var(--color-accent),0.1)]'
                : 'bg-surface-base text-text-muted border-border-subtle hover:border-accent/40 hover:bg-surface-light'
            }`}
          >
            <div className="flex items-center gap-2 font-bold w-full">
              <Network className={`w-5 h-5 ${selectedClassId === cls.id ? 'text-accent' : 'text-text-muted/70'}`} />
              <span className="truncate">{cls.name}</span>
            </div>
            <span className={`text-xs ${selectedClassId === cls.id ? 'text-accent/80' : 'text-surface-light'}`}>
              {cls.currentCourseId ? 'کورس منتخب ہے' : 'کورس منتخب نہیں'}
            </span>
          </button>
        ))}
        {classes?.length === 0 && (
          <div className="col-span-full py-4 text-center text-text-muted font-medium">کوئی فعال کلاس موجود نہیں</div>
        )}
      </div>

      {selectedClass && !selectedCourse && (
        <div className="glass-card p-12 text-center border-dashed border-border-subtle flex flex-col items-center justify-center">
          <AlertCircle className="w-16 h-16 text-orange-400 mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-text-primary">اس کلاس کے لیے کوئی کورس منتخب نہیں کیا گیا</h3>
          <p className="text-text-muted mt-2">براہ کرم &apos;کلاسز&apos; کے سیکشن میں جا کر اس کلاس کے لیے کوئی کورس منتخب کریں۔</p>
        </div>
      )}

      {selectedClass && selectedCourse && (
        <div className="glass-card stat-card-glow p-6 border-border-subtle">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-border-subtle">
            <div>
              <h3 className="text-2xl font-bold text-text-primary tracking-tight">{selectedCourse.name}</h3>
              <p className="text-text-muted mt-1 flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> منسلک کلاس: {selectedClass.name}
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 px-6 py-4 bg-surface-light/30 rounded-2xl border border-border-subtle w-full md:w-auto">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-text-muted">پروگریس</span>
                <span className="text-sm font-bold text-accent drop-shadow-[0_0_8px_rgba(var(--color-accent),0.5)]">{progressPercent}%</span>
              </div>
              <div className="w-full md:w-48 bg-surface-base rounded-full h-2.5 overflow-hidden border border-border-subtle">
                <div className="bg-accent shadow-[0_0_10px_var(--color-accent)] h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }}></div>
              </div>
              <div className="text-xs text-text-muted mt-2 text-center">
                <span className="text-text-primary font-bold">{totalSkills}</span> میں سے <span className="text-text-primary font-bold">{completedSkills}</span> مکمل
              </div>
            </div>
          </div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            {selectedCourse.skills.map((courseSkill, index) => {
              const tracking = skillTrackings?.find(st => st.skillId === courseSkill.id);
              const status = tracking?.status || 'Pending';
              
              let statusColor = "bg-surface-base border-border-subtle text-text-muted";
              if (status === 'In Progress') statusColor = "bg-accent/10 border-accent/30 text-text-primary ring-1 ring-accent/20";
              if (status === 'Completed') statusColor = "bg-emerald-500/10 border-emerald-500/30 text-text-primary";

              return (
                <div key={courseSkill.id} className={`flex flex-col md:flex-row p-5 rounded-2xl border transition-all ${statusColor}`}>
                  
                  <div className="flex-1 flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border border-border-subtle ${status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : status === 'In Progress' ? 'bg-accent/20 text-accent border-accent/50' : 'bg-surface-light text-text-muted'}`}>
                      {status === 'Completed' ? <Check className="w-4 h-4" /> : index + 1}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold">{courseSkill.name}</h4>
                      <div className="flex flex-col md:flex-row gap-2 md:gap-4 mt-2 text-xs md:text-sm text-text-muted">
                         {tracking?.startDate && (
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="w-3.5 h-3.5 opacity-70" />
                              شروع: {format(new Date(tracking.startDate), 'dd MMM yyyy')}
                            </span>
                         )}
                         {tracking?.endDate && (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5 opacity-70" />
                              ختم: {format(new Date(tracking.endDate), 'dd MMM yyyy')}
                            </span>
                         )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 md:mt-0 flex flex-wrap shrink-0 self-start md:self-center bg-surface-base p-1.5 rounded-xl border border-border-subtle">
                        <button 
                          onClick={() => markStatus(tracking, 'Pending')}
                          disabled={!tracking}
                          className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${status === 'Pending' ? 'bg-surface-light text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary hover:bg-surface-light/50'}`}
                        >
                          شروع کریں
                        </button>
                        <button 
                          onClick={() => markStatus(tracking, 'In Progress')}
                          disabled={!tracking}
                          className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${status === 'In Progress' ? 'bg-accent/20 text-accent shadow-sm' : 'text-text-muted hover:text-accent hover:bg-accent/10'}`}
                        >
                          جاری
                        </button>
                        <button 
                          onClick={() => markStatus(tracking, 'Completed')}
                          disabled={!tracking}
                          className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 ${status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400 shadow-sm' : 'text-text-muted hover:text-emerald-400 hover:bg-emerald-500/10'}`}
                        >
                          {status === 'Completed' && <CheckCircle className="w-4 h-4" />}
                          مکمل
                        </button>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {!selectedClassId && (
        <div className="glass-card p-12 text-center border-dashed border-border-subtle flex flex-col items-center justify-center">
          <BookOpen className="w-16 h-16 text-accent/20 mb-4" />
          <h3 className="text-xl font-bold text-text-primary">کوئی کلاس منتخب نہیں</h3>
          <p className="text-text-muted mt-2">سکلز ٹریک کرنے کے لیے اوپر سے کسی کلاس کا انتخاب کریں۔</p>
        </div>
      )}
    </div>
  );
}

// Temporary import for missing icon
import { BookOpen } from "lucide-react";
