import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store/index.js';

// Use throughout codebase instead of plain `useDispatch`
export const useAppDispatch = () => useDispatch<AppDispatch>();

// Use throughout codebase instead of plain `useSelector`
export const useAppSelector = <TSelected,>(
  selector: (state: RootState) => TSelected
): TSelected => useSelector<RootState, TSelected>(selector);
