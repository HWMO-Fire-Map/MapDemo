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

const downloadFileAction = defineFileAction({
  id: "download",
  fileFilter: (file) => file.isDir,
  button: {
    name: "Download",
    toolbar: true,
    contextMenu: true,
    icon: ChonkyIconName.download
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
  uploadFileAction,
  downloadFileAction,
  deleteFilesAction,
];
