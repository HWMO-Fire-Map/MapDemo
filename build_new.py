import shutil
import zipfile
import os

def delete_folder(path):
    try:
        shutil.rmtree(path)
        print(f"Deleted folder: {path}")
    except Exception as e:
        print(f"Error deleting folder {path}: {e}")

def unzip_latest_archive(folder_path, extract_path):
    try:
        zip_files = [f for f in os.listdir(folder_path) if f.endswith(".zip")]
        if not zip_files:
            print("No zip files found in the folder.")
            return

        latest_zip = max(zip_files, key=lambda f: os.path.getmtime(os.path.join(folder_path, f)))
        zip_path = os.path.join(folder_path, latest_zip)

        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_path)
        
        print(f"Extracted {latest_zip} to {extract_path}")
    except Exception as e:
        print(f"Error extracting latest zip file: {e}")

if __name__ == "__main__":
    current_directory = os.getcwd()  # Get the current directory
    
    old_path = os.path.join(current_directory, "react/firemap/build")
    drop_path = os.path.join(current_directory, "react/firemap")

    # Delete the folder
    delete_folder(old_path)

    # Unzip the latest archive
    unzip_latest_archive(drop_path, drop_path)
