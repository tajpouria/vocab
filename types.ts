export interface Language {
  code: string;
  name: string;
}

export interface Course {
  id: string;
  learningLanguage: Language;
  nativeLanguage: Language;
  decks: Deck[];
}

export interface Deck {
  id: string;
  name: string;
  words: Word[];
}

export interface Word {
  id: string;
  learningWord: string;
  nativeWord: string;
  examples: Example[];
  srs: SrsData;
  exercises: Exercise[];
}

export interface Example {
  sentence: string;
  translation: string;
}

export interface SrsData {
  stability: number;
  difficulty: number;
  reviewDate: string; // ISO string
  lapses: number;
}

export enum ExerciseType {
  TRANSLATE_MC = 'TRANSLATE_MC',
  FILL_BLANK_MC = 'FILL_BLANK_MC',
  FILL_BLANK_TYPE = 'FILL_BLANK_TYPE',
  PRONOUNCE_WORD = 'PRONOUNCE_WORD',
  PRONOUNCE_SENTENCE = 'PRONOUNCE_SENTENCE',
}

export interface Exercise {
  id: string;
  type: ExerciseType;
  question: string;
  options?: string[];
  correctAnswer: string;
  sentenceContext?: string;
  translationContext?: string;
}

export enum View {
  COURSE,
  PRACTICE,
}

export type AddWordResult = {
  status: 'added' | 'duplicate';
  wordId: string;
  learningWord: string;
};
