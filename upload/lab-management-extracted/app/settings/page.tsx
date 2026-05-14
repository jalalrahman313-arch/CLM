"use client";

import { useState } from "react";
import { db } from "@/lib/db";
import { Settings, DownloadCloud, UploadCloud, AlertTriangle, ShieldCheck, HardDrive, Trash2, Database, LayoutDashboard, Check } from "lucide-react";
import { useDashboardSettings, WIDGETS } from "@/hooks/use-dashboard-settings";

export default function SettingsPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [importStatus, setImportStatus] = useState<string>('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState(1);

  const { enabledWidgets, toggleWidget, isLoaded } = useDashboardSettings();

  const exportData = async () => {
    setIsExporting(true);
    try {
      const classes = await db.classes.toArray();
      const courses = await db.courses.toArray();
      const students = await db.students.toArray();
      const attendance = await db.attendance.toArray();
      const skillTracking = await db.skillTracking.toArray();
      const tasks = await db.tasks.toArray();

      const fullData = {
        classes,
        courses,
        students,
        attendance,
        skillTracking,
        tasks,
        exportedAt: new Date().toISOString(),
        version: 2
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullData));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `Backup_Lab_System_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (error) {
      console.error(error);
      alert('بیک اپ بنانے میں خرابی پیش آئی۔');
    } finally {
      setIsExporting(false);
    }
  };

  const triggerFileInput = () => {
    document.getElementById('import-file')?.click();
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm('تنبیہ: نیا ڈیٹا امپورٹ کرنے سے موجودہ تمام ڈیٹا حذف ہو جائے گا! کیا آپ واقعی امپورٹ کرنا چاہتے ہیں؟')) {
       // Reset input
       event.target.value = '';
       return;
    }

    setIsImporting(true);
    setImportStatus('ڈیٹا پڑھا جا رہا ہے...');
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);

        // Basic validation
        if (!parsed.classes || !parsed.courses || !parsed.students) {
          throw new Error('فائل کا فارمیٹ درست نہیں ہے۔');
        }

        setImportStatus('موجودہ ڈیٹا مٹایا جا رہا ہے...');
        // Clear all existing data
        await db.transaction('rw', [db.classes, db.courses, db.students, db.attendance, db.skillTracking, db.tasks], async () => {
          await db.classes.clear();
          await db.courses.clear();
          await db.students.clear();
          await db.attendance.clear();
          await db.skillTracking.clear();
          await db.tasks.clear();
          
          setImportStatus('نیا ڈیٹا لکھا جا رہا ہے...');
          
          if (parsed.classes.length) await db.classes.bulkAdd(parsed.classes);
          if (parsed.courses.length) await db.courses.bulkAdd(parsed.courses);
          if (parsed.students.length) await db.students.bulkAdd(parsed.students);
          if (parsed.attendance && parsed.attendance.length) await db.attendance.bulkAdd(parsed.attendance);
          if (parsed.skillTracking && parsed.skillTracking.length) await db.skillTracking.bulkAdd(parsed.skillTracking);
          if (parsed.tasks && parsed.tasks.length) await db.tasks.bulkAdd(parsed.tasks);
        });

        setImportStatus('ڈیٹا کامیابی سے بحال ہو گیا!');
        setTimeout(() => setImportStatus(''), 3000);
      } catch (error: any) {
        console.error(error);
        alert('امپورٹ کے دوران خرابی: ' + error.message);
        setImportStatus('امپورٹ ناکام');
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset
  };

  const injectTestData = async () => {
    setIsImporting(true);
    setImportStatus('ٹیسٹنگ ڈیٹا شامل کیا جا رہا ہے...');
    try {
      const courseId1 = "course_" + Date.now() + "1";
      const courseId2 = "course_" + Date.now() + "2";
      const classId1 = "class_" + Date.now() + "1";
      const classId2 = "class_" + Date.now() + "2";

      const skills1 = [
        { id: "skill_" + Date.now() + "11", name: "MS Word" },
        { id: "skill_" + Date.now() + "12", name: "MS Excel" },
        { id: "skill_" + Date.now() + "13", name: "MS PowerPoint" }
      ];

      const skills2 = [
        { id: "skill_" + Date.now() + "21", name: "HTML" },
        { id: "skill_" + Date.now() + "22", name: "CSS" },
        { id: "skill_" + Date.now() + "23", name: "JavaScript" }
      ];

      await db.transaction('rw', [db.classes, db.courses, db.students, db.attendance, db.skillTracking, db.tasks], async () => {
        await db.courses.bulkAdd([
          { id: courseId1, name: "MS Office", duration: "3 ماہ", skills: skills1, createdAt: new Date().toISOString() },
          { id: courseId2, name: "Web Development", duration: "6 ماہ", skills: skills2, createdAt: new Date().toISOString() }
        ]);

        await db.classes.bulkAdd([
          { id: classId1, name: "صبح کی کلاس", currentCourseId: courseId1, createdAt: new Date().toISOString(), isActive: true },
          { id: classId2, name: "شام کی کلاس", currentCourseId: courseId2, createdAt: new Date().toISOString(), isActive: true }
        ]);

        const studentsList = [
          { id: "std_" + Date.now() + "1", rollNo: "M-001", name: "علی احمد", classId: classId1, status: 'جاری' as const, enrolledAt: new Date().toISOString() },
          { id: "std_" + Date.now() + "2", rollNo: "M-002", name: "عثمان خان", classId: classId1, status: 'جاری' as const, enrolledAt: new Date().toISOString() },
          { id: "std_" + Date.now() + "3", rollNo: "E-001", name: "زین اسلم", classId: classId2, status: 'جاری' as const, enrolledAt: new Date().toISOString() },
          { id: "std_" + Date.now() + "4", rollNo: "E-002", name: "بلال رشید", classId: classId2, status: 'جاری' as const, enrolledAt: new Date().toISOString() }
        ];
        await db.students.bulkAdd(studentsList);
        
        const dateStr = new Date().toISOString().slice(0, 10);
        await db.attendance.bulkAdd([
          { id: "att_" + Date.now() + "1", studentId: studentsList[0].id, classId: classId1, date: dateStr, status: 'حاضر' },
          { id: "att_" + Date.now() + "2", studentId: studentsList[1].id, classId: classId1, date: dateStr, status: 'رخصت' },
          { id: "att_" + Date.now() + "3", studentId: studentsList[2].id, classId: classId2, date: dateStr, status: 'حاضر' },
          { id: "att_" + Date.now() + "4", studentId: studentsList[3].id, classId: classId2, date: dateStr, status: 'غیر حاضر' }
        ]);
        
        await db.skillTracking.bulkAdd([
          {
            id: "track_" + Date.now() + "1",
            classId: classId1,
            skillId: skills1[0].id,
            courseId: courseId1,
            skillName: skills1[0].name,
            status: 'Completed',
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString()
          },
          {
            id: "track_" + Date.now() + "2",
            classId: classId1,
            skillId: skills1[1].id,
            courseId: courseId1,
            skillName: skills1[1].name,
            status: 'In Progress',
            startDate: new Date().toISOString(),
            endDate: null
          }
        ]);

        await db.tasks.bulkAdd([
          {
            id: "task_" + Date.now() + "1",
            title: "MS Word الاسائنمنٹ مکمل کریں",
            description: "طلباء کا ٹائپنگ ٹیسٹ لیں",
            status: 'Pending',
            classId: classId1,
            courseId: courseId1,
            createdAt: new Date().toISOString()
          },
          {
            id: "task_" + Date.now() + "2",
            title: "HTML ٹیگز کا پریکٹیکل",
            description: "بیسک لے آؤٹ بنوانا ہے",
            status: 'Completed',
            classId: classId2,
            courseId: courseId2,
            createdAt: new Date().toISOString()
          }
        ]);
      });
      alert('فرضی ٹیسٹنگ ڈیٹا کامیابی کے ساتھ شامل کر دیا گیا ہے۔');
      setImportStatus('ڈیٹا شامل ہو گیا!');
      setTimeout(() => setImportStatus(''), 3000);
    } catch (e: any) {
      console.error(e);
      alert('ڈیٹا شامل کرنے میں خرابی: ' + e.message);
      setImportStatus('ایرر!');
    } finally {
      setIsImporting(false);
    }
  };

  const resetData = async () => {
    setIsResetting(true);
    setImportStatus('ڈیٹا مٹایا جا رہا ہے...');
    
    try {
      await db.transaction('rw', [db.classes, db.courses, db.students, db.attendance, db.skillTracking, db.tasks], async () => {
        await db.classes.clear();
        await db.courses.clear();
        await db.students.clear();
        await db.attendance.clear();
        await db.skillTracking.clear();
        await db.tasks.clear();
      });

      setImportStatus('تمام ڈیٹا حذف کر دیا گیا ہے۔');
      setTimeout(() => setImportStatus(''), 3000);
      alert('اپلیکیشن کا تمام ڈیٹا کامیابی کے ساتھ ری سیٹ کر دیا گیا ہے۔');
      setShowResetModal(false);
      setResetStep(1);
    } catch (error: any) {
      console.error(error);
      alert('ڈیٹا ری سیٹ کرنے کے دوران خرابی: ' + error.message);
      setImportStatus('ری سیٹ ناکام');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex justify-between items-center glass-card p-6 border-border-subtle">
        <div>
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Settings className="text-accent" />
            سیٹنگز
          </h2>
          <p className="text-text-muted mt-1">ایپ کا ڈیٹا بیک اپ لیں یا پرانا ڈیٹا بحال کریں۔</p>
        </div>
      </div>

      {/* Dashboard Configuration */}
      {isLoaded && (
        <div className="glass-card stat-card-glow p-8 border-border-subtle mt-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl border border-indigo-500/20">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-text-primary">ڈیش بورڈ کسٹمائزیشن</h3>
              <p className="text-sm text-text-muted">ڈیش بورڈ پر نظر آنے والے چارٹس اور کارڈز منتخب کریں</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {WIDGETS.map((widget) => {
              const isEnabled = enabledWidgets.includes(widget.id);
              return (
                <button
                  key={widget.id}
                  onClick={() => toggleWidget(widget.id)}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all text-right ${
                    isEnabled 
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600' 
                      : 'bg-surface-light border-border-subtle text-text-muted hover:bg-surface-base'
                  }`}
                >
                  <span className="font-medium text-sm">{widget.label}</span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                    isEnabled ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-border-subtle bg-surface-base'
                  }`}>
                    {isEnabled && <Check className="w-4 h-4" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Export Card */}
        <div className="glass-card stat-card-glow p-8 border-border-subtle">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <DownloadCloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-text-primary">بیک اپ ایکسپورٹ</h3>
              <p className="text-sm text-text-muted">موجودہ تمام ڈیٹا JSON فائل میں محفوظ کریں</p>
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-text-muted text-sm leading-relaxed">
              ڈیٹا کے ضیاع سے بچنے کے لیے ہفتہ وار بنیادوں پر بیک اپ لینے کی سفارش کی جاتی ہے۔ یہ فائل آپ کے ڈیوائس میں ڈاؤن لوڈ ہو جائے گی۔
            </p>
            <button 
              onClick={exportData}
              disabled={isExporting}
              className="three-d-button w-full flex items-center justify-center gap-2 px-6 py-3 text-white font-medium"
            >
              {isExporting ? 'ایکسپورٹ ہو رہا ہے...' : 'ڈاؤن لوڈ بیک اپ'}
            </button>
          </div>
        </div>

        {/* Import Card */}
        <div className="glass-card stat-card-glow p-8 border-border-subtle">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-orange-500/10 text-orange-400 rounded-xl border border-orange-500/20">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-text-primary">بیک اپ امپورٹ (بحالی)</h3>
              <p className="text-sm text-text-muted">پہلے سے محفوظ کردہ JSON فائل اپ لوڈ کریں</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-red-500/10 text-red-400 p-3 rounded-lg flex items-start gap-2 text-sm border border-red-500/20">
               <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
               <p>خیال رہے! نیا بیک اپ اپ لوڈ کرنے سے آپ کا موجودہ تمام ڈیٹا مکمل طور پر حذف ہو جائے گا اور نئے ڈیٹا سے بدل جائے گا۔</p>
            </div>
            <input 
              type="file" 
              id="import-file"
              accept=".json" 
              className="hidden" 
              onChange={importData} 
            />
            <button 
              onClick={triggerFileInput}
              disabled={isImporting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 active:scale-95 text-orange-400 font-bold rounded-xl shadow-md transition-all"
            >
              {isImporting ? 'امپورٹ ہو رہا ہے...' : 'بیک اپ اپ لوڈ کریں'}
            </button>
            {importStatus && (
               <p className="text-center text-sm font-bold text-accent animate-pulse">{importStatus}</p>
            )}
          </div>
        </div>
      </div>

      {/* Test Data */}
      <div className="glass-card stat-card-glow p-8 border-border-subtle mt-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary">ٹیسٹنگ ڈیٹا (فرضی مواد)</h3>
            <p className="text-sm text-text-muted">ایپلی کیشن کو ٹیسٹ کرنے کے لیے کچھ فرضی ڈیٹا شامل کریں</p>
          </div>
        </div>
        <div className="space-y-4">
          <p className="text-text-muted text-sm leading-relaxed">
            استعمال کے مشاہدے کے لیے اس بٹن کے ذریعے کچھ فرضی کورسز، کلاسز، طلباء، ٹاسکس، اور حاضری کا ریکارڈ شامل کیا جا سکتا ہے۔ اس سے موجودہ ڈیٹا ڈیلیٹ نہیں ہوگا۔
          </p>
          <button 
            onClick={injectTestData}
            disabled={isImporting || isExporting || isResetting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 active:scale-95 text-blue-400 font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            <Database className="w-5 h-5" />
            فرضی ڈیٹا شامل کریں
          </button>
        </div>
      </div>

      <div className="glass-card stat-card-glow p-6 mt-6 flex gap-4 items-center border-accent/20 bg-accent/5">
         <div className="p-3 bg-accent/20 text-accent rounded-full shrink-0 border border-accent/30 shadow-[0_0_15px_rgba(var(--color-accent),0.3)]">
           <ShieldCheck className="w-8 h-8" />
         </div>
         <div>
           <h4 className="font-bold text-text-primary text-lg flex items-center gap-2">
             <HardDrive className="w-5 h-5 opacity-70" />
             آف لائن ڈیٹا بیس
           </h4>
           <p className="text-text-muted text-sm mt-1">
              اس ایپ کا تمام ڈیٹا آپ کے اپنے براؤزر اور ڈیوائس میں (IndexedDB) انتہائی محفوظ طریقے سے رکھا گیا ہے۔ 
              یہ انٹرنیٹ کے بغیر بھی مکمل طور پر فعال ہے۔
           </p>
         </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-card p-8 border-red-500/20 bg-red-500/5 mt-6 border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-red-500">خطرناک حصہ (Danger Zone)</h3>
            <p className="text-sm text-red-400/80">تمام موجودہ ڈیٹا حذف کریں</p>
          </div>
        </div>
        <div className="space-y-4">
          <p className="text-text-primary text-sm leading-relaxed">
            اس عمل سے ایپ کا تمام ڈیٹا (کلاسز، کورسز، طلبہ، حاضری، اور سکلز کا ریکارڈ) ہمیشہ کے لئے حذف ہو جائے گا۔ اسے واپس لانا ممکن نہیں ہوگا۔ احتیاط سے کام لیں۔
          </p>
          <button 
            onClick={() => {
              setShowResetModal(true);
              setResetStep(1);
            }}
            disabled={isResetting || isImporting || isExporting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 active:scale-95 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            <Trash2 className="w-5 h-5" />
            {isResetting ? 'ری سیٹ ہو رہا ہے...' : 'ڈیٹا ری سیٹ کریں'}
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-base border border-red-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4 border-2 border-red-500/20">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h3 className="text-xl font-bold text-red-500 mb-2">
              {resetStep === 1 ? 'انتہائی خطرناک عمل' : 'آخری تصدیق'}
            </h3>
            
            <p className="text-text-primary mb-6">
              {resetStep === 1 ? 
                'کیا آپ واقعی سارا ڈیٹا ڈیلیٹ کرنا چاہتے ہیں؟ اس عمل کو واپس لانا ممکن نہیں ہوگا۔' : 
                'آخری بار احتیاط سے فیصلہ کریں: کیا آپ پرامید ہیں کہ تمام ڈیٹا ہمیشہ کے لیے حذف کر دیا جائے؟'}
            </p>

            <div className="flex gap-3 w-full">
              <button 
                onClick={() => {
                  setShowResetModal(false);
                  setResetStep(1);
                }}
                className="flex-1 px-4 py-2 border border-border-subtle rounded-xl text-text-muted hover:bg-surface-light transition-colors"
                disabled={isResetting}
              >
                منسوخ کریں
              </button>
              
              {resetStep === 1 ? (
                <button 
                  onClick={() => setResetStep(2)}
                  className="flex-[1.5] px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/30 rounded-xl font-bold transition-colors"
                >
                  ہاں، میں سمجھتا ہوں
                </button>
              ) : (
                <button 
                  onClick={resetData}
                  disabled={isResetting}
                  className="flex-[1.5] px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {isResetting ? 'حذف ہو رہا ہے...' : 'ڈیلیٹ کر دیں'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
