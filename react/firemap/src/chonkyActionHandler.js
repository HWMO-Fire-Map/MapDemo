const handleAction = async (data) => {
    console.log("handle", data);
  
    if (data.id === 'delete_file') {
      try {
        // If there are folders to delete, proceed with the delete API call
        const folderNamesToDelete = data.state.selectedFiles.map((file) => file.id);
        const response = await fetch('http://127.0.0.1:5000/delete-folders', {
          method: 'DELETE',
          body: JSON.stringify(folderNamesToDelete),
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        if (response.ok) {
          console.log('Folders deleted successfully');
  
          // Reload the page after updating the file tree
          window.location.reload();
        } else {
          console.error('Failed to delete folders');
        }
      } catch (error) {
        console.error('Error deleting folders:', error);
      }
    }

    if (data.id === 'upload') {
      try {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.zip'; // Restrict accepted file types to zip files
  
        // Trigger the file input dialog
        fileInput.click();
  
        // Listen for changes in the file input
        fileInput.addEventListener('change', async () => {
          const formData = new FormData();
          const file = fileInput.files[0]; // Get the selected file
          formData.append('file', file);
  
          // Send the file via a POST request to your server
          const response = await fetch('http://127.0.0.1:5000/upload-zip', {
            method: 'POST',
            body: formData,
          });
  
          if (response.ok) {
            console.log('File uploaded successfully');
  
            // Reload the page or perform other actions upon successful upload
            window.location.reload();
          } else {
            console.error('Failed to upload file');
          }
        });
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
  };
  
  export default handleAction;
  