import Resume from "../models/Resume.js";
import { parseResume } from "../utils/resumeParser.js";
import { extractKeywords } from "../utils/keywordExtractor.js";
import { calculateATSScore } from "../utils/atsScore.js";
import { analyzeWithGemini } from "../utils/aiAnalyzer.js";

const SKILL_CONTEXT = {
  "machine learning": {
    why: "Core for building predictive systems and solving data-driven business problems.",
    impact: "Without ML, you may struggle to build or tune models expected for intelligent product features."
  },
  "deep learning": {
    why: "Required for advanced tasks in vision, NLP, and complex pattern recognition.",
    impact: "Lack of deep learning limits performance on high-complexity tasks like image and language modeling."
  },
  "natural language processing": {
    why: "Important for text understanding, chatbots, summarization, and search relevance.",
    impact: "Missing NLP can weaken your ability to deliver text-focused features in ML roles."
  },
  "python": {
    why: "Most common language for ML pipelines, experimentation, and production scripts.",
    impact: "Limited Python skills reduce development speed and compatibility with standard ML tooling."
  },
  "sql": {
    why: "Needed to query, clean, and validate data before model training and reporting.",
    impact: "Weak SQL leads to slower analysis and can block end-to-end model delivery."
  },
  "pytorch": {
    why: "Widely used framework for deep learning research and production prototyping.",
    impact: "Missing PyTorch can limit your ability to implement modern neural architectures."
  },
  "tensorflow": {
    why: "Common framework for model training and scalable ML deployment.",
    impact: "Without TensorFlow, you may miss opportunities requiring enterprise ML workflows."
  },
  "scikit-learn": {
    why: "Key library for baseline ML models, validation, and classical algorithms.",
    impact: "Missing scikit-learn weakens your ability to build strong baseline models quickly."
  },
  "docker": {
    why: "Used to containerize ML services for reproducibility and deployment consistency.",
    impact: "Without Docker, deployment reliability and environment portability can suffer."
  },
  "aws": {
    why: "Cloud platforms are commonly used for data pipelines, model hosting, and scaling.",
    impact: "Missing cloud exposure can limit your ability to deploy and monitor production models."
  },
  "communication": {
    why: "ML candidates must explain trade-offs and model outcomes to non-technical stakeholders.",
    impact: "Weak communication can reduce interview performance even with strong technical skills."
  }
};

const GENERIC_SKILL_CONTEXT = {
  why: "This appears repeatedly in job requirements and is likely important for success in the role.",
  impact: "If this skill is missing from your resume, ATS and recruiters may rate your profile as less relevant."
};

const toUniqueTopList = (items = [], limit = 20) => {
  const unique = [];
  const seen = new Set();
  for (const item of items) {
    const clean = String(item || "").trim().toLowerCase();
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    unique.push(clean);
    if (unique.length >= limit) break;
  }
  return unique;
};

const buildFallbackActualChanges = (missingSkills, bulletImprovements, tips) => {
  const changes = [];

  for (const skill of missingSkills.slice(0, 8)) {
    changes.push(`Add "${skill}" naturally in your Professional Summary and one Experience bullet.`);
  }

  for (const item of (bulletImprovements || []).slice(0, 3)) {
    if (item?.suggested_bullets?.length) {
      changes.push(`Replace a weak bullet with: "${item.suggested_bullets[0]}"`);
    }
  }

  for (const tip of (tips || []).slice(0, 4)) {
    if (typeof tip === "string" && tip.trim()) {
      changes.push(tip.replace(/\*\*/g, "").trim());
    }
  }

  if (!changes.length) {
    changes.push("Add measurable impact in experience bullets (numbers, %, time saved, revenue, users).");
    changes.push("Mirror important keywords from the job description in relevant sections.");
    changes.push("Use action verbs and clear ATS-friendly section headings.");
  }

  return toUniqueTopList(changes, 12);
};

const getWordCount = (text = "") =>
  String(text)
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

const findJDReference = (jobDescription = "", skill = "") => {
  if (!jobDescription || !skill) return "";
  const snippets = jobDescription
    .split(/[\n.!?]+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const lowerSkill = skill.toLowerCase();
  const match = snippets.find((line) => line.toLowerCase().includes(lowerSkill));
  return match || "";
};

const buildMissingSkillInsights = (missingSkills = [], jobDescription = "") => {
  return missingSkills.slice(0, 12).map((skill) => {
    const context = SKILL_CONTEXT[skill] || GENERIC_SKILL_CONTEXT;
    const jdReference = findJDReference(jobDescription, skill);
    return {
      skill,
      why_important: context.why,
      job_impact: context.impact,
      jd_reference: jdReference || `The job description expects this capability for day-to-day responsibilities.`,
      how_to_add_in_resume: `Add "${skill}" in your Skills section and one project/experience bullet with measurable outcome.`
    };
  });
};

const buildInterviewPrepTips = (missingSkillInsights = []) => {
  const tips = [];

  for (const item of missingSkillInsights.slice(0, 8)) {
    tips.push(`Prepare one STAR story showing how you used ${item.skill} to solve a real problem.`);
    tips.push(`Be ready to explain trade-offs, metrics, and impact for ${item.skill}-related work.`);
  }

  return toUniqueTopList(tips, 10);
};

const normalizeSuggestions = ({
  rawSuggestions,
  score,
  jdKeywords,
  resumeKeywords,
  jobDescription
}) => {
  const rawAnalysis = rawSuggestions?.analysis ?? rawSuggestions ?? {};
  const missingFromResume = toUniqueTopList(
    jdKeywords.filter((k) => !resumeKeywords.includes(k)),
    25
  );
  const extraInResume = toUniqueTopList(
    resumeKeywords.filter((k) => !jdKeywords.includes(k)),
    25
  );

  const resumeSkills = toUniqueTopList(rawAnalysis?.resume_skills || resumeKeywords, 25);
  const jdSkills = toUniqueTopList(rawAnalysis?.job_description_skills || jdKeywords, 25);
  const bulletImprovements = Array.isArray(rawAnalysis?.ats_optimized_bullet_point_improvements)
    ? rawAnalysis.ats_optimized_bullet_point_improvements
    : [];
  const tips = Array.isArray(rawAnalysis?.ats_optimization_tips)
    ? rawAnalysis.ats_optimization_tips
    : [];
  const aiMissingSkillInsights = Array.isArray(rawAnalysis?.missing_skill_insights)
    ? rawAnalysis.missing_skill_insights
    : [];
  const missingSkillInsights = aiMissingSkillInsights.length
    ? aiMissingSkillInsights
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          skill: String(item.skill || "").trim(),
          why_important: String(item.why_important || "").trim(),
          job_impact: String(item.job_impact || "").trim(),
          jd_reference: String(item.jd_reference || "").trim(),
          how_to_add_in_resume: String(item.how_to_add_in_resume || "").trim()
        }))
        .filter((item) => item.skill)
    : buildMissingSkillInsights(missingFromResume, jobDescription);
  const interviewPrepTips = Array.isArray(rawAnalysis?.interview_prep_tips)
    ? rawAnalysis.interview_prep_tips
    : buildInterviewPrepTips(missingSkillInsights);

  const actualChanges = toUniqueTopList(
    rawAnalysis?.actual_changes?.length
      ? rawAnalysis.actual_changes
      : buildFallbackActualChanges(missingFromResume, bulletImprovements, tips),
    12
  );

  const compatibilityScore = score;

  return {
    success: true,
    analysis: {
      resume_skills: resumeSkills,
      job_description_skills: jdSkills,
      missing_skills: {
        from_resume_for_job_description: missingFromResume,
        from_job_description_for_resume: extraInResume
      },
      missing_skill_insights: missingSkillInsights,
      interview_prep_tips: interviewPrepTips,
      actual_changes: actualChanges,
      ats_optimized_bullet_point_improvements: bulletImprovements,
      ats_optimization_tips: tips,
      compatibility_score: compatibilityScore,
      overall_assessment:
        rawAnalysis?.overall_assessment ||
        `Your resume currently matches about ${compatibilityScore}% of the job-description keywords. Prioritize the missing skills and rewrite weak bullets with measurable outcomes.`
    }
  };
};

/* =========================
   UPLOAD + PARSE RESUME
   ========================= */

export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // ✅ CRITICAL FIX → Convert Buffer → Uint8Array
    const uint8Array = new Uint8Array(req.file.buffer);

    // ✅ Parse PDF
    const text = await parseResume(uint8Array);

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "No text extracted from PDF" });
    }

    console.log("Resume parsed. Length:", text.length);

    res.json({
      success: true,
      preview: text.substring(0, 500),
      text
    });

  } catch (err) {
    console.error("Upload Resume Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* =========================
   ANALYZE RESUME + JD
   ========================= */

export const analyzeResume = async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;

    if (!resumeText || !jobDescription) {
      return res.status(400).json({ error: "Missing resumeText or jobDescription" });
    }

    const jdWordCount = getWordCount(jobDescription);
    if (jdWordCount < 20) {
      return res.status(400).json({
        error: "Job description is too short. Please paste at least 20 words for accurate ATS analysis."
      });
    }

    // ✅ Keyword extraction
    const jdKeywords = extractKeywords(jobDescription);
    const resumeKeywords = extractKeywords(resumeText);

    // ✅ ATS Score
    const score = calculateATSScore(jdKeywords, resumeKeywords);

    console.log("ATS Score:", score);

    // ✅ Gemini AI analysis
    const rawSuggestions = await analyzeWithGemini(resumeText, jobDescription);
    const suggestions = normalizeSuggestions({
      rawSuggestions,
      score,
      jdKeywords,
      resumeKeywords,
      jobDescription
    });

    res.json({
      success: true,
      score,
      matchPercentage: score,
      suggestions
    });

  } catch (err) {
    console.error("Analyze Resume Error:", err);
    res.status(500).json({ error: err.message });
  }
};
