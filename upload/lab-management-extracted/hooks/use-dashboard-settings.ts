"use client";

import { useState, useEffect } from "react";

export type WidgetId = 
  | 'summaryCards' 
  | 'attendanceOverview' 
  | 'skillsProgress' 
  | 'weeklyAttendance' 
  | 'tasksOverview';

export const WIDGETS: { id: WidgetId; label: string }[] = [
  { id: 'summaryCards', label: 'خلاصہ کارکردگی (Summary Cards)' },
  { id: 'attendanceOverview', label: 'آج کی حاضری (Today Attendance)' },
  { id: 'skillsProgress', label: 'سکلز تکمیل کی صورتحال (Skills Progress)' },
  { id: 'weeklyAttendance', label: 'ہفتہ وار حاضری کا رجحان (Weekly Attendance Chart)' },
  { id: 'tasksOverview', label: 'ٹاسکس کی صورتحال (Tasks Chart)' },
];

export const DEFAULT_WIDGETS: WidgetId[] = [
  'summaryCards',
  'attendanceOverview',
  'skillsProgress',
  'weeklyAttendance',
  'tasksOverview'
];

export function useDashboardSettings() {
  const [enabledWidgets, setEnabledWidgets] = useState<WidgetId[]>(DEFAULT_WIDGETS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('dashboard_widgets');
    if (saved) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEnabledWidgets(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoaded(true);
  }, []);

  const toggleWidget = (id: WidgetId) => {
    setEnabledWidgets(prev => {
      const newSettings = prev.includes(id) 
        ? prev.filter(w => w !== id) 
        : [...prev, id];
      localStorage.setItem('dashboard_widgets', JSON.stringify(newSettings));
      return newSettings;
    });
  };

  return { enabledWidgets, toggleWidget, isLoaded };
}
