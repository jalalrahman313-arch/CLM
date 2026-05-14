"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Search, FileText, Eye, Award } from "lucide-react";
import { format } from "date-fns";
import CertificatePreview from "@/components/CertificatePreview";
import { Suspense } from "react";

function CertificatesContent() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search');
  const [searchTerm, setSearchTerm] = useState(search || "");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const students = useLiveQuery(() => db.students.toArray(), []);
  const classes = useLiveQuery(() => db.classes.toArray(), []);
  const courses = useLiveQuery(() => db.courses.toArray(), []);
  const skillTracking = useLiveQuery(() => db.skillTracking.toArray(), []);

  const filteredStudents = students?.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStudentDetails = (student: any) => {
    const studentClass = classes?.find(c => c.id === student.classId);
    
    // Get completed courses for this student's class
    // In a real app, you might want to filter by student specifically if data allows
    const completedCoursesIds = skillTracking?.filter(st => 
      st.classId === student.classId && st.status === 'Completed'
    ).map(st => st.courseId) || [];
    
    // Remove duplicates
    const uniqueCompletedCourseIds = Array.from(new Set(completedCoursesIds));
    
    const completedCourses = courses?.filter(c => uniqueCompletedCourseIds.includes(c.id)) || [];

    return {
      ...student,
      className: studentClass?.name || "N/A",
      year: format(new Date(student.enrolledAt), 'yyyy'),
      courses: completedCourses.map(c => c.name)
    };
  };

  const handlePreview = (student: any) => {
    setSelectedStudent(getStudentDetails(student));
    setIsPreviewOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass-card p-6 border-border-subtle">
        <div className="w-full">
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2 text-right justify-end" dir="rtl">
            سرٹیفکیٹ مینجمنٹ
            <Award className="text-accent" />
          </h2>
          <p className="text-text-muted mt-1 text-right" dir="rtl">طلباء کے لیے پیشہ ورانہ سرٹیفکیٹ تیار کریں اور ڈاؤن لوڈ کریں۔</p>
        </div>
      </div>

      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center border border-border-subtle">
        <div className="relative w-full text-text-primary">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-text-muted" />
          </div>
          <input
            type="text"
            className="block w-full pr-10 pl-3 py-2 bg-bg-base border border-border-subtle rounded-xl focus:ring-1 focus:ring-accent focus:border-accent outline-none text-sm placeholder:text-surface-light transition-all text-right"
            dir="rtl"
            placeholder="نام یا رول نمبر سے تلاش کریں..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
                <th className="px-6 py-4">داخلہ کا سال</th>
                <th className="px-6 py-4 text-center">سرٹیفکیٹ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50">
              {filteredStudents?.map((student) => {
                const className = classes?.find(c => c.id === student.classId)?.name || 'نامعلوم';
                const year = student.enrolledAt ? format(new Date(student.enrolledAt), 'yyyy') : 'N/A';
                return (
                  <tr key={student.id} className="hover:bg-surface-light/20 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-accent">{student.rollNo}</td>
                    <td className="px-6 py-4 text-text-primary font-medium">{student.name}</td>
                    <td className="px-6 py-4 text-text-muted">{className}</td>
                    <td className="px-6 py-4 text-text-muted">{year}</td>
                    <td className="px-6 py-4 text-center flex justify-center gap-2">
                      <button 
                        onClick={() => handlePreview(student)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 text-accent hover:bg-accent/20 rounded-lg transition-colors text-xs font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        پریویو
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredStudents?.length === 0 && (
            <div className="py-16 text-center">
              <FileText className="w-12 h-12 text-surface-light mx-auto mb-3" />
              <p className="text-text-muted font-medium pb-2">کوئی طالب علم نہیں ملا</p>
            </div>
          )}
        </div>
      </div>

      {isPreviewOpen && selectedStudent && (
        <CertificatePreview 
          student={selectedStudent} 
          onClose={() => setIsPreviewOpen(false)} 
        />
      )}
    </div>
  );
}

export default function CertificatesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><p className="text-text-muted">Loading...</p></div>}>
      <CertificatesContent />
    </Suspense>
  );
}
