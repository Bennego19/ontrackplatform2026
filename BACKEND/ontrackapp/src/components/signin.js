import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { authAPI, tokenManager } from "../services/authMiddleware";

const SignIn = () => {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if user is already authenticated
  useEffect(() => {
    const token = tokenManager.getToken();
    const storedUser = tokenManager.getStoredUser();
    if (token && storedUser) {
      navigate('/userdashboard');
    }
  }, [navigate]);

  const handleLogin = async (event) => {
    event.preventDefault();

    // Client-side validation
    if (!loginData.username.trim()) {
      setError('Username is required');
      return;
    }
    if (!loginData.password.trim()) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const loginResult = await authAPI.login(loginData.username, loginData.password);
      tokenManager.setToken(loginResult.token);
      const userDataFromResponse = loginResult.user || loginResult;
      const transformedUser = {
        name: `${userDataFromResponse.name || ''} ${userDataFromResponse.surname || ''}`.trim(),
        username: userDataFromResponse.username,
        email: userDataFromResponse.email,
        program: userDataFromResponse.program,
        track: userDataFromResponse.track,
        semester: new Date(userDataFromResponse.createdAt).toLocaleDateString(),
        registrationMonth: userDataFromResponse.registrationMonth || "Not specified",
        studentId: userDataFromResponse.username,
        cohort: `${userDataFromResponse.program} ${new Date().getFullYear()}`,
        startDate: userDataFromResponse.createdAt ?
          new Date(userDataFromResponse.createdAt).toLocaleDateString() : "Not specified",
        cellnumber: userDataFromResponse.cellnumber || "Not provided"
      };
      tokenManager.setStoredUser(transformedUser);
      navigate('/userdashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setLoginData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError('');
  };

  const styles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: "'Poppins', 'Inter', system-ui, sans-serif",
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    },
    card: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      padding: '40px',
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
      width: '100%',
      maxWidth: '420px',
      backdropFilter: 'blur(20px)',
      position: 'relative',
      zIndex: '1',
      animation: 'slideUp 0.6s ease-out'
    },
    title: {
      fontSize: '32px',
      fontWeight: '800',
      color: '#1a202c',
      marginBottom: '12px',
      textAlign: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      letterSpacing: '-0.02em'
    },
    subtitle: {
      fontSize: '18px',
      color: '#4a5568',
      marginBottom: '32px',
      textAlign: 'center',
      fontWeight: '500',
      lineHeight: '1.4'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    },
    input: {
      width: '100%',
      padding: '18px 24px',
      border: '2px solid #e2e8f0',
      borderRadius: '16px',
      fontSize: '16px',
      boxSizing: 'border-box',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      fontFamily: 'inherit',
      backgroundColor: '#ffffff',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.08)',
      outline: 'none'
    },
    inputFocus: {
      borderColor: '#667eea',
      boxShadow: '0 0 0 6px rgba(102, 126, 234, 0.15), 0 8px 16px rgba(0, 0, 0, 0.12)',
      transform: 'translateY(-2px)'
    },
    button: {
      width: '100%',
      padding: '18px 24px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#ffffff',
      border: 'none',
      borderRadius: '16px',
      fontSize: '18px',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      fontFamily: 'inherit',
      boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)',
      position: 'relative',
      overflow: 'hidden'
    },
    buttonHover: {
      background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
      transform: 'translateY(-3px)',
      boxShadow: '0 12px 28px rgba(102, 126, 234, 0.5)'
    },
    buttonDisabled: {
      backgroundColor: '#a0aec0',
      cursor: 'not-allowed',
      transform: 'none',
      boxShadow: 'none'
    },
    error: {
      background: 'linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%)',
      color: '#c53030',
      padding: '16px',
      borderRadius: '12px',
      marginBottom: '16px',
      border: '1px solid #feb2b2',
      fontSize: '14px',
      lineHeight: '1.5',
      boxShadow: '0 4px 12px rgba(197, 48, 48, 0.15)',
      animation: 'shake 0.5s ease-in-out'
    },
    signupLink: {
      textAlign: 'center',
      marginTop: '24px',
      color: '#4a5568',
      fontSize: '14px'
    },
    signupButton: {
      background: 'none',
      border: 'none',
      color: '#667eea',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      textDecoration: 'underline',
      marginLeft: '4px'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Student Portal</h1>
        <p style={styles.subtitle}>
          Sign in to access your learning dashboard
        </p>
        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="text"
            placeholder="Enter your username"
            value={loginData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            style={styles.input}
            required
            disabled={loading}
            onFocus={(e) => {
              e.target.style.borderColor = styles.inputFocus.borderColor;
              e.target.style.boxShadow = styles.inputFocus.boxShadow;
              e.target.style.transform = styles.inputFocus.transform;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = styles.input.borderColor;
              e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.08)';
              e.target.style.transform = 'none';
            }}
          />
          <input
            type="password"
            placeholder="Enter your password"
            value={loginData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            style={styles.input}
            required
            disabled={loading}
            onFocus={(e) => {
              e.target.style.borderColor = styles.inputFocus.borderColor;
              e.target.style.boxShadow = styles.inputFocus.boxShadow;
              e.target.style.transform = styles.inputFocus.transform;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = styles.input.borderColor;
              e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.08)';
              e.target.style.transform = 'none';
            }}
          />
          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {})
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.background = styles.buttonHover.background;
                e.target.style.transform = styles.buttonHover.transform;
                e.target.style.boxShadow = styles.buttonHover.boxShadow;
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.background = styles.button.background;
                e.target.style.transform = 'none';
                e.target.style.boxShadow = styles.button.boxShadow;
              }
            }}
          >
            {loading ? (
              <>
                <div style={{
                  display: 'inline-block',
                  width: '16px',
                  height: '16px',
                  border: '2px solid transparent',
                  borderTop: '2px solid currentColor',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: '8px'
                }}></div>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        <div style={styles.signupLink}>
          Don't have an account?
          <button
            onClick={() => navigate('/SignUp')}
            style={styles.signupButton}
          >
            Sign Up
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SignIn;
