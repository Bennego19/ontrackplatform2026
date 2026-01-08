import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authenticateToken } from "../middleware/auth.js";
import ExpressBrute from "express-brute";
import { tokenManager } from "../../ontrackapp/src/services/authMiddleware.js";
const router = express.Router();
router.use((req,res,next) =>{
    res.setHeader('X-Frame-Options','DENY');
    res.setHeader('Content-Security-Policy',"frame-ancestors 'none'");
    next();
});

var store = new ExpressBrute.MemoryStore();
var bruteforce = new ExpressBrute(store);

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Admin access token required" });
  }

  const JWT_SECRET = process.env.JWT_SECRET || 'ontrack-connect-jwt-secret-key-2024';

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if decoded has admin role
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Verify admin exists in database
    const adminCollection = await db.collection("admins");
    const admin = await adminCollection.findOne({ _id: new ObjectId(decoded.id) });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    req.admin = decoded;
    req.adminUser = admin;
    next();
  } catch (error) {
    console.error("Admin authentication error:", error.message);

    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({ message: "Invalid admin token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(403).json({ message: "Admin token expired" });
    }

    res.status(500).json({
      message: "Admin authentication failed",
      error: error.message
    });
  }
};

const generateToken = (user) => {
  const JWT_SECRET = process.env.JWT_SECRET || 'ontrack-connect-jwt-secret-key-2024';

  return jwt.sign(
    {
      id: user._id.toString(), // Convert ObjectId to string
      username: user.username,
      program: user.program,
      track: user.track
    },
    JWT_SECRET,
    { expiresIn: 86400 } // 24 hours in seconds
  );
};

// Add authentication middleware (add this before your protected routes)

// Add missing validation patterns
const PATTERNS = {
  USERNAME: /^[a-zA-Z0-9_-]{3,20}$/,
  FULL_NAME: /^[a-zA-Z\s'-]{2,50}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  CELL_NUMBER: /^[0-9]{10}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
};

const validateInput = (value, pattern, fieldName) => {
  if (!value || typeof value !== 'string') {
    return `${fieldName} is required and must be a string`;
  }
  return !pattern.test(value.trim());
};

const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;
  return input
    .trim()
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "");
};

const validateSignupInput = (req, res, next) => {
  let { name, surname, email, cellnumber, program, track, username, password } = req.body;

  req.body.username = sanitizeInput(username);
  req.body.name = sanitizeInput(name);
  req.body.surname = sanitizeInput(surname);
  req.body.email = sanitizeInput(email);
  req.body.cellnumber = sanitizeInput(cellnumber);
  req.body.program = sanitizeInput(program);
  req.body.track = sanitizeInput(track);
  req.body.password = sanitizeInput(password);

  if (!req.body.username || !req.body.name || !req.body.surname || !req.body.email || 
      !req.body.cellnumber || !req.body.program || !req.body.track || !req.body.password) {
    return res.status(400).json({
      message: "All fields (username, name, surname, email, cellnumber, program, track, password) are required.",
    });
  }

  const validationErrors = [];

  if (validateInput(req.body.username, PATTERNS.USERNAME, "Username")) {
    validationErrors.push({
      field: "username",
      message: "Must be 3-20 characters, alphanumeric, underscores, and hyphens only"
    });
  }

  if (validateInput(req.body.name, PATTERNS.FULL_NAME, "Name")) {
    validationErrors.push({
      field: "name", 
      message: "Must be 2-50 characters, letters, spaces, hyphens, and apostrophes only"
    });
  }

  if (validateInput(req.body.surname, PATTERNS.FULL_NAME, "Surname")) {
    validationErrors.push({
      field: "surname",
      message: "Must be 2-50 characters, letters, spaces, hyphens, and apostrophes only"
    });
  }

  if (validateInput(req.body.email, PATTERNS.EMAIL, "Email")) {
    validationErrors.push({
      field: "email",
      message: "Must be a valid email address format"
    });
  }

  if (validateInput(req.body.cellnumber, PATTERNS.CELL_NUMBER, "Cell Number")) {
    validationErrors.push({
      field: "cellnumber",
      message: "Must be a valid phone number format"
    });
  }

  if (validateInput(req.body.password, PATTERNS.PASSWORD, "Password")) {
    validationErrors.push({
      field: "password",
      message: "Must be at least 8 characters with uppercase, lowercase, number, and special character"
    });
  }

  if (validationErrors.length > 0) {
    return res.status(400).json({
      message: "Validation failed",
      errors: validationErrors
    });
  }

  next();
};


// GET all students - PUBLIC for mentor assignment page
router.get("/", async (req, res) => {
  res.setHeader('X-Frame-Options', 'DENY');
  try {
    let collection = await db.collection("students");
    let results = await collection.find({}).toArray();
    res.send(results).status(200);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch students"
    });
  }
});



// Create a new student
router.post("/onboardstudent", authenticateAdmin, validateSignupInput, async (req, res) => {
  try {
    const {
      name,
      surname,
      email,
      cellnumber,
      program,
      track,
      username,
      password
    } = req.body;

    const collection = await db.collection("students");

    // Check if user already exists
    const existingUser = await collection.findOne({
      $or: [
        { email: email.trim() },
        { username: username.trim() }
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User with this email or username already exists"
      });
    }

    // ✅ STORE PLAIN TEXT PASSWORD (since login compares plain text)
    const newUser = {
      name: name.trim(),
      surname: surname.trim(),
      email: email.trim(),
      cellnumber: cellnumber.trim(),
      program: program.trim(),
      track: track.trim(),
      username: username.trim(),
      password: password.trim(), // ✅ PLAIN TEXT PASSWORD
      accessAllowed: "granted",
      createdAt: new Date(),
      lastLogin: null,
      loginAttempts: 0,
      lockedUntil: null
    };

    const result = await collection.insertOne(newUser);

    return res.status(201).json({
      success: true,
      message: "Student registered successfully.",
      userId: result.insertedId,
      user: {
        name: newUser.name,
        surname: newUser.surname,
        email: newUser.email,
        cellnumber: newUser.cellnumber,
        program: newUser.program,
        track: newUser.track,
        username: newUser.username,
        createdAt: newUser.createdAt
      }
    });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      message: "Internal server error during registration"
    });
  }
});

// Update student
router.patch("/:id", authenticateAdmin, async (req, res) => {
  try {
    const query = { _id: new ObjectId(req.params.id) };
    const updates = {
      $set: {
        name: req.body.name,
        surname: req.body.surname,
        email: req.body.email,
        cellnumber: req.body.cellnumber,
        program: req.body.program,
        track: req.body.track,
        accessAllowed: req.body.accessAllowed
      },
    };

    let collection = await db.collection("students");
    let result = await collection.updateOne(query, updates);
    res.send(result).status(200);
  } catch (error) {
    res.status(500).json({ error: "Failed to update student" });
  }
});

// Delete student
router.delete("/:id", authenticateAdmin, async (req, res) => {
  try {
    const query = { _id: new ObjectId(req.params.id) };
    const collection = await db.collection("students");
    let result = await collection.deleteOne(query);
    res.send(result).status(200);
  } catch (error) {
    res.status(500).json({ error: "Failed to delete student" });
  }
});

router.post("/login",bruteforce.prevent, async (req, res) => {
  console.log("Login attempt received:", {
    body: req.body,
    timestamp: new Date().toISOString()
  });
  
  try {
    const { username, password } = req.body; // Only username, not email

    console.log("Parsed credentials:", { username, password });

    if (!username || !password) {
      console.log("Missing credentials");
      return res.status(400).json({
        message: "Username and password are required"
      });
    }

    const collection = await db.collection("students");

    // Find user by username ONLY (no email)
    const user = await collection.findOne({
      username: username?.trim()
    });

    console.log("User found:", user ? "Yes" : "No");

    if (!user) {
      console.log("No user found with this username");
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    // 🔐 PLAIN TEXT PASSWORD CHECK (since stored passwords are not hashed)
    if (password !== user.password) {
      console.log("Invalid password");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.accessAllowed !== "granted") {
      console.log("Access not granted for user");
      return res.status(403).json({
        message: "Access denied. Please contact support.",
        accessDenied: true
      });
    }

    const token = generateToken(user);

    console.log("Login successful, token generated");

    // Update last login
    await collection.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        surname: user.surname,
        email: user.email,
        program: user.program,
        track: user.track,
        username: user.username
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Internal server error during login"
    });
  }
});

// Helper function to calculate current semester
const getCurrentSemester = (registrationDate) => {
  if (!registrationDate) return "Not specified";
  const date = new Date(registrationDate);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
};

// Helper function to get registration month
const getRegistrationMonth = (registrationDate) => {
  if (!registrationDate) return "Not specified";
  const date = new Date(registrationDate);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return monthNames[date.getMonth()];
};

// Get current user profile (protected route)
router.get("/profile", authenticateToken, async (req, res) => {
    try {
    const collection = db.collection("students");

    const user = await collection.findOne(
      { _id: req.user._id },
      { projection: { password: 0 } } // already keeps program + track
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add current semester and registration month to the response
    user.currentSemester = getCurrentSemester(user.createdAt);
    user.registrationMonth = getRegistrationMonth(user.createdAt);

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});


// Get user-specific resources based on program and track
router.get("/my-resources", authenticateToken, async (req, res) => {
  try {
    const userProgram = req.user.program;
    const userTrack = req.user.track;

    const resourcesCollection = await db.collection("resources");

    const resources = await resourcesCollection.find({
      $or: [
        { program: userProgram },
        { track: userTrack },
        { isGeneral: true }
      ]
    }).toArray();

    res.json(resources);
  } catch (error) {
    console.error("Error fetching user resources:", error);
    res.status(500).json({ error: "Failed to fetch resources" });
  }
});

// Get user-specific assignments based on program and track
router.get("/my-assignments",authenticateToken, async (req, res) => {
  try {
    const userProgram = req.user.program;
    const userTrack = req.user.track;

    const assignmentsCollection = await db.collection("assignments");

    const assignments = await assignmentsCollection.find({
      $or: [
        { program: userProgram },
        { track: userTrack },
        { isGeneral: true }
      ]
    }).toArray();

    res.json(assignments);
  } catch (error) {
    console.error("Error fetching user assignments:", error);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

// Get user-specific tasks based on program and track
router.get("/my-tasks", authenticateToken, async (req, res) => {
  try {
    const userProgram = req.user.program;
    const userTrack = req.user.track;

    const tasksCollection = await db.collection("tasks");

    const tasks = await tasksCollection.find({
      $or: [
        { program: userProgram },
        { track: userTrack },
        { isGeneral: true }
      ]
    }).toArray();

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching user tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// Get user-specific projects based on program and track
router.get("/my-projects", authenticateToken, async (req, res) => {
  try {
    const userProgram = req.user.program;
    const userTrack = req.user.track;

    const projectsCollection = await db.collection("projects");

    const projects = await projectsCollection.find({
      $or: [
        { program: userProgram },
        { track: userTrack },
        { isGeneral: true }
      ]
    }).toArray();

    res.json(projects);
  } catch (error) {
    console.error("Error fetching user projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// GET total number of students
router.get('/total-students', async (req, res) => {
  res.setHeader('X-Frame-Options', 'DENY');
  try {
    const collection = await db.collection("students");
    const total = await collection.countDocuments({});

    res.json({ total });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch total students" });
  }
});

// GET total students by program (mentorship, internship, etc.)
router.get("/total-by-program/:programName", async (req, res) => {
  res.setHeader('X-Frame-Options', 'DENY');
  try {
    const { programName } = req.params;
    let collection = await db.collection("students");

    // Normalize program name for case-insensitive search
    const total = await collection.countDocuments({
      program: { $regex: new RegExp(`^${programName}$`, 'i') }
    });

    res.status(200).json({
      program: programName,
      total: total,
      message: `Total students in ${programName} program retrieved successfully`
    });
  } catch (error) {
    console.error("Error fetching students by program:", error);
    res.status(500).json({
      error: "Failed to fetch students count by program"
    });
  }
});

// GET total students by track (Web Development, Java, etc.)
router.get("/total-by-track/:trackName", async (req, res) => {
  res.setHeader('X-Frame-Options', 'DENY');
  try {
    const { trackName } = req.params;
    let collection = await db.collection("students");
    
    // Normalize track name for case-insensitive search
    const total = await collection.countDocuments({
      track: { $regex: new RegExp(`^${trackName}$`, 'i') }
    });
    
    res.status(200).json({
      track: trackName,
      total: total,
      message: `Total students in ${trackName} track retrieved successfully`
    });
  } catch (error) {
    console.error("Error fetching students by track:", error);
    res.status(500).json({
      error: "Failed to fetch students count by track"
    });
  }
});
// GET totals for dashboard programs only (fixed version)
router.get("/totals-by-programs", async (req, res) => {
  res.setHeader('X-Frame-Options', 'DENY');
  try {
    let collection = await db.collection("students");

    // Get all unique programs from the database to see what exists
    const allPrograms = await collection.distinct("program");
    console.log("All programs in database:", allPrograms);

    // Define the specific programs shown in dashboard program enrollment section
    const dashboardPrograms = [
      "Mentorship Program",
      "Internship Program",
      "Skill Development Program",
      "Graduate Program"
    ];

    const totals = {};

    // Count only for the programs displayed in the dashboard
    for (const program of dashboardPrograms) {
      const count = await collection.countDocuments({ program: program });
      totals[program] = count;
      console.log(`Count for "${program}": ${count}`);
    }

    console.log("Final totals:", totals);

    res.status(200).json({
      totals: totals,
      message: "Dashboard program totals retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching dashboard program totals:", error);
    res.status(500).json({
      error: "Failed to fetch dashboard program totals"
    });
  }
});

// GET totals for all tracks (fixed version) - REMOVED RATE LIMITING FOR DASHBOARD
router.get("/totals-by-tracks", async (req, res) => {
  res.setHeader('X-Frame-Options', 'DENY');
  try {
    let collection = await db.collection("students");

    // Get all unique tracks from the database, filter out null/undefined
    const allTracks = await collection.distinct("track");
    const validTracks = allTracks.filter(t => t && typeof t === 'string');

    const totals = {};

    // Count for each valid track
    for (const track of validTracks) {
      const count = await collection.countDocuments({ track: track });

      // Normalize track name to match dashboard expectations
      let normalizedTrack = track.trim();
      if (normalizedTrack.toLowerCase().includes('web')) {
        normalizedTrack = "Web Development";
      } else if (normalizedTrack.toLowerCase().includes('java') && !normalizedTrack.toLowerCase().includes('script')) {
        normalizedTrack = "Java Programming";
      } else if (normalizedTrack.toLowerCase().includes('c#') || normalizedTrack.toLowerCase().includes('csharp')) {
        normalizedTrack = "C# Programming";
      } else if (normalizedTrack.toLowerCase().includes('python')) {
        normalizedTrack = "Python Programming";
      } else if (normalizedTrack.toLowerCase().includes('robotics')) {
        normalizedTrack = "Robotics";
      } else if (normalizedTrack.toLowerCase().includes('compukids')) {
        normalizedTrack = "Compukids";
      } else if (normalizedTrack.toLowerCase().includes('computeens')) {
        normalizedTrack = "CompuTeens";
      } else if (normalizedTrack.toLowerCase().includes('digital') && normalizedTrack.toLowerCase().includes('entrepreneurship')) {
        normalizedTrack = "Digital Entrepreneurship";
      }

      // Aggregate counts for normalized track names
      if (!totals[normalizedTrack]) {
        totals[normalizedTrack] = 0;
      }
      totals[normalizedTrack] += count;
    }

    // Count students with null/undefined tracks
    const nullTrackCount = await collection.countDocuments({
      $or: [
        { track: null },
        { track: { $exists: false } },
        { track: "" }
      ]
    });

    if (nullTrackCount > 0) {
      totals["No Track Assigned"] = nullTrackCount;
    }

    res.status(200).json({
      totals: totals,
      message: "Track totals retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching track totals:", error);
    res.status(500).json({
      error: "Failed to fetch track totals"
    });
  }
});

// GET totals for specific predefined programs (fixed version)
router.get("/totals-by-predefined-programs",async (req, res) => {
  res.setHeader('X-Frame-Options', 'DENY');
  try {
    let collection = await db.collection("students");
    
    // Define the programs we want to count
    const predefinedPrograms = [
      "Mentorship Program",
      "Internship Program",
      "Skill Development Program",
      "Graduate Program"
    ];
    
    const totals = {};
    let otherCount = 0;
    
    // Get all programs from DB, filter out null/undefined
    const allPrograms = await collection.distinct("program");
    const validPrograms = allPrograms.filter(p => p && typeof p === 'string');
    
    // Count for each predefined program
    for (const program of predefinedPrograms) {
      const count = await collection.countDocuments({ program: program });
      totals[program] = count;
    }
    
    // Count for other programs
    const otherPrograms = validPrograms.filter(p => 
      !predefinedPrograms.includes(p)
    );
    
    for (const otherProgram of otherPrograms) {
      const count = await collection.countDocuments({ program: otherProgram });
      otherCount += count;
      totals[otherProgram] = count; // Include individual other programs too
    }
    
    // Count students with null/undefined programs
    const nullProgramCount = await collection.countDocuments({
      $or: [
        { program: null },
        { program: { $exists: false } },
        { program: "" }
      ]
    });
    
    if (nullProgramCount > 0) {
      totals["No Program Assigned"] = nullProgramCount;
    }
    
    if (otherCount > 0) {
      totals["Other Programs"] = otherCount;
    }
    
    res.status(200).json({
      totals: totals,
      message: "Predefined program totals retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching predefined program totals:", error);
    res.status(500).json({
      error: "Failed to fetch predefined program totals"
    });
  }
});

// GET totals for specific predefined tracks (fixed version)
router.get("/totals-by-predefined-tracks", async (req, res) => {
  res.setHeader('X-Frame-Options', 'DENY');
  try {
    let collection = await db.collection("students");
    
    // Define the tracks we want to count
    const predefinedTracks = [
      "Web Development",
      "Java Programming",
      "C# Programming",
      "Python Programming",
      "Robotics",
      "Compukids",
      "CompuTeens",
      "Digital Entrepreneurship",

    ];
    
    const totals = {};
    let otherCount = 0;
    
    // Get all tracks from DB, filter out null/undefined
    const allTracks = await collection.distinct("track");
    const validTracks = allTracks.filter(t => t && typeof t === 'string');
    
    // Count for each predefined track
    for (const track of predefinedTracks) {
      const count = await collection.countDocuments({ track: track });
      totals[track] = count;
    }
    
    // Count for other tracks
    const otherTracks = validTracks.filter(t => 
      !predefinedTracks.includes(t)
    );
    
    for (const otherTrack of otherTracks) {
      const count = await collection.countDocuments({ track: otherTrack });
      otherCount += count;
      totals[otherTrack] = count; // Include individual other tracks too
    }
    
    // Count students with null/undefined tracks
    const nullTrackCount = await collection.countDocuments({
      $or: [
        { track: null },
        { track: { $exists: false } },
        { track: "" }
      ]
    });
    
    if (nullTrackCount > 0) {
      totals["No Track Assigned"] = nullTrackCount;
    }
    
    if (otherCount > 0) {
      totals["Other Tracks"] = otherCount;
    }
    
    res.status(200).json({
      totals: totals,
      message: "Predefined track totals retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching predefined track totals:", error);
    res.status(500).json({
      error: "Failed to fetch predefined track totals"
    });
  }
});

// GET detailed breakdown by program and track (fixed version) - REMOVED RATE LIMITING FOR DASHBOARD
router.get("/detailed-breakdown", async (req, res) => {
  res.setHeader('X-Frame-Options', 'DENY');
  try {
    let collection = await db.collection("students");

    // Get all data and process in memory
    const allStudents = await collection.find({}, {
      projection: { program: 1, track: 1 }
    }).toArray();

    const breakdown = {};

    // Group by program and track
    allStudents.forEach(student => {
      const { program, track } = student;

      // Handle null/undefined values and normalize program names
      let programName = program && typeof program === 'string' ? program.trim() : "No Program Assigned";

      // Normalize program names to match frontend expectations
      if (programName.toLowerCase().includes('mentorship')) {
        programName = "Mentorship Program";
      } else if (programName.toLowerCase().includes('internship')) {
        programName = "Internship Program";
      } else if (programName.toLowerCase().includes('skill') && programName.toLowerCase().includes('development')) {
        programName = "Skill Development Program";
      } else if (programName.toLowerCase().includes('graduate')) {
        programName = "Graduate Program";
      }

      const trackName = track && typeof track === 'string' ? track.trim() : "No Track Assigned";

      if (!breakdown[programName]) {
        breakdown[programName] = {
          program: programName,
          tracks: {},
          total: 0
        };
      }

      if (!breakdown[programName].tracks[trackName]) {
        breakdown[programName].tracks[trackName] = 0;
      }

      breakdown[programName].tracks[trackName]++;
      breakdown[programName].total++;
    });

    // Convert to array format
    const result = Object.values(breakdown).map(programData => ({
      program: programData.program,
      tracks: Object.entries(programData.tracks).map(([track, count]) => ({
        track,
        count
      })),
      total: programData.total
    })).sort((a, b) => a.program.localeCompare(b.program));

    res.status(200).json({
      breakdown: result,
      message: "Detailed breakdown retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching detailed breakdown:", error);
    res.status(500).json({
      error: "Failed to fetch detailed breakdown"
    });
  }
});

// GET summary statistics (fixed version)
router.get("/summary-statistics", async (req, res) => {
  res.setHeader('X-Frame-Options', 'DENY');
  try {
    let collection = await db.collection("students");
    
    // Get all counts in parallel for better performance
    const [
      totalStudents,
      programDistribution,
      trackDistribution,
      recentSignups
    ] = await Promise.all([
      // Total students
      collection.countDocuments({}),
      
      // Program distribution - filter out null/undefined
      collection.aggregate([
        { 
          $match: { 
            $or: [
              { program: { $exists: true, $ne: null, $ne: "" } },
              { program: { $exists: false } }
            ]
          } 
        },
        { $group: { 
          _id: { 
            $cond: {
              if: { $and: [{ $ne: ["$program", null] }, { $ne: ["$program", ""] }] },
              then: "$program",
              else: "No Program Assigned"
            }
          }, 
          count: { $sum: 1 } 
        } },
        { $project: { program: "$_id", count: 1, _id: 0 } },
        { $sort: { count: -1 } }
      ]).toArray(),
      
      // Track distribution - filter out null/undefined
      collection.aggregate([
        { 
          $match: { 
            $or: [
              { track: { $exists: true, $ne: null, $ne: "" } },
              { track: { $exists: false } }
            ]
          } 
        },
        { $group: { 
          _id: { 
            $cond: {
              if: { $and: [{ $ne: ["$track", null] }, { $ne: ["$track", ""] }] },
              then: "$track",
              else: "No Track Assigned"
            }
          }, 
          count: { $sum: 1 } 
        } },
        { $project: { track: "$_id", count: 1, _id: 0 } },
        { $sort: { count: -1 } }
      ]).toArray(),
      
      // Recent signups (last 30 days)
      (() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return collection.countDocuments({
          createdAt: { $gte: thirtyDaysAgo }
        });
      })()
    ]);
    
    res.status(200).json({
      summary: {
        totalStudents,
        recentSignupsLast30Days: recentSignups,
        programDistribution,
        trackDistribution
      },
      message: "Summary statistics retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching summary statistics:", error);
    res.status(500).json({
      error: "Failed to fetch summary statistics"
    });
  }
});

// NEW: Get counts for students with missing data
router.get("/missing-data-stats",async (req, res) => {
  res.setHeader('X-Frame-Options', 'DENY');
  try {
    let collection = await db.collection("students");
    
    const [
      noProgramCount,
      noTrackCount,
      noProgramOrTrackCount
    ] = await Promise.all([
      // Students with no program
      collection.countDocuments({
        $or: [
          { program: null },
          { program: { $exists: false } },
          { program: "" }
        ]
      }),
      
      // Students with no track
      collection.countDocuments({
        $or: [
          { track: null },
          { track: { $exists: false } },
          { track: "" }
        ]
      }),
      
      // Students with neither program nor track
      collection.countDocuments({
        $and: [
          {
            $or: [
              { program: null },
              { program: { $exists: false } },
              { program: "" }
            ]
          },
          {
            $or: [
              { track: null },
              { track: { $exists: false } },
              { track: "" }
            ]
          }
        ]
      })
    ]);
    
    res.status(200).json({
      missingData: {
        noProgram: noProgramCount,
        noTrack: noTrackCount,
        noProgramOrTrack: noProgramOrTrackCount
      },
      message: "Missing data statistics retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching missing data stats:", error);
    res.status(500).json({
      error: "Failed to fetch missing data statistics"
    });
  }
});

// Add this to onboardstudents.mjs
router.get("/debug-user/:username",async (req, res) => {
  try {
    const collection = await db.collection("students");
    const user = await collection.findOne({
      username: req.params.username
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      username: user.username,
      program: user.program,
      track: user.track,
      programType: typeof user.program,
      trackType: typeof user.track,
      programLength: user.program?.length,
      trackLength: user.track?.length,
      programTrimmed: user.program?.trim(),
      trackTrimmed: user.track?.trim()
    });
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ error: "Debug failed" });
  }
});

// Debug endpoint to see all programs in database
router.get("/debug-programs", async (req, res) => {
  try {
    const collection = await db.collection("students");
    const allPrograms = await collection.distinct("program");
    const sampleStudents = await collection.find({}, { projection: { program: 1, username: 1 } }).limit(10).toArray();

    res.json({
      allPrograms: allPrograms,
      sampleStudents: sampleStudents,
      message: "Debug programs retrieved successfully"
    });
  } catch (error) {
    console.error("Debug programs error:", error);
    res.status(500).json({ error: "Debug programs failed" });
  }
});

// GET mentorship tracks distribution (for dashboard)
router.get("/mentorship-tracks-distribution", async (req, res) => {
  res.setHeader('X-Frame-Options', 'DENY');
  try {
    let collection = await db.collection("students");

    // Get students in Mentorship Program and count by track
    const mentorshipTracks = await collection.aggregate([
      {
        $match: {
          program: { $regex: new RegExp("^Mentorship Program$", "i") },
          track: { $exists: true, $ne: null, $ne: "" }
        }
      },
      {
        $group: {
          _id: "$track",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          track: "$_id",
          count: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();

    // Convert to object format for dashboard
    const tracks = {};
    mentorshipTracks.forEach(item => {
      tracks[item.track] = item.count;
    });

    res.status(200).json({
      tracks: tracks,
      message: "Mentorship tracks distribution retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching mentorship tracks distribution:", error);
    res.status(500).json({
      error: "Failed to fetch mentorship tracks distribution"
    });
  }
});

// GET internship tracks distribution (for dashboard)
router.get("/internship-tracks-distribution", async (req, res) => {
  res.setHeader('X-Frame-Options', 'DENY');
  try {
    let collection = await db.collection("students");

    // Get students in Internship Program and count by track
    const internshipTracks = await collection.aggregate([
      {
        $match: {
          program: { $regex: new RegExp("^Internship Program$", "i") },
          track: { $exists: true, $ne: null, $ne: "" }
        }
      },
      {
        $group: {
          _id: "$track",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          track: "$_id",
          count: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();

    // Convert to object format for dashboard
    const tracks = {};
    internshipTracks.forEach(item => {
      tracks[item.track] = item.count;
    });

    res.status(200).json({
      tracks: tracks,
      message: "Internship tracks distribution retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching internship tracks distribution:", error);
    res.status(500).json({
      error: "Failed to fetch internship tracks distribution"
    });
  }
});

export default router;
