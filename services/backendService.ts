import { Course } from '../types';

const DB_KEY_PREFIX = 'vocab-course-';
const LATENCY = 200; // ms

const simulateLatency = () => new Promise(resolve => setTimeout(resolve, LATENCY));

const getDbKey = (email: string) => `${DB_KEY_PREFIX}${email}`;

export const getCourse = async (email: string): Promise<Course | null> => {
  if (!email) return null;
  await simulateLatency();
  try {
    const savedCourse = localStorage.getItem(getDbKey(email));
    return savedCourse ? JSON.parse(savedCourse) : null;
  } catch (error) {
    console.error("Failed to load course from backend", error);
    return null;
  }
};

export const saveCourse = async (email: string, course: Course): Promise<void> => {
  if (!email) return;
  await simulateLatency();
  try {
    localStorage.setItem(getDbKey(email), JSON.stringify(course));
  } catch (error) {
    console.error("Failed to save course to backend", error);
    throw new Error("Failed to save course progress.");
  }
};

export const deleteCourse = async (email: string): Promise<void> => {
  if (!email) return;
  await simulateLatency();
  try {
    localStorage.removeItem(getDbKey(email));
  } catch (error)
  {
      console.error("Failed to delete course from backend", error);
  }
};
