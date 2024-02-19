import sqlite3

# Connect to SQLite data sets
conn = sqlite3.connect('data_sets.db')

# Create a cursor object to interact with the database
cursor = conn.cursor()

#select the first entry in the table to be the default
cursor.execute("SELECT file_name FROM files LIMIT 1")

files = cursor.fetchone()
files_formatted = files[0].strip()
files_clean = f'"{files_formatted}"'
print(files_clean)

conn.close()