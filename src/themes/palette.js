// third-party
import { presetPalettes } from '@ant-design/colors';

// project imports
import ThemeOption from './theme';
import { extendPaletteWithChannels } from 'utils/colorUtils';

const greyAscent = ['#F7FAFC', '#9CB0BF', '#365064', '#253F54'];

// ==============================|| GREY COLORS BUILDER ||============================== //

function buildGrey() {
  const greyPrimary = [
    '#FFFFFF',
    '#F7FAFC',
    '#EEF4F8',
    '#DFE8EF',
    '#CCD9E2',
    '#9CB0BF',
    '#6B8191',
    '#4D6475',
    '#365064',
    '#253F54',
    '#16324A'
  ];
  const greyConstant = ['#F7FAFC', '#DFE8EF'];

  return [...greyPrimary, ...greyAscent, ...greyConstant];
}

// ==============================|| DEFAULT THEME - PALETTE ||============================== //

export function buildPalette(presetColor) {
  const lightColors = { ...presetPalettes, grey: buildGrey() };
  const lightPaletteColor = ThemeOption(lightColors, presetColor);

  const commonColor = { common: { black: '#000000', white: '#FFFFFF' } };

  const extendedLight = extendPaletteWithChannels(lightPaletteColor);
  const extendedCommon = extendPaletteWithChannels(commonColor);

  return {
    light: {
      mode: 'light',
      ...extendedCommon,
      ...extendedLight,
      text: {
        primary: '#16324A',
        secondary: '#4D6475',
        disabled: '#9CB0BF'
      },
      action: {
        disabled: '#DFE8EF',
        hover: 'rgba(0, 84, 159, 0.05)',
        selected: 'rgba(0, 84, 159, 0.09)'
      },
      divider: '#DFE8EF',
      background: {
        paper: '#FFFFFF',
        default: '#F7FAFC'
      }
    }
  };
}
