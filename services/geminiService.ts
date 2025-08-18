import { Language, Exercise } from "../types";
import { API_BASE } from "../constants/api";
import { getAuthHeaders } from "./authService";

export const processWord = async (
  word: string,
  learningLanguage: Language,
  nativeLanguage: Language
) => {
  try {
    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE}/process-word`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({ word, learningLanguage, nativeLanguage }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication required");
      }
      throw new Error("Failed to process word");
    }

    return await response.json();
  } catch (error) {
    console.error("Error processing word:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to process the word. Please try again."
    );
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
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({
        learningWord,
        nativeWord,
        learningLanguage,
        nativeLanguage,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication required");
      }
      throw new Error("Failed to generate exercises");
    }

    return await response.json();
  } catch (error) {
    console.error("Error generating exercises:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to generate exercises. Please try again."
    );
  }
};

// Audio cache using Map for in-memory storage
const audioCache = new Map<string, string>();

// Create a cache key for audio
const createCacheKey = (text: string, langCode: string) => {
  return `${langCode}:${text.toLowerCase().trim()}`;
};

// Play audio from base64 string
const playAudioFromBase64 = (base64Audio: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Convert base64 to blob
      const byteCharacters = atob(base64Audio);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "audio/mp3" });

      // Create audio element and play
      const audio = new Audio();
      const url = URL.createObjectURL(blob);

      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };

      audio.onerror = (error) => {
        URL.revokeObjectURL(url);
        reject(error);
      };

      audio.src = url;
      audio.play().catch(reject);
    } catch (error) {
      reject(error);
    }
  });
};

// Fallback to browser's speechSynthesis
const fallbackToSpeechSynthesis = (
  text: string,
  langCode: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel(); // Cancel any previous speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode;

      // Optional: find a specific voice
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find((v) => v.lang === langCode);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (error) => reject(error);

      window.speechSynthesis.speak(utterance);
    } else {
      reject(new Error("Browser does not support text-to-speech"));
    }
  });
};

// Get audio from server API
const getAudioFromAPI = async (
  text: string,
  langCode: string
): Promise<string> => {
  const headers = getAuthHeaders();
  const response = await fetch(`${API_BASE}/text-to-speech`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({ text, langCode }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication required");
    }
    throw new Error("Failed to generate speech");
  }

  const data = await response.json();
  return data.audio;
};

export const textToSpeech = async (
  text: string,
  langCode: string
): Promise<void> => {
  try {
    const cacheKey = createCacheKey(text, langCode);

    // Check cache first
    let audioBase64 = audioCache.get(cacheKey);

    if (!audioBase64) {
      try {
        // Try to get audio from API
        audioBase64 = await getAudioFromAPI(text, langCode);
        // Cache the result
        audioCache.set(cacheKey, audioBase64);
      } catch (apiError) {
        console.warn(
          "Google TTS API failed, falling back to browser TTS:",
          apiError
        );
        // Fallback to browser's speechSynthesis
        await fallbackToSpeechSynthesis(text, langCode);
        return;
      }
    }

    // Play the audio
    try {
      await playAudioFromBase64(audioBase64);
    } catch (playError) {
      console.warn(
        "Failed to play audio from API, falling back to browser TTS:",
        playError
      );
      // Remove from cache if it's corrupted
      audioCache.delete(cacheKey);
      // Fallback to browser's speechSynthesis
      await fallbackToSpeechSynthesis(text, langCode);
    }
  } catch (error) {
    console.error("Text-to-speech error:", error);
    // Final fallback to browser TTS
    try {
      await fallbackToSpeechSynthesis(text, langCode);
    } catch (fallbackError) {
      console.error("All TTS methods failed:", fallbackError);
      alert("Text-to-speech is not available.");
    }
  }
};
