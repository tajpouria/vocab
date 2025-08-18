import { Language, Exercise } from '../types';
import { API_BASE } from '../constants/api';
import { getAuthHeaders } from './authService';

export const processWord = async (
  word: string,
  learningLanguage: Language,
  nativeLanguage: Language
) => {
  try {
    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE}/process-word`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({ word, learningLanguage, nativeLanguage }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      throw new Error('Failed to process word');
    }

    return await response.json();
  } catch (error) {
    console.error("Error processing word:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to process the word. Please try again.");
  }
};

export const generateExercisesForWord = async (
    learningWord: string, 
    nativeWord: string,
    learningLanguage: Language,
    nativeLanguage: Language
): Promise<Exercise[]> => {
    try {
        const headers = getAuthHeaders();
        const response = await fetch(`${API_BASE}/generate-exercises`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...headers,
            },
            body: JSON.stringify({ learningWord, nativeWord, learningLanguage, nativeLanguage }),
        });

        if (!response.ok) {
            if (response.status === 401) {
              throw new Error('Authentication required');
            }
            throw new Error('Failed to generate exercises');
        }

        return await response.json();
    } catch (error) {
        console.error("Error generating exercises:", error);
        throw new Error(error instanceof Error ? error.message : "Failed to generate exercises. Please try again.");
    }
};

export const textToSpeech = (text: string, langCode: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any previous speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode;
      // Optional: find a specific voice
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang === langCode);
      if (voice) {
        utterance.voice = voice;
      }
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Your browser does not support text-to-speech.");
    }
};