import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import type { StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import { notificationKeys } from '../api/notifications';
import { getAccessToken, tokenRefreshManager } from '../api/client';
import toast from 'react-hot-toast';
import type { NotificationMessage } from '../types/notification.types';

interface WebSocketContextType {
  connected: boolean;
  subscribe: (destination: string, callback: (message: any) => void) => void;
  unsubscribe: (destination: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<Map<string, StompSubscription>>(new Map());
  const queryClient = useQueryClient();
  const isReconnectingRef = useRef(false);

  const user = useSelector((state: RootState) => state.user.details);
  const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);

  /**
   * Create and activate a new WebSocket client
   */
  const createClient = useCallback((accessToken: string) => {
    console.log('WebSocket: Creating new client with fresh token');

    const client = new Client({
      webSocketFactory: () =>
        new SockJS(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/ws`),
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      debug: (str) => {
        console.log('STOMP: ' + str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log('WebSocket: Connected successfully');
      setConnected(true);
      isReconnectingRef.current = false;

      // Subscribe to user-specific notification queue
      const subscription = client.subscribe(
        `/user/queue/notifications`,
        (message) => {
          try {
            const notification: NotificationMessage = JSON.parse(message.body);
            console.log('WebSocket: Received notification:', notification);

            // Show toast notification
            toast.success(notification.message, {
              duration: 5000,
              position: 'top-right',
              icon: '🔔',
            });

            // Invalidate notification queries to trigger refetch
            queryClient.invalidateQueries({ queryKey: notificationKeys.all });
          } catch (error) {
            console.error('WebSocket: Error processing notification:', error);
          }
        }
      );

      subscriptionsRef.current.set('/user/queue/notifications', subscription);
      console.log('WebSocket: Subscribed to user notification queue');
    };

    client.onDisconnect = () => {
      console.log('WebSocket: Disconnected');
      setConnected(false);
      subscriptionsRef.current.clear();
    };

    client.onStompError = (frame) => {
      console.error('WebSocket: STOMP error:', frame.headers['message']);
      console.error('WebSocket: Error details:', frame.body);
    };

    client.onWebSocketError = (event) => {
      console.error('WebSocket: Connection error:', event);
    };

    return client;
  }, [queryClient]);

  /**
   * Disconnect the current client
   */
  const disconnectClient = useCallback(() => {
    if (clientRef.current) {
      console.log('WebSocket: Disconnecting current client');
      clientRef.current.deactivate();
      clientRef.current = null;
    }
    subscriptionsRef.current.clear();
    setConnected(false);
  }, []);

  /**
   * Reconnect WebSocket with new token
   */
  const reconnectWithNewToken = useCallback((newAccessToken: string) => {
    if (isReconnectingRef.current) {
      console.log('WebSocket: Already reconnecting, skipping');
      return;
    }

    isReconnectingRef.current = true;
    console.log('WebSocket: Reconnecting with new token after refresh');

    // Disconnect existing client
    disconnectClient();

    // Create and activate new client with fresh token
    const newClient = createClient(newAccessToken);
    newClient.activate();
    clientRef.current = newClient;
  }, [createClient, disconnectClient]);

  // Main effect: Initialize WebSocket and subscribe to token events
  useEffect(() => {
    // Only connect if user is authenticated
    if (!user || !isAuthenticated) {
      console.log('WebSocket: No user or not authenticated, skipping connection');
      disconnectClient();
      return;
    }

    // Get access token from API client
    const accessToken = getAccessToken();

    if (!accessToken) {
      console.log('WebSocket: No access token available');
      return;
    }

    console.log('WebSocket: Initializing connection...');

    // Create and activate the client
    const client = createClient(accessToken);
    client.activate();
    clientRef.current = client;

    // Subscribe to token refresh events
    const unsubscribeFromTokenEvents = tokenRefreshManager.subscribe((event) => {
      console.log('WebSocket: Received token event:', event.type);

      switch (event.type) {
        case 'TOKEN_REFRESHED':
          // Reconnect with new token
          if (event.accessToken) {
            reconnectWithNewToken(event.accessToken);
          }
          break;

        case 'TOKEN_EXPIRED':
        case 'TOKEN_CLEARED':
          // Disconnect on token expiry or logout
          disconnectClient();
          break;
      }
    });

    // Cleanup on unmount or when user/token changes
    return () => {
      console.log('WebSocket: Cleaning up connection and event subscription');
      unsubscribeFromTokenEvents();
      disconnectClient();
    };
  }, [user, isAuthenticated, createClient, disconnectClient, reconnectWithNewToken]);

  const subscribe = (destination: string, callback: (message: any) => void) => {
    if (!clientRef.current?.connected) {
      console.warn('WebSocket: Cannot subscribe, not connected');
      return;
    }

    console.log(`WebSocket: Subscribing to ${destination}`);

    const subscription = clientRef.current.subscribe(destination, (message) => {
      try {
        const data = JSON.parse(message.body);
        callback(data);
      } catch (error) {
        console.error('WebSocket: Error parsing message:', error);
      }
    });

    subscriptionsRef.current.set(destination, subscription);
  };

  const unsubscribe = (destination: string) => {
    const subscription = subscriptionsRef.current.get(destination);
    if (subscription) {
      console.log(`WebSocket: Unsubscribing from ${destination}`);
      subscription.unsubscribe();
      subscriptionsRef.current.delete(destination);
    }
  };

  return (
    <WebSocketContext.Provider value={{ connected, subscribe, unsubscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};
