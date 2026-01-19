// src/services/mentorAuthMiddleware.js

const API_BASE_URL = "http://localhost:3000";

// Mentor authentication API
export const mentorAuthAPI = {
  // Mentor login
  login: async (email, password) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/onboardmentors/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email, password })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Mentor login failed");
      }

      return data;
    } catch (error) {
      console.error("Mentor login error:", error);
      throw error;
    }
  },

  // Get mentor profile
  getProfile: async () => {
    try {
      const token = mentorTokenManager.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/onboardmentors/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 && data.accessDenied) {
          mentorTokenManager.clearAuth();
          throw new Error("Access denied. You have been logged out.");
        }
        throw new Error(data.message || "Failed to fetch mentor profile");
      }

      return data;
    } catch (error) {
      console.error("Mentor profile fetch error:", error);
      throw error;
    }
  },

  // Get students assigned to mentor
  getAssignedStudents: async () => {
    try {
      const token = mentorTokenManager.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/mentorstudentassignment/mentor`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 && data.accessDenied) {
          mentorTokenManager.clearAuth();
          throw new Error("Access denied. You have been logged out.");
        }
        throw new Error(data.message || "Failed to fetch assigned students");
      }

      return data;
    } catch (error) {
      console.error("Fetch assigned students error:", error);
      throw error;
    }
  },

  // Mentor logout
  logout: () => {
    mentorTokenManager.clearAuth();
  }
};

// Mentor token manager (separate from student auth)
export const mentorTokenManager = {
  getToken: () => {
    try {
      return localStorage.getItem("mentorAuthToken");
    } catch {
      return null;
    }
  },

  setToken: (token) => {
    try {
      localStorage.setItem("mentorAuthToken", token);
    } catch {}
  },

  removeToken: () => {
    try {
      localStorage.removeItem("mentorAuthToken");
    } catch {}
  },

  getStoredMentor: () => {
    try {
      const mentor = localStorage.getItem("mentor");
      return mentor ? JSON.parse(mentor) : null;
    } catch {
      return null;
    }
  },

  setStoredMentor: (mentor) => {
    try {
      localStorage.setItem("mentor", JSON.stringify(mentor));
    } catch {}
  },

  removeStoredMentor: () => {
    try {
      localStorage.removeItem("mentor");
    } catch {}
  },

  isAuthenticated: () => {
    try {
      return !!(
        localStorage.getItem("mentorAuthToken") &&
        localStorage.getItem("mentor")
      );
    } catch {
      return false;
    }
  },

  clearAuth: () => {
    try {
      localStorage.removeItem("mentorAuthToken");
      localStorage.removeItem("mentor");
    } catch {}
  }
};
