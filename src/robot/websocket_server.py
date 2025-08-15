#!/usr/bin/env python
"""
Simple WebSocket server implementation for Python 2.7
Based on RFC 6455 WebSocket specification
"""

import socket
import threading
import hashlib
import base64
import struct
import json
import logging


class WebSocketFrame:
    """WebSocket frame parser and builder"""
    
    @staticmethod
    def parse_frame(data):
        """Parse incoming WebSocket frame"""
        if len(data) < 2:
            return None
            
        byte1, byte2 = struct.unpack('!BB', data[:2])
        
        fin = (byte1 & 0x80) >> 7
        opcode = byte1 & 0x0f
        masked = (byte2 & 0x80) >> 7
        payload_length = byte2 & 0x7f
        
        offset = 2
        
        # Extended payload length
        if payload_length == 126:
            if len(data) < offset + 2:
                return None
            payload_length = struct.unpack('!H', data[offset:offset+2])[0]
            offset += 2
        elif payload_length == 127:
            if len(data) < offset + 8:
                return None
            payload_length = struct.unpack('!Q', data[offset:offset+8])[0]
            offset += 8
            
        # Masking key
        if masked:
            if len(data) < offset + 4:
                return None
            masking_key = data[offset:offset+4]
            offset += 4
        else:
            masking_key = None
            
        # Payload
        if len(data) < offset + payload_length:
            return None
            
        payload = data[offset:offset+payload_length]
        
        # Unmask payload if needed
        if masked and masking_key:
            payload = bytearray(payload)
            for i in range(len(payload)):
                payload[i] ^= masking_key[i % 4]
            payload = bytes(payload)
            
        return {
            'fin': fin,
            'opcode': opcode,
            'payload': payload,
            'frame_length': offset + payload_length
        }
    
    @staticmethod
    def build_frame(payload, opcode=1):
        """Build WebSocket frame for sending"""
        payload_bytes = payload.encode('utf-8') if isinstance(payload, unicode) else payload
        payload_length = len(payload_bytes)
        
        # First byte: FIN=1, opcode
        frame = struct.pack('!B', 0x80 | opcode)
        
        # Payload length
        if payload_length < 126:
            frame += struct.pack('!B', payload_length)
        elif payload_length < 65536:
            frame += struct.pack('!BH', 126, payload_length)
        else:
            frame += struct.pack('!BQ', 127, payload_length)
            
        frame += payload_bytes
        return frame


class WebSocketConnection:
    """Represents a WebSocket connection"""
    
    def __init__(self, socket, address):
        self.socket = socket
        self.address = address
        self.buffer = b''
        self.connected = False
        self.logger = logging.getLogger(__name__)
        
    def handshake(self, request):
        """Perform WebSocket handshake"""
        try:
            lines = request.split('\r\n')
            headers = {}
            
            for line in lines[1:]:
                if ':' in line:
                    key, value = line.split(':', 1)
                    headers[key.strip().lower()] = value.strip()
            
            # Check required headers
            if 'sec-websocket-key' not in headers:
                return False
                
            # Generate accept key
            websocket_key = headers['sec-websocket-key']
            accept_key = base64.b64encode(
                hashlib.sha1(websocket_key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest()
            )
            
            # Send handshake response
            response = (
                'HTTP/1.1 101 Switching Protocols\r\n'
                'Upgrade: websocket\r\n'
                'Connection: Upgrade\r\n'
                'Sec-WebSocket-Accept: %s\r\n'
                '\r\n' % accept_key
            )
            
            self.socket.send(response.encode('utf-8'))
            self.connected = True
            return True
            
        except Exception as e:
            self.logger.error("Handshake failed: %s" % str(e))
            return False
    
    def receive_message(self):
        """Receive and parse WebSocket message"""
        try:
            # Receive data
            data = self.socket.recv(1024)
            if not data:
                return None
                
            self.buffer += data
            
            # Parse frame
            frame = WebSocketFrame.parse_frame(self.buffer)
            if not frame:
                return None  # Incomplete frame
                
            # Remove parsed frame from buffer
            self.buffer = self.buffer[frame['frame_length']:]
            
            if frame['opcode'] == 1:  # Text frame
                return frame['payload'].decode('utf-8')
            elif frame['opcode'] == 8:  # Close frame
                self.connected = False
                return None
            elif frame['opcode'] == 9:  # Ping frame
                # Send pong
                pong_frame = WebSocketFrame.build_frame(frame['payload'], opcode=10)
                self.socket.send(pong_frame)
                return None
                
        except socket.error:
            self.connected = False
            return None
        except Exception as e:
            self.logger.error("Error receiving message: %s" % str(e))
            return None
    
    def send_message(self, message):
        """Send WebSocket message"""
        try:
            if not self.connected:
                return False
                
            frame = WebSocketFrame.build_frame(message)
            self.socket.send(frame)
            return True
            
        except Exception as e:
            self.logger.error("Error sending message: %s" % str(e))
            self.connected = False
            return False
    
    def close(self):
        """Close WebSocket connection"""
        try:
            if self.connected:
                # Send close frame
                close_frame = WebSocketFrame.build_frame('', opcode=8)
                self.socket.send(close_frame)
                self.connected = False
        except:
            pass
        
        try:
            self.socket.close()
        except:
            pass


class SimpleWebSocketServer:
    """Simple WebSocket server for Python 2.7"""
    
    def __init__(self, host='0.0.0.0', port=8765):
        self.host = host
        self.port = port
        self.socket = None
        self.running = False
        self.connections = set()
        self.connection_lock = threading.Lock()
        self.logger = logging.getLogger(__name__)
        self.message_handler = None
        
    def set_message_handler(self, handler):
        """Set message handler function"""
        self.message_handler = handler
        
    def start(self):
        """Start the WebSocket server"""
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.socket.bind((self.host, self.port))
        self.socket.listen(5)
        
        self.running = True
        self.logger.info("WebSocket server started on %s:%d" % (self.host, self.port))
        
        while self.running:
            try:
                client_socket, client_address = self.socket.accept()
                client_thread = threading.Thread(
                    target=self._handle_client,
                    args=(client_socket, client_address)
                )
                client_thread.daemon = True
                client_thread.start()
                
            except socket.error as e:
                if self.running:
                    self.logger.error("Socket error: %s" % str(e))
                    
    def _handle_client(self, client_socket, client_address):
        """Handle new client connection"""
        connection = None
        
        try:
            # Read HTTP request for handshake
            request = b''
            while b'\r\n\r\n' not in request:
                chunk = client_socket.recv(1024)
                if not chunk:
                    return
                request += chunk
                
            # Create WebSocket connection
            connection = WebSocketConnection(client_socket, client_address)
            
            # Perform handshake
            if not connection.handshake(request.decode('utf-8')):
                self.logger.error("WebSocket handshake failed for %s:%d" % client_address)
                return
                
            self.logger.info("WebSocket client connected: %s:%d" % client_address)
            
            with self.connection_lock:
                self.connections.add(connection)
            
            # Handle messages
            while connection.connected:
                message = connection.receive_message()
                if message:
                    if self.message_handler:
                        self.message_handler(connection, message)
                        
        except Exception as e:
            self.logger.error("Error handling client %s:%d: %s" % (client_address[0], client_address[1], str(e)))
        finally:
            if connection:
                with self.connection_lock:
                    self.connections.discard(connection)
                connection.close()
            self.logger.info("WebSocket client disconnected: %s:%d" % client_address)
    
    def broadcast(self, message):
        """Broadcast message to all connected clients"""
        with self.connection_lock:
            disconnected = []
            for connection in self.connections.copy():
                if not connection.send_message(message):
                    disconnected.append(connection)
            
            # Remove disconnected clients
            for connection in disconnected:
                self.connections.discard(connection)
    
    def stop(self):
        """Stop the WebSocket server"""
        self.running = False
        if self.socket:
            self.socket.close()
            
        # Close all connections
        with self.connection_lock:
            for connection in self.connections.copy():
                connection.close()
            self.connections.clear()