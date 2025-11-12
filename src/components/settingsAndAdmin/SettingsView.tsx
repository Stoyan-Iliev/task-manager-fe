import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  useTheme,
} from "@mui/material";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";

type Workflow = "Basic" | "Agile" | "Scrum";
type Priority = "Low" | "Medium" | "High";

const initialSettings = {
  workflow: "Agile" as Workflow,
  defaultPriority: "Medium" as Priority,
  customFields: ["Customer ID", "Release Notes"],
};

const SettingsView: React.FC = () => {
  const theme = useTheme();
  const [settings, setSettings] = useState(initialSettings);
  const [newField, setNewField] = useState("");

  const handleAddField = () => {
    if (!newField.trim()) return;
    setSettings((prev) => ({
      ...prev,
      customFields: [...prev.customFields, newField.trim()],
    }));
    setNewField("");
  };

  const handleRemoveField = (field: string) => {
    setSettings((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((f) => f !== field),
    }));
  };

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: theme.palette.background.default,
        minHeight: {
          xs: 'calc(100vh - 56px)',
          sm: 'calc(100vh - 64px)',
        },
      }}
    >
      <Typography
        variant="h4"
        sx={{ mb: 4, display: "flex", alignItems: "center", gap: 1 }}
        color="text.primary"
      >
        <SettingsRoundedIcon />
        System Settings
      </Typography>

      {/* Workflow & Priority */}
      <Paper sx={{ mb: 4, p: 3, boxShadow: 3, borderRadius: 2, bgcolor: theme.palette.background.paper }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Workflow Configuration
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{xs:12, md:6}}>
            <FormControl fullWidth size="small">
              <InputLabel>Workflow</InputLabel>
              <Select
                value={settings.workflow}
                label="Workflow"
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, workflow: e.target.value as Workflow }))
                }
              >
                <MenuItem value="Basic">Basic</MenuItem>
                <MenuItem value="Agile">Agile</MenuItem>
                <MenuItem value="Scrum">Scrum</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{xs:12, md:6}}>
            <FormControl fullWidth size="small">
              <InputLabel>Default Priority</InputLabel>
              <Select
                value={settings.defaultPriority}
                label="Default Priority"
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, defaultPriority: e.target.value as Priority }))
                }
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Custom Fields */}
      <Paper sx={{ mb: 4, p: 3, boxShadow: 3, borderRadius: 2, bgcolor: theme.palette.background.paper }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Custom Fields
        </Typography>

        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid size={{xs:12, md:8}}>
            <TextField
              fullWidth
              size="small"
              label="New Field"
              value={newField}
              onChange={(e) => setNewField(e.target.value)}
            />
          </Grid>
          <Grid size={{xs:12, md:4}}>
            <Button variant="contained" fullWidth onClick={handleAddField}>
              Add Field
            </Button>
          </Grid>
        </Grid>

        {settings.customFields.map((field) => (
          <Paper
            key={field}
            sx={{
              mb: 1,
              p: 1.5,
              borderRadius: 1.5,
              boxShadow: 1,
              bgcolor:
                theme.palette.mode === "dark"
                  ? theme.palette.background.paper
                  : theme.palette.action.hover,
              border: `1px solid ${
                theme.palette.mode === "dark"
                  ? theme.palette.divider
                  : "transparent"
              }`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              "&:hover": {
                boxShadow: 3,
              },
            }}
          >
            <Typography color="text.primary">{field}</Typography>
            <Button size="small" color="error" onClick={() => handleRemoveField(field)}>
              Remove
            </Button>
          </Paper>
        ))}
      </Paper>
    </Box>
  );
};

export default SettingsView;