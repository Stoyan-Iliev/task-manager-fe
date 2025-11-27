import { useNavigate, useLocation } from 'react-router';
import { useSelector } from 'react-redux';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import QueueRoundedIcon from '@mui/icons-material/QueueRounded';
// import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded';
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import NewReleasesRoundedIcon from '@mui/icons-material/NewReleasesRounded';
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
// import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import BusinessIcon from '@mui/icons-material/Business';
import { selectCurrentOrganizationId } from '../../redux/organizationSlice';

const mainListItems = [
  { text: 'Home', icon: <HomeRoundedIcon />, path: '/' },
  { text: 'Projects', icon: <FolderRoundedIcon />, path: '/projects' },
  { text: 'Tasks', icon: <AssignmentRoundedIcon />, path: '/tasks' },
  { text: 'Backlog', icon: <QueueRoundedIcon />, path: '/backlog' },
  { text: 'Sprints', icon: <TimelineRoundedIcon />, path: '/sprints' },
  { text: 'Team', icon: <GroupRoundedIcon />, path: '/team' },
  { text: 'Releases', icon: <NewReleasesRoundedIcon />, path: '/releases' },
  // { text: 'Reports', icon: <BarChartRoundedIcon />, path: '/reports' },
  { text: "Search", icon: <SearchRoundedIcon />, path: "/search" },
  { text: 'Notifications', icon: <NotificationsRoundedIcon />, path: '/notifications' },
];

export default function MenuContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentOrgId = useSelector(selectCurrentOrganizationId);

  const secondaryListItems = [
    ...(currentOrgId
      ? [
          {
            text: 'Organization',
            icon: <BusinessIcon />,
            path: `/organizations/${currentOrgId}/settings`,
          },
        ]
      : []),
    // { text: 'Settings', icon: <SettingsRoundedIcon />, path: '/settings' },
  ];

  return (
    <Stack sx={{ flexGrow: 1, p: 1, justifyContent: 'space-between' }}>
      <List dense>
        {mainListItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <List dense>
        {secondaryListItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}