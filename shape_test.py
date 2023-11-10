import geopandas as gpd
import pyproj
import folium
import random
import json
import numpy as np
from flask import Flask, jsonify, request
from shapely.geometry import Polygon, MultiPolygon
from folium.plugins import MarkerCluster
from flask_cors import CORS

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

def parse_year_range(year_range):
    """
    Parse input year range in the format ['2010-2015'] and generate individual years as a list.
    
    Args:
        year_range (list): A list containing a year range in the format ['start-end'].
        
    Returns:
        list: A list containing individual years from the input range.
    """
    years = []
    if year_range and len(year_range) == 1:
        start, end = map(int, year_range[0].strip("[]").split('-'))
        years = [str(year) for year in range(start, end + 1)]
    return years

def filter_geo_data(gdf, years, islands):
    filtered_rows = []

    # Iterate over rows of the GeoDataFrame
    for index, row in gdf.iterrows():
        if row['Year'] in str(years) and row['Island'] in islands:
            filtered_rows.append(row)
    
    if not filtered_rows:
        return gpd.GeoDataFrame(columns=gdf.columns, crs=gdf.crs)
    else:
        # Convert the list of filtered rows back to a GeoDataFrame
        filtered_gdf = gpd.GeoDataFrame(filtered_rows, crs=gdf.crs, geometry='geometry')
        
        return filtered_gdf

@app.route('/api/data', methods=['GET'])
def get_filtered_data():

    # Retrieve query parameters for 'years' and 'islands'
    years_get = request.args.getlist('years')
    islands_get = request.args.getlist('islands')
    years_get = parse_year_range(years_get)
    print(years_get)

    # Location of the example shape file and project files
    shapefile_path = 'ExampleFiles\\2022_2015_allfires.shp'
    prjfile_path = 'ExampleFiles\\2022_2015_allfires.prj'

    # Read the shapefile into a GeoDataFrame
    gdf = gpd.read_file(shapefile_path)

    # Call the drop_multipolygons function to remove MultiPolygons
    gdf = drop_multipolygons(gdf)

    gdf = filter_geo_data(gdf, years_get, islands_get)

    # Get unique years and islands
    unique_islands = list(gdf['Island'].unique())
    unique_years_str = list(gdf['Year'].unique())

    # Convert 'Year' column to integer type if it's not already
    gdf['Year'] = gdf['Year'].astype(int)

    # Define a color dictionary for each unique year
    unique_years = gdf['Year'].unique()
    year_colors = {year: "#{:02x}{:02x}{:02x}".format(random.randint(0, 255), random.randint(0, 255), random.randint(0, 255)) for year in unique_years}

    # Define the original projection using the provided WKT format
    original_proj_wkt = read_prj_file(prjfile_path)

    # Create a Proj object from the provided WKT projection information
    original_proj = pyproj.Proj(original_proj_wkt)
    # Calculate centroid of the first polygon
    first_polygon_centroid = gdf['geometry'].iloc[0].centroid
    centroid_utm_x, centroid_utm_y = first_polygon_centroid.x, first_polygon_centroid.y
    centroid_lat, centroid_lon = original_proj(centroid_utm_x, centroid_utm_y, inverse=True)

    # Create a map centered over the first polygon
    m = folium.Map(location=[centroid_lon, centroid_lat], zoom_start=10)

    # Create a MarkerCluster layer
    marker_cluster = MarkerCluster().add_to(m)
    # Get the centroid coordinates of each polygon and add them as markers
    for idx, row in gdf.iterrows():
        centroid = row['geometry'].centroid
        centroid_utm_x, centroid_utm_y = centroid.x, centroid.y
        centroid_lat, centroid_lon = original_proj(centroid_utm_x, centroid_utm_y, inverse=True)

        # Get comments and area information
        comments = row['Comments']
        acerage = row['Acerage']
        month = row['FireMonth']
        
        # Create marker popup content with comments and area
        popup_content = f'Comments: {comments}\n'
        popup_content += f'Acres: {acerage}\n'
        popup_content += f'Month: {month}'
        
        folium.Marker([centroid_lon, centroid_lat], popup=folium.Popup(popup_content, parse_html=True)).add_to(marker_cluster)

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

    # Create the legend HTML content
    legend_html = '''
        <div style="position: fixed; 
                    bottom: 50px; right: 50px; width: 100px; height: 150px; 
                    border:2px solid grey; z-index:9999; font-size:14px;
                    background-color:white; opacity:0.9">
        '''
    for year, color in year_colors.items():
        legend_html += '<i style="background:{};width:10px;height:10px;float:left;margin-right:5px;"></i> {}<br>'.format(color, year)

    legend_html += '</div>'

    # Add the legend HTML content to the map
    m.get_root().html.add_child(folium.Element(legend_html))

    # Print the map projection type
    print("Map Projection Type:", gdf.crs)
    map_save = 'D:\Documents\GitHub\MapDemo\\react\\firemap\public\\filtered_map.html'
    print(f"saving to {map_save}")
    m.save(map_save)

    map_data = m.to_json()

    # Return GeoJSON data, map object, unique years, and unique islands

    response_data = {
        "uniqueYears": unique_years_str,
        "uniqueIslands": unique_islands,
    }

    return jsonify(response_data)



@app.route('/api/list', methods=['GET'])
def get_default_data():

    # Location of the example shape file and project files
    shapefile_path = 'ExampleFiles\\2022_2015_allfires.shp'

    # Read the shapefile into a GeoDataFrame
    gdf_total = gpd.read_file(shapefile_path)

    # Get unique years and islands
    total_islands = list(gdf_total['Island'].unique())
    total_years = list(gdf_total['Year'].unique())

    response_data = {
        "allYears": total_years,
        "allIslands": total_islands
    }

    return jsonify(response_data)


if __name__ == '__main__':
    app.run(debug=True)