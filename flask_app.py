import os
import io
import base64
import geopandas as gpd
import pyproj
import folium
import math
import zipfile
import shutil
import jwt
import sqlite3
import bcrypt
from datetime import datetime, timedelta
from palettable.colorbrewer.qualitative import Set3_12
from flask import Flask, jsonify, send_file, request, send_from_directory
from shapely.geometry import Polygon, MultiPolygon
from folium.plugins import MarkerCluster
from flask_cors import CORS
from db_functions import*
from collections import defaultdict

# User directory
user_dir = os.path.expanduser('~')

debug = False

app = Flask(__name__)
CORS(app)

file_name = 'key.txt'
try:
    with open(file_name, 'r') as file:
        key_string = file.read()
except FileNotFoundError:
    print(f"The file '{file_name}' was not found.")

app.config['SECRET_KEY'] = key_string
def read_prj_file(file_path):
    try:
        with open(file_path, 'r') as prj_file:
            prj_content = prj_file.read()
            return prj_content
    except Exception as e:
        print(f"Error: {e}")
        return None

def create_user_folder(folder_path):
    if not os.path.exists(folder_path):
        try:
            os.makedirs(folder_path)
            if debug:
                print(f"Folder '{folder_path}' created successfully.")
        except OSError as e:
            if debug:
                print(f"Error creating folder: {e}")
    else:
        print(f"Folder '{folder_path}' already exists.")

# Function to securely create a new user
def create_user(username, password):
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, hashed_password))
    conn.commit()

# Function to authenticate a user
def authenticate_user(username, password):
        # Connect to SQLite database
    conn = sqlite3.connect('users.db')

    # Create a cursor object to interact with the database
    cursor = conn.cursor()

    cursor.execute("SELECT password FROM users WHERE username=?", (username,))
    hashed_password = cursor.fetchone()
    if hashed_password:
        if bcrypt.checkpw(password.encode('utf-8'), hashed_password[0]):
            return True
    return False

# Function to search for zip files in a folder
def find_zip_files(folder_path):
    return [os.path.join(root, file) for root, _, files in os.walk(folder_path) for file in files if file.endswith('.zip')]

# Function to check if a file has been unzipped
def check_unzipped(file_path):
    unzip_folder = os.path.splitext(file_path)[0]  # Extract folder name without the .zip extension
    return os.path.exists(unzip_folder)

def sort_months(arr):
    months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]

    only_months = sorted([month for month in arr if month in months], key=lambda x: months.index(x))
    other_items = [item for item in arr if item not in months]

    return only_months + other_items

# Function to process shapefile and retrieve required information
def process_shapefile(shapefile_path):
    gdf_total = gpd.read_file(shapefile_path)
    unique_months = list(gdf_total['FireMonth'].unique())
    sorted_months = sort_months(unique_months)
    all_islands = ','.join(map(str, list(gdf_total['Island'].unique())))
    all_years = ','.join(map(str, sorted(list(gdf_total['Year'].unique()))))
    unique_months_str = ','.join(map(str, sorted_months))
    return all_islands, all_years, unique_months_str

# Function to unzip a file, process shapefile, and update SQLite DB
def unzip_and_update_db(zip_file, db_connection):
    try:
        unzip_folder = os.path.splitext(zip_file)[0]
        with zipfile.ZipFile(zip_file, 'r') as zip_ref:
            zip_ref.extractall(path=os.path.dirname(zip_file))

        shp_file = '/'+os.path.splitext(unzip_folder.split('/')[-1])[0] + '.shp'
        shp_path = unzip_folder+shp_file
        if debug:
            print(f"This is the sph_path: {shp_path}")
        if os.path.exists(shp_path):
            all_islands, all_years, sorted_months = process_shapefile(shp_path)
            cursor = db_connection.cursor()
            cursor.execute("INSERT OR IGNORE INTO files (file_name, unzipped, total_islands, total_years, unique_months_str) VALUES (?, ?, ?, ?, ?)",
                           (os.path.splitext(os.path.basename(zip_file))[0], 1, all_islands, all_years, sorted_months))
            db_connection.commit()
            cursor.close()
        else:
            print(f"No shapefile found in '{os.path.basename(zip_file)}'. Skipping database update.")
    except Exception as e:
        print(f"Error unzipping '{os.path.basename(zip_file)}': {e}")

def transform_coordinates(geometry, proj):
    if isinstance(geometry, Polygon):
        projected_coords = []
        for coords in geometry.exterior.coords:
            projected_coords.append(proj(coords[0], coords[1], inverse=True))
        return Polygon(projected_coords)
    elif isinstance(geometry, MultiPolygon):
        transformed_polygons = []
        for polygon in geometry:
            projected_coords = []
            for coords in polygon.exterior.coords:
                projected_coords.append(proj(coords[0], coords[1], inverse=True))
            transformed_polygons.append(Polygon(projected_coords))
        return MultiPolygon(transformed_polygons)
    else:
        raise ValueError("Unsupported geometry type")

def drop_multipolygons(gdf):
    # Use apply() to filter out rows with MultiPolygons
    gdf = gdf[gdf['geometry'].apply(lambda geom: geom.geom_type == 'Polygon')]
    return gdf

def convert_months(months_list):
    # Check if the input list is not empty
    if months_list and len(months_list) == 1:
        # Access the first (and only) element of the list
        months_string = months_list[0]
        # Split the string into a list using ',' as the delimiter
        months_list = months_string.split(',')
        # Remove any leading or trailing whitespaces from each month
        months_list = [month.strip() for month in months_list]
        return months_list
    else:
        return []

def convert_islands(island_list):
    # Check if the input list is not empty
    if island_list and len(island_list) == 1:
        # Access the first (and only) element of the list
        island_string = island_list[0]
        # Split the string into a list using ',' as the delimiter
        island_list = island_string.split(',')
        # Remove any leading or trailing whitespaces from each month
        island_list = [island.strip() for island in island_list]
        return island_list
    else:
        return []

def filter_geo_data(gdf, years, months, islands):
    filtered_rows = []

    #if nothing is selected choose all
    if years == ['']:
        years = list(gdf['Year'].unique())
    if months == ['']:
        months = list(gdf['FireMonth'].unique())
    if islands == ['']:
        islands = list(gdf['Island'].unique())

    if debug:
        print(f"These are the filtered years: {years}")
        print(f"These are the filtered months: {months}")
        print(f"These are the filtered islands: {islands}")

    # Iterate over rows of the GeoDataFrame
    for index, row in gdf.iterrows():
        if row['Year'] in str(years) and row['FireMonth'] in months and row['Island'] in islands:
            filtered_rows.append(row)

    if not filtered_rows:
        return gpd.GeoDataFrame(columns=gdf.columns, crs=gdf.crs)
    else:
        # Convert the list of filtered rows back to a GeoDataFrame
        filtered_gdf = gpd.GeoDataFrame(filtered_rows, crs=gdf.crs, geometry='geometry')

        return filtered_gdf

# Define a function to categorize acreage into groups
def categorize_acreage(acreage):
    if acreage <= 0.25:
        return '0-0.25'
    elif 0.26 <= acreage <= 9.99:
        return '0.26-9'
    elif 10.0 <= acreage <= 99.99:
        return '10-99'
    elif 100.0 <= acreage <= 299.99:
        return '100-299'
    elif 300.0 <= acreage <= 999.99:
        return '300-999'
    elif 1000.0 <= acreage <= 9999.99:
        return '1000-9999'
    else:
        return 'Undefined'

@app.route('/api/data', methods=['GET'])
def get_filtered_data():

    #land area for islands to calculate % burn total
    island_land_areas = {
        'Tinian': 25010,  # Replace with actual land area in acres
        'Saipan': 29400,  # Replace with actual land area in acres
        'Rota': 21036.8,    # Replace with actual land area in acres
        'Guam': 135700,   # Replace with actual land area in acres
        'Palau': 113300,  # Replace with actual land area in acres
        'Yap': 24710      # Replace with actual land area in acres
    }

    #set up dic for summary table
    category_data = defaultdict(lambda: {'count': 0, 'acreage': 0.0})

    # Retrieve query parameters for 'years' and 'islands'
    years_get = request.args.getlist('years')
    months_get = request.args.getlist('months')
    islands_get = request.args.getlist('islands')
    id_get = request.args.get('id_num')
    try:
        dataSet_raw = request.args.getlist('dataSet')
    except:
        print("no dataset")

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

    default_dataSet = files_clean

    if dataSet_raw ==[]:
        dataSet_raw = [default_dataSet]

    if debug:
        print(f"These years sent from the frontend: {years_get}")
        print(f"These months sent from the frontend: {months_get}")
        print(f"These islands sent from the frontend: {islands_get}")
        print(f"---This is the stored id in the frontend: {id_get}---")
        print(f"---This is the stored dataSet in the frontend: {dataSet_raw}---")

    id = int(id_get)

    try:
        dataSet_get = dataSet_raw[0][1:-1]
        shapefile_path = "ExampleFiles/"+dataSet_get+"/"+dataSet_get+".shp"
        prjfile_path = 'ExampleFiles/'+str(dataSet_get)+'/'+str(dataSet_get)+'.prj'
    except:
        shapefile_path = 'ExampleFiles/'+str(default_dataSet)+'/'+str(default_dataSet)+'.shp'
        prjfile_path = 'ExampleFiles/'+str(default_dataSet)+'/'+str(default_dataSet)+'.prj'

    #convert the list object to a commma seperated list
    split_months = convert_months(months_get)
    split_islands = convert_islands(islands_get)

    gdf = gpd.read_file(shapefile_path)

    # Call the drop_multipolygons function to remove MultiPolygons
    gdf = drop_multipolygons(gdf)

    #calculate total land area for selected islands
    if split_islands == ['']:
        split_islands = list(gdf['Island'].unique())

    available_islands = list(gdf['Island'].unique())

    # Islands to filter
    selected_islands = [island for island in split_islands if island in available_islands]


    # Filtering the dictionary based on selected islands
    filtered_areas = {island: area for island, area in island_land_areas.items() if island in selected_islands}

    # Calculating the total land area of selected islands
    total_land_area = sum(filtered_areas.values())

    gdf = filter_geo_data(gdf, years_get, split_months, split_islands)

    # Convert 'Year' column to integer type if it's not already
    gdf['Year'] = gdf['Year'].astype(int)

    # Define a color dictionary for each unique year using a colorblind-friendly palette
    unique_years = sorted(list(gdf['Year'].unique()))
    year_colors = {year: Set3_12.hex_colors[i % len(Set3_12.hex_colors)] for i, year in enumerate(unique_years)}

    # Define the original projection using the provided WKT format
    original_proj_wkt = read_prj_file(prjfile_path)

    # Create a Proj object from the provided WKT projection information
    original_proj = pyproj.Proj(original_proj_wkt)
    # Calculate centroid of the first polygon
    first_polygon_centroid = gdf['geometry'].iloc[0].centroid
    centroid_utm_x, centroid_utm_y = first_polygon_centroid.x, first_polygon_centroid.y
    centroid_lat, centroid_lon = original_proj(centroid_utm_x, centroid_utm_y, inverse=True)

    # Create a map centered over the first polygon
    m = folium.Map(
        location=[centroid_lon, centroid_lat],
        zoom_start=10,
        tiles="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attr='Esri World Imagery',
        )

    # Create a MarkerCluster layer
    marker_cluster = MarkerCluster().add_to(m)
    # Get the centroid coordinates of each polygon and add them as markers
    for idx, row in gdf.iterrows():
        centroid = row['geometry'].centroid
        centroid_utm_x, centroid_utm_y = centroid.x, centroid.y
        centroid_lat, centroid_lon = original_proj(centroid_utm_x, centroid_utm_y, inverse=True)

        # Get comments and area information
        acerage = round(row['Acerage'],2)
        fire_year = row['Year']
        month = row['FireMonth']

        acreage_category = categorize_acreage(acerage)

        # Increment count and sum acres for the category
        category_data[acreage_category]['count'] += 1
        category_data[acreage_category]['acreage'] += acerage

        # Create marker popup content with comments and area
        popup_content = f'Acres: {acerage}\n'
        popup_content += f'Year: {fire_year}\n'
        popup_content += f'Month: {month}'

        # Create an HTML table with the given data
        table_html = f"""
        <table style="border-collapse: collapse; width: 100px;">
            <tr>
                <td style="border: 1px solid black; padding: 8px;">Acres</td>
                <td style="border: 1px solid black; padding: 8px;">{acerage}</td>
            </tr>
            <tr>
                <td style="border: 1px solid black; padding: 8px;">Year</td>
                <td style="border: 1px solid black; padding: 8px;">{fire_year}</td>
            </tr>
            <tr>
                <td style="border: 1px solid black; padding: 8px;">Month</td>
                <td style="border: 1px solid black; padding: 8px;">{month}</td>
            </tr>
        </table>
        """
        folium.Marker([centroid_lon, centroid_lat], popup=table_html).add_to(marker_cluster)

    # Apply coordinate transformation to the 'geometry' column
    gdf['geometry'] = gdf['geometry'].apply(lambda geom: transform_coordinates(geom, original_proj))

    # Convert GeoDataFrame to GeoJSON
    geojson_data = gdf.to_json()

    # Add GeoJSON data to the map with fill color based on 'Year' column
    folium.GeoJson(
        geojson_data,
        style_function=lambda feature: {
            'fillColor': year_colors[feature['properties']['Year']],
            'color': 'black',
            'weight': 1,
            'fillOpacity': 0.6
        }
    ).add_to(m)

    # Sort the filtered data by categories using the categorize_acreage function
    sorted_data = dict(
        sorted(
            category_data.items(),
            key=lambda x: (
                float(x[0].split('-')[0]) if x[0] != 'Undefined' else float('inf'),
                categorize_acreage(float(x[0].split('-')[0])) if x[0] != 'Undefined' else float('inf'),
            ),
        )
    )

    # Calculate 'Total' row separately after sorting
    total_count = sum(v['count'] for v in category_data.values())
    total_acres = sum(v['acreage'] for v in category_data.values() if isinstance(v['acreage'], (int, float)) and not math.isnan(v['acreage']))

    # Add 'Total' row back to the sorted data
    sorted_data['Totals'] = {'count': total_count, 'acreage': total_acres}

    percent_burned = str(round(((total_acres/total_land_area)*100),2))+"%"

    # Create the legend HTML content
    summary_legend_html = '''
        <div style="position: fixed;
                    top: 20px; right: 20px;
                    border: 2px solid grey; z-index: 9999;
                    background-color: white; opacity: 0.9; padding: 10px;
                    font-size: 14px;">
        <table style="width:100%; border-collapse: collapse;">
            <tr>
                <th style="border: 1px solid black;">Size Classes (acres)</th>
                <th style="border: 1px solid black;">Number of Burns</th>
                <th style="border: 1px solid black;">Burn Acreage</th>
            </tr>
    '''

    # Add each category's count and total acres to the legend HTML content
    for category, values in sorted_data.items():
        if category != 'Total':  # Exclude the 'Total' row
            count = values['count']
            total_acres = values['acreage']
            summary_legend_html += f'<tr>'
            summary_legend_html += f'<td style="border: 1px solid black;">{category}</td>'
            summary_legend_html += f'<td style="border: 1px solid black;">{count}</td>'
            summary_legend_html += f'<td style="border: 1px solid black;">{round(total_acres,2)}</td>'
            summary_legend_html += '</tr>'

    # Add the modified 'Total % of Land Area Burned' row to the legend HTML content
    summary_legend_html += '<tr>'
    summary_legend_html += f'<td colspan="2" style="border: 1px solid black;">Total % Land Area Burned</td>'
    summary_legend_html += f'<td style="border: 1px solid black;">{percent_burned}</td>'
    summary_legend_html += '</tr>'

    summary_legend_html += '''
        </table>
        </div>
    '''

    # Add the legend HTML content to the map
    m.get_root().html.add_child(folium.Element(summary_legend_html))

    # Create the legend HTML content
    legend_html = '''
        <div style="position: fixed;
                    bottom: 20px; right: 20px; width: 90px;
                    border: 2px solid grey; z-index: 9999;
                    background-color: white; opacity: 0.9; padding: 10px;
                    font-size: 20px;">
    '''

    for year, color in year_colors.items():
        legend_html += '<div style="display: flex; align-items: center;">'
        legend_html += f'<div style="background:{color};width:10px;height:10px;margin-right:5px;"></div>'
        legend_html += f'<span>{year}</span>'
        legend_html += '</div>'

    legend_html += '</div>'

    # Add the legend HTML content to the map
    m.get_root().html.add_child(folium.Element(legend_html))

    #default map output
    user_folder = 'output/user_maps/'+'user_'+str(id_get)

    create_user_folder(user_folder)
    map_save = user_folder+ '/'+ str(id_get)+'_filtered_map.html'

    #save the map to a temp folder
    m.save(map_save)

    # Read the HTML file contents into a variable
    with open(map_save, "r") as file:
        map_data = file.read()

    #delete the temp folder that holds the temp html file
    shutil.rmtree(user_folder)

    update_user_data_id(id, years_get[0], islands_get[0], months_get[0], map_data, dataSet_get)
    if debug:
        print('-----------------------------------------------------------------')
        print(id)
        temp_values = get_values_by_id(id)
        print(temp_values)
        print('-----------------------------------------------------------------')

    map_url = 'user_maps/user_'+str(id_get)+'/'+str(id_get)+'_filtered_map.html'

    # Return GeoJSON data, map object, unique years, and unique islands

    response_data = {
        "mapHtml": map_url,
        'map_data': map_data
    }

    return jsonify(response_data)

@app.route('/api/list', methods=['GET'])
def get_default_data():

    dataSet_raw = request.args.getlist('dataSet')

    if debug:
        print(f"----This is the passed dataset {dataSet_raw}----")

    # Connect to SQLite data sets
    conn = sqlite3.connect('data_sets.db')

    # Create a cursor object to interact with the database
    cursor = conn.cursor()

    #select the first entry in the table to be the default
    cursor.execute("SELECT file_name FROM files LIMIT 1")

    files = cursor.fetchone()
    files_formatted = files[0].strip()
    print(files_formatted)

    conn.close()

    default_dataSet = files_formatted

    # Replace 'folder_path' with the directory path you want to search
    folder_path = 'ExampleFiles'
    zip_files = find_zip_files(folder_path)

    with sqlite3.connect('data_sets.db') as db_connection:
        cursor = db_connection.cursor()
        cursor.execute('''CREATE TABLE IF NOT EXISTS files (
                    file_name TEXT PRIMARY KEY,
                    unzipped INTEGER,
                    total_islands Text,
                    total_years Text,
                    unique_months_str TEXT)''')
        cursor.close()

        if zip_files:
            if debug:
                print("Zip files found:")
            for zip_file in zip_files:
                if not check_unzipped(zip_file):
                    unzip_and_update_db(zip_file, db_connection)
                else:
                    if debug:
                        print(f"File '{os.path.basename(zip_file)}' already unzipped.")
        else:
            if debug:
                print("No zip files found in the specified folder.")

        try:
            file_name = dataSet_raw[0].strip('"')
        except:
            file_name = default_dataSet

        entry = retrieve_file_info(file_name, db_connection)
        if entry:
            total_islands, total_years, unique_months_str = entry
        else:
            default_data = retrieve_file_info(default_dataSet, db_connection)
            total_islands, total_years, unique_months_str = default_data
        data_sets = get_file_names(db_connection)

        year_list = [item for item in total_years.split(',')]
        island_list = [item for item in total_islands.split(',')]
        month_list = [item for item in unique_months_str.split(',')]

        if debug:
            print(f'found data set --------------{data_sets}')
            print(f'Entry value is {entry}')
            print(f"Total Islands: {island_list}")
            print(f"Total Years: {year_list}")
            print(f"Unique Months: {month_list}")


        response_data = {
            "allYears": year_list,
            "allIslands": island_list,
            "allMonths": month_list,
            "allDataSets": list(data_sets)
        }

    return jsonify(response_data)

@app.route('/api/existing', methods=['GET'])
def db_check():

    default_map = 'default_map.html'

    # Retrieve query parameters for 'years' and 'islands'
    param1 = request.args.getlist('param1')

    if debug:
        print(f"This is the passed peram {param1}")

    if not param1:
        if debug:
            print("No cached id")
        id_num = insert_entry_with_checked_id()
        with open(default_map, "r") as file:
                    map_data = file.read()
    else:
        id_num = int(param1[0])
        if not check_id_exists(id_num):
            if debug:
                print("It doesn't exist")
            id_num = insert_entry_with_checked_id()
            with open(default_map, "r") as file:
                    map_data = file.read()
        else:
            if debug:
                print("It exists")
            if not check_map_html_exists(id_num):
                if debug:
                    print("-+-+-+-no default map data found-+-+-+-")
                with open(default_map, "r") as file:
                    map_data = file.read()
            else:
                if debug:
                    print("-+-+-+-Default map data found-+-+-+-")
                map_data = get_map_html(id_num)

    response_data = {
        "id_num": id_num,
        "map_data": map_data
    }

    return response_data

@app.route('/api/mapZip', methods=['GET'])
def generate_shape_zip():
    if debug:
        print("creating shp download")
    #generate a shapefile with the selected saved perameters

    id_get = request.args.get('id_num')

    temp_values = get_values_by_id(id_get)

    years = temp_values[2]
    islands = temp_values[3]
    months = temp_values[4]
    dataSet_get = temp_values[5]

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

    default_dataSet = files_clean

    if debug:
        print(f"mapZip Years: {years}")
        print(f"mapZip Islands: {islands}")
        print(f"mapZip Months: {months}")
        print(f"mapZip Dataset: {dataSet_get}")

    try:
        shapefile_path = "ExampleFiles/"+str(dataSet_get)+"/"+str(dataSet_get)+".shp"
        if debug:
            print("Found existing dataset to download")
    except:
        shapefile_path ='ExampleFiles/'+str(default_dataSet)+'/'+str(default_dataSet)+'.shp'
        if debug:
            print("No dataset found using default for download")

    if debug:
        print(f"This is the shapefile_path in mapZip: {shapefile_path}")

    gdf = gpd.read_file(shapefile_path)

    # Call the drop_multipolygons function to remove MultiPolygons
    gdf = drop_multipolygons(gdf)

    gdf = filter_geo_data(gdf, years, months, islands)

    user_folder = user_dir+'/output/user_maps/'+'user_'+str(id_get)

    if debug:
        print(f"saving map to user folder {user_folder}")
        print(f"This is the user_dir {user_dir}")

    # Save GeoDataFrame to a shapefile
    temp_shapefile_path = user_folder+'/shapefiles'
    if debug:
        print(f"saving map to user folder {temp_shapefile_path}")

    try:
        if debug:
            print("Attempting to set up temp folder")
        os.makedirs(temp_shapefile_path, exist_ok=True)
        if debug:
            print("Set up temp folder")
    except OSError as e:
            print(f"Failed to create directory '{temp_shapefile_path}': {e}")
    if debug:
        print("Made the shp folder")
    gdf.to_file(temp_shapefile_path, driver='ESRI Shapefile')
    if debug:
        print("converting gdf to file")

    # Instead of saving to disk, create the Zip file in memory
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, _, files in os.walk(temp_shapefile_path):
            for file in files:
                file_path = os.path.join(root, file)
                zipf.write(file_path, os.path.relpath(file_path, temp_shapefile_path))

    if debug:
        print("saved zip data to memory")

    # Get the contents of the Zip file from the buffer
    zip_buffer.seek(0)
    zip_contents = zip_buffer.getvalue()

    # Encode the binary data to base64
    base64_encoded_zip = base64.b64encode(zip_contents).decode('utf-8')


    # Clean up the temporary shapefiles directory
    shutil.rmtree(user_folder)

    response_data = {
        'shape_zip': base64_encoded_zip,
    }

    return jsonify(response_data)

@app.route('/file-tree')
def get_file_tree():
    directory_path = 'ExampleFiles'  # Replace with your folder path
    file_tree = get_files_in_directory(directory_path)
    return jsonify(file_tree)

def get_directory_size(directory):
    total_size = 0
    for dirpath, dirnames, filenames in os.walk(directory):
        for f in filenames:
            fp = os.path.join(dirpath, f)
            total_size += os.path.getsize(fp)
    return total_size

def get_modification_date(path):
    timestamp = os.path.getmtime(path)
    return datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S')

def get_files_in_directory(directory_path):
    files = []
    for item in os.listdir(directory_path):
        item_path = os.path.join(directory_path, item)
        is_directory = os.path.isdir(item_path)

        file_object = {
            'id': item,
            'name': item,
            'isDir': is_directory,
            'isHidden': is_directory,
            'openable': bool(0),
            'files': []
        }

        if not is_directory:
            file_object['size'] = os.path.getsize(item_path)
            file_object['modDate'] = datetime.fromtimestamp(os.path.getmtime(item_path)).strftime('%Y-%m-%d %H:%M:%S')


        if is_directory:
            file_object['files'] = get_files_in_directory(item_path)
            file_object['size'] = get_directory_size(item_path)  # Get directory size
            file_object['modDate'] = get_modification_date(item_path)  # Get modification date

        files.append(file_object)

    return files

@app.route('/delete-folders', methods=['DELETE'])
def delete_folders():
    try:
        data = request.json  # Get folder and file names from frontend

        conn = sqlite3.connect('data_sets.db')  # Connect to the database
        cursor = conn.cursor()

        for file_name in data:
            item_path = os.path.join('ExampleFiles', file_name)  # Assuming ExampleFiles is the root folder
            base_file_name = file_name
            if os.path.exists(item_path):
                if os.path.isdir(item_path):
                    shutil.rmtree(item_path)  # Remove the directory and its contents
                else:
                    os.remove(item_path)  # Remove the file

                    base_file_name = os.path.splitext(file_name)[0]
                    unzip_folder = os.path.join('ExampleFiles', base_file_name)
                    try:
                        shutil.rmtree(unzip_folder)
                    except FileNotFoundError:
                        pass  # No unpacked files

                cursor.execute("DELETE FROM files WHERE file_name = ?", (base_file_name,))
                conn.commit()

        conn.close()

        return jsonify({'message': 'Folders and files deleted successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500  # Handle exceptions

@app.route('/upload-zip', methods=['POST'])
def upload_zip():
    try:
        if 'file' not in request.files:
            return {'error': 'No file uploaded'}, 400

        uploaded_file = request.files['file']
        if uploaded_file.filename == '':
            return {'error': 'No selected file'}, 400

        # Save the uploaded file to a specific directory
        # Replace 'uploads' with your desired directory
        uploaded_file.save('ExampleFiles/' + uploaded_file.filename)

        with sqlite3.connect('data_sets.db') as db_connection:
            cursor = db_connection.cursor()
            cursor.execute('''CREATE TABLE IF NOT EXISTS files (
                        file_name TEXT PRIMARY KEY,
                        unzipped INTEGER,
                        total_islands Text,
                        total_years Text,
                        unique_months_str TEXT)''')
            cursor.close()

            unzip_and_update_db(('ExampleFiles/' + uploaded_file.filename), db_connection)

        return {'message': 'File uploaded successfully'}, 200
    except Exception as e:
        return {'error': str(e)}, 500

@app.route('/download-files', methods=['GET'])
def download_files():

    example_files_dir = 'ExampleFiles'

    try:
        file_ids = request.args.get('fileIds').split(',')
        temp_folder = 'output/temp_admin_download_folder'

        # Create a temporary folder to store downloaded files
        os.makedirs(temp_folder, exist_ok=True)

        # Compress selected files from ExampleFiles into a ZIP archive
        zip_path = os.path.join(temp_folder, 'downloaded_files.zip')
        with zipfile.ZipFile(zip_path, 'w') as zip_file:
            for file_id in file_ids:
                file_path = os.path.join(example_files_dir, file_id)
                if os.path.exists(file_path):
                    zip_file.write(file_path, os.path.basename(file_path))

        # Read the contents of the ZIP file
        with open(zip_path, 'rb') as f:
            zip_contents = f.read()

        # Encode the binary data to base64
        base64_encoded_zip = base64.b64encode(zip_contents).decode('utf-8')


        # Clean up the temporary shapefiles directory
        shutil.rmtree(temp_folder)

        response_data = {
            'zip_folder': base64_encoded_zip,
        }

        return(response_data)

    except Exception as e:
        return str(e)

@app.route('/login/auth', methods=['POST'])
def login():
    try:
        data = request.json
        username = data.get('auth', {}).get('username')
        password = data.get('auth', {}).get('password')

        if not username or not password:
            return jsonify({'message': 'Invalid credentials'}), 401

        if not authenticate_user(username, password):
            return jsonify({'message': 'Invalid username or password'}), 401

        # Encoding the JWT token
        token = jwt.encode({'username': username, 'exp': datetime.utcnow() + timedelta(minutes=30)},
                       app.config['SECRET_KEY'])

        return jsonify({'token': token}), 200

    except Exception as e:
        # Print the exception and stack trace for debugging
        print(f"Exception occurred: {str(e)}")
        import traceback
        traceback.print_exc()

        return jsonify({'message': 'Internal Server Error'}), 500

# Example route protected by token-based authentication
@app.route('/protected', methods=['GET'])
def protected():
    token = request.headers.get('Authorization')

    if not token:
        return jsonify({'message': 'Token is missing'}), 401

    try:
        # Verify the token
        decoded_token = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        username = decoded_token['username']

        return jsonify({'message': f'Hello, {username}! This is a protected route.'})

    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token'}), 401

@app.route('/get_text_file', methods=['GET'])
def get_text_file():
    # Read the text file content
    with open('ExampleFiles/FireDataText.txt', 'r') as file:
        text_content = file.read()

    return jsonify({'text_content': text_content})

@app.route('/get_pdf', methods=['POST'])
def get_file():
    try:
        # Get the filename from the POST request data
        filename = request.json.get('filename')
        if not filename:
            raise ValueError('Filename not provided in the request.')
        
        folder = 'ExampleFiles'

        # Construct the absolute path to the file
        file_path = f'{folder}\\{filename}'

        # Use Flask's send_from_directory to send the file
        return send_from_directory(folder, filename, mimetype='application/pdf')
    except Exception as e:
        return str(e), 500
    
@app.route('/get_text', methods=['POST'])
def get_text():
    try:
        # Get the filename from the POST request data
        filename = request.json.get('filename')
        if not filename:
            raise ValueError('Filename not provided in the request.')

        folder = 'ExampleFiles'

        # Construct the absolute path to the file
        file_path = f'{folder}/{filename}'
        print(file_path)

        # Read the text content from the file
        with open(file_path, 'r') as file:
            text_content = file.read()

        return {'text_content': text_content}
    except Exception as e:
        return str(e), 500


if __name__ == '__main__':
    app.run(debug=True)