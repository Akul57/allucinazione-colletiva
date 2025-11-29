import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GameData, GamePhase, MIN_PLAYERS, MAX_PLAYERS, Player, Role, SavedGroup } from './types';
import { generateGameScenario } from './services/geminiService';
import { Button } from './components/Button';
import { Users, Zap, Play, AlertTriangle, HelpCircle, Eye, EyeOff, UserPlus, ArrowRight, Settings, X, Lock, Vote, Trophy, Skull, Check, RefreshCw, BookOpen, Scale, Save, Trash2, Edit2, Download, Plus, Minus, Phone, RotateCcw } from 'lucide-react';

// Custom Mushroom Icon
const MushroomIcon = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    style={style}
  >
    <path d="M18.6 15.2A7 7 0 1 0 5.4 15.2" />
    <path d="M19 15.2v1.8c0 2.8-2.2 5-5 5H10c-2.8 0-5-2.2-5-5v-1.8" />
    <path d="M10 22v-2" />
    <path d="M14 22v-2" />
  </svg>
);

// Background Animation Component - Memoized to prevent restart on state change
const FallingMushrooms = React.memo(() => {
  const mushrooms = useMemo(() => Array.from({ length: 20 }).map(() => ({
    left: Math.random() * 100,
    duration: 5 + Math.random() * 15,
    delay: Math.random() * -20,
    size: 20 + Math.random() * 30,
    opacity: 0.2 + Math.random() * 0.3,
    isPurple: Math.random() > 0.5
  })), []);

  return (
    <>
      {mushrooms.map((m, i) => (
        <div 
          key={i}
          className={`mushroom-fall ${m.isPurple ? 'text-neon-purple' : 'text-neon-green'}`}
          style={{
            left: `${m.left}%`,
            animationDuration: `${m.duration}s, 4s`,
            animationDelay: `${m.delay}s, 0s`,
            width: `${m.size}px`,
            height: `${m.size}px`,
            opacity: m.opacity,
            filter: `drop-shadow(0 0 8px ${m.isPurple ? '#b026ff' : '#39ff14'})`
          }}
        >
          <MushroomIcon className="w-full h-full" />
        </div>
      ))}
    </>
  );
});

export default function App() {
  // State
  const [phase, setPhase] = useState<GamePhase>(GamePhase.SETUP);
  const [numPlayers, setNumPlayers] = useState<number>(6);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
  const [tempName, setTempName] = useState<string>('');
  const [cardRevealed, setCardRevealed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Settings State
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [gameMode, setGameMode] = useState<'live' | 'app'>('live'); 
  const [revealTruth, setRevealTruth] = useState<boolean>(false);
  const [eliminationCount, setEliminationCount] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'settings' | 'rules' | 'saves'>('settings');
  const [settingsSaved, setSettingsSaved] = useState<boolean>(false);
  const [savedGroups, setSavedGroups] = useState<SavedGroup[]>([]);

  // Group Editor State
  const [isEditingGroup, setIsEditingGroup] = useState<boolean>(false);
  const [editGroupId, setEditGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState<string>('');
  const [editPlayerNames, setEditPlayerNames] = useState<string[]>([]);

  // Voting State
  const [votes, setVotes] = useState<Record<string, number>>({}); // playerId -> count
  const [lastEliminatedPlayers, setLastEliminatedPlayers] = useState<Player[]>([]);
  const [winnerTeam, setWinnerTeam] = useState<Role | null>(null);
  const [showGameOverWords, setShowGameOverWords] = useState<boolean>(false);
  
  // Runoff (Ballottaggio) State
  const [isRunoff, setIsRunoff] = useState<boolean>(false);
  const [runoffCandidates, setRunoffCandidates] = useState<string[]>([]); // IDs of tied players

  // Live Kill Confirmation State (playerId -> boolean)
  const [killConfirm, setKillConfirm] = useState<string | null>(null);

  // Game Ready UI State (Moved here to fix React Error #310)
  const [saveName, setSaveName] = useState("Gruppo Amici");
  const [showSaveUI, setShowSaveUI] = useState(false);

  // Role Distribution State
  const [roleDistribution, setRoleDistribution] = useState<Role[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Memoized starting player name to prevent changes on re-renders (e.g. clicking Save)
  const startingPlayerName = useMemo(() => {
    if (players.length > 0) {
        return players[Math.floor(Math.random() * players.length)].name;
    }
    return "Chiunque";
  }, [players, gameData]); // Recalculate only when players or game data changes

  // Load saved groups on mount
  useEffect(() => {
    const saved = localStorage.getItem('ac_saved_groups');
    if (saved) {
      try {
        setSavedGroups(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved groups");
      }
    }
  }, []);

  // Update default name when player index changes or phase changes
  useEffect(() => {
    if (phase === GamePhase.PLAYER_REGISTRATION) {
      // Check if we already have a name for this slot (e.g. from saved group or replay)
      const existingName = players[currentPlayerIndex]?.name;
      if (existingName) {
        setTempName(existingName);
      } else {
        setTempName(`Giocatore ${currentPlayerIndex + 1}`);
      }
    }
  }, [phase, currentPlayerIndex, players]);

  // Focus input on phase change
  useEffect(() => {
    if (phase === GamePhase.PLAYER_REGISTRATION && inputRef.current) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select(); // Auto-select text
        }
      }, 100);
    }
  }, [phase, currentPlayerIndex]);

  // Reset Game Over words visibility when entering Game Over
  useEffect(() => {
    if (phase === GamePhase.GAME_OVER) {
      setShowGameOverWords(false);
    }
  }, [phase]);

  // Initialize Game Logic
  const startGameSetup = async (presetNames?: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const currentNumPlayers = presetNames ? presetNames.length : numPlayers;
      if (presetNames) setNumPlayers(currentNumPlayers);

      const data = await generateGameScenario();
      setGameData(data);
      
      //Tc: Reset Game Ready UI State
      setSaveName("Gruppo Amici");
      setShowSaveUI(false);

      // Generate roles
      const newRoles = generateRoles(currentNumPlayers);
      setRoleDistribution(newRoles);
      
      setCurrentPlayerIndex(0);
      setPlayers([]);
      setRevealTruth(false);
      setVotes({});
      setLastEliminatedPlayers([]);
      setWinnerTeam(null);
      setKillConfirm(null);
      setIsRunoff(false);
      setRunoffCandidates([]);
      
      if (presetNames) {
        // Fast forward setup if names are provided
        // We create the players array with names, but user still steps through card reveal
        const createdPlayers: Player[] = presetNames.map((name, idx) => {
          const currentRole = newRoles[idx];
          let word = '';
          if (currentRole === Role.GOOD) word = data.normalWord;
          else if (currentRole === Role.HALLUCINATED) word = data.similarWord;

          return {
            id: `p-${idx}`,
            name: name,
            role: currentRole,
            assignedWord: word,
            isRevealed: false,
            isAlive: true
          };
        });
        setPlayers(createdPlayers);
        // Start directly with first player revealing card
        setPhase(GamePhase.CARD_REVEAL);
      } else {
        setPhase(GamePhase.PLAYER_REGISTRATION);
        setTempName(`Giocatore 1`);
      }

    } catch (e) {
      setError("Impossibile contattare l'IA. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  const startNewGameSamePlayers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateGameScenario();
      setGameData(data);
      
      // Generate new roles based on existing player count
      const count = players.length;
      const newRoles = generateRoles(count);
      setRoleDistribution(newRoles);

      // Re-map existing players to new roles/words
      const newPlayers = players.map((p, idx) => {
        const currentRole = newRoles[idx];
        let word = '';
        if (currentRole === Role.GOOD) word = data.normalWord;
        else if (currentRole === Role.HALLUCINATED) word = data.similarWord;
        
        return {
          ...p,
          role: currentRole,
          assignedWord: word,
          isRevealed: false,
          isAlive: true
        };
      });

      setPlayers(newPlayers);
      setNumPlayers(count); // Ensure count is synced
      setCurrentPlayerIndex(0);
      setPhase(GamePhase.CARD_REVEAL);
      
      // Reset game state
      setRevealTruth(false);
      setVotes({});
      setLastEliminatedPlayers([]);
      setWinnerTeam(null);
      setKillConfirm(null);
      setIsRunoff(false);
      setRunoffCandidates([]);
      setCardRevealed(false);

    } catch (e) {
      setError("Errore nel riavvio. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  const generateRoles = (total: number): Role[] => {
    const roles: Role[] = [];
    roles.push(Role.IMPOSTOR);
    
    let numHallucinated = 1;
    if (total >= 7) numHallucinated = 2;
    if (total >= 10) numHallucinated = 3;

    for (let i = 0; i < numHallucinated; i++) {
      roles.push(Role.HALLUCINATED);
    }

    const remaining = total - 1 - numHallucinated;
    for (let i = 0; i < remaining; i++) {
      roles.push(Role.GOOD);
    }

    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }
    return roles;
  };

  const handleNextPlayer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tempName.trim()) return;

    const currentRole = roleDistribution[currentPlayerIndex];
    let word = '';
    
    if (currentRole === Role.GOOD) word = gameData!.normalWord;
    else if (currentRole === Role.HALLUCINATED) word = gameData!.similarWord;
    else word = '';

    // Create new player object or update existing
    const newPlayer: Player = {
      id: `p-${currentPlayerIndex}`,
      name: tempName.trim(),
      role: currentRole,
      assignedWord: word,
      isRevealed: false,
      isAlive: true
    };

    const updatedPlayers = [...players];
    updatedPlayers[currentPlayerIndex] = newPlayer;
    setPlayers(updatedPlayers);
    
    setPhase(GamePhase.CARD_REVEAL);
  };

  const handleConfirmReveal = () => {
    setCardRevealed(true);
  };

  const handlePassPhone = () => {
    setTempName('');
    setCardRevealed(false);
    
    if (currentPlayerIndex + 1 < numPlayers) {
      setCurrentPlayerIndex(prev => prev + 1);
      setPhase(GamePhase.PLAYER_REGISTRATION);
    } else {
      setPhase(GamePhase.GAME_READY);
    }
  };

  const handleRestart = () => {
    setPhase(GamePhase.SETUP);
    setPlayers([]);
    setGameData(null);
    setCardRevealed(false);
    setTempName('');
    setRoleDistribution([]);
    setCurrentPlayerIndex(0);
    setRevealTruth(false);
    setVotes({});
    setLastEliminatedPlayers([]);
    setWinnerTeam(null);
    setKillConfirm(null);
    setIsRunoff(false);
    setRunoffCandidates([]);
  };

  const handleUndoGameOver = () => {
    setPhase(GamePhase.PLAYING);
    setWinnerTeam(null);
  };

  const handleResurrectPlayer = (e: React.MouseEvent, playerId: string) => {
    e.stopPropagation();
    const updatedPlayers = players.map(p => 
      p.id === playerId ? { ...p, isAlive: true } : p
    );
    setPlayers(updatedPlayers);
  };

  // --- SAVE GROUP LOGIC ---
  const saveCurrentGroup = (groupName: string) => {
    const newGroup: SavedGroup = {
      id: Date.now().toString(),
      name: groupName,
      playerNames: players.map(p => p.name)
    };
    const updated = [...savedGroups, newGroup];
    setSavedGroups(updated);
    localStorage.setItem('ac_saved_groups', JSON.stringify(updated));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const deleteSavedGroup = (id: string) => {
    const updated = savedGroups.filter(g => g.id !== id);
    setSavedGroups(updated);
    localStorage.setItem('ac_saved_groups', JSON.stringify(updated));
  };

  // Editor Logic
  const startEditingGroup = (group?: SavedGroup) => {
     if (group) {
       setEditGroupId(group.id);
       setEditGroupName(group.name);
       setEditPlayerNames([...group.playerNames]);
     } else {
       setEditGroupId(null);
       setEditGroupName('Nuovo Gruppo');
       // Default 6 empty/default slots
       setEditPlayerNames(Array.from({length: 6}, (_, i) => `Giocatore ${i + 1}`));
     }
     setIsEditingGroup(true);
  };

  const saveEditedGroup = () => {
     if (!editGroupName.trim() || editPlayerNames.length < MIN_PLAYERS) return;

     let updatedGroups = [...savedGroups];
     if (editGroupId) {
        // Update existing
        updatedGroups = updatedGroups.map(g => g.id === editGroupId ? { ...g, name: editGroupName, playerNames: editPlayerNames } : g);
     } else {
        // Create new
        const newGroup: SavedGroup = {
            id: Date.now().toString(),
            name: editGroupName,
            playerNames: editPlayerNames
        };
        updatedGroups.push(newGroup);
     }
     
     setSavedGroups(updatedGroups);
     localStorage.setItem('ac_saved_groups', JSON.stringify(updatedGroups));
     setIsEditingGroup(false);
  };

  const updateEditPlayerName = (index: number, value: string) => {
     const newNames = [...editPlayerNames];
     newNames[index] = value;
     setEditPlayerNames(newNames);
  };

  const addPlayerToEdit = () => {
    if (editPlayerNames.length < MAX_PLAYERS) {
       setEditPlayerNames([...editPlayerNames, `Giocatore ${editPlayerNames.length + 1}`]);
    }
  };

  const removePlayerFromEdit = (index: number) => {
    if (editPlayerNames.length > MIN_PLAYERS) {
       const newNames = editPlayerNames.filter((_, i) => i !== index);
       setEditPlayerNames(newNames);
    }
  };


  // --- LIVE MODE LOGIC ---
  const handleLiveEliminationClick = (e: React.MouseEvent, playerId: string) => {
    e.stopPropagation(); // Prevent any bubble up
    
    if (killConfirm === playerId) {
      // Second click - Execute kill
      executeKill(playerId);
      setKillConfirm(null);
    } else {
      // First click - Arm button
      setKillConfirm(playerId);
      // Auto-reset after 3 seconds if not confirmed
      setTimeout(() => {
        setKillConfirm(prev => prev === playerId ? null : prev);
      }, 3000);
    }
  };

  const executeKill = (playerId: string) => {
    const updatedPlayers = players.map(p => 
      p.id === playerId ? { ...p, isAlive: false } : p
    );
    
    setPlayers(updatedPlayers);

    // Check win condition immediately after manual kill
    const winRole = checkWinCondition(updatedPlayers);
    if (winRole) {
      setWinnerTeam(winRole);
      setPhase(GamePhase.GAME_OVER);
    }
  };

  // --- VOTING LOGIC ---

  const getNextVoterIndex = (startIndex: number) => {
    let nextIndex = startIndex + 1;
    while (nextIndex < players.length) {
      const p = players[nextIndex];
      // In normal phase: any alive player votes.
      // In runoff phase: candidate cannot vote
      if (isRunoff) {
        if (p.isAlive && !runoffCandidates.includes(p.id)) {
           return nextIndex;
        }
      } else {
        if (p.isAlive) {
           return nextIndex;
        }
      }
      nextIndex++;
    }
    return -1; // No more voters
  };

  const startVotingPhase = () => {
    setVotes({});
    
    // Find first eligible voter
    let firstVoterIndex = -1;
    for(let i=0; i<players.length; i++) {
        const p = players[i];
        if (isRunoff) {
            if (p.isAlive && !runoffCandidates.includes(p.id)) {
                firstVoterIndex = i;
                break;
            }
        } else {
            if (p.isAlive) {
                firstVoterIndex = i;
                break;
            }
        }
    }

    if (firstVoterIndex !== -1) {
        setCurrentPlayerIndex(firstVoterIndex);
        setPhase(GamePhase.VOTING_INTRO);
    } else {
        // Edge case: No one can vote? (Should not happen in viable game)
        console.error("No eligible voters found");
        // Force result calc (empty)
        if(isRunoff) calculateRunoffResults({});
        else calculateRoundResults({});
    }
  };

  const submitVote = (targetId: string) => {
    const newVotes = {
      ...votes,
      [targetId]: (votes[targetId] || 0) + 1
    };
    setVotes(newVotes);

    const nextIndex = getNextVoterIndex(currentPlayerIndex);

    if (nextIndex !== -1) {
      setCurrentPlayerIndex(nextIndex);
      setPhase(GamePhase.VOTING_INTRO);
    } else {
      // All eligible players have voted
      if (isRunoff) {
        calculateRunoffResults(newVotes);
      } else {
        calculateRoundResults(newVotes);
      }
    }
  };

  const calculateRoundResults = (currentVotes: Record<string, number>) => {
    // Sort players by votes descending
    const candidates = players
      .filter(p => p.isAlive)
      .map(p => ({ ...p, votes: currentVotes[p.id] || 0 }))
      .sort((a, b) => b.votes - a.votes);

    const cutoffIndex = eliminationCount - 1;
    
    // Check if there are any votes at all
    if (candidates.length > 0 && candidates[0].votes > 0) {
        // Check for tie at the cutoff point
        if (candidates[cutoffIndex] && candidates[cutoffIndex].votes > 0) {
            const votesAtCutoff = candidates[cutoffIndex].votes;
            const nextCandidate = candidates[cutoffIndex + 1];
            
            if (nextCandidate && nextCandidate.votes === votesAtCutoff) {
                // TIE DETECTED
                // Tie logic: Identify everyone with votes >= votesAtCutoff at the borderline
                const tiedCandidates = candidates.filter(c => c.votes === votesAtCutoff);
                
                setIsRunoff(true);
                setRunoffCandidates(tiedCandidates.map(c => c.id));
                setPhase(GamePhase.RUNOFF_INTRO);
                return;
            }
        }
    } else {
        // No votes cast? Or everyone 0.
        // Proceed to results (no elimination)
    }

    // No tie affecting the outcome, proceed with elimination
    const eliminated: Player[] = [];
    const updatedPlayers = [...players];

    for (let i = 0; i < eliminationCount; i++) {
      if (i >= candidates.length) break;
      const current = candidates[i];
      if (current.votes === 0) break;

      const originalIndex = updatedPlayers.findIndex(p => p.id === current.id);
      if (originalIndex !== -1) {
        updatedPlayers[originalIndex].isAlive = false;
        eliminated.push(updatedPlayers[originalIndex]);
      }
    }

    finalizeRound(updatedPlayers, eliminated);
  };

  const calculateRunoffResults = (currentVotes: Record<string, number>) => {
    // Only candidates in runoffCandidates are eligible to be eliminated
    const candidates = players
      .filter(p => runoffCandidates.includes(p.id)) 
      .map(p => ({ ...p, votes: currentVotes[p.id] || 0 }))
      .sort((a, b) => b.votes - a.votes);

    const eliminated: Player[] = [];
    const updatedPlayers = [...players];

    if (candidates.length > 0) {
      const topVotes = candidates[0].votes;
      if (topVotes > 0) {
        const tiedAtTop = candidates.filter(c => c.votes === topVotes);
      
        if (tiedAtTop.length < candidates.length) { 
           // We have differentiation. 
           // If we have 2 candidates and 1 has more votes, eliminate 1.
           // Simplified Runoff: Eliminate the top 1. If top 1 is tied, no one dies.
           if (tiedAtTop.length === 1) {
             const loser = tiedAtTop[0];
             const originalIndex = updatedPlayers.findIndex(p => p.id === loser.id);
             if (originalIndex !== -1) {
                updatedPlayers[originalIndex].isAlive = false;
                eliminated.push(updatedPlayers[originalIndex]);
             }
           }
        }
        // Else: Still tied fully. No one dies.
      }
    }
    
    // Reset runoff state for next round
    setIsRunoff(false);
    setRunoffCandidates([]);
    finalizeRound(updatedPlayers, eliminated);
  };

  const finalizeRound = (updatedPlayers: Player[], eliminated: Player[]) => {
    setPlayers(updatedPlayers);
    setLastEliminatedPlayers(eliminated);

    if (eliminated.length > 0) {
      const winRole = checkWinCondition(updatedPlayers);
      if (winRole) {
        setWinnerTeam(winRole);
        setPhase(GamePhase.GAME_OVER);
      } else {
        setPhase(GamePhase.ROUND_RESULTS);
      }
    } else {
      setPhase(GamePhase.ROUND_RESULTS);
    }
  };

  const checkWinCondition = (currentPlayers: Player[]): Role | null => {
    const alivePlayers = currentPlayers.filter(p => p.isAlive);
    const aliveImpostor = alivePlayers.find(p => p.role === Role.IMPOSTOR);
    const aliveHallucinated = alivePlayers.filter(p => p.role === Role.HALLUCINATED);
    
    // 1. Impostor Wins:
    if (aliveImpostor) {
        if (alivePlayers.length <= 2) {
            const other = alivePlayers.find(p => p.id !== aliveImpostor.id);
            if (other && other.role === Role.HALLUCINATED) {
                return Role.HALLUCINATED;
            }
            return Role.IMPOSTOR;
        }
    }

    // 2. Hallucinated Wins:
    if (!aliveImpostor) {
        if (alivePlayers.length === 2 && aliveHallucinated.length >= 1) {
            return Role.HALLUCINATED;
        }
    }

    // 3. Good Wins:
    if (!aliveImpostor && aliveHallucinated.length === 0) {
        return Role.GOOD;
    }

    return null;
  };

  // --- RENDER FUNCTIONS ---

  const renderSettingsModal = () => {
    if (!showSettings) return null;
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-gray-900 border border-white/10 w-full max-w-sm max-h-[85vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-white/5 bg-black/20">
            <div className="flex items-center gap-2">
               <h2 className="text-xl font-bold text-white brand-font">MENU</h2>
               <span className="text-[10px] text-gray-500 font-mono bg-white/5 px-2 py-0.5 rounded-full">v1.3</span>
            </div>
            <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/5">
             <button 
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'settings' ? 'bg-white/5 text-neon-blue border-b-2 border-neon-blue' : 'text-gray-500 hover:text-gray-300'}`}
             >
               Opzioni
             </button>
             <button 
                onClick={() => setActiveTab('rules')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'rules' ? 'bg-white/5 text-neon-purple border-b-2 border-neon-purple' : 'text-gray-500 hover:text-gray-300'}`}
             >
               Regole
             </button>
             <button 
                onClick={() => setActiveTab('saves')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'saves' ? 'bg-white/5 text-neon-green border-b-2 border-neon-green' : 'text-gray-500 hover:text-gray-300'}`}
             >
               Salvataggi
             </button>
          </div>
          
          {/* Content */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative">
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-400 text-xs uppercase font-bold mb-3">Modalità di Gioco</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setGameMode('live')}
                      className={`p-3 rounded-xl text-sm font-bold transition-all ${gameMode === 'live' ? 'bg-neon-purple text-white shadow-neon-purple/30 shadow-lg' : 'bg-gray-800 text-gray-400'}`}
                    >
                      Dal Vivo
                    </button>
                    <button 
                      onClick={() => setGameMode('app')}
                      className={`p-3 rounded-xl text-sm font-bold transition-all ${gameMode === 'app' ? 'bg-neon-blue text-black shadow-neon-blue/30 shadow-lg' : 'bg-gray-800 text-gray-400'}`}
                    >
                      Voto in App
                    </button>
                  </div>
                  <p className="text-gray-500 text-xs mt-3 leading-relaxed">
                    {gameMode === 'live' 
                      ? "Votazione verbale. Elimina i giocatori manualmente." 
                      : "Votazione segreta gestita dall'app."}
                  </p>
                </div>

                <div className="animate-fade-in">
                  <label className="block text-gray-400 text-xs uppercase font-bold mb-3">Eliminati per Turno</label>
                  <div className="flex items-center justify-between bg-black/40 rounded-xl p-2 border border-white/5">
                      <button 
                        onClick={() => { setEliminationCount(Math.max(1, eliminationCount - 1)); setSettingsSaved(true); setTimeout(() => setSettingsSaved(false), 1500); }}
                        className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-neon-red/20 hover:text-neon-red transition-all"
                      >
                        -
                      </button>
                      <span className="text-xl font-bold text-white">{eliminationCount}</span>
                      <button 
                        onClick={() => { setEliminationCount(Math.min(3, eliminationCount + 1)); setSettingsSaved(true); setTimeout(() => setSettingsSaved(false), 1500); }}
                        className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-neon-red/20 hover:text-neon-red transition-all"
                      >
                        +
                      </button>
                  </div>
                  {settingsSaved && (
                    <div className="flex items-center justify-center gap-2 mt-2 text-neon-green text-xs font-bold animate-fade-in">
                       <Check className="w-3 h-3" /> Salvato
                    </div>
                  )}
                  <p className="text-gray-500 text-xs mt-2">
                    Persone eliminate ad ogni votazione. In caso di parità, scatta il <span className="text-neon-red font-bold">Ballottaggio</span>.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'rules' && (
              <div className="space-y-6 text-sm text-gray-300">
                <section>
                   <h3 className="text-white font-bold mb-2 flex items-center gap-2"><BookOpen className="w-4 h-4 text-neon-blue" /> Obiettivo</h3>
                   <p className="leading-relaxed text-xs text-gray-400">
                     Due parole simili vengono distribuite. I giocatori discutono per trovare l'intruso.
                   </p>
                </section>
                
                <section>
                   <h3 className="text-white font-bold mb-2 flex items-center gap-2"><Users className="w-4 h-4 text-neon-blue" /> Ruoli</h3>
                   <ul className="space-y-3">
                     <li className="bg-gray-800/50 p-2 rounded-lg border border-white/5">
                        <span className="text-neon-blue font-bold text-xs uppercase block mb-1">Buoni</span>
                        <span className="text-xs">Parola "Normale". Vincono se eliminano l'Impostore.</span>
                     </li>
                     <li className="bg-gray-800/50 p-2 rounded-lg border border-white/5">
                        <span className="text-neon-purple font-bold text-xs uppercase block mb-1">Allucinati</span>
                        <span className="text-xs">Parola "Simile". Pensano di essere buoni. Vincono in coppia negli ultimi 2.</span>
                     </li>
                     <li className="bg-gray-800/50 p-2 rounded-lg border border-white/5">
                        <span className="text-neon-red font-bold text-xs uppercase block mb-1">Impostore</span>
                        <span className="text-xs">Nessuna parola. Vince da solo o in 1vs1.</span>
                     </li>
                   </ul>
                </section>

                <section>
                   <h3 className="text-white font-bold mb-2 flex items-center gap-2"><Phone className="w-4 h-4 text-neon-blue" /> Dinamiche di Gioco</h3>
                   <div className="space-y-2 text-xs text-gray-400">
                      <p><strong>• Registrazione:</strong> Passa il telefono al giocatore indicato sullo schermo (es. "Giocatore 1").</p>
                      <p><strong>• Carta Segreta:</strong> Guarda la tua parola in segreto, poi tocca "Nascondi e Passa" prima di dare il telefono al prossimo.</p>
                      <p><strong>• Votazione App:</strong> Il telefono chiamerà il nome di chi deve votare. Quel giocatore conferma la sua identità ("Sono io"), vota in segreto, e passa il telefono al successivo.</p>
                   </div>
                </section>
              </div>
            )}

            {activeTab === 'saves' && (
               <div className="space-y-4 h-full flex flex-col">
                  {isEditingGroup ? (
                     <div className="flex flex-col h-full animate-fade-in">
                        <div className="flex-1 overflow-y-auto pr-1">
                           <label className="block text-gray-500 text-[10px] uppercase font-bold mb-1">Nome Gruppo</label>
                           <input 
                              type="text" 
                              value={editGroupName}
                              onChange={(e) => setEditGroupName(e.target.value)}
                              className="w-full bg-black/40 border border-white/20 rounded-lg p-2 text-white mb-4 text-sm"
                              placeholder="Es. Colleghi Ufficio"
                           />
                           
                           <div className="flex items-center justify-between mb-2">
                              <label className="block text-gray-500 text-[10px] uppercase font-bold">Giocatori ({editPlayerNames.length})</label>
                              <div className="flex gap-2">
                                <button onClick={() => removePlayerFromEdit(editPlayerNames.length - 1)} className="p-1 bg-white/5 rounded hover:bg-red-900/30 text-gray-400 hover:text-red-500"><Minus className="w-3 h-3" /></button>
                                <button onClick={addPlayerToEdit} className="p-1 bg-white/5 rounded hover:bg-neon-green/20 text-gray-400 hover:text-neon-green"><Plus className="w-3 h-3" /></button>
                              </div>
                           </div>

                           <div className="space-y-2">
                              {editPlayerNames.map((name, idx) => (
                                 <div key={idx} className="flex gap-2">
                                    <span className="text-gray-600 text-xs w-6 py-2 text-center">{idx+1}</span>
                                    <input 
                                       type="text" 
                                       value={name}
                                       onChange={(e) => updateEditPlayerName(idx, e.target.value)}
                                       className="flex-1 bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white focus:border-neon-purple focus:outline-none"
                                    />
                                 </div>
                              ))}
                           </div>
                        </div>
                        <div className="pt-4 mt-2 border-t border-white/10 flex gap-2">
                           <Button onClick={() => setIsEditingGroup(false)} variant="secondary" className="flex-1 text-xs py-2">Annulla</Button>
                           <Button onClick={saveEditedGroup} variant="primary" className="flex-1 text-xs py-2">Salva</Button>
                        </div>
                     </div>
                  ) : (
                    <>
                      <Button onClick={() => startEditingGroup()} fullWidth variant="secondary" className="border-neon-green/30 text-neon-green hover:bg-neon-green/10 mb-2 py-3">
                         <Plus className="w-4 h-4 mr-2" /> CREA NUOVO GRUPPO
                      </Button>
                      
                      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {savedGroups.length === 0 ? (
                          <p className="text-center text-gray-500 text-xs py-8">Nessun gruppo salvato.</p>
                        ) : (
                          savedGroups.map(group => (
                            <div key={group.id} className="bg-white/5 p-3 rounded-xl border border-white/10 flex justify-between items-center group hover:border-white/20 transition-all">
                              <div>
                                  <p className="font-bold text-white text-sm">{group.name}</p>
                                  <p className="text-xs text-gray-500">{group.playerNames.length} Giocatori</p>
                              </div>
                              <div className="flex gap-2 opacity-100 sm:opacity-60 sm:group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => startEditingGroup(group)}
                                    className="p-2 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 hover:text-white"
                                    title="Modifica"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => deleteSavedGroup(group.id)}
                                    className="p-2 bg-red-900/20 text-red-500 rounded-lg hover:bg-red-900/30"
                                    title="Elimina"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => { startGameSetup(group.playerNames); setShowSettings(false); }}
                                    className="p-2 bg-neon-blue/20 text-neon-blue rounded-lg hover:bg-neon-blue/30 border border-neon-blue/30"
                                    title="Gioca"
                                  >
                                    <Play className="w-4 h-4 fill-current" />
                                  </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
               </div>
            )}
          </div>

          {!isEditingGroup && (
             <div className="p-6 border-t border-white/5 bg-black/20">
               <Button onClick={() => setShowSettings(false)} fullWidth variant="secondary">Chiudi</Button>
             </div>
          )}
        </div>
      </div>
    );
  };

  const renderSetup = () => (
    <div className="flex flex-col items-center justify-center min-h-full py-8 px-4 animate-fade-in relative">
      <button 
        onClick={() => setShowSettings(true)}
        className="absolute top-4 right-4 p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors z-20"
      >
        <Settings className="w-6 h-6 text-gray-400 hover:text-white" />
      </button>

      <div className="text-center space-y-4 mb-12 mt-8">
        <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-purple via-white to-neon-blue drop-shadow-[0_0_15px_rgba(176,38,255,0.5)] brand-font tracking-wider leading-tight">
          ALLUCINAZIONE<br />COLLETTIVA
        </h1>
        <p className="text-gray-400 text-lg max-w-md mx-auto font-light">
          Due parole simili. Un intruso. Chi sta avendo un'allucinazione?
        </p>
      </div>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl">
        <div className="text-center mb-8">
          <label className="block text-neon-blue text-xs font-bold mb-4 tracking-[0.2em] uppercase">
            Numero di Giocatori
          </label>
          <div className="flex items-center justify-between bg-black/40 rounded-2xl p-2 border border-white/5">
            <button 
              onClick={() => setNumPlayers(Math.max(MIN_PLAYERS, numPlayers - 1))}
              className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center text-3xl hover:bg-neon-purple/20 hover:text-neon-purple transition-all active:scale-95"
            >
              -
            </button>
            <span className="text-5xl font-black brand-font text-white w-24 text-center tabular-nums">{numPlayers}</span>
            <button 
              onClick={() => setNumPlayers(Math.min(MAX_PLAYERS, numPlayers + 1))}
              className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center text-3xl hover:bg-neon-purple/20 hover:text-neon-purple transition-all active:scale-95"
            >
              +
            </button>
          </div>
        </div>

        <div className="space-y-3 bg-black/20 p-4 rounded-xl mb-8 border border-white/5">
          <div className="flex items-center justify-between text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-neon-red" />
              <span>Impostore</span>
            </div>
            <span className="font-bold text-white">1</span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <MushroomIcon className="w-4 h-4 text-neon-green" />
              <span>Allucinati</span>
            </div>
            <span className="font-bold text-white">
              {numPlayers >= 10 ? '3' : numPlayers >= 7 ? '2' : '1'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-300">
            <div className="flex items-center gap-2">
               <Users className="w-4 h-4 text-neon-blue" />
              <span>Buoni</span>
            </div>
            <span className="font-bold text-white">
              {numPlayers - 1 - (numPlayers >= 10 ? 3 : numPlayers >= 7 ? 2 : 1)}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <Button onClick={() => startGameSetup()} fullWidth className="group relative overflow-hidden" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creazione partita...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2 relative z-10">
                INIZIA ORA <Play className="w-5 h-5 fill-current group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </Button>
          
          {savedGroups.length > 0 && (
             <Button onClick={() => { setActiveTab('saves'); setShowSettings(true); }} fullWidth variant="secondary" className="text-xs py-3 border-white/10">
               <Download className="w-4 h-4 mr-2" /> CARICA GRUPPO SALVATO
             </Button>
          )}
        </div>
        
        {error && <p className="text-red-400 text-center mt-4 text-sm bg-red-900/20 p-2 rounded-lg border border-red-500/30">{error}</p>}
      </div>
    </div>
  );

  const renderRegistration = () => (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-10 animate-fade-in">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-lg p-8 rounded-[2rem] border border-neon-blue/20 shadow-[0_0_40px_rgba(0,243,255,0.05)]">
        <div className="flex justify-center mb-8">
           <div className="w-20 h-20 bg-gradient-to-br from-neon-blue/20 to-purple-900/20 rounded-full flex items-center justify-center border border-neon-blue/50 shadow-[0_0_20px_rgba(0,243,255,0.2)]">
             <UserPlus className="w-8 h-8 text-neon-blue" />
           </div>
        </div>
        
        <div className="text-center mb-8">
            <span className="text-neon-purple text-xs font-bold tracking-widest uppercase mb-2 block">Giocatore {currentPlayerIndex + 1} di {numPlayers}</span>
            <h2 className="text-3xl font-bold text-white brand-font">IDENTIFICAZIONE</h2>
        </div>

        <form onSubmit={handleNextPlayer}>
            <div className="relative mb-8">
               <input
                 ref={inputRef}
                 type="text"
                 value={tempName}
                 onChange={(e) => setTempName(e.target.value)}
                 onFocus={(e) => e.target.select()}
                 placeholder="Inserisci il tuo nome"
                 className="w-full bg-black/60 border-2 border-white/10 rounded-2xl p-5 pl-12 text-center text-2xl text-white placeholder-gray-600 focus:border-neon-purple focus:outline-none focus:ring-2 focus:ring-neon-purple/20 transition-all brand-font"
                 autoComplete="off"
                 autoCorrect="off"
               />
               <Edit2 className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
               {tempName && (
                  <button 
                    type="button"
                    onClick={() => { setTempName(''); inputRef.current?.focus(); }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
               )}
            </div>

            <Button type="submit" disabled={!tempName.trim()} fullWidth>
              RIVELA CARTA SEGRETA <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
        </form>
        
        <p className="text-center text-gray-500 text-xs mt-6">
            Passa il telefono a questo giocatore prima di continuare.
        </p>
      </div>
    </div>
  );

  const renderCardReveal = () => {
    const currentPlayer = players[currentPlayerIndex];
    const isImposter = currentPlayer.role === Role.IMPOSTOR;
    
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-4 animate-fade-in">
        <div className="mb-6 text-center">
            <h2 className="text-gray-400 text-sm uppercase tracking-widest font-bold mb-1">Turno di</h2>
            <h1 className="text-4xl font-black text-white brand-font">{currentPlayer.name}</h1>
        </div>

        {!cardRevealed ? (
          <div 
            onClick={handleConfirmReveal}
            className="w-full max-w-xs aspect-[3/4] bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl border-2 border-white/10 flex flex-col items-center justify-center cursor-pointer hover:scale-[1.02] hover:border-neon-purple/50 transition-all shadow-2xl group relative overflow-hidden touch-manipulation"
          >
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-shine opacity-0 group-hover:opacity-100 pointer-events-none"></div>
            <Eye className="w-20 h-20 text-gray-600 mb-6 group-hover:text-neon-purple transition-colors" />
            <p className="text-white font-bold text-xl uppercase tracking-widest mb-2">Tocca per vedere</p>
            <p className="text-gray-500 text-xs px-8 text-center leading-relaxed">
              Assicurati che NESSUN altro stia guardando il tuo schermo.
            </p>
          </div>
        ) : (
          <div className="w-full max-w-xs aspect-[3/4] bg-white rounded-3xl flex flex-col items-center justify-center shadow-[0_0_60px_rgba(176,38,255,0.4)] relative overflow-hidden animate-flip-in">
            
            <div className="flex-1 w-full flex flex-col items-center justify-center p-6 text-center relative z-10">
              <div className="absolute top-4 right-4">
                <EyeOff className="text-gray-300 w-6 h-6 opacity-50" />
              </div>

              {isImposter ? (
                <>
                  <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <AlertTriangle className="w-12 h-12 text-red-600" />
                  </div>
                  <h3 className="text-4xl font-black text-red-600 brand-font uppercase tracking-tighter mb-2">
                    IMPOSTORE
                  </h3>
                  <div className="bg-red-50 p-4 rounded-xl border border-red-100 w-full">
                    <p className="text-red-800 font-medium text-sm leading-relaxed">
                      Non hai una parola segreta.
                    </p>
                    <p className="text-red-600 text-xs mt-2 font-bold">
                      NON CONOSCI LA CATEGORIA.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <span className="text-4xl">🤫</span>
                  </div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-2">La tua parola è</p>
                  <h3 className="text-4xl font-black text-black break-words w-full leading-tight brand-font mb-8">
                    {currentPlayer.assignedWord}
                  </h3>
                  <p className="text-gray-500 text-xs px-4">
                     Non rivelare a nessuno che parola hai ricevuto.
                  </p>
                </>
              )}
            </div>

            <div className="w-full p-4 bg-gray-50 border-t border-gray-200">
              <Button 
                onClick={handlePassPhone} 
                fullWidth 
                variant={isImposter ? 'danger' : 'primary'}
                className="shadow-none py-3 text-base"
              >
                {currentPlayerIndex + 1 < numPlayers ? "NASCONDI E PASSA" : "HO CAPITO, GIOCIAMO"}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderGameReady = () => {
    return (
      <div className="flex flex-col items-center justify-center min-h-full space-y-8 animate-fade-in p-6">
        <div className="text-center space-y-6 max-w-md w-full">
          <div className="w-24 h-24 bg-neon-green rounded-full mx-auto flex items-center justify-center shadow-[0_0_40px_rgba(57,255,20,0.6)] animate-pulse">
             <Play className="w-10 h-10 text-black fill-current ml-1" />
          </div>
          <h2 className="text-4xl font-black text-white brand-font">TUTTO PRONTO!</h2>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg transform rotate-1">
             <p className="text-neon-purple text-xs font-bold uppercase mb-2 tracking-widest">Primo Giocatore suggerito</p>
             <p className="text-3xl font-bold text-white">{startingPlayerName}</p>
          </div>
        </div>

        <div className="w-full max-w-md space-y-4 pb-8">
           {!showSaveUI ? (
              <button 
                 onClick={() => setShowSaveUI(true)}
                 className="w-full text-xs text-gray-500 hover:text-white flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Salva questo gruppo per dopo
              </button>
           ) : (
             <div className="bg-white/5 p-4 rounded-xl border border-white/10 animate-fade-in">
                <input 
                   type="text" 
                   value={saveName} 
                   onChange={(e) => setSaveName(e.target.value)}
                   className="w-full bg-black/50 border border-white/20 rounded-lg p-2 text-white mb-2"
                   placeholder="Nome gruppo"
                />
                <Button onClick={() => { saveCurrentGroup(saveName); setShowSaveUI(false); }} fullWidth variant="secondary" className="py-2 text-sm">
                   CONFERMA SALVATAGGIO
                </Button>
             </div>
           )}

           <Button onClick={() => setPhase(GamePhase.PLAYING)} fullWidth variant="primary">
             INIZIA PARTITA
           </Button>
        </div>
      </div>
    );
  };

  const renderPlaying = () => {
    const aliveCounts = {
      good: players.filter(p => p.isAlive && p.role === Role.GOOD).length,
      hallucinated: players.filter(p => p.isAlive && p.role === Role.HALLUCINATED).length,
      impostor: players.filter(p => p.isAlive && p.role === Role.IMPOSTOR).length
    };

    return (
    <div className="flex flex-col h-full animate-fade-in max-w-lg mx-auto w-full bg-black/50">
      <div className="pt-8 pb-6 px-6 bg-gradient-to-b from-indigo-900/50 to-transparent">
        <div className="flex justify-between items-start mb-2">
             <h2 className="text-3xl font-black text-white brand-font">IN GIOCO</h2>
             <span className="px-3 py-1 bg-neon-purple/20 text-neon-purple rounded-full text-xs font-bold border border-neon-purple/50">
                {players.filter(p => p.isAlive).length} / {players.length} Vivi
             </span>
        </div>
        
        {gameMode === 'live' && (
          <div className="flex items-center gap-2 mt-2 text-xs font-mono bg-black/40 p-2 rounded-lg border border-white/10">
             <span className="text-neon-blue font-bold">{aliveCounts.good} Buoni</span> •
             <span className="text-neon-purple font-bold">{aliveCounts.hallucinated} Allucinati</span> •
             <span className="text-neon-red font-bold">{aliveCounts.impostor} Impostore</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-32 space-y-3">
          {players.map((p, idx) => {
            let statusColor = "bg-gray-700";
            let statusText = p.name.charAt(0).toUpperCase();
            let roleText = "";

            if (!p.isAlive) {
              if (p.role === Role.IMPOSTOR) {
                statusColor = "bg-neon-red";
                roleText = "IMPOSTORE";
              } else if (p.role === Role.HALLUCINATED) {
                statusColor = "bg-neon-purple";
                roleText = "ALLUCINATO";
              } else {
                statusColor = "bg-gray-900 text-gray-500";
                roleText = "ELIMINATO";
              }
            }

            const isConfirming = killConfirm === p.id;

            return (
             <div key={idx} className={`p-4 rounded-xl flex items-center justify-between backdrop-blur-sm border ${!p.isAlive ? 'bg-black/60 border-white/5 opacity-80' : 'bg-white/5 border-white/10'}`}>
               <div className="flex items-center space-x-4">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white border border-white/10 shadow-inner ${statusColor}`}>
                   {!p.isAlive && (p.role === Role.IMPOSTOR || p.role === Role.HALLUCINATED) ? <Skull className="w-5 h-5" /> : statusText}
                 </div>
                 <div>
                    <span className={`text-lg font-bold ${!p.isAlive ? 'text-gray-500 line-through' : 'text-gray-200'}`}>{p.name}</span>
                    {!p.isAlive && roleText && <p className={`text-xs font-bold ${p.role === Role.IMPOSTOR ? 'text-neon-red' : p.role === Role.HALLUCINATED ? 'text-neon-purple' : 'text-gray-600'}`}>{roleText}</p>}
                 </div>
               </div>
               
               {gameMode === 'live' && (
                  p.isAlive ? (
                    <button 
                      onClick={(e) => handleLiveEliminationClick(e, p.id)}
                      className={`w-12 h-10 rounded-lg flex items-center justify-center transition-all z-50 relative
                        ${isConfirming 
                          ? 'bg-red-600 text-white animate-pulse shadow-red-500/50 shadow-lg' 
                          : 'bg-red-900/20 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white'
                        }`}
                      title="Elimina Giocatore"
                    >
                      {isConfirming ? <Check className="w-6 h-6" /> : <Skull className="w-5 h-5" />}
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => handleResurrectPlayer(e, p.id)}
                      className="w-12 h-10 rounded-lg flex items-center justify-center transition-all z-50 relative bg-yellow-900/20 border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500 hover:text-white"
                      title="Riporta in Vita"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  )
               )}
             </div>
            );
          })}

        {gameMode === 'live' && (
          <div className="bg-yellow-900/10 border border-yellow-600/20 p-4 rounded-xl flex gap-3 items-start mt-6 mx-2">
            <HelpCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-yellow-500 font-bold text-sm mb-1">Condizioni di Vittoria</h4>
              <ul className="text-yellow-100/60 text-xs space-y-1 list-disc pl-3">
                  <li><strong>Buoni:</strong> Eliminano l'Impostore.</li>
                  <li><strong>Allucinati:</strong> Ultimi 2: 1 Allucinato + 1 Altro.</li>
                  <li><strong>Impostore:</strong> Vince in 1vs1 o da solo.</li>
              </ul>
            </div>
          </div>
        )}
        
        {gameMode === 'app' && (
           <div className="flex justify-center mt-4">
              <span className="text-xs text-gray-500 font-mono">Eliminati per turno: <strong className="text-white">{eliminationCount}</strong></span>
           </div>
        )}

        <div className="mt-8 mx-2">
            <h3 className="text-center text-gray-500 text-xs uppercase tracking-widest mb-4">Zona Verifica</h3>
            {!revealTruth ? (
            <Button onClick={() => setRevealTruth(true)} fullWidth variant="secondary" className="bg-gray-900 border-gray-700 flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" /> RIVELA PAROLE
            </Button>
            ) : (
            <div className="bg-white p-6 rounded-2xl text-center animate-flip-in relative overflow-hidden">
                <button onClick={() => setRevealTruth(false)} className="absolute top-2 right-2 text-gray-400 hover:text-black"><X className="w-5 h-5" /></button>
                <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mb-1">Buoni</p>
                <h2 className="text-3xl font-black text-black brand-font mb-4">{gameData?.normalWord}</h2>
                <div className="w-full h-px bg-gray-200 my-3"></div>
                <p className="text-gray-400 text-xs uppercase font-bold">Parola Allucinata</p>
                <h2 className="text-xl font-bold text-neon-purple brand-font">{gameData?.similarWord}</h2>
            </div>
            )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/95 to-transparent max-w-lg mx-auto space-y-3 pointer-events-auto">
        {gameMode === 'app' && (
          <Button onClick={startVotingPhase} fullWidth variant="primary" className="flex items-center justify-center gap-2">
            <Vote className="w-5 h-5" /> INIZIA VOTAZIONE
          </Button>
        )}
        <Button onClick={handleRestart} fullWidth variant="secondary" className="border-white/10 hover:bg-white/10 text-sm">
          NUOVA PARTITA
        </Button>
      </div>
    </div>
    );
  };

  const renderVotingIntro = () => {
    // Only show "Pass to" if it's the current player's turn to vote.
    // Logic: In Voting Phase, we show a screen "Pass to X". X clicks "It's me".
    // Then X votes.
    const voter = players[currentPlayerIndex];

    return (
      <div className="flex flex-col items-center justify-center min-h-full p-8 animate-fade-in text-center">
        <div className="w-20 h-20 bg-neon-blue/20 rounded-full flex items-center justify-center mb-6 border border-neon-blue/50 mx-auto">
          <Vote className="w-10 h-10 text-neon-blue" />
        </div>
        <h2 className="text-xl text-gray-400 font-bold uppercase tracking-widest mb-2">
          {isRunoff ? 'BALLOTTAGGIO' : 'Votazione'}
        </h2>
        <h1 className="text-4xl font-black text-white brand-font mb-8">Passa a {voter.name}</h1>
        
        {/* Verification Zone in Intro */}
        <div className="mb-8 w-full max-w-xs mx-auto">
            <h3 className="text-gray-500 text-[10px] uppercase tracking-widest mb-2">Dubbio sulla tua parola?</h3>
             {!revealTruth ? (
                <Button onClick={() => setRevealTruth(true)} fullWidth variant="secondary" className="py-2 text-xs bg-gray-900 border-gray-700 flex items-center justify-center gap-2">
                    <Lock className="w-3 h-3" /> CONTROLLA ORA
                </Button>
             ) : (
                <div className="bg-white p-4 rounded-xl text-center relative overflow-hidden animate-flip-in">
                    <button onClick={() => setRevealTruth(false)} className="absolute top-2 right-2 text-gray-400 hover:text-black"><X className="w-4 h-4" /></button>
                    
                    {voter.role === Role.IMPOSTOR ? (
                       <>
                          <div className="flex justify-center mb-2">
                             <AlertTriangle className="w-8 h-8 text-red-600" />
                          </div>
                          <p className="text-red-600 font-black brand-font text-lg mb-1">SEI L'IMPOSTORE</p>
                          <p className="text-xs text-red-800">Non hai una parola.</p>
                       </>
                    ) : (
                       <>
                          <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mb-1">La tua parola</p>
                          <p className="text-2xl font-black text-black brand-font">{voter.assignedWord}</p>
                       </>
                    )}
                </div>
             )}
        </div>

        <Button onClick={() => { setRevealTruth(false); setPhase(GamePhase.VOTING_TURN); }} fullWidth>
          SONO IO, CONTINUA
        </Button>
      </div>
    );
  };

  const renderVotingTurn = () => {
    const voter = players[currentPlayerIndex];
    // In runoff, only tied players are candidates.
    
    const validCandidates = isRunoff 
      ? players.filter(p => runoffCandidates.includes(p.id)) 
      : players.filter(p => p.isAlive);

    return (
      <div className="flex flex-col h-full animate-fade-in p-6">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
             {isRunoff && <span className="bg-neon-red text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider animate-pulse">Ballottaggio</span>}
          </div>
          <h2 className="text-gray-400 text-xs uppercase tracking-widest font-bold">Sta votando</h2>
          <h1 className="text-3xl font-black text-white brand-font">{voter.name}</h1>
          <p className="text-gray-500 text-xs mt-2">
            {isRunoff ? "Scegli chi eliminare tra i giocatori in pareggio." : "Chi vuoi eliminare?"}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pb-4">
          {validCandidates.map(p => (
            <button
              key={p.id}
              onClick={() => submitVote(p.id)}
              className={`w-full p-4 rounded-xl flex items-center justify-between border transition-all ${
                 p.id === voter.id 
                 ? 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed' 
                 : isRunoff
                    ? 'bg-red-900/20 border-red-500/50 hover:bg-red-600 hover:text-white' 
                    : 'bg-gray-800/50 border-gray-700 hover:bg-neon-red/20 hover:border-neon-red/50'
              }`}
              disabled={p.id === voter.id}
            >
              <span className="font-bold text-white">{p.name}</span>
              <Vote className="w-5 h-5 text-current opacity-70" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderRunoffIntro = () => {
    // Get names of tied candidates
    const tiedNames = players.filter(p => runoffCandidates.includes(p.id)).map(p => p.name).join(' e ');

    return (
      <div className="flex flex-col items-center justify-center min-h-full p-6 animate-fade-in text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-red-900/10 animate-pulse pointer-events-none"></div>
        <div className="mb-8">
          <Scale className="w-20 h-20 text-neon-red mx-auto mb-4" />
          <h2 className="text-neon-red text-sm font-bold tracking-[0.3em] uppercase mb-2">Parità Rilevata</h2>
          <h1 className="text-4xl font-black text-white brand-font mb-4">BALLOTTAGGIO</h1>
          <p className="text-lg text-gray-300">
            Tra <span className="text-white font-bold">{tiedNames}</span>
          </p>
        </div>

        <div className="bg-gray-900/80 p-6 rounded-xl border border-white/10 max-w-sm mb-8">
          <p className="text-sm text-gray-400 leading-relaxed">
            I voti sono pari. Si procederà a una <strong>nuova votazione</strong>.
            I candidati in pareggio <strong>NON potranno votare</strong>.
          </p>
        </div>

        <Button onClick={startVotingPhase} fullWidth variant="danger">
           INIZIA SPAREGGIO
        </Button>
      </div>
    );
  };

  const renderRoundResults = () => (
    <div className="flex flex-col items-center justify-center min-h-full p-6 animate-fade-in text-center">
      <div className="mb-8">
        <Skull className="w-20 h-20 text-neon-red mx-auto mb-4 animate-bounce" />
        <h1 className="text-4xl font-black text-white brand-font mb-2">ELIMINATI</h1>
      </div>

      {lastEliminatedPlayers.length > 0 ? (
        <div className="space-y-4 w-full max-w-xs mb-8">
          {lastEliminatedPlayers.map(p => (
            <div key={p.id} className="bg-red-900/20 border border-red-500/30 p-4 rounded-xl">
              <p className="text-2xl font-bold text-white">{p.name}</p>
              <p className="text-red-400 text-sm font-bold uppercase mt-1">
                {p.role === Role.IMPOSTOR ? 'ERA L\'IMPOSTORE!' : p.role === Role.HALLUCINATED ? 'ERA UN ALLUCINATO' : 'ERA UN BUONO'}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-800 p-6 rounded-xl mb-8 border border-white/10">
          <p className="text-xl text-gray-300 font-bold mb-2">Nessun eliminato</p>
          <p className="text-gray-500 text-sm">
             {isRunoff 
               ? "Parità anche al ballottaggio. Nessuno viene escluso." 
               : "I voti si sono dispersi o c'è stata parità assoluta."}
          </p>
        </div>
      )}

      <div className="w-full max-w-xs space-y-3">
         <Button onClick={() => setPhase(GamePhase.PLAYING)} fullWidth variant="primary">
           TORNA AL GIOCO
         </Button>
      </div>
    </div>
  );

  const renderGameOver = () => (
    <div className="flex flex-col items-center justify-center min-h-full p-6 animate-fade-in text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-purple/10 to-transparent pointer-events-none"></div>
      
      <Trophy className="w-24 h-24 text-yellow-400 mb-6 filter drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-pulse" />
      
      <h2 className="text-neon-purple text-sm font-bold tracking-[0.3em] uppercase mb-2">Vittoria</h2>
      <h1 className="text-5xl md:text-6xl font-black text-white brand-font mb-8 leading-tight">
        {winnerTeam === Role.IMPOSTOR ? 'IMPOSTORE' : winnerTeam === Role.HALLUCINATED ? 'ALLUCINATI' : 'BUONI'}
      </h1>

      <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 w-full max-w-md mb-8">
        {!showGameOverWords ? (
           <Button onClick={() => setShowGameOverWords(true)} fullWidth variant="secondary" className="bg-gray-900 border-gray-700 flex items-center justify-center gap-2">
             <Eye className="w-4 h-4" /> RIVELA SOLUZIONE
           </Button>
        ) : (
          <div className="space-y-2 relative animate-flip-in">
             <button onClick={() => setShowGameOverWords(false)} className="absolute -top-2 -right-2 text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
            <p className="text-gray-400 text-xs uppercase font-bold">Parola Comune</p>
            <p className="text-2xl font-bold text-white mb-4">{gameData?.normalWord}</p>
            <div className="h-px bg-white/10 w-full my-4"></div>
            <p className="text-gray-400 text-xs uppercase font-bold">Parola Allucinata</p>
            <p className="text-2xl font-bold text-neon-purple">{gameData?.similarWord}</p>
          </div>
        )}
      </div>

      <div className="space-y-3 w-full max-w-md">
        <Button onClick={startNewGameSamePlayers} fullWidth variant="primary" className="flex items-center justify-center gap-2">
           <RefreshCw className="w-5 h-5" /> RIGIOCA (STESSI NOMI)
        </Button>
        <div className="flex gap-2">
          <Button onClick={handleUndoGameOver} fullWidth variant="secondary" className="flex-1 flex items-center justify-center gap-2 text-xs">
             <RotateCcw className="w-4 h-4" /> ANNULLA FINE PARTITA
          </Button>
        </div>
        <Button onClick={handleRestart} fullWidth variant="secondary" className="border-white/10">
           NUOVA PARTITA
        </Button>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-screen overflow-hidden bg-black text-white font-sans selection:bg-neon-purple selection:text-white fixed inset-0">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black"></div>
         <FallingMushrooms />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 h-full w-full overflow-hidden flex flex-col">
        {renderSettingsModal()}
        
        {phase === GamePhase.SETUP && renderSetup()}
        {phase === GamePhase.PLAYER_REGISTRATION && renderRegistration()}
        {phase === GamePhase.CARD_REVEAL && renderCardReveal()}
        {phase === GamePhase.GAME_READY && renderGameReady()}
        {phase === GamePhase.PLAYING && renderPlaying()}
        {phase === GamePhase.VOTING_INTRO && renderVotingIntro()}
        {phase === GamePhase.VOTING_TURN && renderVotingTurn()}
        {phase === GamePhase.RUNOFF_INTRO && renderRunoffIntro()}
        {phase === GamePhase.ROUND_RESULTS && renderRoundResults()}
        {phase === GamePhase.GAME_OVER && renderGameOver()}
      </div>
    </div>
  );
}