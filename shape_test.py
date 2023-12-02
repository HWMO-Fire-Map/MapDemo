import os
import io
import base64
import geopandas as gpd
import pyproj
import folium
import random
import math
import numpy as np
import zipfile
import shutil
from palettable.colorbrewer.qualitative import Set3_12
from flask import Flask, jsonify, request
from shapely.geometry import Polygon, MultiPolygon
from folium.plugins import MarkerCluster
from shapely.geometry import Point
from flask_cors import CORS
from db_functions import*
from collections import defaultdict

debug = False

app = Flask(__name__)
CORS(app)

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

def sort_months(arr):
    months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]

    only_months = sorted([month for month in arr if month in months], key=lambda x: months.index(x))
    other_items = [item for item in arr if item not in months]

    return only_months + other_items
    
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

    default_dataSet = '2022_2015_allfires'

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
        shapefile_path = "ExampleFiles\\"+dataSet_get+"\\"+dataSet_get+".shp"
        prjfile_path = 'ExampleFiles\\'+str(dataSet_get)+'\\'+str(dataSet_get)+'.prj'
    except:
        shapefile_path = 'ExampleFiles\\'+str(default_dataSet)+'\\'+str(default_dataSet)+'.shp'
        prjfile_path = 'ExampleFiles\\'+str(default_dataSet)+'\\'+str(default_dataSet)+'.prj'
        
    #convert the list object to a commma seperated list
    split_months = convert_months(months_get)
    split_islands = convert_islands(islands_get)

    gdf = gpd.read_file(shapefile_path)  

    # Call the drop_multipolygons function to remove MultiPolygons
    gdf = drop_multipolygons(gdf)

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
            summary_legend_html += f'<td style="border: 1px solid black;">{round(total_acres, 2)}</td>'
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
    user_folder = 'output\\user_maps\\'+'user_'+str(id_get)

    create_user_folder(user_folder)
    map_save = user_folder+ '\\'+ str(id_get)+'_filtered_map.html'

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

    map_url = '/user_maps/user_'+str(id_get)+'/'+str(id_get)+'_filtered_map.html'

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
    
    default_dataSet = '2022_2015_allfires'

    dataPath = 'ExampleFiles'
    data_sets = [name for name in os.listdir(dataPath) if os.path.isdir(os.path.join(dataPath, name))]

    if debug:
        print(data_sets)

    try:
        dataSet_get = dataSet_raw[0][1:-1]
        shapefile_path = "ExampleFiles\\"+dataSet_get+"\\"+dataSet_get+".shp"
    except:
        shapefile_path = 'ExampleFiles\\'+str(default_dataSet)+'\\'+str(default_dataSet)+'.shp'

    # Read the shapefile into a GeoDataFrame
    gdf_total = gpd.read_file(shapefile_path)

    unique_months = list(gdf_total['FireMonth'].unique())
    sorted_months = sort_months(unique_months)
    if debug:
        print(sorted_months)

    # Get unique years and islands
    total_islands = list(gdf_total['Island'].unique())
    total_years = sorted(list(gdf_total['Year'].unique()))
    unique_months_str = sorted_months

    response_data = {
        "allYears": total_years,
        "allIslands": total_islands,
        "allMonths": unique_months_str,
        "allDataSets": data_sets
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
    #generate a shapefile with the selected saved perameters

    id_get = request.args.get('id_num')

    temp_values = get_values_by_id(id_get)

    years = temp_values[2]
    islands = temp_values[3]
    months = temp_values[4]
    dataSet_get = temp_values[5]

    default_dataSet = '2022_2015_allfires'

    try:
        shapefile_path = "ExampleFiles\\"+dataSet_get+"\\"+dataSet_get+".shp"
    except:
        shapefile_path = 'ExampleFiles\\'+str(default_dataSet)+'\\'+str(default_dataSet)+'.shp'

    gdf = gpd.read_file(shapefile_path)  

    # Call the drop_multipolygons function to remove MultiPolygons
    gdf = drop_multipolygons(gdf)

    gdf = filter_geo_data(gdf, years, months, islands)

    user_folder = 'output\\user_maps\\'+'user_'+str(id_get)

    # Save GeoDataFrame to a shapefile
    temp_shapefile_path = user_folder+'\\shapefiles'
    os.makedirs(temp_shapefile_path, exist_ok=True)
    gdf.to_file(temp_shapefile_path, driver='ESRI Shapefile')

    # Instead of saving to disk, create the Zip file in memory
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, _, files in os.walk(temp_shapefile_path):
            for file in files:
                file_path = os.path.join(root, file)
                zipf.write(file_path, os.path.relpath(file_path, temp_shapefile_path))

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


if __name__ == '__main__':
    app.run(debug=True)