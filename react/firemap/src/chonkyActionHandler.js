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
  };
  
  export default handleAction;
  