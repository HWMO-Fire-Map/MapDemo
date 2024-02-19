import React, { useEffect, useState } from 'react';
import { FullFileBrowser, ChonkyActions } from 'chonky';
import { ChonkyIconFA } from 'chonky-icon-fontawesome';
import { setChonkyDefaults } from 'chonky';
import { customActions } from './chonkyCustomActions';
import handleAction from './chonkyActionHandler';
import FileButton from './FileButton';
import MainButton from './MainButton';
import Footer from './footer';

import { AppBar, Toolbar } from '@mui/material';

// Determine if the code is running in a development environment
const isDevelopment = process.env.NODE_ENV === 'development';

// Set the base URL accordingly
const baseURL = isDevelopment ? 'http://127.0.0.1:5000' : '';

// set hidden files to not be shown by default
ChonkyActions.ToggleHiddenFiles.option.defaultValue = false;

// Use `setChonkyDefaults` to set the default icons
setChonkyDefaults({
  iconComponent: ChonkyIconFA,
});

const FileBrowserWrapper = ({ fileTree, folderChain, customActions, handleAction, setFileTree }) => {
  const [key, setKey] = useState(0); // State to control the key

  const handleActionWrapper = async (data) => {
    const actionResult = await handleAction(data); // Perform the action

    // Check if the action type is 'upload' or 'delete'
    console.log(actionResult)
    if (actionResult === true) {
      // Fetch the updated fileTree
      try {
        const response = await fetch(`${baseURL}/file-tree`);
        const updatedFileTree = await response.json();
        setFileTree(updatedFileTree); // Update fileTree state
        setKey((prevKey) => prevKey + 1); // Update key to trigger FullFileBrowser reload
      } catch (error) {
        console.error('Error fetching updated file tree:', error);
      }
    }
  };

  return (
    <div style={{ height: '80vh' }}>
      <FullFileBrowser
        key={key} // Use the key to force reload
        files={fileTree}
        folderChain={folderChain}
        fileActions={[...customActions, ChonkyActions.ToggleHiddenFiles]}
        onFileAction={handleActionWrapper}
      />
    </div>
  );
};

const FileManagerPage = () => {
  const [fileTree, setFileTree] = useState([]);
  const folderChain = [
    {
        id: 'ExampleFiles',
        name: 'Data',
        isDir: true,
    },
];

  const fetchFileTree = async () => {
    try {
      const response = await fetch(`${baseURL}/file-tree`);
      const data = await response.json();
      setFileTree(data);
    } catch (error) {
      console.error('Error fetching file tree:', error);
    }
  };

  useEffect(() => {
    fetchFileTree();
  }, []);

  return (
    <div>
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateRows: 'auto 1fr',
          paddingLeft: '20px',
          paddingRight: '20px',
          paddingTop: '20px',
          paddingBottom: '20px',
          marginTop: '80px',
        
        }}>
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }} style={{ backgroundColor: '#1D6069' }}>
          <Toolbar sx={{ display: 'flex', marginLeft: '60px', justifyContent: 'space-between' }}>
            <MainButton />
            <div style={{ display: 'flex' }}>
              <FileButton />
            </div>
          </Toolbar>
        </AppBar>

        <FileBrowserWrapper
        fileTree={fileTree}
        folderChain={folderChain}
        customActions={customActions}
        handleAction={handleAction}
        setFileTree={setFileTree}
      />
      
      </div>
      <Footer/>
    </div>
  );
};

export default FileManagerPage;
