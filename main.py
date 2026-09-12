import socket

server_socket = socket.socket()

server_socket.bind(("127.0.0.1", 8000))

server_socket.listen()

print("Server is running at http://127.0.0.1:8000")

connection, address = server_socket.accept()

print("Client connected:", address)

data = connection.recv(1024)

print("Request:")
print(data.decode())

response = (
    "HTTP/1.1 200 OK\r\n"
    "Content-Type: text/html\r\n"
    "\r\n"
    "<h1>Hello, I am Akash!</h1>"
)

connection.send(response.encode())

connection.close()
server_socket.close()
