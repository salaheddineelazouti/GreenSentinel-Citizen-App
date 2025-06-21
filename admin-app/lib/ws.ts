'use client';

import { getAuthToken } from './auth';
import { Incident } from './api';

const WS_BASE = process.env.NEXT_PUBLIC_WS_BASE || 'ws://api.greensentinel.dev/ws/incidents';

type EventType = 'create' | 'update' | 'delete';

interface WSEvent {
  type: EventType;
  payload: Incident;
}

type EventCallback = (event: WSEvent) => void;

/**
 * WebSocket client for real-time incident updates
 */
export class IncidentWebSocket {
  private ws: WebSocket | null = null;
  private events: Record<EventType, EventCallback[]> = {
    create: [],
    update: [],
    delete: [],
  };
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private intentionallyClosed = false;

  /**
   * Connect to the WebSocket server with authentication
   */
  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket is already connected or connecting');
      return;
    }

    this.intentionallyClosed = false;

    // Get auth token for authentication
    const token = getAuthToken();
    if (!token) {
      console.error('No authentication token available');
      return;
    }

    // Create WebSocket connection with token
    try {
      this.ws = new WebSocket(`${WS_BASE}?token=${token}`);

      this.ws.onopen = this.onOpen.bind(this);
      this.ws.onmessage = this.onMessage.bind(this);
      this.ws.onclose = this.onClose.bind(this);
      this.ws.onerror = this.onError.bind(this);
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
    }
  }

  /**
   * Close the WebSocket connection
   */
  disconnect(): void {
    this.intentionallyClosed = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Register event listeners
   */
  on(event: EventType, callback: EventCallback): void {
    this.events[event].push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: EventType, callback: EventCallback): void {
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  /**
   * Handle WebSocket open event
   */
  private onOpen(): void {
    console.log('WebSocket connected');
    this.reconnectAttempts = 0;
  }

  /**
   * Handle WebSocket message event
   */
  private onMessage(event: MessageEvent): void {
    try {
      const wsEvent = JSON.parse(event.data) as WSEvent;
      
      // Notify registered listeners
      if (wsEvent && wsEvent.type && this.events[wsEvent.type]) {
        this.events[wsEvent.type].forEach(callback => callback(wsEvent));
      }
    } catch (err) {
      console.error('Failed to parse WebSocket message:', err);
    }
  }

  /**
   * Handle WebSocket close event
   */
  private onClose(event: CloseEvent): void {
    console.log(`WebSocket disconnected: ${event.code} - ${event.reason}`);
    
    // Attempt to reconnect unless intentionally closed
    if (!this.intentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => this.connect(), this.reconnectDelay);
    }
  }

  /**
   * Handle WebSocket error event
   */
  private onError(error: Event): void {
    console.error('WebSocket error:', error);
  }
}

// Singleton instance
let wsInstance: IncidentWebSocket | null = null;

/**
 * Get singleton WebSocket instance safely (works with SSR)
 */
export const getIncidentWebSocket = (): IncidentWebSocket | null => {
  // Only create WebSocket instance on the client side
  if (typeof window === 'undefined') {
    return null;
  }
  
  if (!wsInstance) {
    wsInstance = new IncidentWebSocket();
  }
  return wsInstance;
};
