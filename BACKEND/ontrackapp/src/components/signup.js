import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import './Signup.css';
import { NavLink } from 'react-router-dom';

function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    cellNumber: '',
    course: '',
    program: '',
    track: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.surname) newErrors.surname = 'Surname is required';
    
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    
    if (!formData.cellNumber) newErrors.cellNumber = 'Cell number is required';
    else if (!/^[0-9+-\s]+$/.test(formData.cellNumber)) newErrors.cellNumber = 'Cell number is invalid';
    
    if (!formData.course) newErrors.course = 'Course selection is required';
    if (!formData.program) newErrors.program = 'Program selection is required';
    if (!formData.track) newErrors.track = 'Track selection is required';
    
    if (!formData.username) newErrors.username = 'Username is required';
    else if (formData.username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    return newErrors;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
    } else {
      setErrors({});
      console.log('Sign up attempted with:', formData);
      // Here you would typically send a request to your server
    }
  };

  return (
  <div className="signup-container">
  <div className="signup-wrapper">
    <div className="signup-card">
      {/* Header Section */}
      <div className="signup-header">
        <div className="logo-container">
          <h1 className="brand-title">ONTRACK</h1>
          <h2 className="brand-subtitle">CONNECT</h2>
        </div>
        <p className="welcome-text">Start your professional journey with us</p>
      </div>

      {/* Signup Form */}
      <div className="signup-form-section">
        <h3 className="form-title">Create Your Account</h3>
        
        <Form onSubmit={handleSubmit} className="signup-form">
          {/* First Row - Name and Surname */}
          <div className="form-row">
            <Form.Group className="form-group" controlId="formBasicName">
              <Form.Label className="form-label">First Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                placeholder="Enter your first name"
                value={formData.name}
                onChange={handleChange}
                isInvalid={!!errors.name}
                className="form-input"
              />
              <Form.Control.Feedback type="invalid" className="error-feedback">
                {errors.name}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="form-group" controlId="formBasicSurname">
              <Form.Label className="form-label">Last Name</Form.Label>
              <Form.Control
                type="text"
                name="surname"
                placeholder="Enter your last name"
                value={formData.surname}
                onChange={handleChange}
                isInvalid={!!errors.surname}
                className="form-input"
              />
              <Form.Control.Feedback type="invalid" className="error-feedback">
                {errors.surname}
              </Form.Control.Feedback>
            </Form.Group>
          </div>

          {/* Second Row - Email and Cell Number */}
          <div className="form-row">
            <Form.Group className="form-group" controlId="formBasicEmail">
              <Form.Label className="form-label">Email Address</Form.Label>
              <Form.Control
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                isInvalid={!!errors.email}
                className="form-input"
              />
              <Form.Control.Feedback type="invalid" className="error-feedback">
                {errors.email}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="form-group" controlId="formBasicCell">
              <Form.Label className="form-label">Phone Number</Form.Label>
              <Form.Control
                type="tel"
                name="cellNumber"
                placeholder="Enter your phone number"
                value={formData.cellNumber}
                onChange={handleChange}
                isInvalid={!!errors.cellNumber}
                className="form-input"
              />
              <Form.Control.Feedback type="invalid" className="error-feedback">
                {errors.cellNumber}
              </Form.Control.Feedback>
            </Form.Group>
          </div>

          {/* Third Row - Course, Program, and Track */}
          <div className="form-row">
            <Form.Group className="form-group" controlId="formBasicCourse">
              <Form.Label className="form-label">Select Program</Form.Label>
              <Form.Select
                name="course"
                value={formData.course}
                onChange={handleChange}
                isInvalid={!!errors.course}
                className="form-input"
              >
                <option value="">Choose your course...</option>
                <option value="Mentorship Program">Mentorship Program</option>
                <option value="Internship Program">Internship Program</option>
                <option value="Skills Development Program">Skills Development Program</option>
                <option value="Graduate Program">Graduate Program</option>
                <option value="CompuKids">CompuKids</option>
                <option value="CompuTeens">CompuTeens</option>
               <option value="Digital Entreperneurship">Digital Entreperneurship</option>

              </Form.Select>
              <Form.Control.Feedback type="invalid" className="error-feedback">
                {errors.course}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="form-group" controlId="formBasicProgram">
              <Form.Label className="form-label">Select Track</Form.Label>
              <Form.Select
                name="program"
                value={formData.program}
                onChange={handleChange}
                isInvalid={!!errors.program}
                className="form-input"
              >
                <option value="Web Development">Web Development</option>
                <option value="C# Programming">C# Programming</option>
                <option value="Java Programming">Java Programming</option>
                <option value="Python Development">Python Development</option>
                <option value="Robotics">Robotics</option>
              </Form.Select>
              <Form.Control.Feedback type="invalid" className="error-feedback">
                {errors.program}
              </Form.Control.Feedback>
            </Form.Group>
        

          {/* Fourth Row - Track and Username */}
          <div className="form-row">
      

            <Form.Group className="form-group" controlId="formBasicUsername">
              <Form.Label className="form-label">Username</Form.Label>
              <Form.Control
                type="text"
                name="username"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleChange}
                isInvalid={!!errors.username}
                className="form-input"
              />
              <Form.Control.Feedback type="invalid" className="error-feedback">
                {errors.username}
              </Form.Control.Feedback>
            </Form.Group>
          </div>  </div>

          {/* Fifth Row - Password and Confirm Password */}
          <div className="form-row">
            <Form.Group className="form-group" controlId="formBasicPassword">
              <Form.Label className="form-label">Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                isInvalid={!!errors.password}
                className="form-input"
              />
              <Form.Control.Feedback type="invalid" className="error-feedback">
                {errors.password}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="form-group" controlId="formBasicConfirmPassword">
              <Form.Label className="form-label">Confirm Password</Form.Label>
              <Form.Control
                type="password"
                name="confirmPassword"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                isInvalid={!!errors.confirmPassword}
                className="form-input"
              />
              <Form.Control.Feedback type="invalid" className="error-feedback">
                {errors.confirmPassword}
              </Form.Control.Feedback>
            </Form.Group>
          </div>

          {/* Submit Button */}
          <Button 
            variant="primary" 
            type="submit" 
            className="signup-button"
            size="lg"
          >
            Create Account
          </Button>

          {/* Login Redirect */}
          <div className="login-redirect">
            <p>Already have an account?</p>
            <NavLink to="/SignIn" className="login-link">
              <Button 
                variant="outline-primary" 
                type="button" 
                className="login-redirect-button"
              >
                Sign In to Your Account
              </Button>
            </NavLink>
          </div>
        </Form>
      </div>
    </div>
  </div>
</div>
  );
}

export default SignUp;