import "dotenv/config";
import express from "express";
import cors from "cors";
import { Low } from "lowdb";
import { JSONFileSync } from "lowdb/node";
import nodemailer from "nodemailer";
import { GoogleGenAI, Type } from "@google/genai";
import { speak } from "google-translate-api-x";
import { Course, ExerciseType, Session } from "../types.js";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        email: string;
        sessionId: string;
      };
    }
  }
}

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = process.env.DB_PATH || "../db.json";

console.log("DB_PATH", DB_PATH);

app.use(cors());
app.use(express.json());

interface DbData {
  courses: Record<string, Course>;
  otps: Record<string, { otp: string; email: string; expires: number }>;
  sessions: Record<string, Session>;
}

const adapter = new JSONFileSync<DbData>(DB_PATH);
const db = new Low(adapter as any, { courses: {}, otps: {}, sessions: {} });

await db.read();

// Ensure all required properties exist
if (!db.data) {
  db.data = { courses: {}, otps: {}, sessions: {} };
}
if (!db.data.courses) {
  db.data.courses = {};
}
if (!db.data.otps) {
  db.data.otps = {};
}
if (!db.data.sessions) {
  db.data.sessions = {};
}
await db.write();

const transporter = process.env.SMTP_USER
  ? nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// Session utilities
const generateSessionId = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

const createSession = (email: string): Session => {
  const sessionId = generateSessionId();
  const now = Date.now();
  const session: Session = {
    id: sessionId,
    email,
    expires: now + 60 * 24 * 60 * 60 * 1000, // 60 days
    createdAt: now,
  };
  return session;
};

const isValidSession = (session: Session): boolean => {
  return session.expires > Date.now();
};

const cleanExpiredSessions = async () => {
  const now = Date.now();

  // Ensure sessions object exists
  if (!db.data.sessions) {
    db.data.sessions = {};
    await db.write();
    return;
  }

  const sessions = db.data.sessions;
  let hasExpired = false;

  for (const [sessionId, session] of Object.entries(sessions)) {
    if ((session as Session).expires <= now) {
      delete sessions[sessionId];
      hasExpired = true;
    }
  }

  if (hasExpired) {
    await db.write();
  }
};

// Authentication middleware
const authenticateSession = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No session token provided" });
    }

    const sessionId = authHeader.substring(7);

    // Ensure sessions object exists
    if (!db.data.sessions) {
      db.data.sessions = {};
      await db.write();
    }

    const session = db.data.sessions[sessionId];

    if (!session || !isValidSession(session)) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    req.user = { email: session.email, sessionId };
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Authentication error" });
  }
};

const generateContentWithRetry = async (params: any, maxRetries = 3) => {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      return await ai.models.generateContent(params);
    } catch (error: any) {
      retries++;
      const isRateLimitError =
        error.toString().includes("429") ||
        error.toString().includes("RESOURCE_EXHAUSTED");

      if (isRateLimitError && retries < maxRetries) {
        const delay = 1000 * Math.pow(2, retries - 1) + Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error("Failed to get response after retries");
};

app.post("/api/auth/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    db.data.otps[email] = { otp, email, expires };
    await db.write();

    if (transporter) {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: "VocabBoost AI - Verification Code",
        text: `Your verification code is: ${otp}`,
      });
    } else {
      console.log(`OTP for ${email}: ${otp}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const stored = db.data.otps[email];

    if (!stored || stored.otp !== otp || stored.expires < Date.now()) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Clean expired sessions periodically
    await cleanExpiredSessions();

    // Ensure sessions object exists
    if (!db.data.sessions) {
      db.data.sessions = {};
    }

    // Create new session
    const session = createSession(email);
    db.data.sessions[session.id] = session;

    delete db.data.otps[email];
    await db.write();

    res.json({
      success: true,
      session: {
        id: session.id,
        email: session.email,
        expires: session.expires,
      },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
});

// Session management endpoints
app.post("/api/auth/logout", authenticateSession, async (req, res) => {
  try {
    const { sessionId } = req.user;

    // Ensure sessions object exists
    if (!db.data.sessions) {
      db.data.sessions = {};
    } else {
      delete db.data.sessions[sessionId];
    }

    await db.write();
    res.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Failed to logout" });
  }
});

app.get("/api/auth/validate", authenticateSession, async (req, res) => {
  try {
    const { email } = req.user;
    res.json({ success: true, email });
  } catch (error) {
    console.error("Validate session error:", error);
    res.status(500).json({ error: "Failed to validate session" });
  }
});

app.get("/api/course", authenticateSession, async (req, res) => {
  try {
    const { email } = req.user;
    const course = db.data.courses[email] || null;
    res.json(course);
  } catch (error) {
    console.error("Get course error:", error);
    res.status(500).json({ error: "Failed to get course" });
  }
});

app.post("/api/course", authenticateSession, async (req, res) => {
  try {
    const { email } = req.user;
    const course = req.body;

    db.data.courses[email] = course;
    await db.write();

    res.json({ success: true });
  } catch (error) {
    console.error("Save course error:", error);
    res.status(500).json({ error: "Failed to save course" });
  }
});

app.post("/api/process-word", authenticateSession, async (req, res) => {
  try {
    const { word, learningLanguage, nativeLanguage } = req.body;

    const schema = {
      type: Type.OBJECT,
      properties: {
        learningWord: { type: Type.STRING },
        nativeWord: { type: Type.STRING },
        examples: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sentence: { type: Type.STRING },
              translation: { type: Type.STRING },
            },
          },
        },
      },
      required: ["learningWord", "nativeWord", "examples"],
    };

    const prompt = `You are a language learning assistant. The user is learning ${learningLanguage.name} and their native language is ${nativeLanguage.name}. They have submitted the word: "${word}". Process this word and return a JSON object.
1. First, identify the base/dictionary form (lemma) of the word. For verbs, this is the infinitive (e.g., 'went' -> 'go'). For nouns, this is the singular form (e.g., 'cats' -> 'cat').
2. Use this base form for all subsequent steps.
3. Ensure the 'learningWord' field in the JSON is this base word in ${learningLanguage.name} and 'nativeWord' is its translation in ${nativeLanguage.name}.
4. Generate three distinct, simple example sentences using the ${learningLanguage.name} base word.
5. Provide a translation for each example sentence into ${nativeLanguage.name}.
Your final output MUST be a single JSON object matching the provided schema.`;

    const response = await generateContentWithRetry({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const result = JSON.parse(response.text.trim());
    res.json(result);
  } catch (error) {
    console.error("Process word error:", error);
    res.status(500).json({ error: "Failed to process word" });
  }
});

app.post("/api/generate-exercises", authenticateSession, async (req, res) => {
  try {
    const { learningWord, nativeWord, learningLanguage, nativeLanguage } =
      req.body;

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
            },
          },
        },
      },
    };

    const prompt = `Generate 5 distinct exercises for learning the word "${learningWord}" (${learningLanguage.name}) which means "${nativeWord}" (${nativeLanguage.name}).
Create one of each of the following types:
1. 'TRANSLATE_MC': A multiple-choice translation question. The question should be the word in ${learningLanguage.name}. Provide 3 plausible but incorrect options in ${nativeLanguage.name}.
2. 'FILL_BLANK_MC': A multiple-choice fill-in-the-blank question. Create a sentence in ${learningLanguage.name} with the word "${learningWord}" missing. The 'question' should be this sentence with a blank (e.g., '___'). The 'sentenceContext' field MUST contain the full, correct sentence. Provide 3 plausible but incorrect word choices in ${learningLanguage.name}. The 'translationContext' field MUST contain the translation of the full sentence into ${nativeLanguage.name}.
3. 'FILL_BLANK_TYPE': A typing fill-in-the-blank question. Create a sentence in ${learningLanguage.name} with "${learningWord}" missing. The 'question' should be this sentence with a blank. The 'sentenceContext' field MUST contain the full, correct sentence. The 'translationContext' field MUST contain the translation of the full sentence into ${nativeLanguage.name}. The user has to type the correct answer.
4. 'PRONOUNCE_WORD': An exercise to pronounce the word. The 'question' field should be just the word "${learningWord}".
5. 'PRONOUNCE_SENTENCE': An exercise to pronounce a full sentence. The 'question' field should be a simple sentence in ${learningLanguage.name} that contains the word "${learningWord}".

Return a single JSON object matching the provided schema. Ensure 'options' are only provided for MC types. For 'FILL_BLANK_TYPE' and 'FILL_BLANK_MC', 'correctAnswer' must always be the single correct word. For pronunciation exercises, 'correctAnswer' should be the same as the 'question'. The 'sentenceContext' and 'translationContext' fields MUST be provided for 'FILL_BLANK_MC' and 'FILL_BLANK_TYPE' exercises.`;

    const response = await generateContentWithRetry({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const parsed = JSON.parse(response.text.trim());
    const exercises = parsed.exercises.map((ex: any) => ({
      ...ex,
      id: Math.random().toString(36).substring(2, 9),
    }));

    res.json(exercises);
  } catch (error) {
    console.error("Generate exercises error:", error);
    res.status(500).json({ error: "Failed to generate exercises" });
  }
});

app.post("/api/text-to-speech", authenticateSession, async (req, res) => {
  try {
    const { text, langCode } = req.body;

    if (!text || !langCode) {
      return res
        .status(400)
        .json({ error: "Text and language code are required" });
    }

    // Use Google Translate API for text-to-speech
    const audioBase64 = await speak(text, { to: langCode });

    res.json({
      success: true,
      audio: audioBase64,
      text,
      langCode,
    });
  } catch (error) {
    console.error("Text-to-speech error:", error);
    res.status(500).json({ error: "Failed to generate speech" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
