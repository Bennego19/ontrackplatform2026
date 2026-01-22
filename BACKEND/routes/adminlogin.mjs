import express from "express";
import getDb from "../db/conn.mjs";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import ExpressBrute from "express-brute";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'ontrack-connect-jwt-secret-key-2024';

// Security headers
router.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
    next();
});

// Brute force protection
const store = new ExpressBrute.MemoryStore();
const bruteforce = new ExpressBrute(store);

// =============== MAIN LOGIN ENDPOINT ===============

// Smart login endpoint - auto-detects if user is admin or student
router.post("/adminlogin", bruteforce.prevent, async (req, res) => {
    try {
        const { username, password } = req.body;

        console.log("Login attempt:", { username });

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required"
            });
        }

        // Get database connection
        const db = await getDb();
        if (!db) {
            return res.status(503).json({
                success: false,
                message: "Database service unavailable"
            });
        }

        const trimmedUsername = username.trim();

        // FIRST: Check in admins collection
        const adminsCollection = db.collection("admins");
        const admin = await adminsCollection.findOne({
            username: trimmedUsername
        });

        if (admin) {
            // Found in admins collection - verify password
            const isMatch = await bcrypt.compare(password, admin.password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid credentials"
                });
            }

            const token = jwt.sign(
                {
                    id: admin._id.toString(),
                    username: admin.username,
                    role: admin.role || 'admin',
                    userType: 'admin'
                },
                JWT_SECRET,
                { expiresIn: 86400 }
            );

            // Update last login
            await adminsCollection.updateOne(
                { _id: admin._id },
                { $set: { lastLogin: new Date() } }
            );

            return res.json({
                success: true,
                message: "Admin login successful",
                token,
                user: {
                    id: admin._id.toString(),
                    username: admin.username,
                    role: admin.role || 'admin',
                    name: admin.name,
                    email: admin.email,
                    userType: 'admin'
                }
            });
        }

        // SECOND: Check in students collection
        const studentsCollection = db.collection("students");
        const student = await studentsCollection.findOne({
            username: trimmedUsername
        });

        if (student) {
            // Found in students collection - verify password
            const isMatch = await bcrypt.compare(password, student.password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid credentials"
                });
            }

            const token = jwt.sign(
                {
                    id: student._id.toString(),
                    username: student.username,
                    role: 'student',
                    userType: 'student',
                    name: student.name,
                    studentId: student.studentId || student.id
                },
                JWT_SECRET,
                { expiresIn: 86400 }
            );

            return res.json({
                success: true,
                message: "Student login successful",
                token,
                user: {
                    id: student._id.toString(),
                    username: student.username,
                    role: 'student',
                    name: student.name,
                    email: student.email,
                    studentId: student.studentId || student.id,
                    userType: 'student'
                }
            });
        }

        // User not found in either collection
        return res.status(401).json({
            success: false,
            message: "Invalid credentials - user not found"
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error during login"
        });
    }
});

// =============== SPECIALIZED LOGIN ENDPOINTS (for compatibility) ===============

// Legacy admin login endpoint
router.post("/adminlogin/adminlogin", bruteforce.prevent, async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required"
            });
        }

        const db = await getDb();
        if (!db) {
            return res.status(503).json({
                success: false,
                message: "Database service unavailable"
            });
        }

        const collection = db.collection("admins");
        const admin = await collection.findOne({
            username: username.trim()
        });

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Invalid admin credentials"
            });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const token = jwt.sign(
            {
                id: admin._id.toString(),
                username: admin.username,
                role: admin.role || 'admin',
                userType: 'admin'
            },
            JWT_SECRET,
            { expiresIn: 86400 }
        );

        await collection.updateOne(
            { _id: admin._id },
            { $set: { lastLogin: new Date() } }
        );

        res.json({
            success: true,
            message: "Admin login successful",
            token,
            user: {
                id: admin._id.toString(),
                username: admin.username,
                role: admin.role || 'admin',
                name: admin.name,
                email: admin.email,
                userType: 'admin'
            }
        });

    } catch (error) {
        console.error("Legacy admin login error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

// Student login endpoint
router.post("/adminlogin/studentlogin", bruteforce.prevent, async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required"
            });
        }

        const db = await getDb();
        if (!db) {
            return res.status(503).json({
                success: false,
                message: "Database service unavailable"
            });
        }

        const collection = db.collection("students");
        const student = await collection.findOne({
            username: username.trim()
        });

        if (!student) {
            return res.status(401).json({
                success: false,
                message: "Invalid student credentials"
            });
        }

        const isMatch = await bcrypt.compare(password, student.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const token = jwt.sign(
            {
                id: student._id.toString(),
                username: student.username,
                role: 'student',
                userType: 'student',
                name: student.name,
                studentId: student.studentId || student.id
            },
            JWT_SECRET,
            { expiresIn: 86400 }
        );

        res.json({
            success: true,
            message: "Student login successful",
            token,
            user: {
                id: student._id.toString(),
                username: student.username,
                role: 'student',
                name: student.name,
                email: student.email,
                studentId: student.studentId || student.id,
                userType: 'student'
            }
        });

    } catch (error) {
        console.error("Student login error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

// =============== TEST DATA CREATION ===============

// Create test admin and student accounts
router.post("/create-test-accounts", async (req, res) => {
    try {
        const db = await getDb();
        if (!db) {
            return res.status(503).json({
                success: false,
                message: "Database service unavailable"
            });
        }

        const results = {
            admins: [],
            students: []
        };

        // Create test admin
        const adminsCollection = db.collection("admins");
        const existingAdmin = await adminsCollection.findOne({ username: "admin" });
        
        if (!existingAdmin) {
            const saltAdmin = await bcrypt.genSalt(10);
            const hashedAdminPassword = await bcrypt.hash("admin123", saltAdmin);
            
            const testAdmin = {
                username: "admin",
                password: hashedAdminPassword,
                name: "System Administrator",
                email: "admin@ontrack.com",
                role: "superadmin",
                createdAt: new Date(),
                lastLogin: null,
                isActive: true
            };

            const adminResult = await adminsCollection.insertOne(testAdmin);
            results.admins.push({
                username: "admin",
                password: "admin123",
                id: adminResult.insertedId,
                status: "created"
            });
        } else {
            results.admins.push({
                username: "admin",
                status: "already exists"
            });
        }

        // Create test student
        const studentsCollection = db.collection("students");
        const existingStudent = await studentsCollection.findOne({ username: "student" });
        
        if (!existingStudent) {
            const saltStudent = await bcrypt.genSalt(10);
            const hashedStudentPassword = await bcrypt.hash("student123", saltStudent);
            
            const testStudent = {
                username: "student",
                password: hashedStudentPassword,
                name: "Test Student",
                email: "student@ontrack.com",
                role: "student",
                studentId: "STU001",
                createdAt: new Date(),
                lastLogin: null,
                isActive: true,
                program: "Computer Science",
                year: "2024"
            };

            const studentResult = await studentsCollection.insertOne(testStudent);
            results.students.push({
                username: "student",
                password: "student123",
                id: studentResult.insertedId,
                status: "created"
            });
        } else {
            results.students.push({
                username: "student",
                status: "already exists"
            });
        }

        res.json({
            success: true,
            message: "Test accounts processed",
            note: "Use these credentials for testing",
            testCredentials: {
                admin: {
                    username: "admin",
                    password: "admin123",
                    redirectsTo: "/dashboard"
                },
                student: {
                    username: "student",
                    password: "student123",
                    redirectsTo: "/userdashboard"
                }
            },
            results
        });

    } catch (error) {
        console.error("Error creating test accounts:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create test accounts"
        });
    }
});

// =============== TOKEN VERIFICATION ===============

// Verify token route
router.get('/verify', async (req, res) => {
    try {
        const authHeader = req.headers.authorization || req.headers.Authorization;
        if (!authHeader) {
            return res.status(401).json({ 
                success: false, 
                message: 'No authorization header' 
            });
        }

        const parts = authHeader.split(' ');
        const token = parts.length === 2 ? parts[1] : authHeader;

        const payload = jwt.verify(token, JWT_SECRET);

        // Check if user still exists in database
        const db = await getDb();
        if (!db) {
            return res.status(503).json({ 
                success: false, 
                message: 'Database service unavailable' 
            });
        }

        let user = null;
        
        if (payload.userType === 'admin') {
            const admin = await db.collection("admins").findOne({ 
                _id: new ObjectId(payload.id) 
            });
            if (admin) {
                user = {
                    id: admin._id.toString(),
                    username: admin.username,
                    role: admin.role || 'admin',
                    name: admin.name,
                    email: admin.email,
                    userType: 'admin'
                };
            }
        } else if (payload.userType === 'student') {
            const student = await db.collection("students").findOne({ 
                _id: new ObjectId(payload.id) 
            });
            if (student) {
                user = {
                    id: student._id.toString(),
                    username: student.username,
                    role: 'student',
                    name: student.name,
                    email: student.email,
                    studentId: student.studentId,
                    userType: 'student'
                };
            }
        }

        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User no longer exists' 
            });
        }

        return res.json({
            success: true,
            user
        });
    } catch (err) {
        console.error('Token verify error:', err.message);
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid or expired token' 
        });
    }
});

// =============== USER CHECK ENDPOINT ===============

// Check if username exists and what type of user it is
router.get("/check-user/:username", async (req, res) => {
    try {
        const { username } = req.params;

        if (!username) {
            return res.status(400).json({
                success: false,
                message: "Username is required"
            });
        }

        const db = await getDb();
        if (!db) {
            return res.status(503).json({
                success: false,
                message: "Database service unavailable"
            });
        }

        const trimmedUsername = username.trim();

        // Check in admins collection first
        const adminsCollection = db.collection("admins");
        const admin = await adminsCollection.findOne({
            username: trimmedUsername
        });

        if (admin) {
            return res.json({
                success: true,
                exists: true,
                username: trimmedUsername,
                userType: 'admin',
                role: admin.role || 'admin'
            });
        }

        // Check in students collection
        const studentsCollection = db.collection("students");
        const student = await studentsCollection.findOne({
            username: trimmedUsername
        });

        if (student) {
            return res.json({
                success: true,
                exists: true,
                username: trimmedUsername,
                userType: 'student',
                studentId: student.studentId
            });
        }

        // User not found
        return res.json({
            success: true,
            exists: false,
            username: trimmedUsername,
            userType: null
        });

    } catch (error) {
        console.error("Error checking user:", error);
        res.status(500).json({
            success: false,
            message: "Failed to check user"
        });
    }
});

// =============== HEALTH CHECK ===============

// Simple health check endpoint
router.get("/health", async (req, res) => {
    try {
        const db = await getDb();
        if (!db) {
            return res.status(503).json({
                status: "error",
                message: "Database connection failed"
            });
        }

        // Test database connection
        await db.command({ ping: 1 });

        res.json({
            status: "healthy",
            timestamp: new Date().toISOString(),
            database: "connected",
            endpoints: {
                login: "POST /adminlogin (auto-detects user type)",
                adminLogin: "POST /adminlogin/adminlogin",
                studentLogin: "POST /adminlogin/studentlogin",
                verify: "GET /verify",
                checkUser: "GET /check-user/:username",
                testAccounts: "POST /create-test-accounts",
                health: "GET /health"
            }
        });
    } catch (error) {
        res.status(503).json({
            status: "error",
            message: "Service unhealthy",
            error: error.message
        });
    }
});

// =============== API INFO ===============

router.get("/", (req, res) => {
    res.json({
        message: "OnTrack Connect Authentication API",
        version: "2.0.0",
        description: "Smart login system that auto-detects user type (admin/student)",
        endpoints: {
            "POST /adminlogin": "Smart login (auto-detects admin/student)",
            "POST /adminlogin/adminlogin": "Admin-specific login",
            "POST /adminlogin/studentlogin": "Student-specific login",
            "GET /verify": "Verify authentication token",
            "GET /check-user/:username": "Check if username exists and user type",
            "POST /create-test-accounts": "Create test admin and student accounts",
            "GET /health": "Service health check"
        },
        authentication: "Username and password only - no role required",
        timestamp: new Date().toISOString()
    });
});

export default router;