import React, { useEffect, useState } from 'react';
import { FullFileBrowser, ChonkyActions } from 'chonky';
import { ChonkyIconFA } from 'chonky-icon-fontawesome';
import { setChonkyDefaults } from 'chonky';
import { customActions } from './chonkyCustomActions';
import handleAction from './chonkyActionHandler';
import LoginForm from './LoginComponent';
import FileButton from './FileButton';
import MainButton from './MainButton';
import Footer from './footer';

import { AppBar, Toolbar } from '@mui/material';

// set hidden files to not be shown by default
ChonkyActions.ToggleHiddenFiles.option.defaultValue = false;

// Use `setChonkyDefaults` to set the default icons
setChonkyDefaults({
  iconComponent: ChonkyIconFA,
});

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
              <LoginForm />
            </div>
          </Toolbar>
        </AppBar>

        <div style={{ height: '80vh'}}>
          <FullFileBrowser
            files={fileTree}
            folderChain={folderChain}
            fileActions={[...customActions, ChonkyActions.ToggleHiddenFiles]}
            onFileAction={handleActionWrapper}
            //defaultFileViewActionId={ChonkyActions.EnableListView.id}
            // Add other action handlers if needed
          />
        </div>
      
      </div>
      <Footer/>
    </div>
  );
};

export default FileManagerPage;
