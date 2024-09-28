import argparse
import socket
import os
import datetime
import threading

# Constants for HTTP Failure Response Codes
HTTP_400_BAD_REQUEST = '400 Bad Request\r\n\r\n'
HTTP_403_FORBIDDEN = '403 Forbidden\r\n\r\n'
HTTP_404_NOT_FOUND = '404 Not Found\r\n\r\n'
HTTP_505_HTTP_VERSION_NOT_SUPPORTED = 'HTTP/1.1 505 HTTP Version Not Supported\r\n\r\n'
HTTP_501_NOT_IMPLEMENTED = '501 Not Implemented\r\n\r\n'

# HTML for HTTP Failure Responses
HTTP_400_BAD_REQUEST_HTML = "<html><head><title>400 Bad Request</title></head> <body><h1>400 Bad Request</h1></body></html>"
HTTP_403_FORBIDDEN_HTML = "<html><head><title>403 Forbidden</title></head> <body><h1>403 Forbidden</h1></body></html>"
HTTP_404_NOT_FOUND_HTML = "<html><head><title>404 Not Found</title></head> <body><h1>404 Not Found</h1></body></html>"
HTTP_505_HTTP_VERSION_NOT_SUPPORTED_HTML = "<html><head><title>505 HTTP Version Not Supported</title></head> <body><h1>505 HTTP Version Not Supported</h1></body></html>"
HTTP_501_NOT_IMPLEMENTED_HTML = "<html><head><title>501 Not Implemented</title></head> <body><h1>501 Not Implemented</h1></body></html>"

# Construct Failure Responses
def build_http_400():
    return HTTP_400_BAD_REQUEST + HTTP_400_BAD_REQUEST_HTML

def build_http_403():
    return HTTP_403_FORBIDDEN + HTTP_403_FORBIDDEN_HTML

def build_http_404():
    return HTTP_404_NOT_FOUND + HTTP_404_NOT_FOUND_HTML

def build_http_505():
    return HTTP_505_HTTP_VERSION_NOT_SUPPORTED + HTTP_505_HTTP_VERSION_NOT_SUPPORTED_HTML

def build_http_100():
    return "HTTP/1.1 100 Continue\r\n\r\n"

def build_http_501():
    return HTTP_501_NOT_IMPLEMENTED + HTTP_501_NOT_IMPLEMENTED_HTML

# Get current date time in the required format
def get_current_datetime():
    now = datetime.datetime.now(datetime.UTC)
    return now.strftime('%a, %d %b %Y %H:%M:%S GMT')

# Get file content type 
def get_content_type(file_path):
    if file_path.endswith('.html'):
        return 'text/html'
    elif file_path.endswith('.css'):
        return 'text/css'
    elif file_path.endswith('.png'):
        return 'image/png'
    elif file_path.endswith('.jpg') or file_path.endswith('.jpeg'):
        return 'image/jpeg'
    elif file_path.endswith('.gif'):
        return 'image/gif'
    elif file_path.endswith('ico'):
        return 'image/x-icon'
    elif file_path.endswith('svg'):
        return 'image/svg+xml'
    elif file_path.endswith('js'):
        return 'application/javascript'
    elif file_path.endswith('mp4'):
        return 'video/mp4'
    elif file_path.endswith('woff'):
        return 'font/woff'
    else:
        return 'application/octet-stream'

# Check if file exists and fetch contents
def fetch_file_contents(file_path):
    content_type = get_content_type(file_path)
    is_binary = content_type.startswith('image/') or content_type.startswith('video/') or content_type.startswith('font/')

    # Retrieve contents based on mode
    mode = 'rb' if is_binary else 'r'
    with open(file_path, mode) as file:
        content = file.read()
        return content, content_type

# Send Success Response
def send_http_200(client_socket, content, content_type, protocol, keep_alive):
    # Build 200 response
    response = f"{protocol} 200 OK\r\n"
    response += f"Date: {get_current_datetime()}\r\n"
    response += f"Content-Type: {content_type}\r\n"
    response += f"Content-Length: {len(content)}\r\n"

    # Frame connection header based on keep-alive
    if keep_alive:
        response += "Connection: keep-alive\r\n"
    else:
        response += "Connection: close\r\n"

    response += "\r\n"

    # Handle text and images
    if type(content) == str:
        response += content
        client_socket.sendall(response.encode())
    elif type(content) == bytes:
        client_socket.sendall(response.encode() + content)

    # Log Response
    # print(f"Response: {response}\n")

# Thread-local storage for file count
thread_local_data = threading.local()

# Thread-safe variable to track the number of active connections
active_thread_count_lock = threading.Lock()
active_thread_count = 0

# Base timeout value in seconds
BASE_TIMEOUT = 10

# Calculate timeout value based on the number of connections/threads
def calculate_timeout():
    global active_thread_count
    global active_thread_count_lock
    with active_thread_count_lock:
        if active_thread_count == 0:
            return BASE_TIMEOUT
        return max(BASE_TIMEOUT / active_thread_count, 2)

# Handle HTTP requests
def handle_client(client_socket, client_addr, document_root):
    global active_thread_count
    global active_thread_count_lock
    
    # Increment when a new connection is opened
    with active_thread_count_lock:
        active_thread_count += 1

    thread_local_data.file_count = 0
    thread_local_data.connection_info = f"Connection Summary:\n{client_addr}\n"
    thread_local_data.connection_info += f"Connection from {client_addr} successfully established.\n"

    keep_alive = False

    while True:
        try:
            timeout = calculate_timeout()
            thread_local_data.connection_info += f"Active threads: {active_thread_count}, timeout set to: {timeout:.2f} seconds\n"

            # Set socket timeout
            client_socket.settimeout(timeout)

            # Read request data
            request = client_socket.recv(1024).decode()

            # Log request
            # print(f"Request: {request} received by {client_addr}\n")

            # Return nothing if request is empty
            if not request:
                break

            # Parse the HTTP request
            headers = request.splitlines()

            # Log request in connection_info
            thread_local_data.connection_info += f"GET Request: {headers[0]}\n"

            # Check request format
            try:
                method, path, protocol = headers[0].split()
                
                # Ensure request is HTTP/1.0 or HTTP/1.1
                if not (protocol == "HTTP/1.0" or protocol == "HTTP/1.1"):
                    thread_local_data.connection_info += f"Connection closed: 505 HTTP Version Not Supported.\n"
                    client_socket.sendall(f"{build_http_505}".encode())
                    break
            except ValueError:
                thread_local_data.connection_info += f"Connection closed: 400 Bad Request.\n"
                client_socket.sendall(f"{protocol} {build_http_400()}".encode())
                break

            # Check for the "Host:", "Connection:", and "Expect: 100-continue" header in the request
            host_present = False
            expect_present = False
            connection_header = None
            for header in headers:
                if header.startswith("Host:"):
                    host_name = header.split(':')[1].strip()
                    if not host_name == '':
                        host_present = True
                if "Expect: 100-continue" in header:
                    expect_present = True
                if "Connection:" in header:
                    connection_header = header.split(':')[1].strip()

            # Return 100 Continue if expected
            if expect_present:
                client_socket.sendall(build_http_100().encode())

            # Ensure Host is present if protocol is HTTP/1.1
            if protocol == "HTTP/1.1" and not host_present:
                thread_local_data.connection_info += f"Connection closed: Missing 'Host:' header from {client_addr}, sending 400 Bad Request.\n"
                client_socket.sendall(f"{protocol} {build_http_400()}".encode())
                break        

            # Ensure request is GET
            if method != 'GET':
                thread_local_data.connection_info += f"Connection closed: 501 Not Implemented.\n"
                client_socket.sendall(f"{protocol} {build_http_501()}".encode())
                break

            # Ensure file path is valid - prevent traversal attacks
            if ".." in path:
                thread_local_data.connection_info += f"Connection closed: 403 Forbidden Path.\n"
                client_socket.sendall(f"{protocol} {build_http_403()}".encode())
                break

            # Append index.html if necessary
            if path.endswith('/'):
                path = path + "index.html"

            # Handle .php requests and redirect to file not found
            if path.endswith(".php"):
                client_socket.sendall(f"{protocol} {build_http_404()}".encode())
                thread_local_data.connection_info += "Connection closed: PHP file not found.\n"
                break

            # Check if file exists and is accessible
            file_path = document_root + path
            if not os.path.exists(file_path):
                client_socket.sendall(f"{protocol} {build_http_404()}".encode())
                thread_local_data.connection_info += "Connection closed: File not found.\n"
                break
            if not os.access(file_path, os.R_OK):
                client_socket.sendall(f"{protocol} {build_http_403()}".encode())
                thread_local_data.connection_info += "Connection closed: 403 Forbidden Read.\n"
                break

            # Read file
            content, content_type = fetch_file_contents(file_path)
            thread_local_data.file_count += 1

            # If protocol is HTTP/1.0
            if protocol == "HTTP/1.0":
                send_http_200(client_socket, content, content_type, protocol, False)
                thread_local_data.connection_info += "Connection closed after processing HTTP/1.0 request.\n"
                # Close HTTP/1.0 connection after responding to a single request
                break

            # If protocol is HTTP/1.1
            elif protocol == "HTTP/1.1":
                if connection_header == "keep-alive":
                    keep_alive = True

                send_http_200(client_socket, content, content_type, protocol, keep_alive)

                # Loop to handle upcoming requests for keep-alive connections
                if keep_alive:
                    continue
                else:
                    thread_local_data.connection_info += "Connection Request Header: close\n"
                    break
        
        except TimeoutError as e:
            thread_local_data.connection_info += f"Connection closed: Connection closed after {timeout:.2f} seconds\n"
            break

        except Exception as e:
            print(f"Error: {e}")
            client_socket.sendall(f"HTTP/1.1 {build_http_400()}".encode())
            break

    thread_local_data.connection_info += f"Thread {threading.current_thread().name} processed {thread_local_data.file_count} file(s)."
    thread_local_data.connection_info += f"Connection from {client_addr} closed.\n"
    print(thread_local_data.connection_info)
    client_socket.close()

    # Decrement once a connection gets closed
    with active_thread_count_lock:
        active_thread_count -= 1

def run(document_root, port):
    # Create a TCP server socket
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    # Bind to local address and port and with a backlog of 10 connections
    server_socket.bind(('127.0.0.1', port))
    server_socket.listen(10)

    try:
        # Infinite loop
        while True:
            # Accept client connection
            client_socket, client_addr = server_socket.accept()

            # Spawn worker thread to handle the connection
            worker_thread = threading.Thread(target = handle_client, args = (client_socket, client_addr, document_root))
            
            # Graceful Shutdown
            worker_thread.daemon = True
            
            worker_thread.start()

    except KeyboardInterrupt:
        print("\nServer shutting down...")

    finally:
        server_socket.close()

if __name__ == "__main__":
    # To parse the following arguments from command line:
    #       -document_root
    #       -port
    parser = argparse.ArgumentParser(description = "HTTP/1.1 Server")
    parser.add_argument('-document_root', type = str, required = True, help = "Path to webserver_files")
    parser.add_argument('-port', type = int, required = True, help = "Port to run the server on")

    args = parser.parse_args()

    # Run server
    print(f"Running server from port: {args.port}, hosting database from: {args.document_root}\n")
    run(args.document_root + "/www.sjsu.edu", args.port)