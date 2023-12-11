import axios from 'axios';

const handleAction = async (data) => {
  try {
    if (data.id === 'delete_file') {
      // DELETE request to delete folders
      const folderNamesToDelete = data.state.selectedFiles.map((file) => file.id);
      const deleteResponse = await fetch('/delete-folders', {
        method: 'DELETE',
        body: JSON.stringify(folderNamesToDelete),
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!deleteResponse.ok) {
        console.error('Failed to delete folders');
        return false;
      } else {
        return true;
      }
    }

    if (data.id === 'upload') {
      // Create and upload file
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.zip'; // Restrict accepted file types to zip files

      // Trigger the file input dialog
      fileInput.click();

      const filePromise = new Promise((resolve, reject) => {
        // Listen for changes in the file input
        fileInput.addEventListener('change', async () => {
          const formData = new FormData();
          const file = fileInput.files[0]; // Get the selected file
          formData.append('file', file);

          // Send the file via a POST request to your server
          const uploadResponse = await fetch('upload-zip', {
            method: 'POST',
            body: formData,
          });

          if (uploadResponse.ok) {
            console.log('File uploaded successfully');
            resolve(true);
          } else {
            console.error('Failed to upload file');
            reject(false);
          }
        });
      });

      // Return a promise for this upload operation
      return filePromise;
    }

    if (data.id === 'download') {
      const selectedFiles = data.state.selectedFiles;
      const fileIds = selectedFiles.map((file) => file.id);
      const ZipApiUrl = 'download-files';
      const params = { fileIds: fileIds.join(',') };
      
      try {
        const response = await axios.get(ZipApiUrl, { params });
      
        // Assuming the response data contains 'data.zip_folder'
        const base64EncodedZip = response.data.zip_folder;
        const zipData = atob(base64EncodedZip);
        const uint8Array = new Uint8Array(zipData.length);
      
        for (let i = 0; i < zipData.length; i++) {
          uint8Array[i] = zipData.charCodeAt(i);
        }
      
        const blob = new Blob([uint8Array], { type: 'application/zip' });
        const url = window.URL.createObjectURL(blob);
      
        const link = document.createElement('a');
        link.href = url;
        link.download = 'download_data.zip';
      
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      
        console.log('Downloaded data');
        return true;
      } catch (error) {
        console.error('Failed to download files:', error);
        return false;
      }

    }
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
};

export default handleAction;
