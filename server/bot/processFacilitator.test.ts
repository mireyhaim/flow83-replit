/**
 * Unit tests for ProcessFacilitator intent classifier
 * Tests the detectUserIntent function for CORE_QUESTION state
 */

import { describe, it, expect } from 'vitest';
import { detectUserIntent } from './processFacilitator';

describe("CORE_QUESTION Intent Classification", () => {
  
  describe("Pure Confusion Expressions → confused", () => {
    const pureConfusionCases = [
      "not sure",
      "I'm not sure",
      "don't know",
      "I don't know",
      "not clear",
      "still unclear",
      "confused",
      "I'm confused",
      "uncertain",
      "no idea",
      "can't tell",
      "not sure yet",
      "not sure still",
      "I'm not sure about this",
      "don't know really",
      "still confused about this",
      "no idea at all",
      "unsure",
      "still unsure",
      "unsure about this",
      "still not sure",
      "still unsure about what to do",
      "לא בטוח",
      "לא בטוחה",
      "אני לא בטוח",
      "אני לא בטוחה",
      "לא ברור",
      "לא מובן",
      "לא מבינה",
      "לא מבין",
      "לא יודע",
      "לא יודעת",
      "מבולבל",
      "מבולבלת",
      "לא בטוח עדיין",
      "לא בטוחה עדיין",
      "לא ברור בכלל",
      "לא מבינה ממש",
      "אני לא יודעת עכשיו",
      "עדיין לא בטוח",
      "עדיין לא מבינה",
    ];
    
    pureConfusionCases.forEach(testCase => {
      it(`"${testCase}" → confused`, () => {
        const result = detectUserIntent(testCase, "CORE_QUESTION");
        expect(result).toBe("confused");
      });
    });
  });
  
  describe("Questions → confused", () => {
    const questionCases = [
      "What do you mean?",
      "How does this work?",
      "Can you explain?",
      "?",
      "מה הכוונה?",
      "איך זה עובד?",
      "אפשר להסביר?",
    ];
    
    questionCases.forEach(testCase => {
      it(`"${testCase}" → confused`, () => {
        const result = detectUserIntent(testCase, "CORE_QUESTION");
        expect(result).toBe("confused");
      });
    });
  });
  
  describe("Clarification Requests → confused", () => {
    const clarificationCases = [
      "Can you explain that again?",
      "Please repeat",
      "Could you clarify?",
      "Rephrase please",
      "תסביר שוב",
      "אפשר שוב?",
      "עוד פעם בבקשה",
    ];
    
    clarificationCases.forEach(testCase => {
      it(`"${testCase}" → confused`, () => {
        const result = detectUserIntent(testCase, "CORE_QUESTION");
        expect(result).toBe("confused");
      });
    });
  });
  
  describe("Negated Clarity + Interrogative → confused", () => {
    const negatedClarityWithInterrogative = [
      "not clear what to do",
      "not clear to me what the task is",
      "I don't understand what you mean",
      "can't figure out what to do",
      "I'm not sure what you're asking",
      "no idea how to proceed",
      "confused about what I should do",
      "unclear to me how this works",
      "לא ברור מה לעשות",
      "לא ברור לי מה המשימה",
      "לא מבינה מה לעשות",
      "לא יודעת איך להתקדם",
      "אין לי מושג",
      "אין לי מושג מה לעשות",
      "לא ברור לי עדיין מה לעשות",
    ];
    
    negatedClarityWithInterrogative.forEach(testCase => {
      it(`"${testCase}" → confused`, () => {
        const result = detectUserIntent(testCase, "CORE_QUESTION");
        expect(result).toBe("confused");
      });
    });
  });
  
  describe("Hedged Answers with Substantive Content → answer_core", () => {
    const hedgedAnswerCases = [
      "I don't know, pressure from work",
      "I'm not sure, maybe stress",
      "I don't know, it's the relationship",
      "Maybe... pressure at the office",
      "אני לא יודעת, לחץ בעבודה",
      "לא בטוחה, אולי זה הלחץ",
      "אני לא יודע, זה הקשר עם הילדים",
      "לא יודעת... לחץ ועייפות",
    ];
    
    hedgedAnswerCases.forEach(testCase => {
      it(`"${testCase}" → answer_core`, () => {
        const result = detectUserIntent(testCase, "CORE_QUESTION");
        expect(result).toBe("answer_core");
      });
    });
  });
  
  describe("Clear Answers → answer_core", () => {
    const clearAnswerCases = [
      "It's the pressure from work",
      "Because of my relationship with my parents",
      "Due to stress at the office",
      "I think it's my fear of failure",
      "זה הלחץ בעבודה",
      "בגלל הקשר עם ההורים שלי",
      "עקב הלחץ במשרד",
      "אני חושבת שזה הפחד מכישלון",
    ];
    
    clearAnswerCases.forEach(testCase => {
      it(`"${testCase}" → answer_core`, () => {
        const result = detectUserIntent(testCase, "CORE_QUESTION");
        expect(result).toBe("answer_core");
      });
    });
  });
  
  describe("Short Substantive Answers → answer_core", () => {
    const shortAnswerCases = [
      "Pressure",
      "Work stress",
      "לחץ",
      "לחץ בעבודה",
      "Fear",
      "פחד",
      "Relationships",
      "יחסים",
      "לא לחץ",
    ];
    
    shortAnswerCases.forEach(testCase => {
      it(`"${testCase}" → answer_core`, () => {
        const result = detectUserIntent(testCase, "CORE_QUESTION");
        expect(result).toBe("answer_core");
      });
    });
  });
  
  describe("Regression: Skip triggers should not catch normal phrases", () => {
    const skipRegressionCases = [
      { input: "still unsure about next steps", expected: "confused" },
      { input: "the next issue is stress", expected: "answer_core" },
      { input: "next week I have a deadline", expected: "answer_core" },
      { input: "my next trigger is burnout", expected: "answer_core" },
      { input: "I need to move on from this job", expected: "answer_core" },
      { input: "maybe I should move on to something gentler", expected: "answer_core" },
      { input: "I want to move on from the stress", expected: "answer_core" },
    ];
    
    skipRegressionCases.forEach(({ input, expected }) => {
      it(`"${input}" → ${expected} (not skip)`, () => {
        const result = detectUserIntent(input, "CORE_QUESTION");
        expect(result).toBe(expected);
      });
    });
  });
  
  describe("Valid skip commands should trigger skip", () => {
    const validSkipCases = [
      "skip",
      "skip this",
      "skip it",
      "can we skip",
      "let's skip",
      "next please",
      "move on please",
      "let's move on",
    ];
    
    validSkipCases.forEach(testCase => {
      it(`"${testCase}" → skip`, () => {
        const result = detectUserIntent(testCase, "CORE_QUESTION");
        expect(result).toBe("skip");
      });
    });
  });
});
