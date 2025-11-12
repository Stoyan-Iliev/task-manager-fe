import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import { useEffect } from 'react';
import type { RootState, AppDispatch } from '../redux/store';
import { setUser, clearUser } from '../redux/userSlice';
import { clearOrganization } from '../redux/organizationSlice';
import { useLogin, useSignup, useLogout } from '../api/auth';
import { useCreateOrganization } from '../api/organizations';
import { getAccessToken, getRefreshToken, clearTokens } from '../api/client';
import type { LoginRequest, SignUpRequest } from '../types/auth.types';
import toast from 'react-hot-toast';

/**
 * Custom hook for authentication
 * Provides authentication state and methods
 */
export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.user.details);
  const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);

  // Initialize: Verify tokens and user data are in sync
  useEffect(() => {
    const hasTokens = !!(getAccessToken() && getRefreshToken());
    const hasUserData = !!user;

    // If we have tokens but no user data, clear tokens
    // (This can happen if localStorage is manually edited)
    if (hasTokens && !hasUserData) {
      clearTokens();
    }

    // If we have user data but no tokens, clear user data
    // (This can happen if tokens expire while the tab is open)
    if (!hasTokens && hasUserData) {
      dispatch(clearUser());
      dispatch(clearOrganization());
    }
  }, [user, dispatch]);

  const loginMutation = useLogin();
  const signupMutation = useSignup();
  const logoutMutation = useLogout();
  const createOrganizationMutation = useCreateOrganization();

  /**
   * Login user
   */
  const login = async (credentials: LoginRequest) => {
    try {
      const response = await loginMutation.mutateAsync(credentials);

      // Update Redux with user details (no tokens)
      dispatch(setUser(response.user));

      // Navigate to dashboard
      navigate('/');
    } catch (error) {
      // Error is already handled by the mutation's onError
      throw error;
    }
  };

  /**
   * Sign up new user
   */
  const signup = async (data: SignUpRequest) => {
    try {
      const response = await signupMutation.mutateAsync(data);

      // Update Redux with user details (no tokens)
      dispatch(setUser(response.user));

      // Auto-create personal organization for new user
      try {
        const orgName = `${response.user.username}'s Organization`;
        const orgResponse = await createOrganizationMutation.mutateAsync({
          name: orgName,
          description: 'My personal workspace',
        });

        // Show notification about the created organization
        toast.success(
          `Welcome! We've created "${orgResponse.name}" for you. You can rename it in Organization Settings.`,
          { duration: 6000, position: 'top-center' }
        );
      } catch (orgError) {
        // If organization creation fails, log it but don't block the signup flow
        toast('You can create an organization from the header menu.', {
          duration: 5000,
        });
      }

      // Navigate to dashboard
      navigate('/');
    } catch (error) {
      // Error is already handled by the mutation's onError
      throw error;
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    const refreshToken = getRefreshToken();

    if (refreshToken) {
      try {
        await logoutMutation.mutateAsync({ refreshToken });
      } catch (error) {
        // Error is already handled by the mutation's onError
      }
    }

    // Clear user and organization from Redux
    dispatch(clearUser());
    dispatch(clearOrganization());

    // Navigate to login
    navigate('/login');
  };

  /**
   * Check if user has a valid access token
   */
  const hasValidToken = (): boolean => {
    return !!getAccessToken();
  };

  return {
    user,
    isAuthenticated: isAuthenticated && hasValidToken(),
    isLoading: loginMutation.isPending || signupMutation.isPending || logoutMutation.isPending,
    login,
    signup,
    logout,
    hasValidToken,
  };
};
