import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ManageStudents from './onboardstudent';
import { tokenManager } from '../services/authMiddleware';

// Mock the authMiddleware
jest.mock('../services/authMiddleware', () => ({
  tokenManager: {
    getToken: jest.fn(() => 'mock-jwt-token'),
  },
  authAPI: {},
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('ManageStudents Component - Authentication Headers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful fetch responses
    fetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    );
  });

  test('loadStudents includes Authorization header', async () => {
    render(<ManageStudents />);

    // Wait for the component to load and call loadStudents
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/onboardstudents', {
        headers: {
          'Authorization': 'Bearer mock-jwt-token',
          'Content-Type': 'application/json'
        }
      });
    });
  });

  test('handleCreateSubmit includes Authorization header', async () => {
    render(<ManageStudents />);

    // Fill out the form
    fireEvent.change(screen.getByPlaceholderText('Enter first name'), {
      target: { value: 'John' }
    });
    fireEvent.change(screen.getByPlaceholderText('Enter last name'), {
      target: { value: 'Doe' }
    });
    fireEvent.change(screen.getByPlaceholderText('student@example.com'), {
      target: { value: 'john.doe@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText('0122342569'), {
      target: { value: '0123456789' }
    });
    fireEvent.change(screen.getByPlaceholderText('Enter Username'), {
      target: { value: 'johndoe' }
    });
    fireEvent.change(screen.getByPlaceholderText('Enter Password'), {
      target: { value: 'Password123!' }
    });

    // Select program and track
    fireEvent.change(screen.getByDisplayValue('-- Select Program --'), {
      target: { value: 'Mentorship Program' }
    });
    fireEvent.change(screen.getByDisplayValue('-- Select Track --'), {
      target: { value: 'Web Development' }
    });

    // Mock successful creation response
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    );

    // Click create button
    fireEvent.click(screen.getByText('➕ Create Student'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/onboardstudents/onboardstudent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token'
        },
        body: JSON.stringify({
          name: 'John',
          surname: 'Doe',
          email: 'john.doe@example.com',
          cellnumber: '0123456789',
          username: 'johndoe',
          password: 'Password123!',
          program: 'Mentorship Program',
          track: 'Web Development'
        })
      });
    });
  });

  test('loadStudentsForUpdate includes Authorization header', async () => {
    render(<ManageStudents />);

    // Switch to update tab
    fireEvent.click(screen.getByText('Update Students'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/onboardstudents', {
        headers: {
          'Authorization': 'Bearer mock-jwt-token',
          'Content-Type': 'application/json'
        }
      });
    });
  });

  test('updateStudent includes Authorization header', async () => {
    // Mock students data
    const mockStudents = [{
      _id: '123',
      name: 'John',
      surname: 'Doe',
      email: 'john.doe@example.com',
      cellnumber: '0123456789',
      program: 'Mentorship Program',
      track: 'Web Development',
      accessAllowed: 'granted'
    }];

    fetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockStudents),
      })
    );

    render(<ManageStudents />);

    // Switch to update tab
    fireEvent.click(screen.getByText('Update Students'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/onboardstudents', expect.any(Object));
    });

    // Mock successful update response
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    );

    // Click save button (assuming student data is loaded)
    const saveButtons = screen.getAllByText('💾 Save');
    if (saveButtons.length > 0) {
      fireEvent.click(saveButtons[0]);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/onboardstudents/123', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-jwt-token'
          },
          body: expect.any(String)
        });
      });
    }
  });

  test('deleteStudent includes Authorization header', async () => {
    // Mock students data
    const mockStudents = [{
      _id: '123',
      name: 'John',
      surname: 'Doe',
      email: 'john.doe@example.com',
      program: 'Mentorship Program',
      track: 'Web Development'
    }];

    fetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockStudents),
      })
    );

    render(<ManageStudents />);

    // Switch to delete tab
    fireEvent.click(screen.getByText('Delete Student'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/onboardstudents', expect.any(Object));
    });

    // Mock successful delete response
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    );

    // Click delete button
    const deleteButtons = screen.getAllByText('🗑️ Delete');
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/onboardstudents/123', {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer mock-jwt-token',
            'Content-Type': 'application/json'
          }
        });
      });
    }
  });

  test('handles authentication errors gracefully', async () => {
    // Mock failed authentication response
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Unauthorized' }),
      })
    );

    render(<ManageStudents />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load students.')).toBeInTheDocument();
    });
  });

  test('handles network errors gracefully', async () => {
    // Mock network error
    fetch.mockImplementationOnce(() =>
      Promise.reject(new Error('Network error'))
    );

    render(<ManageStudents />);

    await waitFor(() => {
      expect(screen.getByText('Network error loading students.')).toBeInTheDocument();
    });
  });
});
