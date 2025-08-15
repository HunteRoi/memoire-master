#!/usr/bin/env python
"""Simple test client for the WebSocket-based robot server"""

import socket
import json
import time
import hashlib
import base64
import struct


def create_websocket_key():
    """Create a random WebSocket key"""
    import random
    import string
    key = ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(16))
    return base64.b64encode(key).decode('ascii')


def websocket_handshake(sock, host, port, path='/'):
    """Perform WebSocket handshake"""
    key = create_websocket_key()
    
    request = (
        "GET %s HTTP/1.1\r\n"
        "Host: %s:%d\r\n"
        "Upgrade: websocket\r\n"
        "Connection: Upgrade\r\n"
        "Sec-WebSocket-Key: %s\r\n"
        "Sec-WebSocket-Version: 13\r\n"
        "\r\n" % (path, host, port, key)
    )
    
    sock.send(request.encode('utf-8'))
    
    # Read response
    response = b''
    while b'\r\n\r\n' not in response:
        chunk = sock.recv(1024)
        if not chunk:
            raise Exception("Connection closed during handshake")
        response += chunk
    
    # Verify handshake response
    expected_accept = base64.b64encode(
        hashlib.sha1(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest()
    ).decode('ascii')
    
    if 'Sec-WebSocket-Accept: %s' % expected_accept not in response.decode('utf-8'):
        raise Exception("Invalid handshake response")
    
    print("WebSocket handshake successful")


def send_websocket_frame(sock, payload):
    """Send a WebSocket text frame"""
    payload_bytes = payload.encode('utf-8')
    payload_length = len(payload_bytes)
    
    # Build frame
    frame = struct.pack('!B', 0x81)  # FIN=1, opcode=1 (text)
    
    if payload_length < 126:
        frame += struct.pack('!B', payload_length | 0x80)  # MASK=1
    elif payload_length < 65536:
        frame += struct.pack('!BH', 126 | 0x80, payload_length)  # MASK=1
    else:
        frame += struct.pack('!BQ', 127 | 0x80, payload_length)  # MASK=1
    
    # Add masking key (simple mask for testing)
    mask = b'\x00\x01\x02\x03'
    frame += mask
    
    # Mask payload
    masked_payload = bytearray(payload_bytes)
    for i in range(len(masked_payload)):
        masked_payload[i] ^= mask[i % 4]
    
    frame += bytes(masked_payload)
    sock.send(frame)


def receive_websocket_frame(sock):
    """Receive and parse a WebSocket frame"""
    # Read first 2 bytes
    header = sock.recv(2)
    if len(header) < 2:
        return None
    
    byte1, byte2 = struct.unpack('!BB', header)
    payload_length = byte2 & 0x7f
    
    # Read extended payload length if needed
    if payload_length == 126:
        length_data = sock.recv(2)
        payload_length = struct.unpack('!H', length_data)[0]
    elif payload_length == 127:
        length_data = sock.recv(8)
        payload_length = struct.unpack('!Q', length_data)[0]
    
    # Read payload
    payload = sock.recv(payload_length)
    return payload.decode('utf-8')


def test_websocket_connection():
    """Test WebSocket connection to robot server"""
    try:
        # Connect to server
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.connect(('192.168.0.121', 8765))
        print("Connected to robot server")
        
        # Perform WebSocket handshake
        websocket_handshake(sock, '192.168.0.121', 8765)
        
        # Receive welcome message
        welcome = receive_websocket_frame(sock)
        print("Received welcome: %s" % welcome)
        
        # Send ping message
        ping_message = {
            'type': 'ping',
            'data': {'timestamp': time.time()}
        }
        send_websocket_frame(sock, json.dumps(ping_message))
        print("Sent ping message")
        
        # Receive pong response
        pong = receive_websocket_frame(sock)
        print("Received pong: %s" % pong)
        
        # Send command message
        command_message = {
            'type': 'command',
            'data': {'command': 'status'}
        }
        send_websocket_frame(sock, json.dumps(command_message))
        print("Sent command message")
        
        # Receive command response
        response = receive_websocket_frame(sock)
        print("Received command response: %s" % response)
        
        sock.close()
        print("Test completed successfully")
        
    except Exception as e:
        print("Test failed: %s" % str(e))


if __name__ == "__main__":
    test_websocket_connection()