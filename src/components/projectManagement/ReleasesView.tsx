import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Paper,
  TextField,
  IconButton,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import NewReleasesRoundedIcon from "@mui/icons-material/NewReleasesRounded";
import dayjs, { Dayjs } from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

type Release = {
  id: string;
  version: string;
  releaseDate?: string;
  notes?: string;
};

const initialReleases: Release[] = [
  { id: "1", version: "1.0.0", releaseDate: "2025-08-01", notes: "Initial release" },
  { id: "2", version: "1.1.0", releaseDate: "2025-08-15", notes: "Minor improvements" },
];

const ReleasesView: React.FC = () => {
  const theme = useTheme();
  const [releases, setReleases] = useState<Release[]>(initialReleases);

  const [newVersion, setNewVersion] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newDate, setNewDate] = useState<Dayjs | null>(dayjs());

  const handleAddRelease = () => {
    if (!newVersion) return;
    const release: Release = {
      id: Date.now().toString(),
      version: newVersion,
      releaseDate: newDate ? newDate.format("YYYY-MM-DD") : undefined,
      notes: newNotes,
    };
    setReleases((prev) => [...prev, release]);
    setNewVersion("");
    setNewNotes("");
    setNewDate(dayjs());
  };

  const handleRemoveRelease = (id: string) => {
    setReleases((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: theme.palette.background.default,
        minHeight: {
          xs: "calc(100vh - 56px)",
          sm: "calc(100vh - 64px)",
        },
      }}
    >
      <Typography variant="h4" sx={{ mb: 3 }} color="text.primary">
        <NewReleasesRoundedIcon sx={{ mr: 1, verticalAlign: "middle" }} />
        Releases / Versions
      </Typography>

      {/* Add Release Section */}
      <Paper
        sx={{
          p: 3,
          mb: 4,
          bgcolor: theme.palette.background.paper,
          boxShadow: 3,
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }} color="text.primary">
          Add New Release
        </Typography>

        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Version"
              value={newVersion}
              onChange={(e) => setNewVersion(e.target.value)}
              size="small"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <DatePicker
              label="Release Date"
              value={newDate}
              onChange={(date) => setNewDate(date)}
              slotProps={{ textField: { fullWidth: true, size: "small" } }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Notes"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              size="small"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddRelease}
              fullWidth
            >
              Add
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Releases Grid */}
      <Grid container spacing={2}>
        {releases.map((release) => (
          <Grid key={release.id} size={{ xs: 12, md: 4 }}>
            <Card
              sx={{
                bgcolor: theme.palette.background.paper,
                boxShadow: 3,
                borderRadius: 2,
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
              }}
            >
              <CardContent
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography variant="subtitle1" fontWeight={500} color="text.primary">
                    Version {release.version}
                  </Typography>
                  {release.releaseDate && (
                    <Typography variant="body2" color="text.secondary">
                      Release Date: {release.releaseDate}
                    </Typography>
                  )}
                  {release.notes && (
                    <Typography variant="body2" color="text.secondary">
                      Notes: {release.notes}
                    </Typography>
                  )}
                </Box>
                <IconButton
                  color="error"
                  onClick={() => handleRemoveRelease(release.id)}
                  title="Delete Release"
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ReleasesView;
