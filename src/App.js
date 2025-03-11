import React, { useState, useCallback, useEffect, useRef } from 'react';
import './App.css';
import snakeBg from './images/snake-bg.png';
import snakeTitle from './images/snake-title.png';
import snakeHead from './images/snake-head.png';
import snakeBody from './images/snake-body.png';
import snakeByline from './images/snake-byline1.png';
import backgroundMusic from './audio/snake-game-music.mp3';

function App() {
  const [gameState, setGameState] = useState('title'); // title, playing, gameOver
  const [finalScore, setFinalScore] = useState(0);
  const [filledPercentage, setFilledPercentage] = useState(0);
  const [boardStyle, setBoardStyle] = useState("");
  const [isHighScore, setIsHighScore] = useState(false);
  const [selectedBoardStyle, setSelectedBoardStyle] = useState(null); // Add state for selected board style
  const [resetKey, setResetKey] = useState(0); // Add a key to force Game component to remount
  const [isMuted, setIsMuted] = useState(false); // Add state for audio mute
  const audioRef = useRef(null); // Reference to the audio element
  const [highScores, setHighScores] = useState(() => {
    // Initialize high scores from localStorage or with defaults
    const storedScores = localStorage.getItem('snakeHighScores');
    if (storedScores) {
      return JSON.parse(storedScores);
    }
    return {
      'Gapped Border': { score: 0, filled: 0 },
      'Circular': { score: 0, filled: 0 },
      'Maze': { score: 0, filled: 0 },
      'Blob': { score: 0, filled: 0 }
    };
  });

  // Initialize mute state from localStorage
  useEffect(() => {
    const savedMuteState = localStorage.getItem('snakeMuted');
    if (savedMuteState) {
      setIsMuted(JSON.parse(savedMuteState));
    }
  }, []);

  // Toggle mute function
  const toggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    localStorage.setItem('snakeMuted', JSON.stringify(newMuteState));
    
    if (audioRef.current) {
      audioRef.current.muted = newMuteState;
    }
  };

  // Handle audio when component mounts
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.5; // Set volume to 50%
      audioRef.current.muted = isMuted;
      audioRef.current.play().catch(e => {
        // Auto-play was prevented, user needs to interact first
        console.log("Audio auto-play was prevented. User needs to interact with the page first.");
      });
    }
  }, [isMuted]);

  const startGame = (boardStyleIndex) => {
    // If a specific board style is selected, use it
    setSelectedBoardStyle(boardStyleIndex !== undefined ? boardStyleIndex : null);
    setGameState('playing');
    setResetKey(prev => prev + 1);
  };

  const handleGameOver = (score, percentage, style) => {
    const boardStyleName = getBoardStyleName(style) || "Standard";
    setFinalScore(score);
    setFilledPercentage(percentage || 0);
    setBoardStyle(boardStyleName);
    
    // Check if this is a new high score for this board type
    let newHighScore = false;
    
    setHighScores(prevHighScores => {
      const newHighScores = { ...prevHighScores };
      
      // Create entry for this board type if it doesn't exist
      if (!newHighScores[boardStyleName]) {
        newHighScores[boardStyleName] = { score: 0, filled: 0 };
      }
      
      // Check if score is higher than current high score
      if (score > newHighScores[boardStyleName].score) {
        newHighScores[boardStyleName].score = score;
        newHighScore = true;
      }
      
      // Check if filled percentage is higher than current high percentage
      if (percentage > newHighScores[boardStyleName].filled) {
        newHighScores[boardStyleName].filled = percentage;
        newHighScore = true;
      }
      
      // Save to localStorage
      localStorage.setItem('snakeHighScores', JSON.stringify(newHighScores));
      
      return newHighScores;
    });
    
    setIsHighScore(newHighScore);
    setGameState('gameOver');
  };

  const restartGame = (boardStyleIndex) => {
    // If a specific board style is selected, use it
    setSelectedBoardStyle(boardStyleIndex !== undefined ? boardStyleIndex : null);
    setGameState('playing');
    setResetKey(prev => prev + 1);
  };

  const backToTitle = () => {
    // Ensure we're setting the game state to 'title'
    setGameState('title');
  };

  // Add keyboard shortcuts for app-level controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle keyboard shortcuts when in playing state
      if (gameState === 'playing') {
        if (e.key === 'r' || e.key === 'R') {
          // Reset game with R key
        //if (window.confirm('Are you sure you want to reset the game? Your current game progress will be lost.')) {
            setGameState('playing');
            setResetKey(prev => prev + 1);
          //}
        } else if (e.key === 'Escape') {
          // Back to title with Escape key
         // if (window.confirm('Are you sure you want to return to the title screen? Your current game progress will be lost.')) {
            setGameState('title');
         // }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState]);

  return (
    <div className="App">
      {/* Audio element */}
      <audio 
        ref={audioRef}
        src={backgroundMusic}
        loop
        preload="auto"
      />
      
      {/* Mute button */}
      <button 
        className="mute-button" 
        onClick={toggleMute}
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? "🔇" : "🔊"}
      </button>

      {gameState === 'title' && (
        <TitleScreen 
          onStartGame={startGame} 
          highScores={highScores}
        />
      )}
      {gameState === 'playing' && (
        <div className="game-wrapper">
          <Game 
            key={resetKey} 
            onGameOver={handleGameOver} 
            selectedBoardStyle={selectedBoardStyle}
          />
          <div className="game-controls">
            <button className="title-button" onClick={backToTitle} title="Press ESC to return to title">
              <span className="button-icon">🏠</span> Back to Title
            </button>
            <button className="reset-button" onClick={() => restartGame()} title="Press R to reset game">
              <span className="button-icon">🔄</span> Reset Game
            </button>
          </div>
        </div>
      )}
      {gameState === 'gameOver' && (
        <GameOverScreen 
          score={finalScore} 
          filledPercentage={filledPercentage}
          boardStyle={boardStyle}
          isHighScore={isHighScore}
          highScores={highScores}
          onRestart={restartGame} 
          onBackToTitle={backToTitle} 
        />
      )}
    </div>
  );
}

function TitleScreen({ onStartGame, highScores }) {
  const [showBoardSelector, setShowBoardSelector] = useState(false);
  
  // Array of available board styles with descriptions
  const boardStyles = [
    { name: 'Gapped Border', description: 'Classic border with random gaps' },
    { name: 'Circular', description: 'A round arena with curved walls' },
    { name: 'Maze', description: 'Challenging maze-like pattern' },
    { name: 'Blob', description: 'Random blob-shaped obstacles' }
  ];
  
  return (
    <div className="title-screen" style={{ backgroundImage: `url(${snakeBg})` }}>
      <img src={snakeByline} alt="Snake Game Byline" className="title-byline" />
      <div className="title-content">
        <img src={snakeTitle} alt="Snake Game" className="title-logo" />
        
        <button className="start-button" onClick={() => setShowBoardSelector(true)}>
          <span className="start-button-text">START GAME</span>
          <span className="start-button-glow"></span>
        </button>
      </div>
      
      {showBoardSelector && (
        <>
          <div className="modal-overlay" onClick={() => setShowBoardSelector(false)}></div>
          <div className="title-board-selector">
            <h3>Select Board Style</h3>
            <div className="title-board-options">
              {boardStyles.map((style, index) => {
                const highScore = highScores[style.name] || { score: 0, filled: 0 };
                return (
                  <div 
                    key={index} 
                    className="title-board-option"
                    onClick={() => onStartGame(index)}
                  >
                    <div className="board-option-name">{style.name}</div>
                    <div className="board-option-desc">{style.description}</div>
                    <div className="high-score-details">
                      <div className="high-score-item">
                        <span className="high-score-label">Best Score:</span> 
                        <span className="high-score-value">{highScore.score}</span>
                      </div>
                      <div className="high-score-item">
                        <span className="high-score-label">Best Fill:</span> 
                        <span className="high-score-value">{highScore.filled}%</span>
                      </div>
                    </div>
                    <div className="play-now-badge">PLAY NOW</div>
                  </div>
                );
              })}
            </div>
            <div className="title-random-option" onClick={() => onStartGame()}>
              <div className="board-option-name">Random Board</div>
              <div className="board-option-desc">Surprise me with any board type!</div>
              <div className="play-now-badge">PLAY NOW</div>
            </div>
            <button className="back-button" onClick={() => setShowBoardSelector(false)}>
              <span className="button-icon">↩️</span> Back
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function GameOverScreen({ score, filledPercentage, boardStyle, isHighScore, highScores, onRestart, onBackToTitle }) {
  // Array of available board styles with descriptions
  const boardStyles = [
    { name: 'Gapped Border', description: 'Classic border with random gaps' },
    { name: 'Circular', description: 'A round arena with curved walls' },
    { name: 'Maze', description: 'Challenging maze-like pattern' },
    { name: 'Blob', description: 'Random blob-shaped obstacles' }
  ];
  
  // Get the index of the current board style
  const currentBoardIndex = boardStyles.findIndex(b => b.name === boardStyle);
  
  return (
    <div className="game-over-screen">
      <h1>Game Over</h1>
      
      {isHighScore && (
        <div className="new-high-score">
          🏆 New High Score! 🏆
        </div>
      )}
      
      <div className="game-stats">
        <div className="stat-card">
          <div className="stat-title">Your Score</div>
          <div className="stat-value">{score}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-title">Board Filled</div>
          <div className="stat-value">{filledPercentage}%</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-title">Board Type</div>
          <div className="stat-value">{boardStyle}</div>
        </div>
      </div>
      
      <div className="board-selector">
        <h3>Select Board to Play Again</h3>
        <div className="board-options">
          {boardStyles.map((style, index) => {
            const highScore = highScores[style.name] || { score: 0, filled: 0 };
            return (
              <div 
                key={index} 
                className={`board-option ${currentBoardIndex === index ? 'current-board' : ''}`}
                onClick={() => onRestart(index)}
              >
                <div className="board-option-name">{style.name}</div>
                <div className="board-option-desc">{style.description}</div>
                <div className="high-score-details">
                  <div className="high-score-item">
                    <span className="high-score-label">Best Score:</span> 
                    <span className="high-score-value">{highScore.score}</span>
                  </div>
                  <div className="high-score-item">
                    <span className="high-score-label">Best Fill:</span> 
                    <span className="high-score-value">{highScore.filled}%</span>
                  </div>
                </div>
                <div className="play-now-badge">PLAY NOW</div>
              </div>
            );
          })}
        </div>
        <div className="random-option" onClick={() => onRestart()}>
          <div className="board-option-name">Random Board</div>
          <div className="board-option-desc">Surprise me with any board type!</div>
          <div className="play-now-badge">PLAY NOW</div>
        </div>
        <button className="title-button back-to-title" onClick={onBackToTitle}>
          <span className="button-icon">🏠</span> Back to Title
        </button>
      </div>
    </div>
  );
}

function Game({ onGameOver, selectedBoardStyle }) {
  // Game board dimensions - larger and rectangular
  const boardWidth = 40;
  const boardHeight = 25;
  
  // Generate board with walls and obstacles
  const [boardMap, setBoardMap] = useState(() => {
    // If a specific board style is selected, use it, otherwise randomize
    const { board, boardStyle } = generateBoardMap(boardWidth, boardHeight, selectedBoardStyle);
    return { board, boardStyle };
  });
  
  // Generate a valid random position (not on a wall or obstacle)
  const generateRandomPosition = useCallback(() => {
    let position;
    do {
      position = {
        x: Math.floor(Math.random() * boardWidth),
        y: Math.floor(Math.random() * boardHeight)
      };
    } while (boardMap.board[position.y]?.[position.x] !== 0); // Keep trying until we find an empty cell
    return position;
  }, [boardMap, boardWidth, boardHeight]);
  
  // Initialize snake with a random position
  const [snake, setSnake] = useState(() => {
    const startPos = {
      x: Math.floor(boardWidth / 2),
      y: Math.floor(boardHeight / 2)
    };
    // Ensure the start position is not on a wall or obstacle
    // If it is, we'll find a new position
    if (boardMap.board[startPos.y]?.[startPos.x] !== 0) {
      return [generateRandomPosition()];
    }
    return [startPos]; // Just the head at the beginning
  });
  
  const [direction, setDirection] = useState('RIGHT');
  const [speed] = useState(150); // Slower, constant speed (was 100)
  const [gameRunning, setGameRunning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [filledPercentage, setFilledPercentage] = useState(0);
  
  // Calculate the percentage of the board that has been filled
  useEffect(() => {
    if (snake.length > 0) {
      // Count number of empty cells (not walls or obstacles)
      let emptyCells = 0;
      for (let y = 0; y < boardHeight; y++) {
        for (let x = 0; x < boardWidth; x++) {
          if (boardMap.board[y]?.[x] === 0) {
            emptyCells++;
          }
        }
      }
      const percentage = (snake.length / emptyCells) * 100;
      setFilledPercentage(percentage.toFixed(2));
    }
  }, [snake, boardMap, boardWidth, boardHeight]);
  
  const moveSnake = useCallback(() => {
    setSnake(prevSnake => {
      const newSnake = [...prevSnake];
      const head = { ...newSnake[0] };
      
      // Move the head based on direction
      switch (direction) {
        case 'UP':
          head.y -= 1;
          break;
        case 'DOWN':
          head.y += 1;
          break;
        case 'LEFT':
          head.x -= 1;
          break;
        case 'RIGHT':
          head.x += 1;
          break;
        default:
          break;
      }
      
      // Wrap around the board
      if (head.x < 0) head.x = boardWidth - 1;
      if (head.x >= boardWidth) head.x = 0;
      if (head.y < 0) head.y = boardHeight - 1;
      if (head.y >= boardHeight) head.y = 0;
      
      // Check for collision with walls or obstacles
      if (boardMap.board[head.y]?.[head.x] === 1 || boardMap.board[head.y]?.[head.x] === 2) {
        setGameRunning(false);
        onGameOver(score, filledPercentage, boardMap.boardStyle);
        return prevSnake;
      }
      
      // Check for collision with self (any part of the existing snake)
      for (let i = 0; i < newSnake.length; i++) {
        if (head.x === newSnake[i].x && head.y === newSnake[i].y) {
          setGameRunning(false);
          onGameOver(score, filledPercentage, boardMap.boardStyle);
          return prevSnake;
        }
      }
      
      // Add new head to the snake
      newSnake.unshift(head);
      
      // Increase score
      setScore(prevScore => prevScore + 1);
      
      // Snake grows with each move, so we don't remove the tail
      
      return newSnake;
    });
  }, [direction, boardWidth, boardHeight, boardMap, onGameOver, score, filledPercentage]);
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (direction !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (direction !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (direction !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (direction !== 'LEFT') setDirection('RIGHT');
          break;
        case ' ':
          setIsPaused(prev => !prev);
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    const gameInterval = setInterval(() => {
      if (gameRunning && !isPaused) {
        moveSnake();
      }
    }, speed);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearInterval(gameInterval);
    };
  }, [direction, gameRunning, moveSnake, speed, isPaused]);
  
  return (
    <div className="game-container">
      <div className="score-display">Score: {score} | Filled: {filledPercentage}% | Board: {getBoardStyleName(boardMap.boardStyle)}</div>
      {isPaused && <div className="pause-overlay">PAUSED<br /><span className="pause-hint">Press SPACE to resume</span></div>}
      <div className="game-board">
        {Array.from({ length: boardHeight }).map((_, rowIndex) => (
          <div key={rowIndex} className="board-row">
            {Array.from({ length: boardWidth }).map((_, colIndex) => {
              // Check cell type
              const isWall = boardMap.board[rowIndex]?.[colIndex] === 1;
              const isObstacle = boardMap.board[rowIndex]?.[colIndex] === 2;
              
              // Check if current cell is part of the snake
              const isSnakeBody = snake.some((segment, index) => 
                index > 0 && segment.x === colIndex && segment.y === rowIndex
              );
              // Check if current cell is the snake head
              const isSnakeHead = snake.length > 0 && snake[0].x === colIndex && snake[0].y === rowIndex;
              
              return (
                <div 
                  key={`${rowIndex}-${colIndex}`} 
                  className={`board-cell ${isWall ? 'wall' : ''} ${isObstacle ? 'obstacle' : ''}`}
                >
                  {isSnakeHead && (
                    <div 
                      className="snake-head" 
                      style={{
                        transform: `rotate(${
                          direction === 'UP' ? '270deg' : 
                          direction === 'DOWN' ? '90deg' : 
                          direction === 'LEFT' ? '180deg' : 
                          '0deg'
                        })`
                      }}
                    />
                  )}
                  {isSnakeBody && (
                    <div className="snake-body" />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function getBoardStyleName(style) {
  const styles = [
    'Gapped Border',
    'Circular',
    'Maze',
    'Blob'
  ];
  return styles[style] || 'Standard';
}

// Function to generate a randomized board with walls and obstacles
function generateBoardMap(width, height, forcedStyle = null) {
  // Initialize an empty board (0 = empty, 1 = wall, 2 = obstacle)
  const board = Array(height).fill().map(() => Array(width).fill(0));
  
  // Choose random border style (several options) or use forced style
  const boardStyle = forcedStyle !== null ? forcedStyle : Math.floor(Math.random() * 4);
  
  // Generate border walls for a more interesting shape
  const makeRandomBorders = () => {
    switch (boardStyle) {
      case 0: // Standard border with random gaps
        // Create an array to track gaps for horizontal and vertical borders
        const topGaps = [];
        const leftGaps = [];
        
        // Top and bottom borders with matching gaps
        for (let x = 0; x < width; x++) {
          const hasGap = Math.random() > 0.8; // 20% chance of gap
          if (hasGap) {
            topGaps.push(x); // Record gap position
          } else {
            board[0][x] = 1; // Top wall
            board[height-1][x] = 1; // Bottom wall - same position
          }
        }
        
        // Make sure gaps exist on bottom side to match top
        for (let x of topGaps) {
          // Keep these positions as gaps (0)
          board[0][x] = 0;
          board[height-1][x] = 0;
        }
        
        // Left and right borders with matching gaps
        for (let y = 0; y < height; y++) {
          const hasGap = Math.random() > 0.8; // 20% chance of gap
          if (hasGap) {
            leftGaps.push(y); // Record gap position
          } else {
            board[y][0] = 1; // Left wall
            board[y][width-1] = 1; // Right wall - same position
          }
        }
        
        // Make sure gaps exist on right side to match left
        for (let y of leftGaps) {
          // Keep these positions as gaps (0)
          board[y][0] = 0;
          board[y][width-1] = 0;
        }
        break;
      
      case 1: // Circular arena
        const centerX = Math.floor(width / 2);
        const centerY = Math.floor(height / 2);
        const radiusX = Math.floor(width * 0.45);
        const radiusY = Math.floor(height * 0.45);
        
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            // Elliptical equation to check if point is outside the arena
            const distance = Math.pow((x - centerX) / radiusX, 2) + Math.pow((y - centerY) / radiusY, 2);
            if (distance > 1) {
              board[y][x] = 1;
            }
          }
        }
        break;
      
      case 2: // Maze-like pattern - ensure passages align for wrap-around
        // Simple maze-like pattern with matched openings
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            if (x % 8 === 0 && y % 8 === 0) {
              const length = 3 + Math.floor(Math.random() * 3);
              const isHorizontal = Math.random() > 0.5;
              
              // Don't place walls at edges to ensure there's always a passage
              if ((isHorizontal && (y === 0 || y === height-1)) || 
                  (!isHorizontal && (x === 0 || x === width-1))) {
                continue;
              }
              
              for (let i = 0; i < length; i++) {
                const newX = isHorizontal ? x + i : x;
                const newY = isHorizontal ? y : y + i;
                
                if (newX < width && newY < height) {
                  board[newY][newX] = 1;
                }
              }
            }
          }
        }
        break;
      
      case 3: // Random blobs - modify to avoid complete edge blockages
        // Create several random blob-like structures
        const numBlobs = 3 + Math.floor(Math.random() * 3);
        
        // Create a set of blocked edge positions to ensure matching gaps
        const blockedEdgePositions = {
          top: new Set(),
          bottom: new Set(),
          left: new Set(),
          right: new Set()
        };
        
        for (let blob = 0; blob < numBlobs; blob++) {
          // Keep blobs away from edges
          const edgeMargin = 3;
          const blobX = edgeMargin + Math.floor(Math.random() * (width - 2 * edgeMargin));
          const blobY = edgeMargin + Math.floor(Math.random() * (height - 2 * edgeMargin));
          const blobSize = 3 + Math.floor(Math.random() * 5);
          
          for (let y = -blobSize; y <= blobSize; y++) {
            for (let x = -blobSize; x <= blobSize; x++) {
              const distance = Math.sqrt(x*x + y*y);
              if (distance <= blobSize * Math.random()) {
                const newX = blobX + x;
                const newY = blobY + y;
                
                if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
                  board[newY][newX] = 1;
                  
                  // Track if we're blocking an edge
                  if (newY === 0) blockedEdgePositions.top.add(newX);
                  if (newY === height-1) blockedEdgePositions.bottom.add(newX);
                  if (newX === 0) blockedEdgePositions.left.add(newY);
                  if (newX === width-1) blockedEdgePositions.right.add(newY);
                }
              }
            }
          }
        }
        
        // Ensure matching gaps on opposite edges
        for (let x = 0; x < width; x++) {
          if (blockedEdgePositions.top.has(x)) {
            board[height-1][x] = 1; // Block bottom to match top
          } else if (blockedEdgePositions.bottom.has(x)) {
            board[0][x] = 1; // Block top to match bottom
          }
        }
        
        for (let y = 0; y < height; y++) {
          if (blockedEdgePositions.left.has(y)) {
            board[y][width-1] = 1; // Block right to match left
          } else if (blockedEdgePositions.right.has(y)) {
            board[y][0] = 1; // Block left to match right
          }
        }
        
        // Ensure at least one gap on each side
        ensureGaps(board, width, height);
        break;
      
      default:
        // No walls
        break;
    }
  };
  
  // Helper function to ensure there's at least one gap on each side
  const ensureGaps = (board, width, height) => {
    let hasTopGap = false;
    let hasBottomGap = false;
    let hasLeftGap = false;
    let hasRightGap = false;
    
    // Check if there are gaps
    for (let x = 0; x < width; x++) {
      if (board[0][x] === 0) hasTopGap = true;
      if (board[height-1][x] === 0) hasBottomGap = true;
    }
    
    for (let y = 0; y < height; y++) {
      if (board[y][0] === 0) hasLeftGap = true;
      if (board[y][width-1] === 0) hasRightGap = true;
    }
    
    // Create a gap in the middle if none exists
    const midX = Math.floor(width / 2);
    const midY = Math.floor(height / 2);
    
    if (!hasTopGap) {
      board[0][midX] = 0;
      board[height-1][midX] = 0; // Matching gap
    }
    
    if (!hasBottomGap) {
      board[height-1][midX] = 0;
      board[0][midX] = 0; // Matching gap
    }
    
    if (!hasLeftGap) {
      board[midY][0] = 0;
      board[midY][width-1] = 0; // Matching gap
    }
    
    if (!hasRightGap) {
      board[midY][width-1] = 0;
      board[midY][0] = 0; // Matching gap
    }
    
    // Special handling for circular mode (boardStyle 1)
    // Clear walls near gaps to prevent immediate collisions after wrap-around
    if (boardStyle === 1) {
      // Check and clear walls near left edge gaps
      for (let y = 0; y < height; y++) {
        if (board[y][0] === 0) { // If there's a gap on the left edge
          // Clear any walls in the first few columns
          for (let x = 1; x < 4; x++) {
            if (x < width) board[y][x] = 0;
          }
          
          // Also clear walls on the right edge at the same position
          for (let x = width - 4; x < width; x++) {
            if (x >= 0) board[y][x] = 0;
          }
        }
      }
      
      // Check and clear walls near right edge gaps
      for (let y = 0; y < height; y++) {
        if (board[y][width-1] === 0) { // If there's a gap on the right edge
          // Clear any walls in the last few columns
          for (let x = width - 4; x < width - 1; x++) {
            if (x >= 0) board[y][x] = 0;
          }
          
          // Also clear walls on the left edge at the same position
          for (let x = 0; x < 3; x++) {
            if (x < width) board[y][x] = 0;
          }
        }
      }
      
      // Similar checks for top and bottom edges
      for (let x = 0; x < width; x++) {
        if (board[0][x] === 0) { // If there's a gap on the top edge
          // Clear any walls in the first few rows
          for (let y = 1; y < 4; y++) {
            if (y < height) board[y][x] = 0;
          }
          
          // Also clear walls on the bottom edge at the same position
          for (let y = height - 4; y < height; y++) {
            if (y >= 0) board[y][x] = 0;
          }
        }
        
        if (board[height-1][x] === 0) { // If there's a gap on the bottom edge
          // Clear any walls in the last few rows
          for (let y = height - 4; y < height - 1; y++) {
            if (y >= 0) board[y][x] = 0;
          }
          
          // Also clear walls on the top edge at the same position
          for (let y = 0; y < 3; y++) {
            if (y < height) board[y][x] = 0;
          }
        }
      }
    }
  };
  
  // Generate obstacles with consistent patterns based on board style
  const addObstacles = () => {
    // Use a fixed seed based on board style for consistent obstacle patterns
    // within the same board style
    const seed = boardStyle * 1000;
    let pseudoRandom = (num) => {
      return ((num * 9301 + 49297) % 233280) / 233280;
    };
    
    // Different obstacle counts and patterns for each board style
    let obstacleCount;
    switch (boardStyle) {
      case 0: // Gapped Border - medium obstacles
        obstacleCount = Math.floor(width * height * 0.025); // 2.5% of the board
        break;
      case 1: // Circular - medium-high obstacles
        obstacleCount = Math.floor(width * height * 0.03); // 3% of the board
        break;
      case 2: // Maze - fewer obstacles (already has maze walls)
        obstacleCount = Math.floor(width * height * 0.015); // 1.5% of the board
        break;
      case 3: // Blob - most obstacles
        obstacleCount = Math.floor(width * height * 0.035); // 3.5% of the board
        break;
      default:
        obstacleCount = Math.floor(width * height * 0.025); // 2.5% default
    }
    
    // Divide the board into sectors for more even distribution
    const sectorsX = 8; // Number of horizontal sectors
    const sectorsY = 5; // Number of vertical sectors
    const sectorWidth = width / sectorsX;
    const sectorHeight = height / sectorsY;
    
    // Calculate obstacles per sector (approximately)
    const obstaclesPerSector = Math.ceil(obstacleCount / (sectorsX * sectorsY));
    
    // Keep track of placed obstacles
    let placedObstacles = 0;
    
    // Place obstacles sector by sector
    for (let sY = 0; sY < sectorsY; sY++) {
      for (let sX = 0; sX < sectorsX; sX++) {
        // Calculate sector boundaries
        const startX = Math.floor(sX * sectorWidth);
        const endX = Math.floor((sX + 1) * sectorWidth);
        const startY = Math.floor(sY * sectorHeight);
        const endY = Math.floor((sY + 1) * sectorHeight);
        
        // Skip center sector (for starting area)
        const isCenterSectorX = sX === Math.floor(sectorsX / 2) || sX === Math.floor(sectorsX / 2) - 1;
        const isCenterSectorY = sY === Math.floor(sectorsY / 2) || sY === Math.floor(sectorsY / 2) - 1;
        if (isCenterSectorX && isCenterSectorY) continue;
        
        // Place obstacles in this sector
        for (let i = 0; i < obstaclesPerSector; i++) {
          if (placedObstacles >= obstacleCount) break;
          
          // Generate position within this sector
          const sectorSeed = seed + (sY * sectorsX + sX) * 1000 + i * 100;
          const randomX = pseudoRandom(sectorSeed);
          const randomY = pseudoRandom(sectorSeed + 50);
          
          const obstacleX = Math.floor(startX + randomX * (endX - startX));
          const obstacleY = Math.floor(startY + randomY * (endY - startY));
          
          // Don't place obstacles on walls or near the center (starting position)
          const centerX = Math.floor(width / 2);
          const centerY = Math.floor(height / 2);
          const distanceFromCenter = Math.sqrt(Math.pow(obstacleX - centerX, 2) + Math.pow(obstacleY - centerY, 2));
          
          if (board[obstacleY]?.[obstacleX] === 0 && distanceFromCenter > 6) {
            board[obstacleY][obstacleX] = 2;
            placedObstacles++;
          }
        }
      }
    }
    
    // If we didn't place enough obstacles due to constraints, try to place more randomly
    if (placedObstacles < obstacleCount * 0.8) {
      for (let i = 0; i < obstacleCount - placedObstacles; i++) {
        const randomSeed = seed + 10000 + i * 200;
        const obstacleX = Math.floor(pseudoRandom(randomSeed) * width);
        const obstacleY = Math.floor(pseudoRandom(randomSeed + 100) * height);
        
        const centerX = Math.floor(width / 2);
        const centerY = Math.floor(height / 2);
        const distanceFromCenter = Math.sqrt(Math.pow(obstacleX - centerX, 2) + Math.pow(obstacleY - centerY, 2));
        
        if (board[obstacleY]?.[obstacleX] === 0 && distanceFromCenter > 6) {
          board[obstacleY][obstacleX] = 2;
        }
      }
    }
  };
  
  // Generate the board
  makeRandomBorders();
  
  // Ensure gaps are always available on all sides
  ensureGaps(board, width, height);
  
  // Now add obstacles
  addObstacles();
  
  return { board, boardStyle };
}

export default App;

