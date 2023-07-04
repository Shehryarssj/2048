import Grid from "./Grid.js";
import Tile from "./Tile.js";

const gameBoard = document.getElementById("game-board");
const modal = document.getElementById("modal");
const button = document.getElementById("close-button");
button.addEventListener("click", () => {
  modal.close();
  setupInput();
});
modal.showModal();
const grid = new Grid(gameBoard);
grid.randomEmptyCell().tile = new Tile(gameBoard, 2);
grid.randomEmptyCell().tile = new Tile(gameBoard, 2);

let touchstartX = 0;
let touchendX = 0;
let touchstartY = 0;
let touchendY = 0;

function setupInput() {
  window.addEventListener("keydown", handleInput, { once: true });
  setupTouch();
}

function setupTouch() {
  gameBoard.addEventListener(
    "touchstart",
    (e) => {
      touchstartX = e.changedTouches[0].screenX;
      touchstartY = e.changedTouches[0].screenY;
    },
    { once: true }
  );

  gameBoard.addEventListener(
    "touchend",
    (e) => {
      touchendX = e.changedTouches[0].screenX;
      touchendY = e.changedTouches[0].screenY;
      checkDirection();
    },
    { once: true }
  );
}

function checkDirection() {
  if (touchendX < touchstartX) {
    if (touchendY < touchstartY) {
      const dx = touchstartX - touchendX;
      const dy = touchstartY - touchendY;
      if (dx > dy) {
        handleInput({ key: "ArrowLeft" });
      } else {
        handleInput({ key: "ArrowUp" });
      }
    } else {
      const dx = touchstartX - touchendX;
      const dy = touchendY - touchstartY;
      if (dx > dy) {
        handleInput({ key: "ArrowLeft" });
      } else {
        handleInput({ key: "ArrowDown" });
      }
    }
  } else {
    if (touchendY < touchstartY) {
      const dx = touchendX - touchstartX;
      const dy = touchstartY - touchendY;
      if (dx > dy) {
        handleInput({ key: "ArrowRight" });
      } else {
        handleInput({ key: "ArrowUp" });
      }
    } else {
      const dx = touchstartX - touchendX;
      const dy = touchendY - touchstartY;
      if (dx > dy) {
        handleInput({ key: "ArrowRight" });
      } else {
        handleInput({ key: "ArrowDown" });
      }
    }
  }
}

async function handleInput(e) {
  switch (e.key) {
    case "ArrowUp":
      if (!canMoveUp()) {
        setupInput();
        return;
      }
      await moveUp();
      break;
    case "ArrowDown":
      if (!canMoveDown()) {
        setupInput();
        return;
      }
      await moveDown();
      break;
    case "ArrowLeft":
      if (!canMoveLeft()) {
        setupInput();
        return;
      }
      await moveLeft();
      break;
    case "ArrowRight":
      if (!canMoveRight()) {
        setupInput();
        return;
      }
      await moveRight();
      break;
    default:
      setupInput();
      return;
  }

  grid.cells.forEach((cell) => cell.mergeTiles());
  const t = new Tile(gameBoard, 2);
  grid.randomEmptyCell().tile = t;

  if (!canMoveUp() && !canMoveDown() && !canMoveLeft() && !canMoveRight()) {
    await t.waitForAnimation();
    alert("you lose");
  }
  setupInput();
}

async function moveUp() {
  await slideTiles(grid.cellsByColumn);
}

async function moveDown() {
  await slideTiles(grid.cellsByColumn.map((each) => [...each].reverse()));
}

async function moveLeft() {
  await slideTiles(grid.cellsByRow);
}

async function moveRight() {
  await slideTiles(grid.cellsByRow.map((each) => [...each].reverse()));
}

function slideTiles(cells) {
  return Promise.all(
    cells.flatMap((row) => {
      const promises = [];
      for (let i = 1; i < row.length; i++) {
        const cell = row[i];
        if (cell.tile == null) continue;
        let lastValidCell;
        for (let j = i - 1; j >= 0; j--) {
          const moveToCell = row[j];
          if (!moveToCell.canAccept(cell.tile)) break;
          lastValidCell = moveToCell;
        }
        if (lastValidCell != null) {
          promises.push(cell.tile.waitForTransition());
          if (lastValidCell.tile != null) {
            lastValidCell.mergeTile = cell.tile;
          } else {
            lastValidCell.tile = cell.tile;
          }
          cell.tile = null;
        }
      }
      return promises;
    })
  );
}

function canMoveUp() {
  return canMove(grid.cellsByColumn);
}

function canMoveDown() {
  return canMove(grid.cellsByColumn.map((each) => [...each].reverse()));
}

function canMoveLeft() {
  return canMove(grid.cellsByRow);
}

function canMoveRight() {
  return canMove(grid.cellsByRow.map((each) => [...each].reverse()));
}

function canMove(cells) {
  return cells.some((group) => {
    return group.some((cell, index) => {
      if (index === 0) return false;
      if (cell.tile == null) return false;
      const moveToCell = group[index - 1];
      return moveToCell.canAccept(cell.tile);
    });
  });
}
