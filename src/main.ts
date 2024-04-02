import "./style.css";
// import { setupGame } from "./game";
// document.getElementById("game")!.innerHTML = `<div class="h-full"></div>`;
//

type Position = [number, number];

const defaultGridStyles = "h-9 w-9 xs:h-12 xs:w-12 sm:w-14 sm:h-14 md:w-18 md:h-18 flex justify-center items-center"

const charMap: { [key: string]: string } = {
  // WALL
  "#": "bg-gray-500 border-8 border-gray-600 rounded-md scale-[0.98]",
  // PLAYER
  "@": "bg-blue-700 rounded-full scale-75",
  // PLAYER ON GOAL
  "+": "bg-blue-700 rounded-full scale-75",
  // BOX
  $: "bg-yellow-900 rounded-md scale-[0.85]",
  // BOX ON GOAL
  "*": "bg-yellow-700 rounded-md scale-[0.85]",
  // GOAL
  ".": "bg-yellow-500 scale-[0.3] rounded-md",
  // FLOOR
  " ": "bg-stone-400",
};

class Player {
  position: Position;
  moves = 0;

  constructor(position: Position) {
    this.position = position;
  }

  get pos() {
    return this.position;
  }

  set pos(newPos: Position) {
    this.position = newPos;
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
  startLevel = 3;
  currentLevel = this.startLevel;
  levels: Level[] = [];

  constructor(levelsFile: string) {
    this.setupGame(levelsFile);
  }

  /**
   * The most important method after the Game constructor (which calls this method)
   * @param {string} levelsFile - File name of a txt file that contains level data
   */
  async setupGame(levelsFile: string): Promise<void> {
    try {
      this.levels = await this.parseLevelsFile(levelsFile);
      this.createLevel(this.levels[this.currentLevel - 1], "game");
      this.initializeActors(this.levels[this.currentLevel - 1]);
      document.body.addEventListener("keydown", this.handleKeyDown.bind(this));
    } catch (error) {
      console.error("Error setting up game:", error);
    }
  }

  /**
   * What happens when the user presses a key?
   * @param {KeyboardEvent} event - Such as "ArrowUp"
   */
  handleKeyDown(event: KeyboardEvent): void {
    const keyPress = event.code;
    const currentLevelIndex = this.currentLevel - 1;

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(keyPress)) {
      const level = this.levels[currentLevelIndex];

      this.move(keyPress, level);
      this.render(level);
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
            l.goals.push(new Goal([row, col]));
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
   * TODO
   * Renders moving parts such as the player and boxes.
   * @param {Level} l - Current level object
   */
  render(l: Level): void {
    if (!l.player) {
      return;
    }

    console.log(l.player!.pos);


    for (let row = 0; row < l.levelPlan.length; row++) {
      for (let col = 0; col < l.levelPlan[row].length; col++) {
        const currItem = l.levelPlan[row][col];

        if (currItem === "@" || currItem === " ") {
          document.getElementById(`cell-${row}-${col}`)!.className = defaultGridStyles
        }
      }

    }

    l.goals.forEach((goal) => {
      const cell = document.getElementById(`cell-${goal.position[0]}-${goal.position[1]}`)
      cell!.className = `${defaultGridStyles} ${charMap['.']}`
    })


    const newCell = document.getElementById(`cell-${l.player!.pos[0]}-${l.player!.pos[1]}`);
    newCell!.className = `${defaultGridStyles} ${charMap['@']}`


  }

  /**
   * Handles movement logic such as collision detection and updating position state.
   * @param {string} direction - keyboard event code such as "ArrowUp"
   * @param {Level} l - Current level object
   */
  move(direction: string, l: Level) {
    console.log("moving...");
    if (!l.player) {
      return;
    }

    let [newRow, newCol] = l.player.pos;

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

    if (this.isValidMove()) {
      l.player.pos = [newRow, newCol];
      // logic for boxes as well
    }
  }

  /**
   * TODO
   */
  isValidMove(): boolean {
    return true;
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

    gameContainer.innerHTML = "";

    const board = document.createElement("div");
    // board.className = "";

    for (let row = 0; row < l.levelPlan.length; row++) {
      const rowElem = document.createElement("div");
      rowElem.className = "flex";

      for (let col = 0; col < l.levelPlan[row].length; col++) {
        const currItem = l.levelPlan[row][col];

        const gridItem = document.createElement("div");

        gridItem.className = `${charMap[currItem]} ${defaultGridStyles}`;

        gridItem.id = `cell-${row}-${col}`;

        // const char = document.createElement("span");
        // char.textContent = currItem;
        // char.classList.add("");
        // gridItem.appendChild(char);

        rowElem.appendChild(gridItem);
      }

      board.appendChild(rowElem);
    }

    gameContainer.appendChild(board);

    console.log("initial level created: ", l);
  }
}

const game1 = new Game("microcosmos.txt");
document.getElementById("reset-btn")!.addEventListener("click", () => console.log("reset..."));

// setupCounter(document.querySelector<HTMLButtonElement>("#counter")!);
// <button id="counter" type="button"></button>

let vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty("--vh", `${vh}`);
