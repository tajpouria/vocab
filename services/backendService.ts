import { Course } from '../types';
import { API_BASE } from '../constants/api';

export const getCourse = async (email: string): Promise<Course | null> => {
  if (!email) return null;
  
  try {
    const response = await fetch(`${API_BASE}/course/${encodeURIComponent(email)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch course');
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to load course from backend", error);
    return null;
  }
};

export const saveCourse = async (email: string, course: Course): Promise<void> => {
  if (!email) return;
  
  try {
    const response = await fetch(`${API_BASE}/course/${encodeURIComponent(email)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(course),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save course');
    }
  } catch (error) {
    console.error("Failed to save course to backend", error);
    throw new Error("Failed to save course progress.");
  }
};
