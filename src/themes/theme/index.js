// ==============================|| PRESET THEME - DEFAULT ||============================== //

export default function Default(colors) {
  const { red, gold, grey } = colors;
  const greyColors = {
    0: grey[0],
    50: grey[1],
    100: grey[2],
    200: grey[3],
    300: grey[4],
    400: grey[5],
    500: grey[6],
    600: grey[7],
    700: grey[8],
    800: grey[9],
    900: grey[10],
    A50: grey[15],
    A100: grey[11],
    A200: grey[12],
    A400: grey[13],
    A700: grey[14],
    A800: grey[16]
  };
  const contrastText = '#FFFFFF';

  return {
    primary: {
      lighter: '#E6F1FA',
      100: '#CCE3F3',
      200: '#99C6E6',
      light: '#3380B9',
      400: '#196AAA',
      main: '#00549F',
      dark: '#00477F',
      700: '#003B6F',
      darker: '#002F59',
      900: '#00213F',
      contrastText
    },
    secondary: {
      lighter: '#FFF2E8',
      100: '#FFE4D0',
      200: '#FFC39A',
      light: '#FF9A4F',
      400: '#FF862C',
      main: '#FF740C',
      600: '#E9670B',
      dark: '#CC5A09',
      800: '#A84808',
      darker: '#7F3606',
      A100: '#FFF8F2',
      A200: '#FFD5B5',
      A300: '#FFA861',
      contrastText: '#002F59'
    },
    error: {
      lighter: red[0],
      light: red[2],
      main: red[4],
      dark: red[7],
      darker: red[9],
      contrastText
    },
    warning: {
      lighter: gold[0],
      light: gold[3],
      main: gold[5],
      dark: gold[7],
      darker: gold[9],
      contrastText: greyColors[100]
    },
    info: {
      lighter: '#E6F1FA',
      light: '#3380B9',
      main: '#00549F',
      dark: '#00477F',
      darker: '#002F59',
      contrastText
    },
    success: {
      lighter: '#EAF6EC',
      light: '#66BB6A',
      main: '#2E7D32',
      dark: '#1B5E20',
      darker: '#0E3B12',
      contrastText
    },
    grey: greyColors
  };
}
