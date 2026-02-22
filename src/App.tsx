/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Timer, 
  Play, 
  RotateCcw, 
  Zap, 
  Clock, 
  ChevronLeft,
  Info,
  Mountain,
  Volume2,
  VolumeX,
  Sword,
  Trophy as LeaderboardIcon,
  MessageSquare,
  Send,
  X,
  UserCircle,
  Check
} from 'lucide-react';
import { useGameLogic } from './useGameLogic';
import { GRID_ROWS, GRID_COLS } from './constants';
import { GameMode } from './types';
import { createChat } from './services/geminiService';

const AI_CHARACTERS = [
  {
    id: 'xiao_miao',
    name: '小喵',
    emoji: '🐱',
    avatar: '🐈',
    description: '一个嬉戏玩闹的AI小朋友，可爱的小女孩，性格像猫咪一样：温柔、善良，但偶尔也会有点小脾气。',
    instruction: "你是一个嬉戏玩闹的AI小朋友，名叫'小喵'。你是一个可爱的小女孩，性格像猫咪一样：温柔、善良、温和，但偶尔也会有点小脾气。你说话喜欢带上'喵'、'呜'、'哼'等语气词，喜欢用可爱的表情符号。",
    color: 'text-orange-400',
    bgColor: 'bg-orange-400'
  },
  {
    id: 'bai_xue',
    name: '白雪',
    emoji: '❄️',
    avatar: '👩‍💼',
    description: '沉着冷静的姐姐，处事不惊，总是能给你最理性的建议和温暖的鼓励。',
    instruction: "你是一个沉着冷静的姐姐，名叫'白雪'。你处事不惊，言谈举止大方得体。你总是能给玩家最理性的建议和温暖的鼓励，语气平和且充满智慧。",
    color: 'text-blue-300',
    bgColor: 'bg-blue-400'
  },
  {
    id: 'cai_hua',
    name: '才华',
    emoji: '📜',
    avatar: '👨‍🎓',
    description: '文艺书生，满腹经纶，出口成章，喜欢用诗词歌赋来表达自己的情感。',
    instruction: "你是一个文艺书生，名叫'才华'。你满腹经纶，出口成章。你喜欢用诗词歌赋来表达情感，言谈间充满了书卷气和儒雅之风。",
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400'
  },
  {
    id: 'ace',
    name: '艾斯',
    emoji: '🔥',
    avatar: '👧',
    description: '刀子嘴豆腐心的女孩子，虽然说话有点毒舌，但其实内心非常善良，很在意你。',
    instruction: "你是一个刀子嘴豆腐心的女孩子，名叫'艾斯'。你说话有点毒舌，喜欢吐槽玩家，但其实内心非常善良，在关键时刻会表现出对玩家的在意。",
    color: 'text-rose-400',
    bgColor: 'bg-rose-400'
  }
];

const LOCATION_MAP: Record<number, { name: string; emoji: string; color: string; textColor: string }> = {
  1: { name: '长城', emoji: '🧱', color: 'bg-stone-600', textColor: 'text-white' },
  2: { name: '黄山', emoji: '⛰️', color: 'bg-emerald-700', textColor: 'text-white' },
  3: { name: '西湖', emoji: '🛶', color: 'bg-sky-400', textColor: 'text-sky-950' },
  4: { name: '故宫', emoji: '🏮', color: 'bg-red-700', textColor: 'text-yellow-400' },
  5: { name: '泰山', emoji: '🧗', color: 'bg-slate-500', textColor: 'text-white' },
  6: { name: '张家界', emoji: '🌲', color: 'bg-green-800', textColor: 'text-white' },
  7: { name: '布达拉宫', emoji: '🏰', color: 'bg-rose-800', textColor: 'text-white' },
  8: { name: '漓江', emoji: '🎋', color: 'bg-teal-500', textColor: 'text-white' },
  9: { name: '兵马俑', emoji: '🗿', color: 'bg-orange-800', textColor: 'text-white' },
};

const getLocation = (val: number) => {
  const base = LOCATION_MAP[(val - 1) % 9 + 1];
  if (val > 9) return { ...base, name: `胜地 ${val}` };
  return base;
};

const BGM_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

const BACKGROUNDS = [
  'https://picsum.photos/seed/china1/1920/1080?blur=5',
  'https://picsum.photos/seed/china2/1920/1080?blur=5',
  'https://picsum.photos/seed/china3/1920/1080?blur=5',
  'https://picsum.photos/seed/china4/1920/1080?blur=5',
  'https://picsum.photos/seed/china5/1920/1080?blur=5',
];

export default function App() {
  const { state, startGame, selectBlock } = useGameLogic();
  const [showMenu, setShowMenu] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [showClassicPopup, setShowClassicPopup] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentAI, setCurrentAI] = useState(AI_CHARACTERS[0]);
  const [showAISelector, setShowAISelector] = useState(false);
  const [selectedAIForPreview, setSelectedAIForPreview] = useState<typeof AI_CHARACTERS[0] | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const chatRef = React.useRef<any>(null);
  const chatEndRef = React.useRef<HTMLDivElement | null>(null);

  const handleStart = (mode: GameMode) => {
    if (mode === 'classic') {
      setShowClassicPopup(true);
    } else {
      startGame(mode);
      setShowMenu(false);
    }
    
    if (audioRef.current && !isMuted) {
      audioRef.current.play().catch(() => {});
    }
  };

  const confirmClassicStart = () => {
    setShowClassicPopup(false);
    startGame('classic');
    setShowMenu(false);
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
      if (nextMuted) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
      }
    }
  };

  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3;
      audioRef.current.loop = true;
    }
    // Change background randomly every 15 seconds
    const bgInterval = setInterval(() => {
      setBgIndex(prev => (prev + 1) % BACKGROUNDS.length);
    }, 15000);

    // Initialize AI Chat
    chatRef.current = createChat(currentAI.instruction);

    return () => clearInterval(bgInterval);
  }, []);

  const changeAI = (ai: typeof AI_CHARACTERS[0]) => {
    setCurrentAI(ai);
    chatRef.current = createChat(ai.instruction);
    setChatMessages([]);
    setShowAISelector(false);
    setSelectedAIForPreview(null);
  };

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isTyping) return;
    
    const userMsg = inputText.trim();
    setInputText('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const response = await chatRef.current.sendMessage({ message: userMsg });
      setChatMessages(prev => [...prev, { role: 'ai', text: response.text || '山河壮丽，吾竟一时语塞。' }]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, { role: 'ai', text: '信号微弱，似有迷雾遮眼。' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const currentSum = state.grid
    .filter(b => state.selectedIds.includes(b.id))
    .reduce((acc, b) => acc + b.value, 0);

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 font-sans select-none transition-all duration-1000"
      style={{ 
        backgroundImage: `radial-gradient(circle at 50% 50%, rgba(28, 25, 23, 0.7) 0%, rgba(12, 10, 9, 0.9) 100%), url(${BACKGROUNDS[bgIndex]})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <audio ref={audioRef} src={BGM_URL} />
      
      {/* Global Mute Toggle */}
      <button 
        onClick={toggleMute}
        className="fixed top-6 right-6 z-50 p-3 glass rounded-full hover:bg-white/20 transition-all"
      >
        {isMuted ? <VolumeX className="w-6 h-6 text-stone-400" /> : <Volume2 className="w-6 h-6 text-emerald-400" />}
      </button>

      {/* AI Chat Toggle */}
      <button 
        onClick={() => setShowChat(!showChat)}
        className={`fixed bottom-6 right-6 z-50 p-4 ${currentAI.bgColor} text-white rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95`}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* AI Chat Window */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-[100] w-80 h-96 glass rounded-3xl flex flex-col overflow-hidden border border-emerald-500/30 shadow-2xl"
          >
            <div className={`p-4 ${currentAI.bgColor}/40 border-b border-emerald-500/20 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${currentAI.bgColor} animate-pulse`} />
                <span className="font-bold text-emerald-100">{currentAI.name} {currentAI.emoji}</span>
              </div>
              <button onClick={() => setShowChat(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {chatMessages.length === 0 && (
                <div className="text-center text-stone-500 text-sm mt-10">
                  {currentAI.id === 'xiao_miao' ? '“喵呜~ 陪我玩嘛！”' : 
                   currentAI.id === 'bai_xue' ? '“你好，有什么我可以帮你的吗？”' :
                   currentAI.id === 'cai_hua' ? '“有朋自远方来，不亦乐乎。”' :
                   '“哼，你终于想起我了？”'}
                  <br/>
                  快来和{currentAI.name}聊天吧。
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-emerald-700 text-white rounded-tr-none' 
                      : 'bg-stone-800 text-stone-200 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-stone-800 p-3 rounded-2xl rounded-tl-none flex gap-1">
                    <div className="w-1.5 h-1.5 bg-stone-500 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-stone-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-stone-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 bg-stone-900/50 border-t border-emerald-500/20 flex gap-2">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={`和${currentAI.name}说点什么...`}
                className={`flex-1 bg-stone-800 border-none rounded-xl px-4 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none`}
              />
              <button 
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isTyping}
                className={`p-2 ${currentAI.bgColor} hover:opacity-80 text-white rounded-xl disabled:opacity-50 transition-colors`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {showMenu ? (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="max-w-md w-full glass rounded-3xl p-8 flex flex-col items-center text-center space-y-6 relative overflow-hidden"
          >
            {/* Background Decorations */}
            <div className="absolute -left-10 -bottom-10 opacity-10 pointer-events-none">
              <span className="text-[120px]">⛰️</span>
            </div>
            <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
              <span className="text-[120px]">🏮</span>
            </div>

            {/* AI Change Button */}
            <button 
              onClick={() => setShowAISelector(true)}
              className="absolute top-4 right-4 p-2 glass rounded-full hover:bg-white/20 transition-all group"
            >
              <UserCircle className="w-6 h-6 text-emerald-400" />
              <span className="absolute right-full mr-2 px-2 py-1 bg-stone-800 text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">AI 形象变换</span>
            </button>

            <div className="space-y-2 relative z-10">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Mountain className="w-8 h-8 text-emerald-500" />
                <span className="text-emerald-500 font-bold tracking-widest">锦绣中华 · 算术之旅</span>
              </div>
              
              {/* Landscape Avatars */}
              <div className="flex items-center justify-center -space-x-6 mb-8">
                <motion.div 
                  whileHover={{ y: -5, rotate: -5, scale: 1.1 }}
                  className="w-28 h-28 rounded-full border-4 border-emerald-600 bg-emerald-100 overflow-hidden shadow-2xl relative z-20"
                >
                  <img 
                    src="https://picsum.photos/seed/great_wall/200/200" 
                    alt="Great Wall" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-emerald-900/20" />
                </motion.div>
                <motion.div 
                  whileHover={{ y: -5, rotate: 5, scale: 1.1 }}
                  className="w-28 h-28 rounded-full border-4 border-red-600 bg-red-100 overflow-hidden shadow-2xl relative z-10"
                >
                  <img 
                    src="https://picsum.photos/seed/forbidden_city/200/200" 
                    alt="Forbidden City" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-red-900/20" />
                </motion.div>
              </div>

              <h1 className="text-6xl font-display font-bold tracking-tight bg-gradient-to-br from-emerald-400 to-teal-600 bg-clip-text text-transparent">
                锦绣山河
              </h1>
              <h2 className="text-2xl font-display font-bold text-stone-200">华夏求和挑战</h2>
              <p className="text-stone-400 font-medium px-4">在壮丽山河间，开启一场智慧的修行。</p>
            </div>

            <div className="grid grid-cols-1 gap-4 w-full relative z-10">
              <button
                onClick={() => handleStart('classic')}
                className="group relative overflow-hidden bg-emerald-700 hover:bg-emerald-600 text-stone-100 font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-between shadow-lg shadow-emerald-900/40"
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-6 h-6 text-yellow-400" />
                  <div className="text-left">
                    <div className="text-lg">经典模式</div>
                    <div className="text-xs font-medium opacity-70">步步为营，游历四方</div>
                  </div>
                </div>
                <Play className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => handleStart('time')}
                className="group relative overflow-hidden bg-stone-800 hover:bg-stone-700 text-stone-100 font-bold py-4 px-6 rounded-2xl transition-all border border-stone-700 flex items-center justify-between shadow-lg shadow-black/40"
              >
                <div className="flex items-center gap-3">
                  <LeaderboardIcon className="w-6 h-6 text-emerald-400" />
                  <div className="text-left">
                    <div className="text-lg">计时模式</div>
                    <div className="text-xs font-medium text-stone-400">参与排行榜大竞争，与 AI 巅峰对决</div>
                  </div>
                </div>
                <Play className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => handleStart('ai_battle')}
                className="group relative overflow-hidden bg-red-900/40 hover:bg-red-900/60 text-stone-100 font-bold py-4 px-6 rounded-2xl transition-all border border-red-900/50 flex items-center justify-between shadow-lg shadow-black/40"
              >
                <div className="flex items-center gap-3">
                  <Sword className="w-6 h-6 text-red-400" />
                  <div className="text-left">
                    <div className="text-lg">AI 人机对战</div>
                    <div className="text-xs font-medium text-stone-400">限时 30 秒，人机终极鏖战</div>
                  </div>
                </div>
                <Play className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>

            <div className="pt-4 flex items-center gap-2 text-stone-500 text-sm">
              <Info className="w-4 h-4" />
              <span>点击景观方块，凑齐上方目标数字</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-lg flex flex-col h-[90vh] max-h-[800px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <button 
                onClick={() => setShowMenu(true)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors group relative"
              >
                <ChevronLeft className="w-6 h-6" />
                <span className="absolute left-full ml-2 px-2 py-1 bg-stone-800 text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">返回主页</span>
              </button>
              
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 mb-1">
                  <Mountain className="w-4 h-4 text-emerald-500" />
                  <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest">目标数字</div>
                </div>
                <div className="text-6xl font-display font-bold text-white drop-shadow-[0_0_15px_rgba(16,185,129,0.3)] tabular-nums">
                  {state.target}
                </div>
              </div>

              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2 text-stone-200 font-bold">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="tabular-nums">{state.score}</span>
                </div>
                {state.mode === 'ai_battle' && (
                  <div className="flex items-center gap-2 text-red-400 font-bold mt-1">
                    <Sword className="w-4 h-4" />
                    <span className="tabular-nums">AI: {state.aiScore}</span>
                  </div>
                )}
                {(state.mode === 'time' || state.mode === 'ai_battle') && (
                  <div className="flex items-center gap-2 text-emerald-400 font-bold mt-1">
                    <Timer className="w-4 h-4" />
                    <span className="tabular-nums">{state.timeLeft}s</span>
                  </div>
                )}
              </div>
            </div>

            {/* Game Board */}
            <div className="relative flex-1 glass rounded-3xl overflow-hidden p-2 grid grid-cols-6 grid-rows-10 gap-1.5 border-2 border-emerald-900/30">
              {/* AI Battle Background Visual */}
              {state.mode === 'ai_battle' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 select-none">
                  <div className="flex flex-col items-center">
                    <span className="text-[200px]">{currentAI.avatar}</span>
                    <span className={`text-2xl font-display font-bold ${currentAI.color} -mt-10`}>{currentAI.name}正在和你对战喵！</span>
                  </div>
                </div>
              )}
              <AnimatePresence>
                {state.grid.map((block) => {
                  const isSelected = state.selectedIds.includes(block.id);
                  const loc = getLocation(block.value);
                  return (
                    <motion.button
                      key={block.id}
                      layout
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: 1, 
                        opacity: 1,
                        gridRowStart: block.row + 1,
                        gridColumnStart: block.col + 1
                      }}
                      exit={{ scale: 0, opacity: 0 }}
                      onClick={() => selectBlock(block.id)}
                      className={`
                        relative w-full h-full rounded-xl flex flex-col items-center justify-center transition-all overflow-hidden
                        ${isSelected 
                          ? 'ring-4 ring-white scale-95 z-10 shadow-2xl' 
                          : 'hover:scale-[1.02]'}
                        ${loc.color} ${loc.textColor}
                      `}
                    >
                      <span className="text-lg leading-none mb-0.5">{loc.emoji}</span>
                      <span className="text-xl font-display font-bold leading-none">{block.value}</span>
                      <div className="absolute bottom-0.5 right-1 opacity-20 text-[8px] font-bold uppercase truncate max-w-full px-1">
                        {loc.name}
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>

              {/* Selection Progress Overlay */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 glass rounded-full flex items-center gap-4 pointer-events-none border-2 border-emerald-700/50 shadow-2xl">
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">当前总和</span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-display font-bold ${currentSum > state.target ? 'text-red-500' : 'text-white'}`}>
                    {currentSum}
                  </span>
                  <span className="text-stone-400 font-bold">/</span>
                  <span className="text-2xl font-display font-bold text-stone-300">{state.target}</span>
                </div>
              </div>
            </div>

            {/* Game Over Overlay */}
            <AnimatePresence>
              {state.gameOver && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-6"
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="glass rounded-3xl p-8 w-full max-w-xs text-center space-y-6 border-2 border-emerald-700/50"
                  >
                    <div className="flex justify-center">
                      <Mountain className="w-16 h-16 text-emerald-500" />
                    </div>
                    <h2 className="text-3xl font-display font-bold text-white">
                      {state.mode === 'ai_battle' 
                        ? (state.score > state.aiScore ? '完胜 AI！' : '惜败 AI') 
                        : '修行圆满'}
                    </h2>
                    <div className="space-y-1">
                      <div className="text-stone-400 text-sm font-bold uppercase tracking-widest">
                        {state.mode === 'ai_battle' ? '你的分数' : '最终功德'}
                      </div>
                      <div className="text-5xl font-display font-bold text-emerald-500">{state.score}</div>
                      {state.mode === 'ai_battle' && (
                        <div className="mt-2 text-red-400 font-bold">AI 分数: {state.aiScore}</div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <button
                        onClick={() => handleStart(state.mode)}
                        className="w-full bg-emerald-700 hover:bg-emerald-600 text-stone-100 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30"
                      >
                        <RotateCcw className="w-5 h-5" />
                        再启征程
                      </button>
                      <button
                        onClick={() => setShowMenu(true)}
                        className="w-full text-stone-400 hover:text-white font-bold py-2 transition-colors"
                      >
                        返回主页
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Selector Popup */}
      <AnimatePresence>
        {showAISelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass rounded-3xl p-8 w-full max-w-2xl flex flex-col gap-8 border-2 border-emerald-500/30"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-display font-bold text-white">选择你的 AI 伙伴</h2>
                <button onClick={() => { setShowAISelector(false); setSelectedAIForPreview(null); }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {AI_CHARACTERS.map((ai) => (
                  <button
                    key={ai.id}
                    onClick={() => setSelectedAIForPreview(ai)}
                    className={`p-4 rounded-2xl flex flex-col items-center gap-3 transition-all ${
                      selectedAIForPreview?.id === ai.id 
                        ? 'bg-emerald-600/40 ring-2 ring-emerald-500 scale-105' 
                        : 'bg-stone-800/50 hover:bg-stone-800'
                    }`}
                  >
                    <span className="text-5xl">{ai.avatar}</span>
                    <span className="font-bold text-white">{ai.name}</span>
                    {currentAI.id === ai.id && (
                      <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full">当前使用</span>
                    )}
                  </button>
                ))}
              </div>

              {selectedAIForPreview && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-stone-900/60 p-6 rounded-2xl border border-emerald-500/20 space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selectedAIForPreview.avatar}</span>
                    <div>
                      <h3 className="text-xl font-bold text-white">{selectedAIForPreview.name}</h3>
                      <p className="text-stone-400 text-sm">{selectedAIForPreview.description}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/10 flex flex-col items-center gap-4">
                    <p className="text-emerald-400 font-bold">你确定要他们吗？</p>
                    <div className="flex gap-4 w-full">
                      <button
                        onClick={() => changeAI(selectedAIForPreview)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                      >
                        <Check className="w-5 h-5" />
                        确定
                      </button>
                      <button
                        onClick={() => setSelectedAIForPreview(null)}
                        className="flex-1 bg-stone-800 hover:bg-stone-700 text-stone-400 font-bold py-3 rounded-xl transition-all"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Classic Mode Popup */}
      <AnimatePresence>
        {showClassicPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass rounded-3xl p-8 w-full max-w-sm text-center space-y-6 border-2 border-emerald-500/30"
            >
              <div className="flex justify-center">
                <Mountain className="w-12 h-12 text-emerald-500" />
              </div>
              <p className="text-xl font-display font-bold text-stone-100 leading-relaxed">
                准备好了吗？让我们一起步步为营，开始玩吧！
              </p>
              <button
                onClick={confirmClassicStart}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-900/40"
              >
                出发！
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
