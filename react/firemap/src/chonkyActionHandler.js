import axios from 'axios';

// Determine if the code is running in a development environment
const isDevelopment = process.env.NODE_ENV === 'development';

// Set the base URL accordingly
const baseURL = isDevelopment ? 'http://127.0.0.1:5000' : '';

const handleAction = async (data) => {
  try {
    if (data.id === 'delete_file') {
      // DELETE request to delete folders
      const folderNamesToDelete = data.state.selectedFiles.map((file) => file.id);
      const deleteResponse = await fetch(`${baseURL}/delete-folders`, {
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
          const uploadResponse = await fetch(`${baseURL}/upload-zip`, {
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
      const ZipApiUrl = `${baseURL}/download-files`;
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

    if (data.id === 'mouse_click_file') {
      if (data.payload.clickType === 'double') {
        const fileName = data.payload.file.id;
        const fileExtension = fileName.split('.').pop().toLowerCase();
    
        if (fileExtension === 'pdf') {
          console.log(`PDF Selected: ${fileName}`);
    
          const serverUrl = `${baseURL}/get_pdf`;
    
          try {
            const response = await fetch(serverUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                filename: fileName,
              }),
            });
    
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    
              // Create a data URL from the Blob and open it in a new tab
              const url = URL.createObjectURL(blob);
              window.open(url, '_blank');
            } else {
              console.error('Failed to download file. Server returned:', response.status, response.statusText);
            }
          } catch (error) {
            console.error('Failed to download file:', error);
          }
        } else if (fileExtension === 'txt') {
          console.log(`Text File Selected: ${fileName}`);
          const serverUrl = `${baseURL}/get_text`;

          try {
            const response = await fetch(serverUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                filename: fileName,
              }),
            });

            if (response.ok) {
              const textContent = await response.text();

              // Replace line breaks with HTML line break tags
              const formattedTextContent = textContent.replace(/\n/g, '<br>');

              // Open the text content in a new window with wrapping
              const newWindow = window.open('', '_blank');
              newWindow.document.write('<html><head><title>Text Viewer</title></head><body>');
              newWindow.document.write('<pre style="white-space: pre-wrap;">');
              newWindow.document.write(`${formattedTextContent}`);
              newWindow.document.write('</pre>');
              newWindow.document.write('</body></html>');
            } else {
              console.error('Failed to load text file. Server returned:', response.status, response.statusText);
            }
          } catch (error) {
            console.error('Failed to load text file:', error);
          }
        } else {
          console.log(`Non-PDF Selected: ${fileName}`);
          // Add any other actions for non-PDF files if needed
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
};

export default handleAction;
