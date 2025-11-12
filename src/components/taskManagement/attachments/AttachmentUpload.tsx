import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  LinearProgress,
  Stack,
  IconButton,
  Paper,
  Alert,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import { FileIcon } from './FileIcon';
import { useUploadAttachment } from '../../../api/tasks';

interface AttachmentUploadProps {
  taskId: number;
  onUploadComplete?: () => void;
  maxFileSize?: number; // in bytes
}

interface UploadingFile {
  file: File;
  progress: number;
  error?: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB default

export const AttachmentUpload = ({
  taskId,
  onUploadComplete,
  maxFileSize = MAX_FILE_SIZE,
}: AttachmentUploadProps) => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const uploadAttachment = useUploadAttachment(taskId);

  const uploadFile = async (file: File) => {
    // Add to uploading list
    setUploadingFiles(prev => [...prev, { file, progress: 0 }]);

    try {
      // Simulate progress updates (since we don't have real progress from API)
      const progressInterval = setInterval(() => {
        setUploadingFiles(prev =>
          prev.map(uf =>
            uf.file === file && uf.progress < 90
              ? { ...uf, progress: uf.progress + 10 }
              : uf
          )
        );
      }, 100);

      // Upload file
      await uploadAttachment.mutateAsync(file);

      // Complete progress
      clearInterval(progressInterval);
      setUploadingFiles(prev =>
        prev.map(uf =>
          uf.file === file ? { ...uf, progress: 100 } : uf
        )
      );

      // Remove from uploading list after a short delay
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(uf => uf.file !== file));
      }, 500);

      // Notify parent
      onUploadComplete?.();
    } catch (error) {
      // Mark as error
      setUploadingFiles(prev =>
        prev.map(uf =>
          uf.file === file
            ? { ...uf, error: error instanceof Error ? error.message : 'Upload failed' }
            : uf
        )
      );
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      if (file.size > maxFileSize) {
        setUploadingFiles(prev => [
          ...prev,
          {
            file,
            progress: 0,
            error: `File size exceeds ${Math.round(maxFileSize / 1024 / 1024)}MB limit`
          }
        ]);
        return;
      }
      uploadFile(file);
    });
  }, [maxFileSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  const removeUploadingFile = (file: File) => {
    setUploadingFiles(prev => prev.filter(uf => uf.file !== file));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Box>
      {/* Dropzone */}
      <Paper
        {...getRootProps()}
        role="button"
        aria-label="Upload files by dragging and dropping or clicking"
        tabIndex={0}
        sx={{
          p: 3,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.2s',
          textAlign: 'center',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover',
          },
        }}
      >
        <input {...getInputProps()} aria-label="File upload input" />
        <CloudUploadIcon
          sx={{
            fontSize: 48,
            color: isDragActive ? 'primary.main' : 'action.active',
            mb: 1,
          }}
        />
        <Typography variant="body1" fontWeight={500} gutterBottom>
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          or click to browse (max {Math.round(maxFileSize / 1024 / 1024)}MB per file)
        </Typography>
      </Paper>

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <Stack spacing={1} sx={{ mt: 2 }}>
          {uploadingFiles.map((uploadingFile, index) => (
            <Paper
              key={index}
              sx={{
                p: 1.5,
                bgcolor: uploadingFile.error ? 'error.lighter' : 'background.paper',
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <FileIcon
                  fileName={uploadingFile.file.name}
                  mimeType={uploadingFile.file.type}
                  size="medium"
                  color="action"
                />

                <Box flex={1} minWidth={0}>
                  <Typography
                    variant="body2"
                    fontWeight={500}
                    noWrap
                    sx={{ mb: 0.5 }}
                  >
                    {uploadingFile.file.name}
                  </Typography>

                  {uploadingFile.error ? (
                    <Alert severity="error" sx={{ py: 0 }}>
                      {uploadingFile.error}
                    </Alert>
                  ) : (
                    <>
                      <Typography variant="caption" color="text.secondary">
                        {formatFileSize(uploadingFile.file.size)} • {uploadingFile.progress}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={uploadingFile.progress}
                        sx={{ mt: 0.5 }}
                      />
                    </>
                  )}
                </Box>

                <IconButton
                  size="small"
                  onClick={() => removeUploadingFile(uploadingFile.file)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
};
