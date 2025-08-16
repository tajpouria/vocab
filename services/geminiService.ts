import { GoogleGenAI, Type } from "@google/genai";
import { Language, Exercise, ExerciseType } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This is a fallback for development environments where process.env might not be set up.
  // In a real production build, this key should be securely managed.
  console.warn("API_KEY is not set. Please set the environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const processWord = async (
  word: string,
  learningLanguage: Language,
  nativeLanguage: Language
) => {
  const schema = {
    type: Type.OBJECT,
    properties: {
      learningWord: {
        type: Type.STRING,
        description: `The word in ${learningLanguage.name}.`,
      },
      nativeWord: {
        type: Type.STRING,
        description: `The word in ${nativeLanguage.name}.`,
      },
      examples: {
        type: Type.ARRAY,
        description: `An array of 3 example sentences.`,
        items: {
          type: Type.OBJECT,
          properties: {
            sentence: {
              type: Type.STRING,
              description: `An example sentence using the word in ${learningLanguage.name}.`,
            },
            translation: {
              type: Type.STRING,
              description: `The translation of the example sentence in ${nativeLanguage.name}.`,
            },
          },
        },
      },
    },
    required: ["learningWord", "nativeWord", "examples"],
  };

  const prompt = `You are a language learning assistant. The user is learning ${learningLanguage.name} and their native language is ${nativeLanguage.name}. They have submitted the word: "${word}". Process this word and return a JSON object.
1.  First, identify the base/dictionary form (lemma) of the word. For verbs, this is the infinitive (e.g., 'went' -> 'go'). For nouns, this is the singular form (e.g., 'cats' -> 'cat').
2.  Use this base form for all subsequent steps.
3.  Ensure the 'learningWord' field in the JSON is this base word in ${learningLanguage.name} and 'nativeWord' is its translation in ${nativeLanguage.name}.
4.  Generate three distinct, simple example sentences using the ${learningLanguage.name} base word.
5.  Provide a translation for each example sentence into ${nativeLanguage.name}.
Your final output MUST be a single JSON object matching the provided schema.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error processing word with Gemini:", error);
    throw new Error("Failed to process the word. Please check your API key and try again.");
  }
};

export const generateExercisesForWord = async (
    learningWord: string, 
    nativeWord: string,
    learningLanguage: Language,
    nativeLanguage: Language
): Promise<Exercise[]> => {

    const schema = {
        type: Type.OBJECT,
        properties: {
            exercises: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, enum: Object.values(ExerciseType) },
                        question: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        correctAnswer: { type: Type.STRING },
                        sentenceContext: { type: Type.STRING },
                        translationContext: { type: Type.STRING },
                    }
                }
            }
        }
    };
    
    const prompt = `Generate 5 distinct exercises for learning the word "${learningWord}" (${learningLanguage.name}) which means "${nativeWord}" (${nativeLanguage.name}).
Create one of each of the following types:
1.  'TRANSLATE_MC': A multiple-choice translation question. The question should be the word in ${learningLanguage.name}. Provide 3 plausible but incorrect options in ${nativeLanguage.name}.
2.  'FILL_BLANK_MC': A multiple-choice fill-in-the-blank question. Create a sentence in ${learningLanguage.name} with the word "${learningWord}" missing. Provide 3 plausible but incorrect word choices in ${learningLanguage.name}. Also, provide the translation of the full sentence in ${nativeLanguage.name} in the 'translationContext' field.
3.  'FILL_BLANK_TYPE': A typing fill-in-the-blank question. Create a sentence in ${learningLanguage.name} with "${learningWord}" missing. The user has to type the correct answer. Provide the translation of the full sentence in ${nativeLanguage.name} in the 'translationContext' field.
4.  'PRONOUNCE_WORD': An exercise to pronounce the word. The 'question' field should be just the word "${learningWord}".
5.  'PRONOUNCE_SENTENCE': An exercise to pronounce a full sentence. The 'question' field should be a simple sentence in ${learningLanguage.name} that contains the word "${learningWord}".

Return a single JSON object matching the provided schema. Ensure 'options' are only provided for MC types. For 'FILL_BLANK_TYPE' and 'FILL_BLANK_MC', the 'question' field should be the sentence with a blank (e.g., '___'). 'correctAnswer' must always be the single correct word. For pronunciation exercises, 'correctAnswer' should be the same as the 'question'.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        
        return parsed.exercises.map((ex: any) => ({...ex, id: Math.random().toString(36).substring(2, 9) }));

    } catch (error) {
        console.error("Error generating exercises with Gemini:", error);
        throw new Error("Failed to generate exercises. The AI service may be temporarily unavailable.");
    }
};

export const textToSpeech = (text: string, langCode: string) => {
    if ('speechSynthesis' in window) {
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
