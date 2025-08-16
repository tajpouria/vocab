import { Course } from '../types';

const DB_KEY = 'vocab-course-backend';
const LATENCY = 200; // ms

const simulateLatency = () => new Promise(resolve => setTimeout(resolve, LATENCY));

export const getCourse = async (): Promise<Course | null> => {
  await simulateLatency();
  try {
    const savedCourse = localStorage.getItem(DB_KEY);
    return savedCourse ? JSON.parse(savedCourse) : null;
  } catch (error) {
    console.error("Failed to load course from backend", error);
    return null;
  }
};

export const saveCourse = async (course: Course): Promise<void> => {
  await simulateLatency();
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(course));
  } catch (error) {
    console.error("Failed to save course to backend", error);
    throw new Error("Failed to save course progress.");
  }
};

export const deleteCourse = async (): Promise<void> => {
  await simulateLatency();
  try {
    localStorage.removeItem(DB_KEY);
  } catch (error)
  {
      console.error("Failed to delete course from backend", error);
  }
};
