// tests/frontend/LoginPage.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../../frontend/src/LoginPage';
import { UserContext } from '../../frontend/src/UserContext';

const mockLogin = jest.fn();
const mockNavigate = jest.fn();

// Mock react-router-dom's useNavigate
jest.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate
}));

describe('LoginPage', () => {
    beforeEach(() => {
        mockLogin.mockClear();
        mockNavigate.mockClear();
        global.fetch = jest.fn();
    });

    test('successful login calls UserContext.login and navigates home', async () => {
        render(
            <UserContext.Provider value={{ login: mockLogin }}>
                <LoginPage />
            </UserContext.Provider>
        );

        // Fill form
        fireEvent.change(screen.getByPlaceholderText(/email/i), {
            target: { value: 'user@example.com' }
        });
        fireEvent.change(screen.getByPlaceholderText(/password/i), {
            target: { value: 'secret123' }
        });

        // Mock backend login success
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ email: 'user@example.com', token: 'fake-jwt-token' })
        });

        fireEvent.click(screen.getByRole('button', { name: /login/i }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'fake-jwt-token');
        });

        expect(mockNavigate).toHaveBeenCalledWith('/');
    });
});
