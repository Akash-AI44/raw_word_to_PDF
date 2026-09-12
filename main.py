import socket

server_socket = socket.socket()

server_socket.bind(("127.0.0.1", 8000))

server_socket.listen()

print("Server is listening...")

connection, address = server_socket.accept()

print("Client connected:", address)

data = connection.recv(1024)

print("Received:", data)

connection.send(b"Hello from server!")

connection.close()
server_socket.close()
