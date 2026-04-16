const SKILL_ALIASES = {
  "machine learning": ["machine learning", "ml"],
  "deep learning": ["deep learning"],
  "natural language processing": ["natural language processing", "nlp"],
  "computer vision": ["computer vision"],
  "data science": ["data science"],
  "data analysis": ["data analysis", "data analytics"],
  "statistics": ["statistics", "statistical analysis"],
  "python": ["python"],
  "java": ["java"],
  "c++": ["c++", "cpp"],
  "javascript": ["javascript", "js"],
  "sql": ["sql", "mysql", "postgresql", "postgres", "sqlite"],
  "nosql": ["nosql", "mongodb", "cassandra", "redis"],
  "pandas": ["pandas"],
  "numpy": ["numpy"],
  "scikit-learn": ["scikit-learn", "sklearn"],
  "tensorflow": ["tensorflow"],
  "pytorch": ["pytorch"],
  "keras": ["keras"],
  "xgboost": ["xgboost"],
  "llms": ["llm", "llms", "large language model", "large language models", "gpt", "transformer"],
  "prompt engineering": ["prompt engineering", "prompt design"],
  "feature engineering": ["feature engineering"],
  "model deployment": ["model deployment", "deployment", "model serving"],
  "mlops": ["mlops"],
  "docker": ["docker"],
  "kubernetes": ["kubernetes", "k8s"],
  "aws": ["aws", "amazon web services"],
  "azure": ["azure"],
  "gcp": ["gcp", "google cloud", "google cloud platform"],
  "git": ["git", "github", "gitlab"],
  "rest api": ["rest api", "restful api", "api development", "apis"],
  "microservices": ["microservices"],
  "spark": ["spark", "pyspark"],
  "hadoop": ["hadoop"],
  "data visualization": ["data visualization", "tableau", "power bi", "matplotlib", "seaborn"],
  "communication": ["communication", "stakeholder management"],
  "problem solving": ["problem solving", "analytical thinking"]
};

const STOP_WORDS = new Set([
  "with", "from", "that", "this", "have", "will", "your", "about", "into", "their", "they", "them",
  "role", "work", "team", "using", "used", "must", "should", "need", "nice", "good", "strong",
  "experience", "years", "year", "plus", "preferred", "required", "responsible", "ability", "knowledge"
]);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const extractKeywords = (text) => {
  if (!text || typeof text !== "string") return [];

  const lower = text.toLowerCase();
  const detectedSkills = [];

  for (const [skill, aliases] of Object.entries(SKILL_ALIASES)) {
    const matched = aliases.some((alias) => {
      if (!alias) return false;
      const pattern = `\\b${escapeRegex(alias).replace(/\\ /g, "\\s+")}\\b`;
      return new RegExp(pattern, "i").test(lower);
    });
    if (matched) detectedSkills.push(skill);
  }

  // Fallback tokens (kept small) so we still work for niche domains outside the preset skills.
  const tokenFreq = {};
  const tokens = lower.match(/\b[a-z][a-z0-9+\-]{2,}\b/g) || [];
  for (const token of tokens) {
    if (STOP_WORDS.has(token)) continue;
    if (token.length > 24) continue;
    tokenFreq[token] = (tokenFreq[token] || 0) + 1;
  }

  const topTokens = Object.entries(tokenFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([token]) => token);

  const unique = [];
  const seen = new Set();
  for (const keyword of [...detectedSkills, ...topTokens]) {
    if (!keyword || seen.has(keyword)) continue;
    seen.add(keyword);
    unique.push(keyword);
  }

  return unique;
};
