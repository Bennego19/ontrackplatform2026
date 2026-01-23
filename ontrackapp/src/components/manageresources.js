import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { tokenManager } from "../services/authMiddleware";
import "./OnboardStudent.css";

export default function ManageResources() {
  const [activeTab, setActiveTab] = useState("create");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    websiteLink: "",
    program: "",
    track: ""
  });

  const [resources, setResources] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [updateFormData, setUpdateFormData] = useState({});
  const [deleteId, setDeleteId] = useState("");
  const [errors, setErrors] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();

  // Helper: extract field-specific errors
  function getFieldError(fieldName) {
    const err = errors.find(e => e.field === fieldName);
    return err ? err.message : "";
  }

  // Handle form updates
  function updateForm(value) {
    setFormData(prev => ({ ...prev, ...value }));
    if (errors.length > 0) setErrors([]);
    if (successMessage) setSuccessMessage("");
  }

  function handleInputChange(field, value) {
    updateForm({ [field]: value });
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

  // Load programs from backend
  const loadPrograms = async () => {
    try {
      const response = await fetch("/api/programs");
      if (response.ok) {
        const data = await response.json();
        setPrograms(data);
      } else {
        showMessage("Failed to load programs.", "error");
      }
    } catch (error) {
      showMessage("Network error loading programs.", "error");
    }
  };

  // Load tracks from backend
  const loadTracks = async () => {
    try {
      const response = await fetch("/api/tracks");
      if (response.ok) {
        const data = await response.json();
        setTracks(data);
      } else {
        showMessage("Failed to load tracks.", "error");
      }
    } catch (error) {
      showMessage("Network error loading tracks.", "error");
    }
  };

  // CREATE RESOURCE
  const isCreateFormValid =
    formData.name &&
    formData.description &&
    formData.websiteLink &&
    formData.program &&
    formData.track;

  async function handleCreateSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    setSuccessMessage("");

    try {
      const response = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          websiteLink: formData.websiteLink.trim(),
          program: formData.program.trim(),
          track: formData.track.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (Array.isArray(data.errors)) {
          setErrors(data.errors);
        } else if (data.message) {
          setErrors([{ field: "general", message: data.message }]);
        } else {
          setErrors([{ field: "general", message: "Resource creation failed. Try again." }]);
        }
        setLoading(false);
        return;
      }

      showMessage(`✅ Resource "${formData.name}" created successfully!`);

      // Reset form
      setFormData({
        name: "",
        description: "",
        websiteLink: "",
        program: "",
        track: ""
      });

      // Refresh resources list
      loadResources();

    } catch (error) {
      setErrors([{ field: "general", message: "Network error. Try again." }]);
    }

    setLoading(false);
  }

  // READ RESOURCES
  const loadResources = async () => {
    try {
      const response = await fetch("/api/resources");
      if (response.ok) {
        const data = await response.json();
        setResources(data);
      } else {
        showMessage("Failed to load resources.", "error");
      }
    } catch (error) {
      showMessage("Network error loading resources.", "error");
    }
  };

  // UPDATE RESOURCE
  const loadResourcesForUpdate = async () => {
    try {
      const response = await fetch("/api/resources", {
        headers: {
          'Authorization': `Bearer ${tokenManager.getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setResources(data);
      }
    } catch (error) {
      showMessage("Failed to load resources for update.", "error");
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
      const resourceData = updateFormData[id] || {};
      const response = await fetch(`/api/resources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resourceData)
      });

      if (response.ok) {
        showMessage(`✅ Resource ${id} updated successfully!`);
        loadResources();
        loadResourcesForUpdate();
      } else {
        showMessage("Error updating resource.", "error");
      }
    } catch (error) {
      showMessage("Network error updating resource.", "error");
    }
  };

  const cancelEdit = (id) => {
    showMessage(`❌ Edit for Resource ${id} cancelled`);
    loadResourcesForUpdate();
  };

  // DELETE RESOURCE
  const handleDeleteSubmit = async (id) => {
    try {
      const response = await fetch(`/api/resources/${id}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${tokenManager.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        showMessage(`✅ Resource deleted successfully`);
        loadResources();
      } else if (response.status === 404) {
        showMessage("Resource not found.", "error");
      } else {
        showMessage("Error deleting resource.", "error");
      }
    } catch (error) {
      showMessage("Network error deleting resource.", "error");
    }
  };

  // Tab change handler
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setErrors([]);
    setSuccessMessage("");
    if (tab === "read") loadResources();
    if (tab === "update") loadResourcesForUpdate();
    if (tab === "delete") loadResources();
  };

  // Filter resources for search
  const filteredResources = resources.filter(resource =>
    resource.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.program?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.track?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    loadResources();
    loadPrograms();
    loadTracks();
  }, []);

  return (
    <div className="manage-students-container">
      <div className="manage-students-card">
        <div className="manage-students-header">
          <div className="header-icon">📚</div>
          <h1 className="manage-students-title">Manage Resources</h1>
          <p className="manage-students-subtitle">Create, view, update, and delete resource records</p>
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

        <div className="tab-container-students">
          {/* Tabs */}
          <div className="tabs-students">
            <button
              className={`tab-students ${activeTab === "create" ? "active" : ""}`}
              onClick={() => handleTabChange("create")}
            >
              Create Resource
            </button>
            <button
              className={`tab-students ${activeTab === "read" ? "active" : ""}`}
              onClick={() => handleTabChange("read")}
            >
              View Resources
            </button>
            <button
              className={`tab-students ${activeTab === "update" ? "active" : ""}`}
              onClick={() => handleTabChange("update")}
            >
              Update Resources
            </button>
            <button
              className={`tab-students ${activeTab === "delete" ? "active" : ""}`}
              onClick={() => handleTabChange("delete")}
            >
              Delete Resource
            </button>
          </div>

          <div className="tab-content-students">
            {/* CREATE TAB */}
            {activeTab === "create" && (
              <div className="tab-pane-students active">
                <div className="form-section">
                  <h3 className="section-title">Create New Resource</h3>
                  <form onSubmit={handleCreateSubmit} className="students-form">
                    {/* RESOURCE INFORMATION */}
                    <div className="form-section">
                      <h4 className="section-subtitle">Resource Information</h4>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Name *</label>
                          <input
                            type="text"
                            className={`form-input ${getFieldError("name") ? "error" : ""}`}
                            placeholder="Enter resource name"
                            value={formData.name}
                            onChange={(e) => handleInputChange("name", e.target.value)}
                            disabled={loading}
                          />
                          {getFieldError("name") && (
                            <span className="error-message">{getFieldError("name")}</span>
                          )}
                        </div>

                        <div className="form-group">
                          <label className="form-label">Description *</label>
                          <textarea
                            className={`form-input ${getFieldError("description") ? "error" : ""}`}
                            placeholder="Enter resource description"
                            value={formData.description}
                            onChange={(e) => handleInputChange("description", e.target.value)}
                            disabled={loading}
                            rows="3"
                          />
                          {getFieldError("description") && (
                            <span className="error-message">{getFieldError("description")}</span>
                          )}
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Website Link *</label>
                          <input
                            type="url"
                            className={`form-input ${getFieldError("websiteLink") ? "error" : ""}`}
                            placeholder="https://example.com"
                            value={formData.websiteLink}
                            onChange={(e) => handleInputChange("websiteLink", e.target.value)}
                            disabled={loading}
                          />
                          {getFieldError("websiteLink") && (
                            <span className="error-message">{getFieldError("websiteLink")}</span>
                          )}
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Program *</label>
                          <select
                            className={`form-select ${getFieldError("program") ? "error" : ""}`}
                            value={formData.program}
                            onChange={(e) => handleInputChange("program", e.target.value)}
                            disabled={loading}
                          >
                            <option value="">-- Select Program --</option>
                            {programs.map((p) => (
                              <option key={p._id} value={p.name}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                          {getFieldError("program") && (
                            <span className="error-message">{getFieldError("program")}</span>
                          )}
                        </div>

                        <div className="form-group">
                          <label className="form-label">Track *</label>
                          <select
                            className={`form-select ${getFieldError("track") ? "error" : ""}`}
                            value={formData.track}
                            onChange={(e) => handleInputChange("track", e.target.value)}
                            disabled={loading}
                          >
                            <option value="">-- Select Track --</option>
                            {tracks.map((t) => (
                              <option key={t._id} value={t.name}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                          {getFieldError("track") && (
                            <span className="error-message">{getFieldError("track")}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="action-section">
                      <button
                        type="submit"
                        disabled={!isCreateFormValid || loading}
                        className={`submit-button ${loading ? "loading" : ""}`}
                      >
                        {loading ? "Creating Resource..." : "➕ Create Resource"}
                      </button>

                      <div className="form-requirements">
                        <span className="requirement-text">* Required fields</span>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* READ TAB */}
            {activeTab === "read" && (
              <div className="tab-pane-students active">
                <div className="form-section">
                  <div className="section-header">
                    <h3 className="section-title">View Resources</h3>
                    <div className="search-refresh-container">
                      <input
                        type="text"
                        className="search-input"
                        placeholder="Search resources..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <button onClick={loadResources} className="refresh-button">
                        🔄 Refresh
                      </button>
                    </div>
                  </div>

                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Description</th>
                          <th>Website Link</th>
                          <th>Program</th>
                          <th>Track</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredResources.map(resource => (
                          <tr key={resource._id || resource.id}>
                            <td>{resource._id || resource.id}</td>
                            <td>{resource.name}</td>
                            <td>{resource.description}</td>
                            <td><a href={resource.websiteLink} target="_blank" rel="noopener noreferrer">{resource.websiteLink}</a></td>
                            <td>{resource.program}</td>
                            <td>{resource.track}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredResources.length === 0 && (
                      <div className="no-data-message">
                        {searchTerm ? "No resources found matching your search." : "No resources found."}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* UPDATE TAB */}
            {activeTab === "update" && (
              <div className="tab-pane-students active">
                <div className="form-section">
                  <h3 className="section-title">Update Resources</h3>
                  <p className="section-subtitle">Edit resource details and save changes</p>

                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Description</th>
                          <th>Website Link</th>
                          <th>Program</th>
                          <th>Track</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resources.map(resource => (
                          <tr key={resource._id || resource.id}>
                            <td>{resource._id || resource.id}</td>
                            <td>
                              <input
                                type="text"
                                defaultValue={resource.name}
                                onChange={(e) => handleUpdateChange(resource._id || resource.id, "name", e.target.value)}
                                className="update-input"
                              />
                            </td>
                            <td>
                              <textarea
                                defaultValue={resource.description}
                                onChange={(e) => handleUpdateChange(resource._id || resource.id, "description", e.target.value)}
                                className="update-input"
                                rows="2"
                              />
                            </td>
                            <td>
                              <input
                                type="url"
                                defaultValue={resource.websiteLink}
                                onChange={(e) => handleUpdateChange(resource._id || resource.id, "websiteLink", e.target.value)}
                                className="update-input"
                              />
                            </td>
                            <td>
                              <select
                                defaultValue={resource.program}
                                onChange={(e) => handleUpdateChange(resource._id || resource.id, "program", e.target.value)}
                                className="update-select"
                              >
                                {programs.map((p) => (
                                  <option key={p._id} value={p.name}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <select
                                defaultValue={resource.track}
                                onChange={(e) => handleUpdateChange(resource._id || resource.id, "track", e.target.value)}
                                className="update-select"
                              >
                                {tracks.map((t) => (
                                  <option key={t._id} value={t.name}>
                                    {t.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  onClick={() => updateResource(resource._id || resource.id)}
                                  className="update-btn"
                                >
                                  💾 Save
                                </button>
                                <button
                                  onClick={() => cancelEdit(resource._id || resource.id)}
                                  className="cancel-btn"
                                >
                                  ❌ Cancel
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {resources.length === 0 && (
                      <div className="no-data-message">
                        No resources available for update.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* DELETE TAB */}
            {activeTab === "delete" && (
              <div className="tab-pane-students active">
                <div className="form-section">
                  <h3 className="section-title">Delete Resource</h3>
                  <p className="section-subtitle">Permanently remove a resource from the system</p>

                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Description</th>
                          <th>Website Link</th>
                          <th>Program</th>
                          <th>Track</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resources.map(resource => (
                          <tr key={resource._id || resource.id}>
                            <td>{resource.name}</td>
                            <td>{resource.description}</td>
                            <td><a href={resource.websiteLink} target="_blank" rel="noopener noreferrer">{resource.websiteLink}</a></td>
                            <td>{resource.program}</td>
                            <td>{resource.track}</td>
                            <td>
                              <button
                                onClick={() => handleDeleteSubmit(resource._id || resource.id)}
                                className="delete-btn"
                              >
                                🗑️ Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {resources.length === 0 && (
                      <div className="no-data-message">
                        No resources available for deletion.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
