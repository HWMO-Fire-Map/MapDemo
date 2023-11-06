import geopandas as gpd
import pyproj
import folium
from folium.plugins import MarkerCluster

# Replace 'path/to/your/shapefile.shp' with the actual path to your shapefile
shapefile_path = 'D:\\Desktop\\HWMO\\shape_test\\2022_2015_allfires.shp'

# Read the shapefile into a GeoDataFrame
gdf = gpd.read_file(shapefile_path)

# Define the original projection using the provided WKT format
original_proj_wkt = """
    PROJCS["WGS_1984_UTM_Zone_54N",
        GEOGCS["GCS_WGS_1984",
            DATUM["D_WGS_1984",
                SPHEROID["WGS_1984",6378137.0,298.257223563]],
            PRIMEM["Greenwich",0.0],
            UNIT["Degree",0.0174532925199433]
        ],
        PROJECTION["Transverse_Mercator"],
        PARAMETER["False_Easting",500000.0],
        PARAMETER["False_Northing",0.0],
        PARAMETER["Central_Meridian",141.0],
        PARAMETER["Scale_Factor",0.9996],
        PARAMETER["Latitude_Of_Origin",0.0],
        UNIT["Meter",1.0]
    ]
"""

# Create a Proj object from the provided WKT projection information
original_proj = pyproj.Proj(original_proj_wkt)

# Create a map centered over the first feature
m = folium.Map(location=[0, 0], zoom_start=10)

# Create a MarkerCluster object
marker_cluster = MarkerCluster().add_to(m)

# Get the centroid coordinates of each polygon and add them to the marker cluster
for idx, row in gdf.iterrows():
    centroid = row['geometry'].centroid
    centroid_utm_x, centroid_utm_y = centroid.x, centroid.y
    centroid_lat, centroid_lon = original_proj(centroid_utm_x, centroid_utm_y, inverse=True)
    print(f"Polygon {idx + 1} - Centroid Latitude: {centroid_lat}, Centroid Longitude: {centroid_lon}")
    folium.Marker([centroid_lat, centroid_lon]).add_to(marker_cluster)

# Print the map projection type
m.save('polygon_map.html')
print("Map Projection Type:", gdf.crs)
