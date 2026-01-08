import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';

import { NavLink } from 'react-router-dom';

function CreateMentor() {
  const [formData, setForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    cellNumber: "",
   cohort: "",
    program:"",
    track: "",
    username:"",
    password: ""
  });
  
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstname) newErrors.firstname = 'First name is required';
    if (!formData.lastname) newErrors.lastname = 'Last name is required';

    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';

    if (!formData.cellNumber) newErrors.cellNumber = 'Cell number is required';
    else if (!/^[0-9+-\s]+$/.test(formData.cellNumber)) newErrors.cellNumber = 'Cell number is invalid';

    if (!formData.cohort) newErrors.cohort = 'Cohort selection is required';
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
    <div className="login-wrapper">
      <div className="login-form-container">
        <h2 className="login-title">Create An Account</h2>
        <Form onSubmit={handleSubmit} className="login-form">
          {/* First Row - Name and Surname */}
          <div className="form-grid">
            <Form.Group className="mb-3" controlId="formBasicName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                isInvalid={!!errors.name}
              />
              <Form.Control.Feedback type="invalid">
                {errors.name}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicSurname">
              <Form.Label>Surname</Form.Label>
              <Form.Control
                type="text"
                name="surname"
                placeholder="Enter your surname"
                value={formData.surname}
                onChange={handleChange}
                isInvalid={!!errors.surname}
              />
              <Form.Control.Feedback type="invalid">
                {errors.surname}
              </Form.Control.Feedback>
            </Form.Group>
          </div>

          {/* Second Row - Email and Cell Number */}
          <div className="form-grid">
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>Email address</Form.Label>
              <Form.Control
                type="email"
                name="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={handleChange}
                isInvalid={!!errors.email}
              />
              <Form.Control.Feedback type="invalid">
                {errors.email}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicCell">
              <Form.Label>Cell Number</Form.Label>
              <Form.Control
                type="tel"
                name="cellNumber"
                placeholder="Enter cell number"
                value={formData.cellNumber}
                onChange={handleChange}
                isInvalid={!!errors.cellNumber}
              />
              <Form.Control.Feedback type="invalid">
                {errors.cellNumber}
              </Form.Control.Feedback>
            </Form.Group>
          </div>

          {/* Third Row - Course, Program, and Track */}
          <div className="form-grid">
            <Form.Group className="mb-3" controlId="formBasicCourse">
              <Form.Label>Select Course</Form.Label>
              <Form.Select
                name="course"
                value={formData.course}
                onChange={handleChange}
                isInvalid={!!errors.course}
              >
                <option value="">Choose a course...</option>
                <option value="computer-science">Computer Science</option>
                <option value="engineering">Engineering</option>
                <option value="business">Business</option>
                <option value="design">Design</option>
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {errors.course}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicProgram">
              <Form.Label>Select Program</Form.Label>
              <Form.Select
                name="program"
                value={formData.program}
                onChange={handleChange}
                isInvalid={!!errors.program}
              >
                <option value="">Choose a program...</option>
                <option value="undergraduate">Undergraduate</option>
                <option value="postgraduate">Postgraduate</option>
                <option value="diploma">Diploma</option>
                <option value="certificate">Certificate</option>
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {errors.program}
              </Form.Control.Feedback>
            </Form.Group>
          </div>

          {/* Fourth Row - Track and Username */}
          <div className="form-grid">
            <Form.Group className="mb-3" controlId="formBasicTrack">
              <Form.Label>Select Track</Form.Label>
              <Form.Select
                name="track"
                value={formData.track}
                onChange={handleChange}
                isInvalid={!!errors.track}
              >
                <option value="">Choose a track...</option>
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="online">Online</option>
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {errors.track}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicUsername">
              <Form.Label>Create User Name</Form.Label>
              <Form.Control
                type="text"
                name="username"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleChange}
                isInvalid={!!errors.username}
              />
              <Form.Control.Feedback type="invalid">
                {errors.username}
              </Form.Control.Feedback>
            </Form.Group>
          </div>

          {/* Fifth Row - Password and Confirm Password */}
          <div className="form-grid">
            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                isInvalid={!!errors.password}
              />
              <Form.Control.Feedback type="invalid">
                {errors.password}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicConfirmPassword">
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control
                type="password"
                name="confirmPassword"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
                isInvalid={!!errors.confirmPassword}
              />
              <Form.Control.Feedback type="invalid">
                {errors.confirmPassword}
              </Form.Control.Feedback>
            </Form.Group>
          </div>

          <Button variant="primary" type="submit" className="login-button">
            Create An Account
          </Button>
              <NavLink to="/SignIn">
          <Button variant="outline-primary" type="button" className="login-button" style={{marginTop: '10px'}}>
            Have An Account already? Log In
          </Button>
        </NavLink>
        </Form>
      </div>
    </div>
  );
}

export default CreateMentor;