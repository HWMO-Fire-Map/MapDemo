import geopandas as gpd
import pyproj
import folium
from folium.plugins import MarkerCluster
import random
import os

def read_prj_file(file_path):
    """
    Read the contents of a .prj file and return it as a string.

    Args:
        file_path (str): The path to the .prj file.

    Returns:
        str: The contents of the .prj file as a string, or None if the file cannot be read.
    """
    try:
        with open(file_path, 'r') as prj_file:
            prj_content = prj_file.read()
            return prj_content
    except Exception as e:
        print(f"Error: {e}")
        return None
    
# Location of the example shape file and project files
shapefile_path = 'ExampleFiles\\2022_2015_allfires.shp'
prjfile_path = 'ExampleFiles\\2022_2015_allfires.prj'
# Read the shapefile into a GeoDataFrame
gdf = gpd.read_file(shapefile_path)

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

# Dictionary to store unique years and corresponding random colors
year_colors = {}

# Add polygons to the map with fill color based on 'Year' column
for idx, row in gdf.iterrows():
    try:
        if row['geometry'].geom_type == 'Polygon':
            projected_coords = []
            for coords in row['geometry'].exterior.coords:
                projected_coords.append(original_proj(coords[0], coords[1], inverse=True))
            geojson_polygon = {
                "type": "Polygon",
                "coordinates": [projected_coords]
            }
        elif row['geometry'].geom_type == 'MultiPolygon':
            projected_polygons = []
            for polygon in row['geometry']:
                projected_coords = []
                for coords in polygon.exterior.coords:
                    projected_coords.append(original_proj(coords[0], coords[1], inverse=True))
                projected_polygons.append([projected_coords])
            geojson_polygon = {
                "type": "MultiPolygon",
                "coordinates": projected_polygons
            }

        # Get the 'Year' attribute
        year = row['Year']

        # Assign a random color if the year is not in the dictionary
        if year not in year_colors:
            year_colors[year] = "#{:02x}{:02x}{:02x}".format(random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))

        # Set fill color based on the random color assigned to the year
        fill_color = year_colors[year]
        
        folium.GeoJson(
            geojson_polygon,
            style_function=lambda feature: {
                'fillColor': fill_color,
                'color': 'black',
                'weight': 1,
                'fillOpacity': 0.6
            }
        ).add_to(m)
    except: 
        print("could not parse geometry")
        print(idx)

print(year_colors)

'''
# Get the centroid coordinates of each polygon and add them as markers
for idx, row in gdf.iterrows():
    centroid = row['geometry'].centroid
    centroid_utm_x, centroid_utm_y = centroid.x, centroid.y
    centroid_lat, centroid_lon = original_proj(centroid_utm_x, centroid_utm_y, inverse=True)
    folium.Marker([centroid_lon, centroid_lat], popup=f'Polygon {idx + 1}').add_to(m)
'''

# Print the map projection type
print("Map Projection Type:", gdf.crs)

m.save('map_with_geojson_polygon.html')