import { useState, useEffect } from "react";
import anime from "animejs";
import "./App.css";

let tiles = {
  red: {
    color: `rgb(155, 0, 0)`,
    flashColor: `rgb(255, 0, 0)`,
    beep: new Audio("/beep1.ogg"),
  },
  green: {
    color: `rgb(0, 155, 0)`,
    flashColor: `rgb(0, 255, 0)`,
    beep: new Audio("/beep2.ogg"),
  },
  blue: {
    color: `rgb(0,   0, 155)`,
    flashColor: `rgb(0,   0, 255)`,
    beep: new Audio("/beep3.ogg"),
  },
  yellow: {
    color: `rgb(155, 155,   0)`,
    flashColor: `rgb(255, 255,   0)`,
    beep: new Audio("/beep4.ogg"),
  },
};

let tilesNames = Object.keys(tiles);
let beeps = Object.values(tiles).map((tile) => tile.beep);

const randomTile = () => {
  let index = Math.floor(Math.random() * tilesNames.length);
  return tilesNames[index];
};

const randomBg = () => {
  let rgb = Array.from({ length: 3 }, () => Math.floor(Math.random() * 255));
  return `rgb(${rgb.join(",")})`;
};

const gameState = {
  bgColor: "rgb(0,0,0)",
  waitingForInput:false
}

function App() {
  const [score, setScore] = useState(0);
  const [pattern, setPattern] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);

  function start(delay) {
    setTimeout(() => {
      let pattern = [];
      for (let i = 0; i < 2; i++) {
        pattern.push(randomTile());
      }
      setPattern(pattern);
      flashBoxes(pattern, {
        onComplete() {
          console.log("done playing..");
        },
      });
    }, delay);
  }

  useEffect(() => {
    function _start() {
      if (!gameStarted) {
        start(500);
        setGameStarted(true);
      }
    }
    window.addEventListener("mousedown", _start);

    return () => {
      window.removeEventListener("mousedown", _start);
    };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted]);

  function animateTile(tileId, onComplete) {
    let tile = tiles[tileId];
    playBeep(tile.beep);
    
    let target = `.${tileId}`;
    anime({
      targets: target,
      duration: 400,
      easing: "easeInOutSine",
      keyframes: [{ background: tile.flashColor }, { background: tile.color }],
      complete: onComplete,
    });
  }

  function flashBoxes(boxes, { onComplete } = {}) {
    function flash(n = 0) {
      setTimeout(() => {
        let tileName = boxes[n];
        animateTile(tileName, () => {
          if (n < boxes.length - 1) {
            flash(n + 1);
          } else {
            gameState.waitingForInput = true;
            onComplete?.();
          }
        });
      }, 100);
    }

    flash();
  }

  function gameOverAnimation({ onComplete }) {
    beeps.forEach((beep) => {
      playBeep(beep);
    });
    anime({
      targets: ".bg",
      duration: 400,
      easing: "easeInOutSine",
      keyframes: [{ background: "rgb(255,255,255)" }, { background: gameState.bgColor }],
      loop: 3,
      complete: onComplete,
    });
  }

  function playBeep(beep) {
    if (beep) {
      beep.currentTime = 0;
      beep.play();
    }
  }

  function nextRound() {
    setScore(score + 1);
    changeBg({
      onComplete() {
        let newPattern = pattern.concat(randomTile());
        setPattern(newPattern);
        flashBoxes(newPattern);
      },
    });
  }

  function changeBg({ delay = 0, onComplete }) {
    gameState.bgColor = randomBg();
    anime({
      targets: ".bg",
      duration: 500,
      delay: delay,
      easing: "easeInOutSine",
      background: gameState.bgColor,
      complete: onComplete,
    });
  }

  let clickQueue = [];
  let started = false;
  let currentStep = 0;
  let isDone = false;
  let cancelAnyPendingClick = false

  function handleTileClick(tile) {
    if (!gameState.waitingForInput) {
      return;
    }

    if (pattern[currentStep] !== tile) {
      gameState.waitingForInput = false;
      cancelAnyPendingClick = true
      gameOverAnimation({ onComplete: restart });
      return;
    }
    clickQueue.push(tile);
    currentStep++;
    isDone = currentStep === pattern.length;

    if (isDone) {
      gameState.waitingForInput = false;
    }

    function flashClickedTiles() {
      let tile = clickQueue.shift();
      if (tile && cancelAnyPendingClick === false) {
        animateTile(tile, () => {
          flashClickedTiles();
        });
        return;
      }
      // no more clicks
      started = false;
      if (isDone) {
        nextRound();
      }
    }

    if (!started) {
      started = true;
      flashClickedTiles();
    }
  }

  function restart() {
    changeBg({
      delay: 800,
      onComplete() {
        setScore(0);
        start(800);
      },
    });
  }

  return (
    <div className="page">
      <div className="bg" />
      <div className="score-container">score: {score}</div>
      <div className="tiles-container">
        <div className="tiles">
          {Object.entries(tiles).map(([tileName, tile]) => {
            return (
              <div
                key={tileName}
                className={`tile ${tileName}`}
                style={{
                  background: tile.color,
                }}
                onClick={() => {
                  handleTileClick(tileName);
                }}
              ></div>
            );
          })}
        </div>
      </div>

      <div className="instruction">
        Match the pattern by clicking on the tiles<br />
        {gameStarted ? null : <span>tap the screen to start!</span>}
      </div>
    </div>
  );
}

export default App;
