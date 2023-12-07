import React, { useEffect, useState } from 'react';
import { FullFileBrowser, ChonkyActions } from 'chonky';
import { ChonkyIconFA } from 'chonky-icon-fontawesome';
import { setChonkyDefaults } from 'chonky';
import { customActions } from "./chonkyCustomActions";
import handleAction from "./chonkyActionHandler";

// Use `setChonkyDefaults` to set the default icons
setChonkyDefaults({
    iconComponent: ChonkyIconFA,
  });
  
  const FileManagerPage = () => {
    const [fileTree, setFileTree] = useState([]);

    const fetchFileTree = async () => {
        try {
          const response = await fetch('http://127.0.0.1:5000/file-tree');
          const data = await response.json();
          setFileTree(data);
        } catch (error) {
          console.error('Error fetching file tree:', error);
        }
      };

    const handleActionWrapper = (data) => {
        handleAction(data);
      };
  
    useEffect(() => {
      fetchFileTree();
    }, []);

  
    return (
      <div style={{ height: '80vh' }}>
        <FullFileBrowser
          files={fileTree}
          fileActions={[...customActions, ChonkyActions.DownloadFiles]}
          onFileAction={handleActionWrapper}
            // Add other action handlers if needed
        />
      </div>
    );
  };
  
  export default FileManagerPage;
