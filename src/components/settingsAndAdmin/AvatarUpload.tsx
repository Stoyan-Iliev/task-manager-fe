import { useRef, useState, useEffect } from 'react';
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { useUploadAvatar, useDeleteAvatar } from '../../api/user';
import { getAvatarUrl, getUserInitials } from '../../util/avatarUtils';
import toast from 'react-hot-toast';

interface AvatarUploadProps {
  userId?: number;
  currentAvatarUrl?: string;
  firstName?: string;
  lastName?: string;
}

export default function AvatarUpload({
  userId,
  currentAvatarUrl,
  firstName,
  lastName
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | undefined>(undefined);

  const uploadMutation = useUploadAvatar();
  const deleteMutation = useDeleteAvatar();

  const initials = getUserInitials(firstName, lastName);

  useEffect(() => {
    let mounted = true;

    const loadAvatar = async () => {
      const url = await getAvatarUrl(userId, currentAvatarUrl);
      if (mounted) {
        setAvatarSrc(url);
      }
    };

    loadAvatar();

    return () => {
      mounted = false;
    };
  }, [userId, currentAvatarUrl]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    uploadMutation.mutate(file, {
      onSuccess: () => {
        setPreview(null);
      },
      onError: () => {
        setPreview(null);
      },
    });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete your avatar?')) {
      deleteMutation.mutate();
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const displayAvatarUrl = preview || avatarSrc;
  const isLoading = uploadMutation.isPending || deleteMutation.isPending;

  return (
    <Box>
      <Stack direction="row" spacing={3} alignItems="center">
        <Box position="relative">
          <Avatar
            src={displayAvatarUrl}
            sx={{ width: 120, height: 120, fontSize: '2.5rem' }}
          >
            {initials}
          </Avatar>
          {isLoading && (
            <CircularProgress
              size={130}
              sx={{
                position: 'absolute',
                top: -5,
                left: -5,
              }}
            />
          )}
        </Box>

        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Upload a profile picture (max 5MB)
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Supported formats: JPEG, PNG, GIF, WebP
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<PhotoCameraIcon />}
              onClick={handleUploadClick}
              disabled={isLoading}
            >
              Upload
            </Button>

            {currentAvatarUrl && (
              <IconButton
                color="error"
                onClick={handleDelete}
                disabled={isLoading}
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Stack>
        </Stack>
      </Stack>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
    </Box>
  );
}
