import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import AdminLogin from './adminlogin';
import { useDashboardApi, usePublicApi } from '../hooks/useApi';
import { tokenManager } from '../services/authMiddleware';
import { authAPI } from '../services/authMiddleware';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// Function to clear dashboard cache
const clearDashboardCache = () => {
  try {
    localStorage.removeItem('dashboardCache');
    console.log('Dashboard cache cleared');
  } catch (e) {
    console.warn('Failed to clear dashboard cache:', e);
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [loadPhase, setLoadPhase] = useState(1); // Control loading phases

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);

  // Phase 1: Core metrics (load first)
  const { data: totalStudentsData, loading: studentsLoading, error: studentsError } = useDashboardApi('/onboardstudents/total-students');
  const { data: totalMentorsData, loading: mentorsLoading, error: mentorsError } = useDashboardApi('/onboardmentors/total-mentors');
  const { data: programTotalsData, loading: programsLoading, error: programsError } = useDashboardApi('/onboardstudents/totals-by-programs');
  const { data: trackTotalsData, loading: tracksLoading, error: tracksError } = useDashboardApi('/onboardstudents/totals-by-tracks');

  // Phase 2: Additional metrics (load after core data)
  const { data: totalAssessmentsData, loading: assessmentsLoading, error: assessmentsError } = usePublicApi(loadPhase >= 2 ? '/assessments/total' : null);
  const { data: totalCohortsData, loading: cohortsLoading, error: cohortsError } = useDashboardApi(loadPhase >= 2 ? '/cohorts/total' : null);
  const { data: activeAssignmentsData, loading: assignmentsLoading, error: assignmentsError } = useDashboardApi(loadPhase >= 2 ? '/mentorstudentassignment/active-count' : null);

  // Phase 3: Detailed breakdowns (load last)
  const { data: internshipTracksApiData, loading: internshipTracksLoading, error: internshipTracksError } = useDashboardApi(loadPhase >= 3 ? '/onboardstudents/internship-tracks-distribution' : null);
  const { data: mentorshipTracksApiData, loading: mentorshipTracksLoading, error: mentorshipTracksError } = useDashboardApi(loadPhase >= 3 ? '/onboardstudents/mentorship-tracks-distribution' : null);
  const { data: mentorsByTrackData, loading: mentorsTrackLoading, error: mentorsTrackError } = useDashboardApi(loadPhase >= 3 ? '/onboardmentors/mentors-by-track' : null);
  const { data: webDevTotalData, loading: webDevLoading, error: webDevError } = useDashboardApi(loadPhase >= 3 ? '/onboardstudents/total-by-track/Web%20Development' : null);
  const { data: summaryStatsData, loading: summaryLoading, error: summaryError } = useDashboardApi(loadPhase >= 3 ? '/onboardstudents/summary-statistics' : null);
  const { data: assessmentTotalsByProgramData, loading: assessmentProgramsLoading, error: assessmentProgramsError } = usePublicApi(loadPhase >= 3 ? '/assessments/totals-by-program' : null);
  const { data: assessmentTotalsByTypeData, loading: assessmentTypesLoading, error: assessmentTypesError } = usePublicApi(loadPhase >= 3 ? '/assessments/totals-by-type' : null);
  const { data: helpRequestsData, loading: helpRequestsLoading, error: helpRequestsError } = useDashboardApi(loadPhase >= 3 ? '/help-requests/admin' : null);

  // Control loading phases
  useEffect(() => {
    if (loadPhase === 1 && !studentsLoading && !mentorsLoading && !programsLoading && !tracksLoading) {
      // Phase 1 complete, move to phase 2
      setLoadPhase(2);
    } else if (loadPhase === 2 && !assessmentsLoading && !cohortsLoading && !assignmentsLoading) {
      // Phase 2 complete, move to phase 3
      setLoadPhase(3);
    }
  }, [loadPhase, studentsLoading, mentorsLoading, programsLoading, tracksLoading, assessmentsLoading, cohortsLoading, assignmentsLoading]);

  // Extract data from API responses
  const totalStudents = totalStudentsData?.total || 0;
  const totalMentors = totalMentorsData?.total || 0;
  const programTotals = programTotalsData?.totals || {};
  const trackTotals = trackTotalsData?.totals || {};
  const internshipTracksData = internshipTracksApiData?.tracks || {};
  const mentorshipTracksData = mentorshipTracksApiData?.tracks || {};
  const mentorsByTrack = mentorsByTrackData?.mentorsByTrack || {};
  const webDevTotal = webDevTotalData?.total || 0;
  const summaryStatistics = summaryStatsData?.summary || {};
  const totalAssessments = totalAssessmentsData?.total || 0;
  const totalCohorts = totalCohortsData?.total || 0;
  const activeAssignments = activeAssignmentsData?.count || 0;
  const assessmentTotalsByProgram = assessmentTotalsByProgramData?.totals || {};
  const assessmentTotalsByType = assessmentTotalsByTypeData?.totals || {};

  // Calculate total enrolled students from program totals
  const totalEnrolledStudents = Object.values(programTotals).reduce((sum, val) => sum + val, 0);

  // Check for consistency between total students and enrolled students
  const totalsMatch = totalStudents === totalEnrolledStudents;
  if (!totalsMatch) {
    console.warn('Dashboard Totals Mismatch:', {
      totalStudents,
      totalEnrolledStudents,
      programTotals,
      difference: totalStudents - totalEnrolledStudents
    });
  }

  // Helper functions
  const getProgramCount = (programName) => programTotals[programName] || 0;
  const getTrackCount = (trackName) => trackTotals[trackName] || 0;
  const getTrackCountByProgram = (programName, trackName) => {
    // Use trackTotals as approximation since detailed breakdown is not available
    // This assumes tracks are mostly unique across programs
    return getTrackCount(trackName);
  };
  const getMentorCount = (trackName) => mentorsByTrack[trackName] || 0;

  // Normalize display fields for assessment/module/resource objects
  const getName = (item) => {
    if (!item) return '';
    return item.name || item.assessmentname || item.title || item.moduleName || item.resourceName || '';
  };

  const getDescription = (item) => {
    if (!item) return '';
    return item.description || item.instructions || item.details || item.summary || '';
  };

  // Data arrays
  // Programs
  const programs = [
    { name: 'Mentorship Program', key: 'Mentorship Program' },
    { name: 'Internship Program', key: 'Internship Program' },
    { name: 'Skill Development Program', key: 'Skill Development Program' },
    { name: 'Graduate Program', key: 'Graduate Program' }
  ];

  // Mentorship Tracks
  const mentorshipTracks = [
    { name: 'Web Development', key: 'Web Development' },
    { name: 'Java Programming', key: 'Java Programming' },
    { name: 'C# Programming', key: 'C# Programming' },
    { name: 'Python Programming', key: 'Python Programming' },
    { name: 'Robotics', key: 'Robotics' },
    { name: 'Compukids', key: 'Compukids' },
    { name: 'CompuTeens', key: 'CompuTeens' }
  ];

  // Internship Tracks - Fixed to match actual track names in database
  const internshipTracks = [
    { name: 'Web Development', key: 'Web Development' },
    { name: 'Java Programming', key: 'Java Programming' },
    { name: 'C# Programming', key: 'C# Programming' },
    { name: 'Python Programming', key: 'Python Programming' }
  ];

  // Skill Development Tracks
  const skillDevTracks = [
    { name: "Web Development", key: "Web Development" },
    { name: "Digital Entrepreneurship", key: "Digital Entrepreneurship" },
    { name: "Robotics", key: "Robotics" },
    { name: "Python Programming", key: "Python Programming" }
  ];

  // Calculate derived values
  const mentorshipTotal = mentorshipTracks.reduce((sum, track) => sum + getTrackCountByProgram('Mentorship Program', track.key), 0);
  const internshipTotal = internshipTracks.reduce((sum, track) => sum + getTrackCountByProgram('Internship Program', track.key), 0);
  const skillsDevTotal = getProgramCount('Skill Development Program');

  // Combined loading and error states
  const loading = studentsLoading || mentorsLoading || programsLoading || tracksLoading ||
                  internshipTracksLoading || mentorshipTracksLoading || mentorsTrackLoading || webDevLoading || summaryLoading ||
                  assessmentsLoading || cohortsLoading || assignmentsLoading || assessmentProgramsLoading || assessmentTypesLoading;

  const error = studentsError || mentorsError || programsError || tracksError ||
                internshipTracksError || mentorshipTracksError || mentorsTrackError || webDevError || summaryError ||
                assessmentsError || cohortsError || assignmentsError || assessmentProgramsError || assessmentTypesError;


  // Debug state changes
  useEffect(() => {
    console.log('Dashboard State Updated:', {
      totalStudents,
      totalMentors,
      programTotals,
      trackTotals,
      mentorshipTotal,
      webDevTotal,
      summaryStatistics
    });
  }, [totalStudents, totalMentors, programTotals, trackTotals, mentorshipTotal, webDevTotal, summaryStatistics]);

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = tokenManager.getToken();
        if (token) {
          // Verify token with backend
          const response = await authAPI.verifyToken();
          if (response.success) {
            setIsAuthenticated(true);
            setUserData(response.user);
          } else {
            tokenManager.removeToken();
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        tokenManager.removeToken();
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // Handle login success from AdminLogin component
  const handleLoginSuccess = (response) => {
    setIsAuthenticated(true);
    setUserData(response.user);
    tokenManager.setToken(response.token);
  };

  // Handle logout
  const handleLogout = () => {
    tokenManager.removeToken();
    setIsAuthenticated(false);
    setUserData(null);
  };

  // Auto-refresh every 60 seconds using hooks
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Help request action handlers
  const handleApproveRequest = async (requestId) => {
    try {
      const response = await fetch('/api/help-requests/approve', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenManager.getToken()}`
        },
        body: JSON.stringify({ id: requestId })
      });

      if (response.ok) {
        // Refresh the help requests data
        setLastUpdate(new Date());
        alert('Help request approved successfully!');
      } else {
        alert('Failed to approve help request.');
      }
    } catch (error) {
      console.error('Error approving help request:', error);
      alert('Error approving help request.');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const response = await fetch('/api/help-requests/reject', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenManager.getToken()}`
        },
        body: JSON.stringify({ id: requestId })
      });

      if (response.ok) {
        // Refresh the help requests data
        setLastUpdate(new Date());
        alert('Help request rejected.');
      } else {
        alert('Failed to reject help request.');
      }
    } catch (error) {
      console.error('Error rejecting help request:', error);
      alert('Error rejecting help request.');
    }
  };

  const handleResolveRequest = async (requestId) => {
    try {
      const response = await fetch('/api/help-requests/resolve', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenManager.getToken()}`
        },
        body: JSON.stringify({ id: requestId })
      });

      if (response.ok) {
        // Refresh the help requests data
        setLastUpdate(new Date());
        alert('Help request marked as resolved!');
      } else {
        alert('Failed to resolve help request.');
      }
    } catch (error) {
      console.error('Error resolving help request:', error);
      alert('Error resolving help request.');
    }
  };

  

  // If not authenticated, show login form
  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="dashboard">

      <header className="dashboard-header">
        <h1 className="dashboard-title">OnTrack Connect</h1>
        <h2 className="dashboard-subtitle">Admin Dashboard</h2>
        <div className="header-actions">
          <button
            className="logout-btn"
            onClick={handleLogout}
            title="Logout"
          >
            Logout
          </button>
          <button
            className="clear-cache-btn"
            onClick={() => {
              clearDashboardCache();
              window.location.reload();
            }}
            title="Clear cached data and refresh"
          >
            🔄 Clear Cache
          </button>
        </div>
      </header>

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p className="loading-text">Loading dashboard data...</p>
        </div>
      )}

      <div className="dashboard-content">
        {/* SECTION 1: KEY METRICS */}
        <div className="metrics-section">
          <div className="section-header">
            <h3>Key Metrics</h3>
            <div className="section-actions">
              <span className="auto-refresh-info">Auto-refreshes every 60 seconds</span>
            </div>
          </div>
          
          <div className="metrics-grid">
            <div className="metric-card primary">
              <div className="metric-icon">👥</div>
              <div className="metric-content">
                <div className="metric-title">Total Students</div>
                <div className="metric-value">
                  {loading ? '...' : totalStudents.toLocaleString()}
                </div>
                <div className="metric-subtitle">All Programs</div>
              </div>
            </div>

            <div className="metric-card success">
              <div className="metric-icon">👨‍🏫</div>
              <div className="metric-content">
                <div className="metric-title">Total Mentors</div>
                <div className="metric-value">
                  {loading ? '...' : totalMentors.toLocaleString()}
                </div>
                <div className="metric-subtitle">Active Mentors</div>
              </div>
            </div>

              <div className="metric-card info">
              <div className="metric-icon">📝</div>
              <div className="metric-content">
                <div className="metric-title">Total Assessments</div>
                <div className="metric-value">
                  {loading ? '...' : totalAssessments}
                </div>
                <div className="metric-subtitle">Completed</div>
              </div>
            </div>

            {/* 5. Total Cohorts */}
            <div className="metric-card secondary">
              <div className="metric-icon">👨‍👩‍👧‍👦</div>
              <div className="metric-content">
                <div className="metric-title">Total Cohorts</div>
                <div className="metric-value">
                  {loading ? '...' : totalCohorts}
                </div>
                <div className="metric-subtitle">Active Groups</div>
              </div>
            </div>

            {/* Assessment Totals by Program */}
            {Object.keys(assessmentTotalsByProgram).length > 0 && programs.map((program) => (
              <div className="metric-card warning" key={program.key}>
                <div className="metric-icon">📊</div>
                <div className="metric-content">
                  <div className="metric-title">{program.name} Assessments</div>
                  <div className="metric-value">
                    {loading ? '...' : assessmentTotalsByProgram[program.key] || 0}
                  </div>
                  <div className="metric-subtitle">Completed</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 1.5: PLATFORM ENGAGEMENT */}
        <div className="engagement-charts-section">
          <div className="section-header">
            <h3>Platform Engagement</h3>
          </div>
          <div className="charts-grid">
            {/* Bar Chart for Student Distribution by Program */}
            <div className="chart-card">
              <div className="chart-header">
                <h4>Student Distribution by Program</h4>
              </div>
              <div className="chart-container">
                <Bar
                  data={{
                    labels: Object.keys(programTotals),
                    datasets: [{
                      label: 'Students',
                      data: Object.values(programTotals),
                      backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40'
                      ],
                      borderColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40'
                      ],
                      borderWidth: 1
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `${context.label}: ${context.parsed.y}`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Pie Chart for Total Students per Track */}
            <div className="chart-card">
              <div className="chart-header">
                <h4>Total Students per Track</h4>
              </div>
              <div className="chart-container">
                <Pie
                  data={{
                    labels: Object.keys(trackTotals),
                    datasets: [{
                      data: Object.values(trackTotals),
                      backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40',
                        '#FF6384',
                        '#C9CBCF'
                      ],
                      hoverBackgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40',
                        '#FF6384',
                        '#C9CBCF'
                      ]
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
  {/* SECTION 3: ADDITIONAL DATA */}
        <div className="two-column-section">
          <div className="column">
            <div className="section-card">
              <div className="section-header">
                <h3>Course & Cohort Management</h3>
              </div>
              <div className="actions-grid">
                <a href="/manageinternship" className="action-btn secondary">
                  <span className="action-text">Manage Internship</span>
                </a>
                <a href="/manageskilldevelopment" className="action-btn secondary">
                  <span className="action-text">Manage Skills Dev</span>
                </a>
                <a href="/managementorship" className="action-btn secondary">
                  <span className="action-text">Manage Mentorship</span>
                </a>
                <a href="/managegraduate" className="action-btn secondary">
                  <span className="action-text">Manage Graduate</span>
                </a>
              </div>
            </div>
          </div>
        </div>
        {/* SECTION 3: PROGRAM DATA - 2 columns */}
        <div className="two-column-section">
          {/* Left Column: Student Programs */}
          <div className="column">
            <div className="section-card">
              <div className="section-header">
                <h3>Program Enrollment</h3>
              </div>
              <div className="data-grid">
                <div className="data-row total">
                  <span className="data-label">Total Registered Students</span>
                  <span className="data-value">
                    {loading ? '...' : totalStudents}
                  </span>
                </div>
                {programs.map((program) => (
                  <div className="data-row" key={program.key}>
                    <span className="data-label">{program.name}</span>
                    <span className="data-value">
                      {loading ? '...' : getProgramCount(program.key)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="section-card">
              <div className="section-header">
                <h3>Mentorship Track Distribution</h3>
                <p className="section-subtitle">Number of students in each track within Mentorship Program</p>
              </div>
              <div className="data-grid">
                {mentorshipTracks.map((track) => (
                  <div className="data-row" key={track.key}>
                    <span className="data-label">{track.name}</span>
                    <span className="data-value">
                      {loading ? '...' : mentorshipTracksData[track.key] || 0}
                    </span>
                  </div>
                ))}
              </div>
              <div className="section-total">
                <h4>Total in Mentorship Program:</h4>
                <span className="total-value">
                  {loading ? '...' : Object.values(mentorshipTracksData).reduce((sum, val) => sum + val, 0)}
                </span>
              </div>
            </div>

            <div className="section-card">
              <div className="section-header">
                <h3>Mentor Information</h3>
              </div>
              <div className="data-grid">
                <div className="data-row">
                  <span className="data-label">Total Mentors (All Programs)</span>
                  <span className="data-value">{loading ? '...' : totalMentors}</span>
                </div>
                <div className="data-row">
                  <span className="data-label">Mentors: Web Development</span>
                  <span className="data-value">{loading ? '...' : getMentorCount('Web Development')}</span>
                </div>
                <div className="data-row">
                  <span className="data-label">Mentors: Java Development</span>
                  <span className="data-value">{loading ? '...' : getMentorCount('Java Programming')}</span>
                </div>
                <div className="data-row">
                  <span className="data-label">Mentors: Python Development</span>
                  <span className="data-value">{loading ? '...' : getMentorCount('Python Programming')}</span>
                </div>
                <div className="data-row">
                  <span className="data-label">Mentors: C# Development</span>
                  <span className="data-value">{loading ? '...' : getMentorCount('C# Programming')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Quick Actions & Additional Data */}
          <div className="column">
            <div className="section-card">
              <div className="section-header">
                <h3>Quick Actions</h3>
              </div>
              <div className="actions-grid">
                <a href="/onboardstudent" className="action-btn">
                  <span className="action-icon">👤</span>
                  <span className="action-text">Onboard Student</span>
                </a>
                <a href="/onboardmentor" className="action-btn">
                  <span className="action-icon">👨‍🏫</span>
                  <span className="action-text">Onboard Mentor</span>
                </a>
                <a href="/studentassignment" className="action-btn">
                  <span className="action-icon">🔗</span>
                  <span className="action-text">Assign Student</span>
                </a>
                <a href="/assignmentor" className="action-btn">
                  <span className="action-icon">🤝</span>
                  <span className="action-text">Assign Mentor</span>
                </a>
                <a href="/resources" className="action-btn">
                  <span className="action-icon">📚</span>
                  <span className="action-text">Resource Center</span>
                </a>
                <a href="/announcements" className="action-btn">
                  <span className="action-icon">📣</span>
                  <span className="action-text">Announcements</span>
                </a>
                <a href="/events" className="action-btn">
                  <span className="action-icon">📅</span>
                  <span className="action-text">Events</span>
                </a>
                <a href="/help-requests" className="action-btn">
                  <span className="action-icon">🆘</span>
                  <span className="action-text">Help Requests</span>
                </a>
              </div>
            </div>

            <div className="section-card">
              <div className="section-header">
                <h3>Internship Track Distribution</h3>
              </div>
              <div className="data-grid">
                {internshipTracks.map((track) => (
                  <div className="data-row" key={track.key}>
                    <span className="data-label">{track.name}</span>
                    <span className="data-value">
                      {loading ? '...' : internshipTracksData[track.key] || 0}
                    </span>
                  </div>
                ))}
              </div>
              <div className="section-total">
                <h4>Total in Internship Program:</h4>
                <span className="total-value">
                  {loading ? '...' : Object.values(internshipTracksData).reduce((sum, val) => sum + val, 0)}
                </span>
              </div>
            </div>

            <div className="section-card">
              <div className="section-header">
                <h3>Skill Development Program</h3>
              </div>
              <div className="data-grid">
                <div className="data-row total">
                  <span className="data-label">Total Students</span>
                  <span className="data-value">
                    {loading ? '...' : skillsDevTotal}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>



      </div>
    </div>
  );
};

export default Dashboard;