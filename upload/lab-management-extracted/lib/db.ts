import Dexie, { type EntityTable } from 'dexie';

export interface ClassEntity {
  id: string;
  name: string;
  currentCourseId: string | null;
  createdAt: string;
  isActive: boolean;
}

export interface SkillDefinition {
  id: string;
  name: string;
}

export interface CourseEntity {
  id: string;
  name: string;
  duration: string;
  skills: SkillDefinition[];
  createdAt: string;
}

export interface StudentEntity {
  id: string;
  rollNo: string;
  name: string;
  classId: string;
  status: 'جاری' | 'فارغ';
  enrolledAt: string;
}

export interface AttendanceEntity {
  id: string;
  studentId: string;
  classId: string;
  date: string; // YYYY-MM-DD
  status: 'حاضر' | 'رخصت' | 'غیر حاضر' | 'skip';
}

export interface SkillTrackingEntity {
  id: string;
  classId: string;
  skillId: string; // Refers to a skill inside a course
  courseId: string;
  skillName: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  startDate: string;
  endDate: string | null;
}

export interface TaskEntity {
  id: string;
  title: string;
  description: string;
  status: 'Pending' | 'Completed';
  classId?: string;
  courseId?: string;
  createdAt: string;
}

export const db = new Dexie('ComputerLabDB') as Dexie & {
  classes: EntityTable<ClassEntity, 'id'>;
  courses: EntityTable<CourseEntity, 'id'>;
  students: EntityTable<StudentEntity, 'id'>;
  attendance: EntityTable<AttendanceEntity, 'id'>;
  skillTracking: EntityTable<SkillTrackingEntity, 'id'>;
  tasks: EntityTable<TaskEntity, 'id'>;
};

// Schema declaration
db.version(2).stores({
  classes: 'id, name, isActive',
  courses: 'id, name',
  students: 'id, rollNo, classId, status',
  attendance: 'id, studentId, classId, date, [classId+date]',
  skillTracking: 'id, classId, courseId, status',
  tasks: 'id, classId, courseId, status'
});
