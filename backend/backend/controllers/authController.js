import User from "../models/User.js";
import jwt from "jsonwebtoken";

const toSafeUser = (user) => ({
  id: user?._id ?? user?.id,
  name: user?.name || "",
  email: user?.email || ""
});

export const register = async (req, res) => {
  try {
    const user = await User.create(req.body);
    // don't return password or sensitive fields
    const safeUser = toSafeUser(user);
    res.status(201).json({ message: "User registered", user: safeUser });
  } catch (err) {
    const isDuplicateEmail =
      err.code === 11000 ||
      err.code === "SQLITE_CONSTRAINT" ||
      err.code === "SQLITE_CONSTRAINT_UNIQUE" ||
      (err.message && err.message.includes("UNIQUE constraint failed: users.email"));

    if (isDuplicateEmail) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    res.status(400).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user || user.password !== req.body.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET
    );

    res.json({ token, user: toSafeUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message || "Login failed" });
  }
};

export const me = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user?.id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: toSafeUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch user profile" });
  }
};
