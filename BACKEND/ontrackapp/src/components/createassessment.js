import React, { useState, useEffect } from 'react';
import './CreateAssessment.css';

const Createassessment = () => {
  const [activeTab, setActiveTab] = useState('tab1');
  const [formData, setFormData] = useState({
    assessmentname: '',
    assessmenttype: '',
    dateadded: '',
    datedue: '',
    program: '',
    track: '',
    document: null
  });
  const [assessments, setAssessments] = useState([]);
  const [users, setUsers] = useState([]);
  const [deleteUserId, setDeleteUserId] = useState('');

  // Valid prefixes
  const validPrograms = ["MEN", "INT"];
  const validTracks = ["WEB", "JAV", "CSH", "PYT", "ROB"];
  const cohortRegex = /^(MEN|INT)(WEB|JAV|CSH|PYT|ROB)(\d{2})$/;

  const showTab = (tabId) => {
    setActiveTab(tabId);
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'document') {
      setFormData(prev => ({
        ...prev,
        [name]: files[0]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    // Validation logic
    const cohortName = formData.assessmentname.trim().toUpperCase();
    
    if (!cohortRegex.test(cohortName)) {
      alert("Invalid Cohort Name! Must follow format: [Program][Track][Number]. Example: MENWEB01");
      return;
    }

    const cohortNumber = parseInt(cohortName.slice(-2), 10);
    if (cohortNumber < 1 || cohortNumber > 99) {
      alert("Cohort number must be between 01 and 99.");
      return;
    }

    // Submit logic here
    console.log('Form submitted:', formData);
    // Add your form submission logic (API call, etc.)
  };

  const loadAssessments = () => {
    // Mock data - replace with actual API call
    const mockAssessments = [
      { id: 1, name: 'Task 1', type: 'task', dateAdded: '2024-01-01', dateDue: '2024-01-15', program: 'mentorship', track: 'webdev' },
      { id: 2, name: 'Assignment 1', type: 'assignment', dateAdded: '2024-01-02', dateDue: '2024-01-20', program: 'internship', track: 'java' }
    ];
    setAssessments(mockAssessments);
  };

  const handleDeleteSubmit = (e) => {
    e.preventDefault();
    // Delete logic here
    console.log('Delete user:', deleteUserId);
    // Add your delete logic
  };

  useEffect(() => {
    // Load initial data if needed
    loadAssessments();
  }, []);

  return (
    <div>
      <br /><br />
      <h1 style={{ textAlign: 'center' }}>Manage Assessments</h1>

      <div className="tab-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'tab1' ? 'active' : ''}`} 
            onClick={() => showTab('tab1')}
          >
            Create
          </button>
          <button 
            className={`tab ${activeTab === 'tab2' ? 'active' : ''}`} 
            onClick={() => showTab('tab2')}
          >
            Read/View
          </button>
          <button 
            className={`tab ${activeTab === 'tab3' ? 'active' : ''}`} 
            onClick={() => showTab('tab3')}
          >
            Update
          </button>
          <button 
            className={`tab ${activeTab === 'tab4' ? 'active' : ''}`} 
            onClick={() => showTab('tab4')}
          >
            Delete
          </button>
        </div>
        <br /><br />

        <div className="tab-content">
          {/* Tab 1: Create Assessment */}
          {activeTab === 'tab1' && (
            <div id="tab1" className="tab-pane active">
              <h2>Overview</h2>
              <form 
                id="assessmentForm" 
                style={{ alignContent: 'center' }} 
                encType="multipart/form-data"
                onSubmit={handleFormSubmit}
              >
                <label>
                  Assessment Name:
                  <input 
                    type="text" 
                    name="assessmentname" 
                    value={formData.assessmentname}
                    onChange={handleInputChange}
                    required 
                  />
                </label>
                <br /><br />

                <label>
                  Assessment Type:
                  <select 
                    name="assessmenttype" 
                    value={formData.assessmenttype}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="task">Task</option>
                    <option value="assignment">Assignment</option>
                    <option value="project">Project</option>
                    <option value="module">Module</option>
                  </select>
                </label>
                <br /><br />

                <label>
                  Date Added:
                  <input 
                    type="date" 
                    name="dateadded" 
                    value={formData.dateadded}
                    onChange={handleInputChange}
                    required 
                  />
                </label>
                <br /><br />

                <label>
                  Date Due:
                  <input 
                    type="date" 
                    name="datedue" 
                    value={formData.datedue}
                    onChange={handleInputChange}
                    required 
                  />
                </label>
                <br /><br />

                <label>
                  Program:
                  <select 
                    name="program" 
                    value={formData.program}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Program</option>
                    <option value="mentorship">Mentorship</option>
                    <option value="internship">Internship</option>
                  </select>
                </label>
                <br /><br />

                <label>
                  Track:
                  <select 
                    name="track" 
                    value={formData.track}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Track</option>
                    <option value="webdev">Web Dev</option>
                    <option value="java">Java</option>
                    <option value="csharp">C#</option>
                    <option value="python">Python</option>
                  </select>
                </label>
                <br /><br />

                <label>
                  Upload Document:
                  <input 
                    type="file" 
                    name="document" 
                    accept=".pdf,.doc,.docx,.txt" 
                    onChange={handleInputChange}
                    required 
                  />
                </label>
                <br /><br />

                <button type="submit">Add Assessment</button>
              </form>
            </div>
          )}

          {/* Tab 2: Read/View Assessments */}
          {activeTab === 'tab2' && (
            <div id="tab2" className="tab-pane">
              <h2>All Assessments</h2>
              <button onClick={loadAssessments}>Refresh</button>
              <ul id="assessmentList">
                {assessments.map(assessment => (
                  <li key={assessment.id}>
                    {assessment.name} - {assessment.type} - Due: {assessment.dateDue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tab 3: Update Assessment */}
          {activeTab === 'tab3' && (
            <div id="tab3" className="tab-pane">
              <h2>Update Assessment</h2>
              <p>Edit user details and save changes.</p>

              <table 
                border="1" 
                cellPadding="10" 
                cellSpacing="0" 
                style={{ width: '100%', borderCollapse: 'collapse' }}
              >
                <thead>
                  <tr>
                    <th>Assessment Name</th>
                    <th>Assessment Type</th>
                    <th>Date Added</th>
                    <th>Date Due</th>
                    <th>Program</th>
                    <th>Track</th>
                  </tr>
                </thead>
                <tbody id="updateTable">
                  {assessments.map(assessment => (
                    <tr key={assessment.id}>
                      <td>{assessment.name}</td>
                      <td>{assessment.type}</td>
                      <td>{assessment.dateAdded}</td>
                      <td>{assessment.dateDue}</td>
                      <td>{assessment.program}</td>
                      <td>{assessment.track}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 4: Delete Assessment */}
          {activeTab === 'tab4' && (
            <div id="tab4" className="tab-pane">
              <h2>Tasks</h2>
              <form id="deleteForm" onSubmit={handleDeleteSubmit}>
                <label>
                  User ID to delete:
                  <input 
                    type="text" 
                    id="userId" 
                    value={deleteUserId}
                    onChange={(e) => setDeleteUserId(e.target.value)}
                    required 
                  />
                </label>
                <button type="submit">Delete</button>
              </form>
              <ul id="userList">
                {users.map(user => (
                  <li key={user.id}>{user.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Createassessment;