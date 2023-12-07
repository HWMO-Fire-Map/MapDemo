import { defineFileAction, ChonkyIconName } from "chonky";

const uploadFileAction = defineFileAction({
  id: "upload",
  fileFilter: (file) => file.isDir,
  button: {
    name: "Upload",
    toolbar: true,
    contextMenu: true,
    icon: ChonkyIconName.upload
  }
});

const delegateFileAction = defineFileAction({
  id: "delegate",
  fileFilter: (file) => file.isDir,
  button: {
    name: "Delegate",
    toolbar: true,
    contextMenu: true,
    icon: ChonkyIconName.loading
  }
});

const viewFileAction = defineFileAction({
  id: "view",
  requiresSelection: true,
  fileFilter: (file) => file && !file.isDir,
  button: {
    name: "View",
    toolbar: true,
    contextMenu: true,
    icon: ChonkyIconName.file
  }
});

const deleteFilesAction = defineFileAction({
    id: "delete_file",
    fileFilter: (file) => file.isDir,
    button: {
      name: "delete",
      toolbar: true,
      contextMenu: true,
      icon: ChonkyIconName.trash
    }
  });

export const customActions = [
  viewFileAction,
  deleteFilesAction,
  delegateFileAction,
  uploadFileAction
];
