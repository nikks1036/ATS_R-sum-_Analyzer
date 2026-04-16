import { getAsync, runAsync } from "../db/sqlite.js";

const mapRowToUser = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password
  };
};

const User = {
  async create({ name, email, password }) {
    const result = await runAsync(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, password]
    );
    return {
      _id: result.lastID,
      id: result.lastID,
      name,
      email,
      password
    };
  },

  async findOne(query = {}) {
    if (query.email) {
      const row = await getAsync("SELECT id, name, email, password FROM users WHERE email = ?", [query.email]);
      return mapRowToUser(row);
    }

    if (query.id || query._id) {
      const id = query.id || query._id;
      const row = await getAsync("SELECT id, name, email, password FROM users WHERE id = ?", [id]);
      return mapRowToUser(row);
    }

    return null;
  }
};

export default User;
