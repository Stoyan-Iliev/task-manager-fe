/**
 * TokenRefreshManager - Handles proactive token refresh before expiration
 *
 * This manager:
 * 1. Schedules token refresh ~1 minute before access token expires
 * 2. Emits events when tokens change (for WebSocket reconnection)
 * 3. Handles browser visibility changes (refresh on tab focus if needed)
 * 4. Prevents multiple concurrent refresh attempts
 */

import axios from 'axios';

// Event types for token lifecycle
export type TokenEventType = 'TOKEN_REFRESHED' | 'TOKEN_EXPIRED' | 'TOKEN_CLEARED';

export interface TokenEvent {
  type: TokenEventType;
  accessToken?: string;
}

type TokenEventListener = (event: TokenEvent) => void;

// Configuration
const REFRESH_BUFFER_SECONDS = 60; // Refresh 60 seconds before expiry
const MIN_REFRESH_INTERVAL_MS = 10000; // Minimum 10 seconds between refresh attempts

class TokenRefreshManager {
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private expiresAt: number | null = null;
  private isRefreshing = false;
  private lastRefreshAttempt = 0;
  private listeners: Set<TokenEventListener> = new Set();

  // These will be set by client.ts to avoid circular dependencies
  private getRefreshToken: (() => string | null) | null = null;
  private setTokensCallback: ((access: string, refresh: string, expiresIn?: number) => void) | null = null;
  private clearTokensCallback: (() => void) | null = null;
  private apiBaseUrl: string = '';

  /**
   * Initialize the manager with token access callbacks
   */
  initialize(config: {
    getRefreshToken: () => string | null;
    setTokens: (access: string, refresh: string, expiresIn?: number) => void;
    clearTokens: () => void;
    apiBaseUrl: string;
  }) {
    this.getRefreshToken = config.getRefreshToken;
    this.setTokensCallback = config.setTokens;
    this.clearTokensCallback = config.clearTokens;
    this.apiBaseUrl = config.apiBaseUrl;

    // Handle browser visibility changes
    this.setupVisibilityHandler();
  }

  /**
   * Subscribe to token events
   */
  subscribe(listener: TokenEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Emit token event to all listeners
   */
  private emit(event: TokenEvent) {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('TokenRefreshManager: Error in listener', error);
      }
    });
  }

  /**
   * Start the refresh timer based on token expiration
   * @param expiresInSeconds - Seconds until token expires (from server response)
   */
  startRefreshTimer(expiresInSeconds: number) {
    this.stopRefreshTimer();

    // Calculate when to refresh (1 minute before expiry)
    const refreshInSeconds = Math.max(expiresInSeconds - REFRESH_BUFFER_SECONDS, 5);
    const refreshInMs = refreshInSeconds * 1000;

    // Store expiration time for visibility change handling
    this.expiresAt = Date.now() + (expiresInSeconds * 1000);

    console.log(`TokenRefreshManager: Scheduling refresh in ${refreshInSeconds} seconds (token expires in ${expiresInSeconds}s)`);

    this.refreshTimer = setTimeout(() => {
      this.performProactiveRefresh();
    }, refreshInMs);
  }

  /**
   * Stop the refresh timer
   */
  stopRefreshTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.expiresAt = null;
  }

  /**
   * Perform proactive token refresh before expiration
   */
  private async performProactiveRefresh(): Promise<boolean> {
    // Prevent concurrent refresh attempts
    if (this.isRefreshing) {
      console.log('TokenRefreshManager: Already refreshing, skipping');
      return false;
    }

    // Rate limiting - prevent too frequent refresh attempts
    const now = Date.now();
    if (now - this.lastRefreshAttempt < MIN_REFRESH_INTERVAL_MS) {
      console.log('TokenRefreshManager: Too soon since last refresh attempt');
      return false;
    }

    if (!this.getRefreshToken || !this.setTokensCallback || !this.clearTokensCallback) {
      console.error('TokenRefreshManager: Not initialized');
      return false;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      console.log('TokenRefreshManager: No refresh token available');
      return false;
    }

    this.isRefreshing = true;
    this.lastRefreshAttempt = now;

    try {
      console.log('TokenRefreshManager: Performing proactive token refresh...');

      const response = await axios.post(
        `${this.apiBaseUrl}/api/auth/refresh`,
        { refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            'Pragma': 'no-cache',
          },
        }
      );

      // Unwrap ApiResponse format (backend returns { success: true, data: { ... } })
      const responseData = response.data.success ? response.data.data : response.data;
      const { accessToken: newAccessToken, refreshToken: newRefreshToken, expiresIn } = responseData;

      if (!newAccessToken || !newRefreshToken) {
        throw new Error('Invalid refresh response: missing tokens');
      }

      // Update tokens (this will also restart the refresh timer)
      this.setTokensCallback(newAccessToken, newRefreshToken, expiresIn);

      // Emit event for WebSocket and other listeners
      this.emit({ type: 'TOKEN_REFRESHED', accessToken: newAccessToken });

      console.log('TokenRefreshManager: Proactive refresh successful');
      return true;
    } catch (error) {
      console.error('TokenRefreshManager: Proactive refresh failed', error);

      // Emit expiration event
      this.emit({ type: 'TOKEN_EXPIRED' });

      // Clear tokens and let the app handle redirect
      this.clearTokensCallback();
      this.stopRefreshTimer();

      // Redirect to login
      window.location.href = '/signin';
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Handle browser visibility changes
   * When user returns to tab, check if token needs refresh
   */
  private setupVisibilityHandler() {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.handleTabFocus();
      }
    });
  }

  /**
   * Check token state when tab becomes visible
   */
  private handleTabFocus() {
    if (!this.expiresAt || !this.getRefreshToken) return;

    const now = Date.now();
    const timeUntilExpiry = this.expiresAt - now;

    // If token is expired or will expire within buffer time, refresh immediately
    if (timeUntilExpiry <= REFRESH_BUFFER_SECONDS * 1000) {
      console.log('TokenRefreshManager: Token expired/expiring after tab focus, refreshing...');
      this.performProactiveRefresh();
    } else {
      // Token is still valid, but restart timer with correct remaining time
      const remainingSeconds = Math.floor(timeUntilExpiry / 1000);
      console.log(`TokenRefreshManager: Tab focused, token valid for ${remainingSeconds}s`);
      this.startRefreshTimer(remainingSeconds);
    }
  }

  /**
   * Called when tokens are cleared (logout)
   */
  onTokensCleared() {
    this.stopRefreshTimer();
    this.emit({ type: 'TOKEN_CLEARED' });
  }

  /**
   * Get whether refresh is in progress
   */
  get refreshInProgress(): boolean {
    return this.isRefreshing;
  }

  /**
   * Get time until token expires (in ms), or null if unknown
   */
  getTimeUntilExpiry(): number | null {
    if (!this.expiresAt) return null;
    return Math.max(0, this.expiresAt - Date.now());
  }
}

// Export singleton instance
export const tokenRefreshManager = new TokenRefreshManager();
