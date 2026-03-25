import express from "express";
import { signup, login, me } from "../controllers/authController.js";
import auth from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

router.get("/test", (req, res) => {
  res.send("Auth route working!");
});

// Logged-in user
router.get("/me", auth, async (req, res) => {
  try {
    const user = req.user; 

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin === true,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
