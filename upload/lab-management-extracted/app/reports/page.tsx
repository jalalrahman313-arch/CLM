"use client";

import { useState, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { FileBarChart, Download, Filter, Calendar, FileSpreadsheet, User, Users } from "lucide-react";
import { format, parseISO, isAfter, isBefore, isEqual, subMonths } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useReactToPrint } from 'react-to-print';

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filterClass, setFilterClass] = useState("");
  const [filterStudent, setFilterStudent] = useState("");
  const [reportData, setReportData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);

  const classes = useLiveQuery(() => db.classes.toArray(), []);
  
  // Fetch students for the selected class to populate student filter
  const studentsInClass = useLiveQuery(() => {
    if (!filterClass) return [];
    return db.students.where('classId').equals(filterClass).toArray();
  }, [filterClass]);
  
  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterClass(e.target.value);
    setFilterStudent(""); // Reset student filter when class changes
  };

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const sDate = new Date(startDate);
      const eDate = new Date(endDate);

      // Fetch
      let attendance = [];
      if (filterClass) {
        attendance = await db.attendance.where('classId').equals(filterClass).toArray();
      } else {
        attendance = await db.attendance.toArray();
      }

      // Filter by date
      let filteredAttendance = attendance.filter(a => {
        const d = new Date(a.date);
        return (isAfter(d, sDate) || isEqual(d, sDate)) && (isBefore(d, eDate) || isEqual(d, eDate));
      });

      // Filter by student if selected
      if (filterStudent) {
        filteredAttendance = filteredAttendance.filter(a => a.studentId === filterStudent);
      }

      const allStudents = await db.students.toArray();
      const studentMap = allStudents.reduce((acc: any, s) => { acc[s.id] = s; return acc; }, {});
      const classesData = await db.classes.toArray();
      const classMap = classesData.reduce((acc: any, c) => { acc[c.id] = c; return acc; }, {});

      let trackingQuery = db.skillTracking.toCollection();
      if (filterClass) trackingQuery = db.skillTracking.where('classId').equals(filterClass);
      let trackings = await trackingQuery.toArray();
      if (filterStudent) {
        // There is no studentId on skillTracking? Actually wait, let's check tracking schema: 'id, classId, courseId, status'
        // Oh, skillTracking is per class, not per student? Yes, it seems so. So no student filtering for skills.
      }

      // Attendance Metrics
      let present = 0, absent = 0, leave = 0;
      
      const dailyMap: Record<string, any> = {};
      const classStats: any = {};
      const studentAbsenceList: any = {};

      filteredAttendance.forEach(a => {
        if (a.status === 'skip') return;

        if (a.status === 'حاضر') present++;
        else if (a.status === 'غیر حاضر') absent++;
        else if (a.status === 'رخصت') leave++;

        if (!dailyMap[a.date]) {
          dailyMap[a.date] = { date: a.date, حاضر: 0, 'غیر حاضر': 0, رخصت: 0 };
        }
        dailyMap[a.date][a.status]++;

        if (!classStats[a.classId]) {
          classStats[a.classId] = { present: 0, absent: 0, leave: 0, name: classMap[a.classId]?.name || 'Unknown' };
        }
        if (a.status === 'حاضر') classStats[a.classId].present++;
        else if (a.status === 'غیر حاضر') classStats[a.classId].absent++;
        else if (a.status === 'رخصت') classStats[a.classId].leave++;

        if (a.status === 'غیر حاضر' || a.status === 'رخصت') {
          if (!studentAbsenceList[a.classId]) studentAbsenceList[a.classId] = {};
          if (!studentAbsenceList[a.classId][a.studentId]) {
             studentAbsenceList[a.classId][a.studentId] = { 
               studentName: studentMap[a.studentId]?.name || 'Unknown', 
               rollNo: studentMap[a.studentId]?.rollNo || '',
               absent: 0, 
               leave: 0 
             };
          }
          if (a.status === 'غیر حاضر') studentAbsenceList[a.classId][a.studentId].absent++;
          if (a.status === 'رخصت') studentAbsenceList[a.classId][a.studentId].leave++;
        }
      });

      const totalAttendance = present + absent + leave;
      
      const pieData = [
        { name: 'حاضر', value: present, color: '#10b981' },
        { name: 'غیر حاضر', value: absent, color: '#f43f5e' },
        { name: 'رخصت', value: leave, color: '#3b82f6' }
      ];

      // Skill metrics
      const completedSkills = trackings.filter(t => t.status === 'Completed').length;
      const inProgressSkills = trackings.filter(t => t.status === 'In Progress').length;
      const totalSkillsCount = trackings.length;
      const avgSkillCompletion = totalSkillsCount > 0 ? Math.round((completedSkills / totalSkillsCount) * 100) : 0;
      
      const barData = Object.values(dailyMap).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const classSummaries = Object.keys(classStats).map(cid => ({
        classId: cid,
        className: classStats[cid].name,
        present: classStats[cid].present,
        absent: classStats[cid].absent,
        leave: classStats[cid].leave,
        total: classStats[cid].present + classStats[cid].absent + classStats[cid].leave,
        absentStudents: Object.values(studentAbsenceList[cid] || {}).sort((a: any, b: any) => b.absent - a.absent)
      }));

      // Count total students taking part in this report
      let totalStudentsCount = 0;
      if (filterStudent) {
         totalStudentsCount = 1;
      } else if (filterClass) {
         totalStudentsCount = allStudents.filter(s => s.classId === filterClass).length;
      } else {
         totalStudentsCount = allStudents.length;
      }

      setReportData({
        isIndividual: !!filterStudent,
        studentName: filterStudent ? studentMap[filterStudent]?.name : null,
        studentRollNo: filterStudent ? studentMap[filterStudent]?.rollNo : null,
        metrics: { present, absent, leave, totalAttendance, completedSkills, inProgressSkills, avgSkillCompletion, totalStudents: totalStudentsCount },
        classSummaries,
        pieData,
        barData,
        className: filterClass ? classes?.find(c => c.id === filterClass)?.name : 'تمام کلاسز',
        dateRange: `${format(sDate, 'dd MMM yyyy')} - ${format(eDate, 'dd MMM yyyy')}`
      });

    } catch (error) {
      console.error(error);
      alert('رپورٹ بنانے میں مسئلہ آیا۔');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `Report_${format(new Date(), 'yyyyMMdd_HHmm')}`,
    pageStyle: `
      @page { size: A4 portrait; margin: 15mm; }
      @media print {
        body { 
          -webkit-print-color-adjust: exact !important; 
          print-color-adjust: exact !important; 
          background-color: white !important;
        }
      }
    `
  });

  const exportPDF = () => {
    handlePrint();
  };

  const exportCSV = () => {
    if (!reportData) return;
    try {
      let csvContent = "\uFEFF"; // BOM for UTF-8 correctly displaying Arabic/Urdu characters
      
      csvContent += `رپورٹ کی تاریخ (Report Dates): ${reportData.dateRange}\n`;
      if (reportData.isIndividual) {
        csvContent += `طالب علم (Student): ${reportData.studentName} (رول نمبر: ${reportData.studentRollNo})\n`;
      } else {
        csvContent += `کلاس (Class): ${reportData.className}\n`;
      }
      csvContent += "\n";

      csvContent += "--- Summary Metrics (خلاصہ) ---\n";
      if (!reportData.isIndividual) {
        csvContent += `Total Students (کل طلباء),${reportData.metrics.totalStudents}\n`;
      }
      let attendancePercentage = reportData.metrics.totalAttendance > 0 ? Math.round((reportData.metrics.present / reportData.metrics.totalAttendance) * 100) : 0;
      csvContent += `Attendance Percentage (حاضری فیصد),${attendancePercentage}%\n`;
      csvContent += `Total Present (کل حاضر),${reportData.metrics.present}\n`;
      csvContent += `Total Absent & Leave (کل غیر حاضر و رخصت),${reportData.metrics.absent + reportData.metrics.leave}\n`;
      if (!reportData.isIndividual) {
        csvContent += `Avg Skill Completion (سکلز تکمیل کا اوسط),${reportData.metrics.avgSkillCompletion}%\n`;
        csvContent += `Total Skill Records (کل سکلز رکارڈز),${reportData.metrics.completedSkills + reportData.metrics.inProgressSkills}\n`;
      }
      csvContent += "\n";

      csvContent += "--- Daily Attendance Trend (روزانہ حاضری) ---\n";
      csvContent += "Date (تاریخ),Present (حاضر),Absent (غیر حاضر),Leave (رخصت)\n";
      if (reportData.barData && reportData.barData.length > 0) {
        reportData.barData.forEach((row: any) => {
          csvContent += `${row.date},${row['حاضر'] || 0},${row['غیر حاضر'] || 0},${row['رخصت'] || 0}\n`;
        });
      }
      csvContent += "\n";

      if (!reportData.isIndividual && reportData.classSummaries.length > 0) {
        csvContent += "--- Class Wise Summary (کلاسوں کی رپورٹ) ---\n";
        csvContent += "Class Name (کلاس),Present (حاضر),Absent (غیر حاضر),Leave (رخصت),Total (کل)\n";
        reportData.classSummaries.forEach((cls: any) => {
          csvContent += `${cls.className},${cls.present},${cls.absent},${cls.leave},${cls.total}\n`;
        });
        csvContent += "\n";
        
        csvContent += "--- Absent/Leave Students (غیر حاضر و رخصت طلباء) ---\n";
        csvContent += "Class Name (کلاس),Student Name (نام),Roll No (رول نمبر),Absent (غیر حاضر),Leave (رخصت)\n";
        reportData.classSummaries.forEach((cls: any) => {
          if (cls.absentStudents && cls.absentStudents.length > 0) {
            cls.absentStudents.forEach((student: any) => {
              csvContent += `${cls.className},${student.studentName},${student.rollNo},${student.absent},${student.leave}\n`;
            });
          }
        });
      }
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Report_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error(error);
      alert('CSV بنانے میں خرابی۔');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex justify-between items-center glass-card p-6 border-border-subtle print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <FileBarChart className="text-accent" />
            رپورٹس
          </h2>
          <p className="text-text-muted mt-1">حاضری اور سکلز کی ماہانہ/تاریخ وار اور انفرادی رپورٹس تیار کریں۔</p>
        </div>
      </div>

      <div className="glass-card stat-card-glow p-6 flex flex-col md:flex-row gap-4 items-end border-border-subtle print:hidden">
        <div className="w-full md:w-1/5">
          <label className="block text-sm font-medium text-text-muted mb-1">شروع کی تاریخ</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2 bg-bg-base border border-border-subtle rounded-xl focus:ring-1 focus:ring-accent focus:border-accent outline-none font-sans text-text-primary transition-all"
          />
        </div>
        <div className="w-full md:w-1/5">
          <label className="block text-sm font-medium text-text-muted mb-1">ختم کی تاریخ</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-2 bg-bg-base border border-border-subtle rounded-xl focus:ring-1 focus:ring-accent focus:border-accent outline-none font-sans text-text-primary transition-all"
          />
        </div>
        <div className="w-full md:w-1/5">
          <label className="block text-sm font-medium text-text-muted mb-1">کلاس فلٹر</label>
          <select
            value={filterClass}
            onChange={handleClassChange}
            className="w-full px-4 py-2 bg-bg-base border border-border-subtle rounded-xl focus:ring-1 focus:ring-accent focus:border-accent outline-none font-sans text-text-primary transition-all"
          >
            <option value="">تمام کلاسز</option>
            {classes?.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="w-full md:w-1/5">
          <label className="block text-sm font-medium text-text-muted mb-1">طالب علم (اختیاری)</label>
          <select
            value={filterStudent}
            onChange={(e) => setFilterStudent(e.target.value)}
            disabled={!filterClass}
            className="w-full px-4 py-2 bg-bg-base border border-border-subtle rounded-xl focus:ring-1 focus:ring-accent focus:border-accent outline-none font-sans text-text-primary transition-all disabled:opacity-50"
          >
            <option value="">تمام طلباء</option>
            {studentsInClass?.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name} ({s.rollNo})</option>
            ))}
          </select>
        </div>
        <button
          onClick={generateReport}
          disabled={isGenerating}
          className="three-d-button w-full md:w-1/5 flex items-center justify-center gap-2 text-white px-5 py-2.5 disabled:opacity-75"
        >
          {isGenerating ? 'بن رہی ہے...' : 'رپورٹ بنائیں'}
        </button>
      </div>

      {reportData && (
        <div className="space-y-4">
          <div className="flex justify-end gap-3 print:hidden">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-5 py-2 bg-green-500/20 border border-green-500/30 text-green-400 font-bold rounded-xl shadow-sm hover:bg-green-500/30 transition-all active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              CSV ڈاؤن لوڈ
            </button>
            <button
              onClick={exportPDF}
              className="flex items-center gap-2 px-5 py-2 bg-red-500/20 border border-red-500/30 text-red-400 font-bold rounded-xl shadow-sm hover:bg-red-500/30 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              PDF Report
            </button>
          </div>

          {/* Report Container */}
          <div ref={reportRef} className="bg-surface-base p-8 rounded-3xl shadow-lg border border-border-subtle print:m-0 print:border-none print:shadow-none" style={{ direction: 'rtl' }}>
            
            {/* Header */}
            <div className="text-center mb-10 pb-6 border-b border-border-subtle print:border-black/20">
              <h1 className="text-3xl font-extrabold text-text-primary print:text-black mb-2">
                کمپیوٹر لیب - {reportData.isIndividual ? 'انفرادی رپورٹ' : 'تفصیلی رپورٹ'}
              </h1>
              <div className="flex justify-center items-center gap-6 mt-4">
                <p className="text-text-muted print:text-gray-600 text-lg">کلاس: <span className="font-bold text-accent print:text-black">{reportData.className}</span></p>
                <div className="h-4 w-px bg-border-subtle print:bg-gray-400"></div>
                <p className="text-text-muted print:text-gray-600 text-md" dir="ltr">{reportData.dateRange}</p>
              </div>
              
              {reportData.isIndividual && (
                <div className="mt-6 flex justify-center">
                  <div className="bg-accent/10 border border-accent/20 rounded-2xl p-4 flex gap-6 items-center print:bg-transparent print:border-black/20">
                    <div className="w-12 h-12 bg-accent/20 text-accent rounded-full flex items-center justify-center print:border-2 print:border-black print:text-black">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-text-muted print:text-gray-600">طالب علم کا نام</p>
                      <p className="text-xl font-bold text-text-primary print:text-black">{reportData.studentName}</p>
                    </div>
                    <div className="w-px h-10 bg-border-subtle print:bg-gray-400"></div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-text-muted print:text-gray-600">رول نمبر</p>
                      <p className="text-lg font-bold text-text-primary print:text-black">{reportData.studentRollNo}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Top Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
              {!reportData.isIndividual && (
                <div className="p-4 bg-surface-light rounded-2xl border border-border-subtle text-center print:border-black/20 print:bg-transparent">
                  <p className="text-text-muted font-medium mb-1 print:text-gray-600">کل طلباء</p>
                  <p className="text-3xl font-bold text-text-primary print:text-black">{reportData.metrics.totalStudents}</p>
                </div>
              )}
              <div className="p-4 bg-surface-light rounded-2xl border border-border-subtle text-center print:border-black/20 print:bg-transparent">
                 <p className="text-text-muted font-medium mb-1 print:text-gray-600">حاضری فیصد</p>
                 <p className="text-3xl font-bold text-accent print:text-black">
                   {reportData.metrics.totalAttendance > 0 
                      ? Math.round((reportData.metrics.present / reportData.metrics.totalAttendance) * 100) 
                      : 0}%
                 </p>
              </div>
              <div className="p-4 bg-surface-light rounded-2xl border border-border-subtle text-center print:border-black/20 print:bg-transparent">
                 <p className="text-text-muted font-medium mb-1 print:text-gray-600">کل حاضریاں</p>
                 <p className="text-3xl font-bold text-emerald-500 print:text-black">{reportData.metrics.present}</p>
              </div>
              <div className="p-4 bg-surface-light rounded-2xl border border-border-subtle text-center print:border-black/20 print:bg-transparent">
                 <p className="text-text-muted font-medium mb-1 print:text-gray-600">کل غیر حاضریاں و رخصت</p>
                 <p className="text-3xl font-bold text-rose-500 print:text-black">{reportData.metrics.absent + reportData.metrics.leave}</p>
              </div>
              {/* Show skill metrics if not individual report */}
              {!reportData.isIndividual && (
                <div className="p-4 bg-surface-light rounded-2xl border border-border-subtle text-center print:border-black/20 print:bg-transparent md:col-span-1 col-span-2">
                   <p className="text-text-muted font-medium mb-1 print:text-gray-600">سکلز تکمیل کا اوسط</p>
                   <p className="text-3xl font-bold text-blue-500 print:text-black">{reportData.metrics.avgSkillCompletion}%</p>
                </div>
              )}
            </div>

            {/* Charts Section */}
            <div className={`grid grid-cols-1 ${reportData.isIndividual ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-8 mb-10 print:grid-cols-1 print:gap-4 print:page-break-inside-avoid print:block`}>
              <div className={`${reportData.isIndividual ? 'lg:col-span-1' : 'lg:col-span-2'} bg-surface-light/30 p-6 rounded-2xl border border-border-subtle print:border-black/20 print:bg-transparent print:mb-6`}>
                <h3 className="text-lg font-bold text-text-primary mb-4 text-center print:text-black">روزانہ حاضری کا رجحان</h3>
                <div className="h-72 w-full print:h-[300px]" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.barData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle)" className="print:stroke-gray-300" />
                      <XAxis dataKey="date" tick={{fontSize: 12, fill: 'var(--color-text-muted)'}} tickMargin={10} className="print:fill-black" />
                      <YAxis tick={{fontSize: 12, fill: 'var(--color-text-muted)'}} allowDecimals={false} className="print:fill-black" />
                      <RechartsTooltip cursor={{fill: 'var(--color-surface-base)'}} contentStyle={{backgroundColor: 'var(--color-surface-base)', borderColor: 'var(--color-border-subtle)', color: 'var(--color-text-primary)'}} />
                      <Legend wrapperStyle={{paddingTop: '20px'}} />
                      <Bar dataKey="حاضر" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} isAnimationActive={false} />
                      <Bar dataKey="رخصت" stackId="a" fill="#3b82f6" isAnimationActive={false} />
                      <Bar dataKey="غیر حاضر" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-surface-light/30 p-6 rounded-2xl border border-border-subtle print:border-black/20 print:bg-transparent print:page-break-inside-avoid">
                <h3 className="text-lg font-bold text-text-primary mb-4 text-center print:text-black">
                  {reportData.isIndividual ? 'طلباء کی حاضری کا تناسب' : 'مجموعی حاضری کا تناسب'}
                </h3>
                <div className="h-64 w-full print:h-[250px]" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        isAnimationActive={false}
                      >
                        {reportData.pieData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{backgroundColor: 'var(--color-surface-base)', borderColor: 'var(--color-border-subtle)', color: 'var(--color-text-primary)'}} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* General Report Details: Class-wise Summary & Absentees */}
            {!reportData.isIndividual && reportData.classSummaries.length > 0 && (
              <div className="space-y-8">
                <h3 className="text-2xl font-bold text-text-primary mb-6 pb-2 border-b border-border-subtle print:text-black print:border-black/20">
                  <span className="flex items-center gap-2 relative z-10 bg-surface-base print:bg-white pr-4 inline-block -mb-6">
                     <Users className="w-6 h-6 text-accent" />
                     کلاسوں کی تفصیلی رپورٹ (حاضری و غیر حاضری)
                  </span>
                </h3>
                
                <div className="grid grid-cols-1 gap-6">
                  {reportData.classSummaries.map((cls: any) => (
                    <div key={cls.classId} className="bg-surface-light border border-border-subtle rounded-2xl overflow-hidden print:border-black/30 print:bg-transparent">
                      {/* Class Summary Header */}
                      <div className="bg-surface-base p-4 border-b border-border-subtle print:border-black/30 print:bg-transparent flex flex-wrap items-center justify-between gap-4">
                        <h4 className="text-xl font-bold text-text-primary print:text-black">{cls.className}</h4>
                        <div className="flex gap-4">
                           <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-sm font-bold print:border-black/20 print:text-black">
                             حاضر: {cls.present}
                           </span>
                           <span className="px-3 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg text-sm font-bold print:border-black/20 print:text-black">
                             غیر حاضر: {cls.absent}
                           </span>
                           <span className="px-3 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-lg text-sm font-bold print:border-black/20 print:text-black">
                             رخصت: {cls.leave}
                           </span>
                        </div>
                      </div>
                      
                      {/* Class Absentees List */}
                      {cls.absentStudents && cls.absentStudents.length > 0 ? (
                        <div className="p-4" style={{ pageBreakInside: 'avoid' }}>
                          <p className="text-sm font-medium text-text-muted mb-3 print:text-gray-600">غیر حاضر اور رخصت طلباء کی فہرست:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {cls.absentStudents.map((student: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center bg-bg-base border border-border-subtle p-3 rounded-xl print:border-black/20 print:bg-transparent">
                                <div>
                                  <p className="font-bold text-text-primary print:text-black">{student.studentName}</p>
                                  <p className="text-xs text-text-muted print:text-gray-600">رول نمبر: {student.rollNo}</p>
                                </div>
                                <div className="text-left flex flex-col gap-1 items-end">
                                  {student.absent > 0 && <span className="text-xs bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-md print:border print:border-black/20 print:text-black">غیر حاضر: {student.absent}</span>}
                                  {student.leave > 0 && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-md print:border print:border-black/20 print:text-black">رخصت: {student.leave}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 text-center text-text-muted text-sm print:text-gray-600">
                          اس مدت میں کوئی غیر حاضری نہیں ہے۔
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-12 pt-6 border-t border-border-subtle text-center text-sm text-text-muted print:border-black/30 print:text-gray-600">
              یہ رپورٹ شعبہ علوم جدیدہ - جامعہ اشرفیہ کے ریکارڈ سسٹم کے ذریعے خودکار پیدا کی گئی ہے۔ <br/>
              (تاریخ اجرا: {format(new Date(), 'dd MMM yyyy, HH:mm')})
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
