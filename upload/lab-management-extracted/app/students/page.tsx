"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { UserPlus, Plus, Search, Filter, Edit, Trash2, GraduationCap, X, Award } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function StudentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  
  const [formData, setFormData] = useState({ name: '', classId: '', status: 'جاری' as const });

  const classes = useLiveQuery(() => db.classes.toArray(), []);
  const allStudents = useLiveQuery(() => db.students.toArray(), []);

  const students = allStudents?.filter(student => {
    const matchesSearch = student.name.includes(searchTerm) || student.rollNo.includes(searchTerm);
    const matchesClass = filterClass ? student.classId === filterClass : true;
    const matchesStatus = filterStatus ? student.status === filterStatus : true;
    return matchesSearch && matchesClass && matchesStatus;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.classId) return;

    if (editingStudent) {
      await db.students.update(editingStudent.id, {
        name: formData.name,
        classId: formData.classId,
        status: formData.status
      });
    } else {
      // Generate Roll No logically (e.g. C-{ClassCount+1}) or simple generic one
      const classStudentsCount = await db.students.where('classId').equals(formData.classId).count();
      const selectedClass = classes?.find(c => c.id === formData.classId);
      const prefix = selectedClass ? selectedClass.name.substring(0, 2).toUpperCase() : 'CL';
      const rollNo = `${prefix}-${String(classStudentsCount + 1).padStart(3, '0')}`;

      await db.students.add({
        id: generateId(),
        name: formData.name,
        rollNo: rollNo,
        classId: formData.classId,
        status: formData.status,
        enrolledAt: new Date().toISOString()
      });
    }
    closeModal();
  };

  const deleteStudent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('کیا آپ واقعی یہ طالب علم حذف کرنا چاہتے ہیں؟')) {
      await db.students.delete(id);
    }
  };

  const openModal = (student: any = null) => {
    if (student) {
      setEditingStudent(student);
      setFormData({ name: student.name, classId: student.classId, status: student.status });
    } else {
      setEditingStudent(null);
      setFormData({ name: '', classId: '', status: 'جاری' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass-card p-6 border-border-subtle">
        <div>
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <UserPlus className="text-accent" />
            طلباء کا انتظام
          </h2>
          <p className="text-text-muted mt-1">لیب کے تمام طلباء، ان کی کلاسز اور حالیہ سٹیٹس کو یہاں سے کنٹرول کریں۔</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="three-d-button text-white px-5 py-2.5 flex-shrink-0 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium text-sm">نیا طالب علم</span>
        </button>
      </div>

      {/* Filters Base */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center border border-border-subtle">
        <div className="relative w-full md:w-1/3 text-text-primary">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-text-muted" />
          </div>
          <input
            type="text"
            className="block w-full pr-10 pl-3 py-2 bg-bg-base border border-border-subtle rounded-xl focus:ring-1 focus:ring-accent focus:border-accent outline-none text-sm placeholder:text-surface-light transition-all"
            placeholder="نام یا رول نمبر سے تلاش کریں..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-4 w-full md:w-auto text-text-primary">
          <div className="relative w-1/2 md:w-48">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-text-muted" />
            </div>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="block w-full pr-10 pl-3 py-2 bg-surface-base border border-border-subtle rounded-xl focus:ring-1 focus:ring-accent focus:border-accent outline-none text-sm appearance-none font-sans text-right transition-all"
              dir="rtl"
            >
              <option value="">تمام کلاسز</option>
              {classes?.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="relative w-1/2 md:w-48">
             <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <GraduationCap className="h-4 w-4 text-text-muted" />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full pr-10 pl-3 py-2 bg-surface-base border border-border-subtle rounded-xl focus:ring-1 focus:ring-accent focus:border-accent outline-none text-sm appearance-none font-sans text-right transition-all"
              dir="rtl"
            >
              <option value="">تمام سٹیٹس</option>
              <option value="جاری">جاری</option>
              <option value="فارغ">فارغ</option>
            </select>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden border-border-subtle">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-right text-sm">
            <thead className="bg-surface-light/30 border-b border-border-subtle text-text-muted font-medium">
              <tr>
                <th className="px-6 py-4">رول نمبر</th>
                <th className="px-6 py-4">نام</th>
                <th className="px-6 py-4">کلاس</th>
                <th className="px-6 py-4">سٹیٹس</th>
                <th className="px-6 py-4">اندراج کی تاریخ</th>
                <th className="px-6 py-4 text-center">عمل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50">
              {students?.map((student) => {
                const className = classes?.find(c => c.id === student.classId)?.name || 'نامعلوم';
                return (
                  <tr key={student.id} className="hover:bg-surface-light/20 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-accent">{student.rollNo}</td>
                    <td className="px-6 py-4">
                      <Link href={`/students/${student.id}`} className="text-text-primary font-medium text-base hover:text-accent transition-colors">
                        {student.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-text-muted">{className}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border uppercase tracking-wider ${student.status === 'جاری' ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-surface-light text-text-muted border-border-subtle'}`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-muted text-xs">{format(new Date(student.enrolledAt), 'dd MMM yyyy')}</td>
                    <td className="px-6 py-4 text-center border-none flex justify-center gap-2">
                      <Link href={`/certificates?search=${student.rollNo}`} className="p-1.5 text-accent hover:bg-accent/10 rounded-lg transition-colors" title="سرٹیفکیٹ">
                        <Award className="w-4 h-4" />
                      </Link>
                      <button onClick={() => openModal(student)} className="p-1.5 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => deleteStudent(student.id, e)} className="p-1.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {students?.length === 0 && (
            <div className="py-16 text-center">
              <UserPlus className="w-12 h-12 text-surface-light mx-auto mb-3" />
              <p className="text-text-muted font-medium pb-2">کوئی طالب علم نہیں ملا</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-base border border-border-subtle rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300 ring-1 ring-white/5 relative">
            <div className="p-6 border-b border-border-subtle bg-gradient-to-br from-surface-light/30 to-transparent flex justify-between items-center relative overflow-hidden">
              <div className="absolute inset-0 bg-accent/5 pointer-events-none"></div>
              <h3 className="text-xl font-bold text-text-primary flex items-center gap-2 relative z-10">
                <Edit className="w-5 h-5 text-accent" />
                {editingStudent ? 'طالب علم میں ترمیم' : 'نئی طالب علم کا اندراج'}
              </h3>
              <button onClick={closeModal} className="text-text-muted hover:text-text-primary transition-colors p-1.5 rounded-lg hover:bg-surface-light cursor-pointer relative z-10">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5 ml-1">طالب علم کا نام</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-bg-base/50 border border-border-subtle rounded-xl text-text-primary focus:ring-1 focus:ring-accent focus:border-accent hover:border-accent/40 outline-none transition-all placeholder:text-surface-light"
                  placeholder="مکمل نام درج کریں"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5 ml-1">کلاس</label>
                <select 
                  value={formData.classId}
                  onChange={(e) => setFormData({...formData, classId: e.target.value})}
                  className="w-full px-4 py-2.5 bg-bg-base/50 border border-border-subtle rounded-xl text-text-primary focus:ring-1 focus:ring-accent focus:border-accent hover:border-accent/40 outline-none transition-all cursor-pointer"
                  required
                >
                  <option value="">-- کلاس منتخب کریں --</option>
                  {classes?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              {editingStudent && (
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5 ml-1">سٹیٹس</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="w-full px-4 py-2.5 bg-bg-base/50 border border-border-subtle rounded-xl text-text-primary focus:ring-1 focus:ring-accent focus:border-accent hover:border-accent/40 outline-none transition-all cursor-pointer"
                  >
                    <option value="جاری">جاری</option>
                    <option value="فارغ">فارغ</option>
                  </select>
                </div>
              )}
              
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
