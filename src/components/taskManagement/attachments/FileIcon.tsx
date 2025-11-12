import {
  InsertDriveFile,
  PictureAsPdf,
  Description,
  TableChart,
  Slideshow,
  Code,
  VideoLibrary,
  AudioFile,
  Archive,
  Image as ImageIcon,
} from '@mui/icons-material';

interface FileIconProps {
  fileName: string;
  mimeType?: string;
  size?: 'small' | 'medium' | 'large';
  color?: 'inherit' | 'primary' | 'secondary' | 'action' | 'disabled';
}

export const FileIcon = ({
  fileName,
  mimeType,
  size = 'medium',
  color = 'action'
}: FileIconProps) => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  const getIconByExtension = () => {
    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
      return <ImageIcon fontSize={size} color={color} />;
    }

    // PDFs
    if (extension === 'pdf') {
      return <PictureAsPdf fontSize={size} color={color} />;
    }

    // Documents
    if (['doc', 'docx', 'odt', 'txt', 'rtf'].includes(extension)) {
      return <Description fontSize={size} color={color} />;
    }

    // Spreadsheets
    if (['xls', 'xlsx', 'ods', 'csv'].includes(extension)) {
      return <TableChart fontSize={size} color={color} />;
    }

    // Presentations
    if (['ppt', 'pptx', 'odp'].includes(extension)) {
      return <Slideshow fontSize={size} color={color} />;
    }

    // Code files
    if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt', 'html', 'css', 'scss', 'json', 'xml', 'yaml', 'yml', 'md'].includes(extension)) {
      return <Code fontSize={size} color={color} />;
    }

    // Video
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension)) {
      return <VideoLibrary fontSize={size} color={color} />;
    }

    // Audio
    if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(extension)) {
      return <AudioFile fontSize={size} color={color} />;
    }

    // Archives
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension)) {
      return <Archive fontSize={size} color={color} />;
    }

    // Default
    return <InsertDriveFile fontSize={size} color={color} />;
  };

  const getIconByMimeType = () => {
    if (!mimeType) return null;

    if (mimeType.startsWith('image/')) {
      return <ImageIcon fontSize={size} color={color} />;
    }
    if (mimeType === 'application/pdf') {
      return <PictureAsPdf fontSize={size} color={color} />;
    }
    if (mimeType.includes('word') || mimeType.includes('document')) {
      return <Description fontSize={size} color={color} />;
    }
    if (mimeType.includes('sheet') || mimeType.includes('excel')) {
      return <TableChart fontSize={size} color={color} />;
    }
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
      return <Slideshow fontSize={size} color={color} />;
    }
    if (mimeType.startsWith('video/')) {
      return <VideoLibrary fontSize={size} color={color} />;
    }
    if (mimeType.startsWith('audio/')) {
      return <AudioFile fontSize={size} color={color} />;
    }
    if (mimeType.includes('zip') || mimeType.includes('compressed')) {
      return <Archive fontSize={size} color={color} />;
    }

    return null;
  };

  // Prefer MIME type over extension if available
  return getIconByMimeType() || getIconByExtension();
};
