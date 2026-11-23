const colors = {
  blue: { background: '#eaf3fb', border: '#9cc5e7', accent: '#00549f' },
  amber: { background: '#fff4df', border: '#f3cd83', accent: '#9a5900' },
  red: { background: '#fcebea', border: '#e9aaa5', accent: '#b3261e' }
};

export const operationalCardStyle = (tone = 'blue') => {
  const color = colors[tone] || colors.blue;
  return {
    height: '100%',
    bgcolor: color.background,
    borderColor: color.border,
    borderRadius: 1.5,
    overflow: 'hidden',
    '& .MuiCardActionArea-root': { height: '100%' },
    '& .MuiCardContent-root': { py: 1.25, px: 1.75 },
    '& .MuiTypography-caption': { color: color.accent, fontWeight: 700 },
    '& .MuiTypography-h4': { color: color.accent, mt: 0.5 }
  };
};
