import sqlite3
import bcrypt

# Connect to SQLite database (create it if it doesn't exist)
conn = sqlite3.connect('users.db')

# Create a cursor object to interact with the database
cursor = conn.cursor()

# Create a table to store usernames and hashed passwords
cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )
''')

# Function to create a new user
def create_user(username, password):
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, hashed_password))
    conn.commit()

# Function to reset password for an existing user
def reset_password(username, new_password):
    hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
    cursor.execute("UPDATE users SET password = ? WHERE username = ?", (hashed_password, username))
    conn.commit()

# Function to delete an existing user
def delete_user(username):
    cursor.execute("DELETE FROM users WHERE username = ?", (username,))
    conn.commit()

# Function to fetch and print all users
def print_all_users():
    cursor.execute("SELECT username FROM users")
    users = cursor.fetchall()
    if users:
        print("Current users:")
        for user in users:
            print(user[0])
    else:
        print("No users found.")

# Loop to prompt for actions
while True:
    print("\nSelect an action:")
    print("1. Create User")
    print("2. Reset Password")
    print("3. Delete User")
    print("4. Print All Users")
    print("5. Exit")

    choice = input("Enter your choice: ")

    if choice == '1':
        new_username = input("Enter a new username: ")
        new_password = input("Enter a new password: ")
        create_user(new_username, new_password)

    elif choice == '2':
        username = input("Enter the username to reset the password: ")
        new_password = input("Enter the new password: ")
        reset_password(username, new_password)

    elif choice == '3':
        username = input("Enter the username to delete: ")
        delete_user(username)

    elif choice == '4':
        print_all_users()

    elif choice == '5':
        break

    else:
        print("Invalid choice. Please enter a valid option.")
