import { Course } from '../types';
import { API_BASE } from '../constants/api';
import { getAuthHeaders } from './authService';

export const getCourse = async (): Promise<Course | null> => {
  try {
    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE}/course`, {
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      throw new Error('Failed to fetch course');
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to load course from backend", error);
    throw error;
  }
};

export const saveCourse = async (course: Course): Promise<void> => {
  try {
    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE}/course`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(course),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      throw new Error('Failed to save course');
    }
  } catch (error) {
    console.error("Failed to save course to backend", error);
    throw new Error("Failed to save course progress.");
  }
};
