import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Alert,
  Stack,
  Divider,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useApplyStatusTemplate } from '../../api/taskStatuses';

interface ApplyTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: number;
}

type StatusTemplate = 'BASIC' | 'SCRUM' | 'KANBAN' | 'SOFTWARE_DEVELOPMENT';

interface TemplateOption {
  id: StatusTemplate;
  name: string;
  description: string;
  statuses: Array<{ name: string; category: string; color: string }>;
  bestFor: string;
}

const templates: TemplateOption[] = [
  {
    id: 'BASIC',
    name: 'Basic (3 stages)',
    description: 'Simple workflow for small teams or personal projects',
    bestFor: 'Small teams, personal projects, getting started',
    statuses: [
      { name: 'To Do', category: 'TODO', color: '#9e9e9e' },
      { name: 'In Progress', category: 'IN_PROGRESS', color: '#2196f3' },
      { name: 'Done', category: 'DONE', color: '#4caf50' },
    ],
  },
  {
    id: 'SCRUM',
    name: 'Scrum (5 stages)',
    description: 'Standard Scrum workflow with backlog and review stages',
    bestFor: 'Agile teams, sprint-based development',
    statuses: [
      { name: 'Backlog', category: 'TODO', color: '#9e9e9e' },
      { name: 'Selected for Development', category: 'TODO', color: '#2196f3' },
      { name: 'In Progress', category: 'IN_PROGRESS', color: '#2196f3' },
      { name: 'In Review', category: 'IN_PROGRESS', color: '#9c27b0' },
      { name: 'Done', category: 'DONE', color: '#4caf50' },
    ],
  },
  {
    id: 'KANBAN',
    name: 'Kanban (4 stages)',
    description: 'Continuous flow with WIP limits to prevent bottlenecks',
    bestFor: 'Continuous delivery, support teams',
    statuses: [
      { name: 'To Do', category: 'TODO', color: '#9e9e9e' },
      { name: 'In Progress', category: 'IN_PROGRESS', color: '#2196f3' },
      { name: 'Testing', category: 'IN_PROGRESS', color: '#ff9800' },
      { name: 'Done', category: 'DONE', color: '#4caf50' },
    ],
  },
  {
    id: 'SOFTWARE_DEVELOPMENT',
    name: 'Software Development (7 stages)',
    description: 'Complete development lifecycle from design to deployment',
    bestFor: 'Software teams, full development cycles',
    statuses: [
      { name: 'Backlog', category: 'TODO', color: '#9e9e9e' },
      { name: 'Design', category: 'IN_PROGRESS', color: '#9c27b0' },
      { name: 'Development', category: 'IN_PROGRESS', color: '#2196f3' },
      { name: 'Code Review', category: 'IN_PROGRESS', color: '#ff9800' },
      { name: 'Testing', category: 'IN_PROGRESS', color: '#ff9800' },
      { name: 'Ready for Deploy', category: 'IN_PROGRESS', color: '#4caf50' },
      { name: 'Done', category: 'DONE', color: '#4caf50' },
    ],
  },
];

const ApplyTemplateDialog = ({ open, onClose, projectId }: ApplyTemplateDialogProps) => {
  const applyTemplate = useApplyStatusTemplate(projectId);
  const [selectedTemplate, setSelectedTemplate] = useState<StatusTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApply = () => {
    if (!selectedTemplate) return;

    setError(null);

    applyTemplate.mutate(
      selectedTemplate,
      {
        onSuccess: () => {
          handleClose();
        },
        onError: (err: Error) => {
          setError(err.message || 'Failed to apply template');
        },
      }
    );
  };

  const handleClose = () => {
    setSelectedTemplate(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth sx={{mt: 8}}>
      <DialogTitle>
        <Typography variant="h6">Apply Status Template</Typography>
        <Typography variant="body2" color="text.secondary">
          Choose a pre-configured workflow to quickly set up your project
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Alert severity="warning">
            <Typography variant="body2">
              <strong>Note:</strong> Applying a template will replace all existing statuses in this
              project. Any tasks will need to be reassigned to the new statuses.
            </Typography>
          </Alert>

          <Stack spacing={2}>
            {templates.map((template) => (
              <Card
                key={template.id}
                variant="outlined"
                sx={{
                  border: selectedTemplate === template.id ? 2 : 1,
                  borderColor:
                    selectedTemplate === template.id ? 'primary.main' : 'divider',
                  position: 'relative',
                }}
              >
                <CardActionArea onClick={() => setSelectedTemplate(template.id)}>
                  <CardContent>
                    {selectedTemplate === template.id && (
                      <CheckCircleIcon
                        color="primary"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                        }}
                      />
                    )}

                    <Typography variant="h6" gutterBottom>
                      {template.name}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {template.description}
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight="medium">
                        BEST FOR:
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {template.bestFor}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight="medium">
                        STATUSES ({template.statuses.length}):
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 1,
                          mt: 1,
                        }}
                      >
                        {template.statuses.map((status, index) => (
                          <Chip
                            key={index}
                            label={status.name}
                            size="small"
                            sx={{
                              borderLeft: 4,
                              borderLeftColor: status.color,
                              borderRadius: 1,
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={applyTemplate.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleApply}
          variant="contained"
          disabled={applyTemplate.isPending || !selectedTemplate}
        >
          {applyTemplate.isPending ? 'Applying...' : 'Apply Template'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApplyTemplateDialog;
