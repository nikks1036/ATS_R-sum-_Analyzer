import { allAsync, getAsync, runAsync } from "../db/sqlite.js";

const mapRowToResume = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    userId: row.user_id,
    text: row.text,
    atsScore: row.ats_score,
    suggestions: row.suggestions ? JSON.parse(row.suggestions) : []
  };
};

const Resume = {
  async create({ userId, text, atsScore, suggestions = [] }) {
    const serializedSuggestions = JSON.stringify(suggestions);
    const result = await runAsync(
      "INSERT INTO resumes (user_id, text, ats_score, suggestions) VALUES (?, ?, ?, ?)",
      [userId, text, atsScore, serializedSuggestions]
    );

    return {
      _id: result.lastID,
      id: result.lastID,
      userId,
      text,
      atsScore,
      suggestions
    };
  },

  async find(query = {}) {
    if (query.userId) {
      const rows = await allAsync(
        "SELECT id, user_id, text, ats_score, suggestions FROM resumes WHERE user_id = ? ORDER BY id DESC",
        [query.userId]
      );
      return rows.map(mapRowToResume);
    }

    const rows = await allAsync(
      "SELECT id, user_id, text, ats_score, suggestions FROM resumes ORDER BY id DESC"
    );
    return rows.map(mapRowToResume);
  },

  async findById(id) {
    const row = await getAsync(
      "SELECT id, user_id, text, ats_score, suggestions FROM resumes WHERE id = ?",
      [id]
    );
    return mapRowToResume(row);
  }
};

export default Resume;
