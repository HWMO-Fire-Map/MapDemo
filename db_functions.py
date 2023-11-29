import sqlite3
from datetime import datetime

# Set debug flag
debug = False

# Connect to a database (this will create a new database if it doesn't exist)
conn = sqlite3.connect('fire_users.db')
cursor = conn.cursor()

# Create a users table
cursor.execute('''CREATE TABLE IF NOT EXISTS user_data (
                    id INTEGER PRIMARY KEY,
                    name TEXT,
                    years Text,
                    islands Text,
                    months Text,
                    map_html TEXT,
                    data_set Text,
                    last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP
                )''')

def check_id_exists(user_id):
    conn = sqlite3.connect('fire_users.db')
    cursor = conn.cursor()

    # Check if the ID exists in the database
    cursor.execute("SELECT COUNT(*) FROM user_data WHERE id = ?", (user_id,))
    count = cursor.fetchone()[0]

    conn.close()

    if debug:
        if count > 0:
            update_last_accessed(user_id)
            print(f"ID {user_id} exists in the database.")  # Debug print

    return count > 0

def check_map_html_exists(user_id):
    conn = sqlite3.connect('fire_users.db')
    cursor = conn.cursor()
    # SQL query to select map_html for a specific id
    cursor.execute("SELECT map_html FROM user_data WHERE id = ?", (user_id,))
    result = cursor.fetchone()

    if result is not None and result[0] is not None and result[0].strip() != '':
        # map_html exists and is not empty
        conn.close()
        return True
    else:
        # map_html does not exist or is empty
        conn.close()
        return False
    
def get_map_html(user_id):
    conn = sqlite3.connect('fire_users.db')
    cursor = conn.cursor()
    # SQL query to select map_html for a specific id
    cursor.execute("SELECT map_html FROM user_data WHERE id = ?", (user_id,))
    result = cursor.fetchone()

    if result is not None and result[0] is not None:
        conn.close()
        return result[0]  # Return map_html content if it exists
    else:
        conn.close()
        return None
    
def update_map_html(user_id, new_map_html):
    conn = sqlite3.connect('fire_users.db')
    cursor = conn.cursor()
    # SQL query to update map_html for a specific id
    cursor.execute("UPDATE user_data SET map_html = ? WHERE id = ?", (new_map_html, user_id))
    conn.commit()
    conn.close()

def update_data_set(user_id, data_set):
    conn = sqlite3.connect('fire_users.db')
    cursor = conn.cursor()
    # SQL query to update map_html for a specific id
    cursor.execute("UPDATE user_data SET data_set = ? WHERE id = ?", (data_set, user_id))
    conn.commit()
    conn.close()

def update_last_accessed(user_id):
    conn = sqlite3.connect('fire_users.db')
    cursor = conn.cursor()

    # Update the last_accessed time for the given user_id
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    cursor.execute("UPDATE user_data SET last_accessed = ? WHERE id = ?", (current_time, user_id))
    conn.commit()

    conn.close()

    if debug:
        print(f"Last accessed time updated for ID {user_id}.")  # Debug print

def check_if_name_exists(name):
    conn = sqlite3.connect('fire_users.db')
    cursor = conn.cursor()
    
    # Check if the name exists in the database
    cursor.execute("SELECT COUNT(*) FROM user_data WHERE name = ?", (name,))
    count = cursor.fetchone()[0]
    
    conn.close()
    
    if debug:
        if count > 0:
            print(f"Name '{name}' exists in the database.")  # Debug print

    return count > 0

def insert_user_data(name, years, islands, months, map_data, data_set, last_accesed):
    conn = sqlite3.connect('fire_users.db')
    cursor = conn.cursor()
    
    # Check if the name already exists
    if not check_if_name_exists(name):
        cursor.execute("INSERT INTO user_data (name, years, islands, months, data_set, map_html, last_accessed) VALUES (?, ?, ?, ?, ?, ?, ?)", (name, years, islands, months, map_data, data_set, last_accesed))
        conn.commit()
        print(f"Inserted data for {name}")
    else:
        print(f"Name '{name}' already exists in the database. Skipping insertion.")
    
    conn.close()

def insert_entry_with_checked_id():
    conn = sqlite3.connect('fire_users.db')
    cursor = conn.cursor()

    # Find the first available ID that isn't in use
    cursor.execute("SELECT id + 1 FROM user_data WHERE NOT EXISTS (SELECT 1 FROM user_data AS t2 WHERE t2.id = user_data.id + 1) ORDER BY id LIMIT 1")
    available_id = cursor.fetchone()

    if available_id:
        available_id = available_id[0]
        cursor.execute("INSERT INTO user_data (id) VALUES (?)", (available_id,))
        conn.commit()
        
        if debug:
            print(f"Inserted entry with ID {available_id}")  # Debug print
    else:
        # If no gaps found, insert at the end
        cursor.execute("INSERT INTO user_data DEFAULT VALUES")
        available_id = cursor.lastrowid
        conn.commit()

    conn.close()
    return available_id

def update_user_data_name(name, new_years, new_islands, new_months):
    conn = sqlite3.connect('fire_users.db')
    cursor = conn.cursor()

    # Check if the name exists in the database
    cursor.execute("SELECT COUNT(*) FROM user_data WHERE name = ?", (name,))
    count = cursor.fetchone()[0]

    if count > 0:
        # Update years, islands, and months for the provided name
        cursor.execute("UPDATE user_data SET years = ?, islands = ?, months = ? WHERE name = ?", (new_years, new_islands, new_months, name))
        conn.commit()
        
        if debug:
            print(f"User data for '{name}' updated: Years - {new_years}, Islands - {new_islands}, Months - {new_months}")  # Debug print
    else:
        if debug:
            print(f"No entries found with the name '{name}'. No updates performed.")

    conn.close()

def update_user_data_id(user_id, new_years, new_islands, new_months, map_data, new_data_set):
    conn = sqlite3.connect('fire_users.db')
    cursor = conn.cursor()

    update_last_accessed(user_id)
    update_map_html(user_id, map_data)
    update_data_set(user_id, new_data_set)
    # Check if the ID exists in the database
    cursor.execute("SELECT COUNT(*) FROM user_data WHERE id = ?", (user_id,))
    count = cursor.fetchone()[0]

    if count > 0:
        # Update years, islands, and months for the provided ID
        cursor.execute("UPDATE user_data SET years = ?, islands = ?, months = ?, data_set = ? WHERE id = ?", (new_years, new_islands, new_months, new_data_set, user_id))
        conn.commit()
        
        if debug:
            print(f"User data for ID '{user_id}' updated: Years - {new_years}, Islands - {new_islands}, Months - {new_months}, Data Set - {new_data_set}")  # Print updated info
    else:
        if debug:
            print(f"No entries found with the ID '{user_id}'. No updates performed.")

    conn.close()

def print_all_entries():
    conn = sqlite3.connect('fire_users.db')
    cursor = conn.cursor()

    # Fetch all entries from user_data table
    cursor.execute("SELECT * FROM user_data")
    rows = cursor.fetchall()

    # Print all entries
    if debug:
        for row in rows:
            print(row)  # Debug print

    conn.close()

def delete_entry_by_name(name):
    conn = sqlite3.connect('fire_users.db')
    cursor = conn.cursor()

    # Check if the name exists in the database
    cursor.execute("SELECT COUNT(*) FROM user_data WHERE name = ?", (name,))
    count = cursor.fetchone()[0]

    if count > 0:
        # Delete entries with the provided name
        cursor.execute("DELETE FROM user_data WHERE name = ?", (name,))
        conn.commit()
        
        if debug:
            print(f"All entries with the name '{name}' have been deleted.")  # Debug print
    else:
        if debug:
            print(f"No entries found with the name '{name}'. No deletions performed.")

    conn.close()

def get_values_by_id(user_id):
    conn = sqlite3.connect('fire_users.db')
    cursor = conn.cursor()
    update_last_accessed(user_id)

    # Retrieve specific columns based on the provided ID
    cursor.execute("SELECT id, name, years, islands, months, data_set, last_accessed FROM user_data WHERE id = ?", (user_id,))
    row = cursor.fetchone()

    conn.close()

    if debug:
        if row:
            print(f"Values for ID {user_id}: {row}")  # Debug print
        else:
            print(f"No values found for ID {user_id}")  # Debug print

    return row if row else None
