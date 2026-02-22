import { useState, useEffect, useCallback, useRef } from 'react';
import { Block, GameMode, GameState } from './types';
import { GRID_ROWS, GRID_COLS, INITIAL_ROWS, MAX_VALUE, TIME_LIMIT } from './constants';

const generateId = () => Math.random().toString(36).substr(2, 9);

const createRow = (rowIdx: number): Block[] => {
  return Array.from({ length: GRID_COLS }, (_, colIdx) => ({
    id: generateId(),
    value: Math.floor(Math.random() * MAX_VALUE) + 1,
    row: rowIdx,
    col: colIdx,
  }));
};

export const useGameLogic = () => {
  const [state, setState] = useState<GameState>({
    grid: [],
    target: 0,
    score: 0,
    aiScore: 0,
    selectedIds: [],
    gameOver: false,
    mode: 'classic',
    timeLeft: TIME_LIMIT,
    level: 1,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const aiTimerRef = useRef<NodeJS.Timeout | null>(null);

  const generateTarget = useCallback((grid: Block[]) => {
    if (grid.length === 0) return 10;
    const count = Math.min(grid.length, Math.floor(Math.random() * 3) + 2);
    const shuffled = [...grid].sort(() => 0.5 - Math.random());
    const sum = shuffled.slice(0, count).reduce((acc, b) => acc + b.value, 0);
    return sum;
  }, []);

  const startGame = (mode: GameMode) => {
    let initialGrid: Block[] = [];
    for (let i = 0; i < INITIAL_ROWS; i++) {
      initialGrid = [...initialGrid, ...createRow(GRID_ROWS - 1 - i)];
    }
    
    setState({
      grid: initialGrid,
      target: generateTarget(initialGrid),
      score: 0,
      aiScore: 0,
      selectedIds: [],
      gameOver: false,
      mode,
      timeLeft: mode === 'ai_battle' ? 30 : TIME_LIMIT,
      level: 1,
    });
  };

  const addRow = useCallback(() => {
    setState(prev => {
      if (prev.mode === 'ai_battle') return prev; // Don't add rows in AI battle mode for simplicity, or we can

      const isFull = prev.grid.some(b => b.row === 0);
      if (isFull) return { ...prev, gameOver: true };

      const movedGrid = prev.grid.map(b => ({ ...b, row: b.row - 1 }));
      
      const maxVal = Math.min(MAX_VALUE + Math.floor(prev.level / 2), 20);
      const newRow = Array.from({ length: GRID_COLS }, (_, colIdx) => ({
        id: generateId(),
        value: Math.floor(Math.random() * maxVal) + 1,
        row: GRID_ROWS - 1,
        col: colIdx,
      }));

      const nextGrid = [...movedGrid, ...newRow];
      
      const nextLevel = Math.floor(prev.score / 500) + 1;
      const nextTimeLimit = Math.max(TIME_LIMIT - (nextLevel - 1), 3);

      return {
        ...prev,
        grid: nextGrid,
        level: nextLevel,
        timeLeft: prev.mode === 'time' ? nextTimeLimit : prev.timeLeft,
        target: prev.target === 0 ? generateTarget(nextGrid) : prev.target
      };
    });
  }, [generateTarget]);

  const selectBlock = (id: string) => {
    setState(prev => {
      if (prev.gameOver) return prev;
      
      const isSelected = prev.selectedIds.includes(id);
      let nextSelected: string[];
      
      if (isSelected) {
        nextSelected = prev.selectedIds.filter(sid => sid !== id);
      } else {
        nextSelected = [...prev.selectedIds, id];
      }

      const currentSum = prev.grid
        .filter(b => nextSelected.includes(b.id))
        .reduce((acc, b) => acc + b.value, 0);

      if (currentSum === prev.target) {
        const remainingGrid = prev.grid.filter(b => !nextSelected.includes(b.id));
        
        const nextGrid: Block[] = [];
        for (let col = 0; col < GRID_COLS; col++) {
          const colBlocks = remainingGrid
            .filter(b => b.col === col)
            .sort((a, b) => b.row - a.row);
          
          colBlocks.forEach((block, index) => {
            nextGrid.push({
              ...block,
              row: GRID_ROWS - 1 - index
            });
          });
        }
        
        const nextScore = prev.score + (nextSelected.length * 10);
        const nextTarget = generateTarget(nextGrid);

        if (prev.mode === 'classic') {
          const newState = {
            ...prev,
            grid: nextGrid,
            score: nextScore,
            selectedIds: [],
            target: nextTarget,
          };
          
          setTimeout(() => addRow(), 100);
          return newState;
        }

        return {
          ...prev,
          grid: nextGrid,
          score: nextScore,
          selectedIds: [],
          target: nextTarget,
        };
      }

      if (currentSum > prev.target) {
        return { ...prev, selectedIds: [] };
      }

      return { ...prev, selectedIds: nextSelected };
    });
  };

  // AI Logic for Battle Mode
  useEffect(() => {
    if (state.mode === 'ai_battle' && !state.gameOver) {
      aiTimerRef.current = setInterval(() => {
        setState(prev => {
          // AI "finds" a solution every 3-5 seconds
          const aiPoints = Math.floor(Math.random() * 3 + 2) * 10;
          return { ...prev, aiScore: prev.aiScore + aiPoints };
        });
      }, 4000);
    } else {
      if (aiTimerRef.current) clearInterval(aiTimerRef.current);
    }
    return () => {
      if (aiTimerRef.current) clearInterval(aiTimerRef.current);
    };
  }, [state.mode, state.gameOver]);

  // Timer logic
  useEffect(() => {
    if ((state.mode === 'time' || state.mode === 'ai_battle') && !state.gameOver && state.grid.length > 0) {
      timerRef.current = setInterval(() => {
        setState(prev => {
          if (prev.timeLeft <= 1) {
            if (prev.mode === 'time') {
              setTimeout(() => addRow(), 0);
              return { ...prev, timeLeft: TIME_LIMIT };
            } else {
              // AI Battle ends
              return { ...prev, timeLeft: 0, gameOver: true };
            }
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.mode, state.gameOver, state.grid.length, addRow]);

  return {
    state,
    startGame,
    selectBlock,
  };
};
