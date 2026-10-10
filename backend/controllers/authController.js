// backend/controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Generate a JSON Web Token signed with the user's ID.
 * Uses the JWT_SECRET from .env and sets token expiration to 30 days.
 * @param {string} id - The MongoDB User Object ID.
 * @returns {string} Signed JWT.
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};
const Score = require('../models/Score');

/**
 * Dynamically aggregate user XP, quizzes passed/taken, and difficulty completion states from the Score database.
 * @param {string} userId - User Object ID.
 * @returns {object} Progress stats tree.
 */
const getUserProgress = async (userId) => {
  const scores = await Score.find({ userId });
  
  let quizzesTaken = scores.length;
  let quizzesPassed = 0;
  let xp = 0;
  
  const courses = {
    html: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 },
    css: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 },
    javascript: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 },
    python: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 }
  };
  
  const categories = {
    c: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 },
    cpp: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 },
    java: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 },
    sql: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 },
    dbms: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 },
    json: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 },
    reactjs: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 },
    nodejs: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 },
    expressjs: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 },
    mongodb: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 },
    datastructures: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 },
    algorithms: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 },
    os: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 },
    networks: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 },
    git: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 }
  };

  scores.forEach(s => {
    const isPassed = s.percentage >= 60;
    if (isPassed) {
      quizzesPassed++;
      let xpGained = 100;
      if (s.difficulty === 'medium') xpGained = 150;
      if (s.difficulty === 'hard') xpGained = 200;
      xp += xpGained;
      
      const courseKey = s.course.toLowerCase().trim();
      const diff = s.difficulty.toLowerCase().trim();
      
      if (courses[courseKey]) {
        courses[courseKey][diff] = 'passed';
        if (diff === 'easy') {
          if (courses[courseKey].medium === 'locked') courses[courseKey].medium = 'unlocked';
        } else if (diff === 'medium') {
          if (courses[courseKey].hard === 'locked') courses[courseKey].hard = 'unlocked';
        }
      } else if (categories[courseKey]) {
        categories[courseKey][diff] = 'passed';
        if (diff === 'easy') {
          if (categories[courseKey].medium === 'locked') categories[courseKey].medium = 'unlocked';
        } else if (diff === 'medium') {
          if (categories[courseKey].hard === 'locked') categories[courseKey].hard = 'unlocked';
        }
      }
    }
  });

  return {
    courses,
    categories,
    stats: {
      xp,
      quizzesTaken,
      quizzesPassed
    }
  };
};

/**
 * @desc    Register a new user profile
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  try {
    const { username, email, password, profileImage } = req.body;

    // 1. Basic inputs presence validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a username, email, and password'
      });
    }

    // 2. Check password length requirement
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // 3. Search database to identify duplicate email registrations
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // 3.5 Search database to identify duplicate username registrations (case-insensitive)
    const usernameExists = await User.findOne({
      username: username.trim()
    }).collation({ locale: 'en', strength: 2 });
    if (usernameExists) {
      return res.status(400).json({
        success: false,
        message: 'Username is already taken'
      });
    }

    // 4. Create and save new user (hashing is executed by Mongoose UserSchema pre-save hook)
    const user = await User.create({
      username,
      email,
      password,
      profileImage: profileImage || ''
    });

    // 5. Generate secure session token
    const token = generateToken(user._id);

    // 6. Return response containing token and non-sensitive user details
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage
      }
    });

  } catch (error) {
    console.error(`Registration error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration. Please try again later.'
    });
  }
};

/**
 * @desc    Authenticate user credentials and issue token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Input presence validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    // 2. Query database for user profile matching email or username
    const trimmedIdentity = email.trim();
    const user = await User.findOne({
      $or: [
        { email: trimmedIdentity },
        { username: trimmedIdentity }
      ]
    }).collation({ locale: 'en', strength: 2 });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password'
      });
    }

    // 3. Compare passwords using the matchPassword schema helper
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // 4. Generate login session token
    const token = generateToken(user._id);

    // 5. Return authentication payload
    const progress = await getUserProgress(user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage
      },
      progress
    });

  } catch (error) {
    console.error(`Login error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again later.'
    });
  }
};

/**
 * @desc    Retrieve logged-in user profile details
 * @route   GET /api/auth/profile
 * @access  Private (Protected by authMiddleware protect filter)
 */
const getProfile = async (req, res) => {
  try {
    // req.user has already been set by the protect middleware, omitting the password field
    if (!req.user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    const progress = await getUserProgress(req.user._id);

    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        profileImage: req.user.profileImage,
        createdAt: req.user.createdAt
      },
      progress
    });

  } catch (error) {
    console.error(`Fetch profile error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving profile information.'
    });
  }
};

/**
 * @desc    Update user profile details
 * @route   PUT /api/auth/profile
 * @access  Private (Requires JWT token authentication)
 */
const updateProfile = async (req, res) => {
  try {
    const { username, email, password, profileImage } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    // 1. Username uniqueness check
    if (username && username.trim() !== user.username) {
      const trimmedUsername = username.trim();
      if (trimmedUsername.length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Username must be at least 3 characters long'
        });
      }

      const usernameExists = await User.findOne({
        username: trimmedUsername
      }).collation({ locale: 'en', strength: 2 });
      if (usernameExists) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken'
        });
      }
      user.username = trimmedUsername;
    }

    // 2. Email validation and uniqueness check
    if (email && email.trim().toLowerCase() !== user.email) {
      const trimmedEmail = email.trim().toLowerCase();
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address'
        });
      }

      const emailExists = await User.findOne({ email: trimmedEmail });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email address is already in use'
        });
      }
      user.email = trimmedEmail;
    }

    // 3. Password validation
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }
      user.password = password;
    }

    // 4. Update profile image if supplied
    if (profileImage !== undefined) {
      user.profileImage = profileImage;
    }

    // 5. Commit changes to database (hashes password via pre-save hook)
    await user.save();

    const progress = await getUserProgress(user._id);

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage
      },
      progress
    });

  } catch (error) {
    console.error(`Profile update error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error updating user profile. Please try again later.'
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updateProfile
};
