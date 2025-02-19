const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(bodyParser.json());

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { secure: false }, // Set to true for HTTPS
  })
);

app.use(passport.initialize());
app.use(passport.session());

connectDB();

const User = require("./models/user");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let existingUser = await User.findOne({ googleId: profile.id });
        if (existingUser) {
          return done(null, existingUser);
        }

        const newUser = await User.create({
          googleId: profile.id,
          username: profile.displayName,
          email: profile.emails[0].value,
        });

        return done(null, newUser);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.send("Backend server is running!");
});

app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
  "/api/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    const user = {
      username: req.user.username,
      email: req.user.email,
    };

    // Correct redirection to profile page with user details
    res.redirect(`http://localhost:5173/profile?username=${user.username}&email=${user.email}`);
  }
);



app.get("/api/auth/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.send("Logged out successfully");
    });
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
