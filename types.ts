export interface Language {
  code: string;
  name: string;
}

export interface Course {
  id: string;
  learningLanguage: Language;
  nativeLanguage: Language;
  studySets: StudySet[];
}

export interface StudySet {
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
  due: Date; // Date when the card is next due for review
  stability: number; // A measure of how well the information is retained
  difficulty: number; // Reflects the inherent difficulty of the card content
  elapsed_days: number; // Days since the card was last reviewed
  scheduled_days: number; // The interval of time in days between this review and the next one
  learning_steps: number; // Keeps track of the current step during the (re)learning stages
  reps: number; // Total number of times the card has been reviewed
  lapses: number; // Times the card was forgotten or remembered incorrectly
  state: number; // FSRS card state: 0=New, 1=Learning, 2=Review, 3=Relearning
  last_review?: Date; // The most recent review date, if applicable
}

export enum ExerciseType {
  TRANSLATE_MC = "TRANSLATE_MC",
  FILL_BLANK_MC = "FILL_BLANK_MC",
  FILL_BLANK_TYPE = "FILL_BLANK_TYPE",
  PRONOUNCE_WORD = "PRONOUNCE_WORD",
  PRONOUNCE_SENTENCE = "PRONOUNCE_SENTENCE",
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
}

export type AddWordResult = {
  status: "added" | "duplicate";
  wordId: string;
  learningWord: string;
};
