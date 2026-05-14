"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, SkillDefinition } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { BookOpen, Plus, Trash2, Edit, ListTree } from "lucide-react";
import { format } from "date-fns";

export default function CoursesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  
  const [formData, setFormData] = useState({ name: '', duration: '', skills: [] as SkillDefinition[] });
  const [newSkillName, setNewSkillName] = useState('');

  const courses = useLiveQuery(() => db.courses.toArray());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingCourse) {
      await db.courses.update(editingCourse.id, {
        name: formData.name,
        duration: formData.duration,
        skills: formData.skills
      });
    } else {
      await db.courses.add({
        id: generateId(),
        name: formData.name,
        duration: formData.duration,
        skills: formData.skills,
        createdAt: new Date().toISOString()
      });
    }
    closeModal();
  };

  const deleteCourse = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('کیا آپ واقعی یہ کورس حذف کرنا چاہتے ہیں؟')) {
      await db.courses.delete(id);
    }
  };

  const addSkill = () => {
    if (newSkillName.trim()) {
      setFormData({
        ...formData,
        skills: [...formData.skills, { id: generateId(), name: newSkillName.trim() }]
      });
      setNewSkillName('');
    }
  };

  const removeSkill = (id: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s.id !== id)
    });
  };

  const openModal = (course: any = null) => {
    if (course) {
      setEditingCourse(course);
      setFormData({ name: course.name, duration: course.duration, skills: course.skills || [] });
    } else {
      setEditingCourse(null);
      setFormData({ name: '', duration: '', skills: [] });
    }
    setNewSkillName('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCourse(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center glass-card p-6 border-border-subtle">
        <div>
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <BookOpen className="text-accent" />
            کورسز کا انتظام
          </h2>
          <p className="text-text-muted mt-1">لیب میں پڑھائے جانے والے تمام کورسز اور ان کی سکلز کا انتظام کریں۔</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="three-d-button text-white px-5 py-2.5 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium text-sm">نیا کورس شامل کریں</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {courses?.map((course) => (
          <div 
            key={course.id} 
            className="glass-card stat-card-glow flex flex-col p-0 overflow-hidden hover:border-accent/50 transition-all border border-border-subtle group"
          >
            <div className="p-6 bg-surface-base border-b border-border-subtle relative z-10 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-text-primary group-hover:text-accent transition-colors">{course.name}</h3>
                <div className="flex gap-2">
                  <button onClick={() => openModal(course)} className="p-1.5 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => deleteCourse(course.id, e)} className="p-1.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-text-muted flex items-center gap-2">
                مدت: {course.duration || 'درج نہیں'}
                <span className="w-1 h-1 bg-border-subtle rounded-full mx-1"></span>
                اندراج: {format(new Date(course.createdAt), 'dd MMM yyyy')}
              </p>
            </div>
            <div className="p-6 bg-surface-base/50 flex-1 relative z-10">
              <h4 className="flex items-center gap-2 font-semibold text-text-primary mb-4">
                <ListTree className="w-4 h-4 text-accent" />
                سکلز کی فہرست ({course.skills?.length || 0})
              </h4>
              {course.skills && course.skills.length > 0 ? (
                <ul className="space-y-2">
                  {course.skills.map((skill, idx) => (
                    <li key={skill.id} className="flex items-center gap-3 bg-surface-light/50 px-4 py-2 border border-border-subtle rounded-lg shadow-sm">
                      <span className="w-6 h-6 rounded-full bg-surface-base border border-accent/20 text-accent flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                      <span className="text-text-primary text-sm">{skill.name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-6 text-text-muted text-sm bg-surface-light/30 rounded-lg border border-dashed border-border-subtle">
                  کوئی سکل شامل نہیں کی گئی
                </div>
              )}
            </div>
          </div>
        ))}
        {courses?.length === 0 && (
          <div className="col-span-full py-12 text-center glass-card border border-dashed border-border-subtle">
            <BookOpen className="w-12 h-12 text-surface-light mx-auto mb-3" />
            <p className="text-text-muted font-medium">کوئی کورس موجود نہیں ہے</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-base border border-border-subtle rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300 ring-1 ring-white/5 max-h-[90vh] flex flex-col relative">
            <div className="p-6 border-b border-border-subtle bg-gradient-to-br from-surface-light/30 to-transparent flex justify-between items-center relative overflow-hidden flex-shrink-0">
              <div className="absolute inset-0 bg-accent/5 pointer-events-none"></div>
              <h3 className="text-xl font-bold text-text-primary flex items-center gap-2 relative z-10">
                <Edit className="w-5 h-5 text-accent" />
                {editingCourse ? 'کورس میں ترمیم' : 'نیا کورس شامل کریں'}
              </h3>
              <button onClick={closeModal} className="text-text-muted hover:text-text-primary transition-colors p-1.5 rounded-lg hover:bg-surface-light cursor-pointer relative z-10">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1.5 ml-1">کورس کا نام</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2.5 bg-bg-base/50 border border-border-subtle rounded-xl text-text-primary focus:ring-1 focus:ring-accent focus:border-accent hover:border-accent/40 outline-none transition-all placeholder:text-surface-light"
                      placeholder="مثال: MS Office"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1.5 ml-1">مدت</label>
                    <input 
                      type="text" 
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      className="w-full px-4 py-2.5 bg-bg-base/50 border border-border-subtle rounded-xl text-text-primary focus:ring-1 focus:ring-accent focus:border-accent hover:border-accent/40 outline-none transition-all placeholder:text-surface-light"
                      placeholder="مثال: 3 ماہ"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-border-subtle">
                  <label className="block text-sm font-medium text-text-muted mb-2.5 ml-1">سکلز شامل کریں</label>
                  <div className="flex gap-3 mb-5">
                    <input 
                      type="text" 
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                      className="flex-1 px-4 py-2.5 bg-bg-base/50 border border-border-subtle rounded-xl text-text-primary focus:ring-1 focus:ring-accent focus:border-accent hover:border-accent/40 outline-none transition-all placeholder:text-surface-light"
                      placeholder="سکل کا نام لکھیں اور شامل کریں پر کلک کریں"
                    />
                    <button 
                      type="button" 
                      onClick={addSkill}
                      className="px-5 py-2.5 bg-surface-light border border-border-subtle text-text-primary rounded-xl hover:bg-surface-light/80 transition-colors text-sm font-medium shadow-sm hover:shadow active:scale-95"
                    >
                      شامل کریں
                    </button>
                  </div>
                  
                  <div className="bg-bg-base/30 p-4 rounded-xl border border-border-subtle max-h-48 overflow-y-auto custom-scrollbar shadow-inner">
                    {formData.skills.length > 0 ? (
                      <ul className="space-y-2.5">
                        {formData.skills.map((skill, idx) => (
                          <li key={skill.id} className="flex justify-between items-center bg-surface-base px-4 py-2.5 border border-border-subtle rounded-lg shadow-sm group hover:border-accent/30 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 flex items-center justify-center bg-surface-light/50 border border-border-subtle rounded-md text-xs text-text-muted font-mono">{idx + 1}</span>
                              <span className="text-text-primary text-sm font-medium">{skill.name}</span>
                            </div>
                            <button type="button" onClick={() => removeSkill(skill.id)} className="text-red-400 opacity-70 group-hover:opacity-100 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded-md transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-8">
                        <ListTree className="w-8 h-8 text-surface-light mx-auto mb-2" />
                        <p className="text-sm text-text-muted">ابھی کوئی سکل شامل نہیں کی گئی</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 p-6 border-t border-border-subtle bg-gradient-to-tr from-surface-light/30 to-transparent flex-shrink-0">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="px-6 py-2.5 text-text-primary bg-surface-light hover:bg-surface-light/80 border border-border-subtle rounded-xl transition-colors font-medium text-sm disabled:opacity-50"
                >
                  منسوخ کریں
                </button>
                <button 
                  type="submit" 
                  className="three-d-button px-6 py-2.5 text-white font-medium text-sm flex items-center justify-center min-w-[120px]"
                >
                  محفوظ کریں
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
