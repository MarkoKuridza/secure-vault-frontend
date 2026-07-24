import { Box, Divider, Paper, Typography } from "@mui/material";

function SectionCard({ icon, title, error, children }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        mt: 3,
        p: 2.5,
        borderRadius: 2,
        borderColor: error ? "error.main" : "divider",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        {icon}
        <Typography variant="subtitle2">{title}</Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />
      {children}
    </Paper>
  );
}

export default SectionCard;
