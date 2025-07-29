import React from 'react';
import { Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { Dragger } = Upload;

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
  label?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  accept = '.xlsx,.xls',
  maxSize = 10,
  label = 'Click or drag file to this area to upload'
}) => {
  const props: UploadProps = {
    name: 'file',
    multiple: false,
    accept,
    beforeUpload: (file) => {
      const isValidType = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                         file.type === 'application/vnd.ms-excel';
      if (!isValidType) {
        message.error('You can only upload Excel files!');
        return false;
      }
      
      const isValidSize = file.size / 1024 / 1024 < maxSize;
      if (!isValidSize) {
        message.error(`File must be smaller than ${maxSize}MB!`);
        return false;
      }
      
      onFileSelect(file);
      return false; // Prevent automatic upload
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
    },
  };

  return (
    <Dragger {...props}>
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">{label}</p>
      <p className="ant-upload-hint">
        Support for Excel files (.xlsx, .xls). Max size: {maxSize}MB
      </p>
    </Dragger>
  );
};

export default FileUpload;