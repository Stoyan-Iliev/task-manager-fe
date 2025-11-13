import { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import ProfileTab from './ProfileTab';
import SecurityTab from './SecurityTab';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function UserSettingsPage() {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        User Settings
      </Typography>

      <Paper sx={{ mt: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="user settings tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            icon={<PersonIcon />}
            iconPosition="start"
            label="Profile"
            id="settings-tab-0"
            aria-controls="settings-tabpanel-0"
          />
          <Tab
            icon={<LockIcon />}
            iconPosition="start"
            label="Security"
            id="settings-tab-1"
            aria-controls="settings-tabpanel-1"
          />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <ProfileTab />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <SecurityTab />
        </TabPanel>
      </Paper>
    </Container>
  );
}
