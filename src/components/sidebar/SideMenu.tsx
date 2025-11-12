import styled from "@emotion/styled";
import { Box, Divider, Stack, Avatar, Typography, useTheme } from "@mui/material";
import MuiDrawer, { drawerClasses } from '@mui/material/Drawer';
import SelectContent from "./SelectContent";
import MenuContent from "./MenuContent";

const drawerWidth = 240;

const Drawer = styled(MuiDrawer)({
  width: drawerWidth,
  flexShrink: 0,
  boxSizing: 'border-box',
  [`& .${drawerClasses.paper}`]: {
    width: drawerWidth,
    boxSizing: 'border-box',
  },
});

type SideMenuProps = {
  open: boolean;
  onClose: () => void;
};

export default function SideMenu({ open, onClose: _onClose }: SideMenuProps) {
  const theme = useTheme();
  return (
    <Drawer
      variant="persistent"
      open={open}
      sx={{
        [`& .${drawerClasses.paper}`]: {
          backgroundColor: 'background.paper',
        },
      }}
    >
      <Box sx={{ display: 'flex', mt: '64px', p: 1.5 }}>
        <SelectContent />
      </Box>
      <Divider />
      <Box
        sx={{
          overflow: 'auto',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <MenuContent />
      </Box>
    </Drawer>
  );
}