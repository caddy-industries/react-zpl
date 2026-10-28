import type { Length } from '../units';

export type Color = 'black' | 'white' | 'transparent' | (string & {});

export interface Style {
  display?: 'flex' | 'none';
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  flexWrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  alignSelf?: 'auto' | 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  alignContent?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'space-between' | 'space-around';
  flex?: number;
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: Length;
  gap?: Length;
  rowGap?: Length;
  columnGap?: Length;
  aspectRatio?: number;

  width?: Length;
  height?: Length;
  minWidth?: Length;
  maxWidth?: Length;
  minHeight?: Length;
  maxHeight?: Length;

  padding?: Length;
  paddingTop?: Length;
  paddingRight?: Length;
  paddingBottom?: Length;
  paddingLeft?: Length;
  paddingHorizontal?: Length;
  paddingVertical?: Length;
  margin?: Length;
  marginTop?: Length;
  marginRight?: Length;
  marginBottom?: Length;
  marginLeft?: Length;
  marginHorizontal?: Length;
  marginVertical?: Length;

  position?: 'relative' | 'absolute';
  top?: Length;
  right?: Length;
  bottom?: Length;
  left?: Length;
  inset?: Length;

  borderWidth?: Length;
  borderTopWidth?: Length;
  borderRightWidth?: Length;
  borderBottomWidth?: Length;
  borderLeftWidth?: Length;
  borderColor?: Color;
  borderRadius?: Length;

  backgroundColor?: Color;
  color?: Color;

  /** Font height. ZPL's built-in font 0 is a bold condensed sans. */
  fontSize?: Length;
  /** Horizontal glyph scale relative to the font size (ZPL ^A width). 1 = normal. */
  fontStretch?: number;
  /** A number is a multiple of the font size; a length is absolute. */
  lineHeight?: number | string;
  textAlign?: 'left' | 'center' | 'right';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  whiteSpace?: 'normal' | 'nowrap';
  /** Maximum number of lines; extra text is cut off. */
  lineClamp?: number;
  /** What to show when text is cut off by lineClamp. */
  textOverflow?: 'clip' | 'ellipsis';
  /** Rotates text clockwise. */
  rotate?: 0 | 90 | 180 | 270;
}
