import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { tokenManager } from "../services/authMiddleware";
import "./managementor.css";

export default function ManageResources() {
  const [activeTab, setActiveTab] = useState("create");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState([]);
  const [resources, setResources] = useState([]);
  const [updateResources, setUpdateResources] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    program: "",
    track: "",
    document: null
  });

  const [updateFormData, setUpdateFormData] = useState({});
  const [deleteId, setDeleteId] = useState("");

  const navigate = useNavigate();

  const programs = ["Web Development", "Java Programming", "C# Programming", "Python Programming"];
  const tracks = ["webdev", "java", "csharp", "python"];

  // Helper: extract field-specific errors
  function getFieldError(fieldName) {
    const err = errors.find(e => e.field === fieldName);
    return err ? err.message : "";
  }

  const showMessage = (text, type = "success") => {
    if (type === "success") {
      setSuccessMessage(text);
      setTimeout(() => setSuccessMessage(""), 4000);
    } else {
      setErrors([{ field: "general", message: text }]);
      setTimeout(() => setErrors([]), 4000);
    }
  };

  // CREATE TAB FUNCTIONS
  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors.length > 0) setErrors([]);
    if (successMessage) setSuccessMessage("");
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.program || !formData.track) {
      showMessage("Please fill out all required fields.", "error");
      return;
    }

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key]) {
        data.append(key, formData[key]);
      }
    });

    setLoading(true);

    try {
      const token = tokenManager.getToken();
      const response = await axios.post("/api/resources", data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        }
      });

      showMessage(`✅ Resource "${response.data.name}" added successfully!`);

      // Reset form
      setFormData({
        name: "",
        program: "",
        track: "",
        document: null
      });

      // Refresh resources list
      loadResources();

    } catch (error) {
      console.error(error);
      if (error.response?.status === 403) {
        showMessage("Access denied. Please log in again.", "error");
      } else {
        showMessage("Failed to create resource. Please try again.", "error");
      }
    }

    setLoading(false);
  };

  // READ TAB FUNCTIONS
  const loadResources = async () => {
    try {
      const token = tokenManager.getToken();
      const response = await axios.get("/api/resources", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setResources(response.data);
    } catch (error) {
      console.error("Error loading resources:", error);
      if (error.response?.status === 403) {
        showMessage("Access denied. Please log in again.", "error");
      } else {
        showMessage("Failed to load resources.", "error");
      }
    }
  };

  // UPDATE TAB FUNCTIONS
  const loadUpdateTable = async () => {
    try {
      const token = tokenManager.getToken();
      const response = await axios.get("/api/resources", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUpdateResources(response.data);
    } catch (error) {
      console.error("Error loading resources for update:", error);
      if (error.response?.status === 403) {
        showMessage("Access denied. Please log in again.", "error");
      } else {
        showMessage("Failed to load resources for update.", "error");
      }
    }
  };

  const handleUpdateChange = (id, field, value) => {
    setUpdateFormData(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const updateResource = async (id) => {
    try {
      const token = tokenManager.getToken();
      const resourceData = updateFormData[id] || {};

      await axios.put(`/api/resources/${id}`, resourceData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      showMessage(`✅ Resource ${id} updated successfully!`);
      loadResources();
      loadUpdateTable();
    } catch (error) {
      console.error(error);
      if (error.response?.status === 403) {
        showMessage("Access denied. Please log in again.", "error");
      } else {
        showMessage("Error updating resource. Please try again.", "error");
      }
    }
  };

  const cancelEdit = (id) => {
    showMessage(`❌ Edit for Resource ${id} cancelled`);
    loadUpdateTable();
  };

  // DELETE TAB FUNCTIONS
  const handleDeleteSubmit = async (id) => {
    try {
      const token = tokenManager.getToken();
      await axios.delete(`/api/resources/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      showMessage(`✅ Resource deleted successfully`);
      loadResources();
    } catch (error) {
      console.error(error);
      if (error.response?.status === 403) {
        showMessage("Access denied. Please log in again.", "error");
      } else if (error.response?.status === 404) {
        showMessage("Resource not found.", "error");
      } else {
        showMessage("Error deleting resource. Please try again.", "error");
      }
    }
  };

  // Tab change handler
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setErrors([]);
    setSuccessMessage("");
    if (tab === "read") loadResources();
    if (tab === "update") loadUpdateTable();
    if (tab === "delete") loadResources();
  };

  useEffect(() => {
    loadResources();
    loadUpdateTable();
  }, []);

  const isCreateFormValid =
    formData.name &&
    formData.program &&
    formData.track;

  const formatTrackName = (track) => {
    const trackMap = {
      "webdev": "Web Development",
      "java": "Java Programming",
      "csharp": "C# Programming",
      "python": "Python Programming"
    };
    return trackMap[track] || track;
  };

  return (
    <div className="manage-mentorship-container">
      <div className="manage-mentorship-card">
        <div className="manage-mentorship-header">
          <div className="header-icon">📚</div>
          <h1 className="manage-mentorship-title">Manage Resources</h1>
          <p className="manage-mentorship-subtitle">Create and manage learning resources</p>
        </div>

        {/* SUCCESS MESSAGE */}
        {successMessage && <div className="success-message">{successMessage}</div>}

        {/* GENERAL ERRORS */}
        {errors.some(e => e.field === "general") && (
          <div className="error-message general-error">
            {errors
              .filter(e => e.field === "general")
              .map((err, idx) => (
                <div key={idx}>{err.message}</div>
              ))}
          </div>
        )}

        <div className="tab-container-mentorship">
          {/* Tabs */}
          <div className="tabs-mentorship">
            <button
              className={`tab-mentorship ${activeTab === "create" ? "active" : ""}`}
              onClick={() => handleTabChange("create")}
            >
              Create Resource
            </button>
            <button
              className={`tab-mentorship ${activeTab === "read" ? "active" : ""}`}
              onClick={() => handleTabChange("read")}
            >
              View Resources
            </button>
            <button
              className={`tab-mentorship ${activeTab === "update" ? "active" : ""}`}
              onClick={() => handleTabChange("update")}
            >
              Update Resources
            </button>
            <button
              className={`tab-mentorship ${activeTab === "delete" ? "active" : ""}`}
              onClick={() => handleTabChange("delete")}
            >
              Delete Resource
            </button>
          </div>

          <div className="tab-content-mentorship">
            {/* CREATE TAB */}
            {activeTab === "create" && (
              <div className="tab-pane-mentorship active">
                <div className="form-section">
                  <h3 className="section-title">Create New Resource</h3>
                  <form onSubmit={handleCreateSubmit} className="mentorship-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Resource Name *</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.name}
                          onChange={(e) => handleFormChange("name", e.target.value)}
                          placeholder="Enter Resource Name"
                          disabled={loading}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Program *</label>
                        <select
                          className="form-select"
                          value={formData.program}
                          onChange={(e) => handleFormChange("program", e.target.value)}
                          disabled={loading}
                          required
                        >
                          <option value="">-- Select Program --</option>
                          {programs.map((program, index) => (
                            <option key={index} value={program}>
                              {program}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Track *</label>
                        <select
                          className="form-select"
                          value={formData.track}
                          onChange={(e) => handleFormChange("track", e.target.value)}
                          disabled={loading}
                          required
                        >
                          <option value="">-- Select Track --</option>
                          {tracks.map((track, index) => (
                            <option key={index} value={track}>
                              {formatTrackName(track)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Upload Document</label>
                        <input
                          type="file"
                          className="form-input"
                          onChange={(e) => handleFormChange("document", e.target.files[0])}
