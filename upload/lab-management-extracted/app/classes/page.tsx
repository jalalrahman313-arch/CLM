"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { Users, Plus, Trash2, Edit, BookOpen } from "lucide-react";
import { format } from "date-fns";

export default function ClassesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', currentCourseId: '', isActive: true });

  const classes = useLiveQuery(() => db.classes.toArray());
  const courses = useLiveQuery(() => db.courses.toArray(), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingClass) {
      await db.classes.update(editingClass.id, {
        name: formData.name,
        currentCourseId: formData.currentCourseId || null,
        isActive: formData.isActive
      });
    } else {
      await db.classes.add({
        id: generateId(),
        name: formData.name,
        currentCourseId: formData.currentCourseId || null,
        createdAt: new Date().toISOString(),
        isActive: formData.isActive
      });
    }
    closeModal();
  };

  const deleteClass = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('کیا آپ واقعی یہ کلاس حذف کرنا چاہتے ہیں؟ اس سے منسلک طلباء بھی متاثر ہوں گے۔')) {
      await db.classes.delete(id);
      // Optional: Delete associated students/attendance or keep them handled separately
    }
  };

  const openModal = (cls: any = null) => {
    if (cls) {
      setEditingClass(cls);
      setFormData({ name: cls.name, currentCourseId: cls.currentCourseId || '', isActive: cls.isActive });
    } else {
      setEditingClass(null);
      setFormData({ name: '', currentCourseId: '', isActive: true });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClass(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center glass-card p-6 border-border-subtle">
        <div>
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Users className="text-accent" />
            کلاسز کا انتظام
          </h2>
          <p className="text-text-muted mt-1">تمام کلاسز کی فہرست اور تفصیلات یہاں دیکھیں۔</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="three-d-button text-white px-5 py-2.5 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium text-sm">نئی کلاس شامل کریں</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes?.map((cls) => {
          const course = courses?.find(c => c.id === cls.currentCourseId);
          return (
            <div 
              key={cls.id} 
              onClick={() => openModal(cls)}
              className="glass-card stat-card-glow p-6 cursor-pointer group border border-border-subtle hover:border-accent/50 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-text-primary">{cls.name}</h3>
                <span className={`px-2 py-1 rounded-md text-[11px] font-semibold tracking-wide uppercase ${cls.isActive ? 'bg-accent/15 text-accent' : 'bg-surface-light text-text-muted'}`}>
                  {cls.isActive ? 'فعال' : 'غیر فعال'}
                </span>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-text-muted text-sm">
                  <BookOpen className="w-4 h-4 text-accent" />
                  <span className="truncate">موجودہ کورس: <span className="text-text-primary font-medium">{course?.name || 'منتخب نہیں'}</span></span>
                </div>
                <div className="flex items-center gap-2 text-text-muted text-sm border-t border-border-subtle/50 pt-2">
                  <Users className="w-4 h-4 text-accent/70" />
                  <span className="text-xs">طلباء کی تعداد کے لیے طلباء پیج دیکھیں</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-border-subtle">
                <span className="text-xs text-text-muted">
                  اندراج: {format(new Date(cls.createdAt), 'dd MMM yyyy')}
                </span>
                <button 
                  onClick={(e) => deleteClass(cls.id, e)}
                  className="p-1.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors z-10"
                  title="حذف کریں"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
        {classes?.length === 0 && (
          <div className="col-span-full py-12 text-center glass-card border border-dashed border-border-subtle">
            <Users className="w-12 h-12 text-surface-light mx-auto mb-3" />
            <p className="text-text-muted font-medium">کوئی کلاس موجود نہیں ہے</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-base border border-border-subtle rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300 ring-1 ring-white/5 relative">
            <div className="p-6 border-b border-border-subtle bg-gradient-to-br from-surface-light/30 to-transparent flex justify-between items-center relative overflow-hidden">
              <div className="absolute inset-0 bg-accent/5 pointer-events-none"></div>
              <h3 className="text-xl font-bold text-text-primary flex items-center gap-2 relative z-10">
                <Edit className="w-5 h-5 text-accent" />
                {editingClass ? 'کلاس میں ترمیم' : 'نئی کلاس شامل کریں'}
              </h3>
              <button onClick={closeModal} className="text-text-muted hover:text-text-primary transition-colors p-1.5 rounded-lg hover:bg-surface-light cursor-pointer relative z-10">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5 ml-1">کلاس کا نام</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-bg-base/50 border border-border-subtle rounded-xl text-text-primary focus:ring-1 focus:ring-accent focus:border-accent hover:border-accent/40 outline-none transition-all placeholder:text-surface-light"
                  placeholder="مثال: اول، دوم"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5 ml-1">موجودہ کورس</label>
                <select 
                  value={formData.currentCourseId}
                  onChange={(e) => setFormData({...formData, currentCourseId: e.target.value})}
                  className="w-full px-4 py-2.5 bg-bg-base/50 border border-border-subtle rounded-xl text-text-primary focus:ring-1 focus:ring-accent focus:border-accent hover:border-accent/40 outline-none transition-all cursor-pointer"
                >
                  <option value="">-- کوئی کورس منتخب نہیں --</option>
                  {courses?.map(course => (
                    <option key={course.id} value={course.id}>{course.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3 p-3 bg-surface-light/20 border border-border-subtle rounded-xl hover:border-accent/20 transition-colors">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="w-5 h-5 accent-accent bg-bg-base border-border-subtle rounded focus:ring-accent cursor-pointer"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-text-primary cursor-pointer flex-1">کلاس فعـــال ہـــے</label>
              </div>
              
              <div className="flex justify-end gap-3 pt-6 border-t border-border-subtle mt-8">
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
