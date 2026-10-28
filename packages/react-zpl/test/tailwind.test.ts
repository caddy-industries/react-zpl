import { describe, expect, it } from 'vitest';
import { tw } from '../src/style/tailwind';

describe('tw', () => {
  it('maps spacing, sizing and flex classes', () => {
    expect(tw('flex items-center justify-between gap-2 p-4 px-[3mm] w-1/2 h-full').style).toEqual({
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      padding: 16,
      paddingLeft: '3mm',
      paddingRight: '3mm',
      width: '50%',
      height: '100%',
    });
  });

  it('keeps an explicit direction with flex', () => {
    expect(tw('flex flex-col').style.flexDirection).toBe('column');
    expect(tw('flex-col flex').style.flexDirection).toBe('column');
  });

  it('maps text and colour classes', () => {
    expect(tw('text-2xl text-center uppercase text-white bg-black leading-none').style).toEqual({
      fontSize: 24,
      textAlign: 'center',
      textTransform: 'uppercase',
      color: 'white',
      backgroundColor: 'black',
      lineHeight: 1,
    });
  });

  it('maps borders and radii', () => {
    expect(tw('border-2 border-t-4 rounded-lg').style).toEqual({
      borderWidth: 2,
      borderTopWidth: 4,
      borderRadius: 8,
    });
  });

  it('handles negative values and positions', () => {
    expect(tw('absolute -top-2 left-1/2 -mt-1').style).toEqual({
      position: 'absolute',
      top: -8,
      left: '50%',
      marginTop: -4,
    });
  });

  it('reports unknown classes', () => {
    expect(tw('p-4 bg-red-500 shadow-lg').unknown).toEqual(['bg-red-500', 'shadow-lg']);
  });
});
