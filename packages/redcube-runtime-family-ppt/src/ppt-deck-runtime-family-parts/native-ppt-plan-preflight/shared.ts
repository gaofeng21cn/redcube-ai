export type JsonRecord = Record<string, any>;
export type NativePptRoute = 'author_pptx_native' | 'repair_pptx_native';

export const CANONICAL_BOUNDS_SCHEMA = Object.freeze({
  required_object: '{ left_in, top_in, width_in, height_in }',
  canonical_keys: ['left_in', 'top_in', 'width_in', 'height_in'],
  forbidden_alias_keys: ['x', 'y', 'w', 'h', 'left', 'top', 'right', 'bottom', 'width', 'height'],
  instruction: 'Use only bounds.left_in, bounds.top_in, bounds.width_in, and bounds.height_in for every zone and shape. Do not use x/y/w/h, left/top/right/bottom, or width/height aliases.',
});
