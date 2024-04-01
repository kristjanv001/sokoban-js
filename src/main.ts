import "./style.css";
// import { setupGame } from "./game";
// document.getElementById("game")!.innerHTML = `<div class="h-full"></div>`;
//

type Position = [number, number];

const charMap: { [key: string]: string } = {
  "#": "bg-gray-500 border-8 border-gray-600", // wall
  "@": "bg-blue-700 rounded-full scale-75", // player
  "+": "bg-blue-700 rounded-full scale-75", // player on goal
  $: "bg-yellow-700 border-8 border-yellow-800", // box
  "*": "bg-green-600 border-8 border-green-700", // box on goal
  ".": "bg-yellow-400 border-8 border-yellow-500 scale-50 animate-pulse", // goal
  " ": "bg-stone-400", // floor
};

class MovementManager {
  static move(entity: Player | Box, direction: string, level: Level) {
    let [newRow, newCol] = entity.position;
    const [oldRow, oldCol] = entity.position;

    switch (direction) {
      case "ArrowUp":
        newRow -= 1;
        break;
      case "ArrowDown":
        newRow += 1;
        break;
      case "ArrowLeft":
        newCol -= 1;
        break;
      case "ArrowRight":
        newCol += 1;
        break;
    }

    if (MovementManager.isValidMove()) {
      const oldCell = document.getElementById(`cell-${oldRow}-${oldCol}`);
      const newCell = document.getElementById(`cell-${newRow}-${newCol}`);

      console.log(oldCell, newCell);

      oldCell!.classList.remove("rounded-full", "bg-blue-700", "scale-75");

      newCell!.classList.remove("bg-stone-400");
      newCell!.classList.add("bg-blue-700", "rounded-full", "scale-75");

      entity.position = [newRow, newCol];
    }
  }

  static isValidMove(): boolean {
    return true;
  }
}

class Player {
  position: Position;
  moves = 0;

  constructor(position: Position) {
    this.position = position;
  }
}

class Box {
  position: Position;
  onGoal = false;

  constructor(position: Position, onGoal: boolean) {
    this.position = position;
    this.onGoal = onGoal;
  }
}

class Goal {
  position: Position;

  constructor(position: Position) {
    this.position = position;
  }
}

class Level {
  player: Player | null = null;
  boxes: Box[] = [];
  goals: Goal[] = [];
  levelNum: number;
  levelPlan: string[][];
  completed = false;

  constructor(levelPlan: string[][], levelNum: number) {
    this.levelPlan = levelPlan;
    this.levelNum = levelNum;
  }
}

class Game {
  startLevel = 1;
  currentLevel = this.startLevel;
  levels: Level[] = [];

  constructor(levelsFile: string) {
    this.setupGame(levelsFile);
  }

  async setupGame(levelsFile: string): Promise<void> {
    try {
      this.levels = await this.parseLevelsFile(levelsFile);
      this.createLevel(this.levels[this.startLevel - 1], "game");

      document.body.addEventListener("keydown", this.handleKeyDown.bind(this));
    } catch (error) {
      console.error("Error setting up game:", error);
    }
  }

  handleKeyDown(event: KeyboardEvent): void {
    const keyPress = event.code;
    const currentLevelIndex = this.currentLevel - 1;
    const allowedMovementKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

    if (allowedMovementKeys.includes(keyPress)) {
      const player = this.levels[currentLevelIndex].player;
      const level = this.levels[currentLevelIndex];

      if (player) {
        MovementManager.move(player, keyPress, level);
      }
    }
  }

  /**
   * Parses a txt file that contains the levels in a specific format. See: http://www.sokobano.de/wiki/index.php?title=Level_format
   * Levels are separated by an empty line
   * @param {string} levelsFile - The file name of the text file containing the levels.
   */
  async parseLevelsFile(levelsFile: string): Promise<Level[]> {
    try {
      const response = await fetch(levelsFile);
      const levelsStr = await response.text();
      const levelsSections = levelsStr.trim().split(/\n\s*\n/);

      return levelsSections.map((section) => {
        const lines = section.split("\n");

        const levelNum = parseInt(lines[0].replace("Level", "").trim());
        const levelPlanLines = lines
          .slice(1)
          .filter((line) => /^[ #]/.test(line))
          .map((line) => line.split(""));

        return new Level(levelPlanLines, levelNum);
      });
    } catch (error) {
      console.error("Error parsing levels:", error);

      return [];
    }
  }

  /**
   * Iterates over the level plan and finds all 'moving' parts such as boxes, goals and the player.
   * @param {Level} l - Current level object
   */
  initializeActors(l: Level): void {
    console.log("initializing actors");
    for (let row = 0; row < l.levelPlan.length; row++) {
      for (let col = 0; col < l.levelPlan[row].length; col++) {
        const currItem = l.levelPlan[row][col];

        switch (currItem) {
          case "@": // player
            l.player = new Player([row, col]);
            break;
          case "+": // player on goal
            l.player = new Player([row, col]);
            break;
          case "$": // box
            l.boxes.push(new Box([row, col], false));
            break;
          case "*": // box on goal
            l.boxes.push(new Box([row, col], true));
            l.goals.push(new Goal([row, col]));
            break;
          case ".": // goal
            l.goals.push(new Goal([row, col]));
            break;
        }
      }
    }
  }

  /**
   * Generates HTML of the level grid and adds it to the DOM.
   * @param {Level} l - Level object.
   * @param {string} id - Id of the HTML element where to append the whole game grid.
   */
  createLevel(l: Level, id: string) {
    const gameContainer = document.getElementById(id);

    if (!gameContainer) {
      console.error(`element with an id of '${id}' not found.`);

      return;
    }

    this.initializeActors(l);

    gameContainer.innerHTML = "";

    const board = document.createElement("div");
    board.className = "grid justify-center";

    for (let row = 0; row < l.levelPlan.length; row++) {
      const rowElem = document.createElement("div");
      rowElem.className = "flex";

      for (let col = 0; col < l.levelPlan[row].length; col++) {
        const currItem = l.levelPlan[row][col];
        const gridItem = document.createElement("div");

        gridItem.className = `${charMap[currItem]} h-5 w-5 xs:h-7 xs:w-7 sm:w-9 sm:h-9 md:w-11 md:h-11 lg:w-14 lg:h-14  flex justify-center items-center`;
        gridItem.id = `cell-${row}-${col}`;

        // const char = document.createElement("span");
        // char.textContent = currItem;
        // gridItem.appendChild(char);

        rowElem.appendChild(gridItem);
      }

      board.appendChild(rowElem);
    }

    gameContainer.appendChild(board);

    console.log(l);
  }
}

const game1 = new Game("microcosmos.txt");
document.getElementById("reset-btn")!.addEventListener("click", () => console.log("reset..."));

// setupCounter(document.querySelector<HTMLButtonElement>("#counter")!);
// <button id="counter" type="button"></button>

let vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty("--vh", `${vh}`);
