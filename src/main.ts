import "./style.css";

type Position = [number, number];

const defaultGridStyles = "h-9 w-9 xs:h-12 xs:w-12 sm:w-14 sm:h-14 md:w-18 md:h-18 flex justify-center items-center";
const charMap: { [key: string]: string } = {
  // WALL
  "#": "bg-gray-600 border-8 border-gray-700 rounded-md scale-[0.98]",
  // PLAYER
  "@": "bg-blue-600 rounded-full scale-75 -hue-rotate-60",
  // PLAYER ON GOAL
  "+": "bg-blue-600 rounded-full scale-75",
  // BOX
  $: "bg-yellow-800 rounded-md scale-[0.85] border-8 border-yellow-900",
  // BOX ON GOAL
  "*": "bg-yellow-700 rounded-md scale-[0.85] border-8 border-yellow-600",
  // GOAL
  ".": "bg-yellow-600 scale-[0.3] rounded-md",
  // FLOOR
  " ": "bg-neutral-800",
  //
  "9": "bg-red-600",
};

class Player {
  position: Position;

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

class Level {
  player!: Player;
  levelNum: number;
  levelPlan: string[][];
  moves: number;

  constructor(levelPlan: string[][], levelNum: number) {
    this.levelPlan = levelPlan;
    this.levelNum = levelNum;
    this.moves = 0;
  }

  /**
   * Iterates over the level plan and removes the player char from the 2d array.
   * And replaces it with a floor or goal char instead.
   * Because we store the player's pos as instance prop instead.
   * Then we render the player based on that pos.
   */
  initializePlayer(): void {
    for (let row = 0; row < this.levelPlan.length; row++) {
      for (let col = 0; col < this.levelPlan[row].length; col++) {
        let currItem = this.levelPlan[row][col];

        switch (currItem) {
          case "@": // player
            this.player = new Player([row, col]);
            this.levelPlan[row][col] = " ";
            break;
          case "+": // player on goal
            this.player = new Player([row, col]);
            this.levelPlan[row][col] = ".";
            break;
        }
      }
    }
  }

  /**
   * Renders moving parts such as the player and boxes.
   */
  render(): void {
    /**
     * Re-writes the cell styles
     * @param {Position} pos - [row, col] of the cell (HTML element) we want to update.
     * Every grid cell (HTML element) has a id of "cell-<row>-<col>" attached to it.
     * @param {string} charKey - Which' element styles we want to give the cell.
     */
    const updateCell = (pos: Position, charKey: string) => {
      // grab the cell we want to update
      const cell = document.getElementById(`cell-${pos[0]}-${pos[1]}`);

      if (cell) {
        cell.className = `${defaultGridStyles} ${charMap[charKey]}`;
      }
    };

    for (let row = this.player.pos[0] - 1; row <= this.player.pos[0] + 1; row++) {
      for (let col = this.player.pos[1] - 1; col <= this.player.pos[1] + 1; col++) {
        const currItem = this.levelPlan[row][col];

        const gridItem = document.getElementById(`cell-${row}-${col}`);
        if (gridItem && currItem !== "#") {
          gridItem.className = `${charMap[currItem]} ${defaultGridStyles}`;
        }
      }
    }

    // set new pos for player
    updateCell(this.player.pos, "@");
  }

  /**
   * Generates HTML of the level grid and adds it to the DOM.
   * @param {string} id - Id of the HTML element where to draw the level grid.
   */
  draw(id: string) {
    const gameContainer = document.getElementById(id);

    if (!gameContainer) {
      console.error(`element with an id of '${id}' not found.`);

      return;
    }

    gameContainer.innerHTML = "";

    const board = document.createElement("div");
    // board.className = "";

    for (let row = 0; row < this.levelPlan.length; row++) {
      const rowElem = document.createElement("div");
      rowElem.className = "flex";

      for (let col = 0; col < this.levelPlan[row].length; col++) {
        const currItem = this.levelPlan[row][col];

        const gridItem = document.createElement("div");
        gridItem.className = `${charMap[currItem]} ${defaultGridStyles}`;
        gridItem.id = `cell-${row}-${col}`;

        rowElem.appendChild(gridItem);
      }

      board.appendChild(rowElem);
    }

    gameContainer.appendChild(board);

    console.log("initial level drawn to the screen");
  }

  /**
   * Handles movement logic such as collision detection and updating position state.
   * @param {string} direction - keyboard event code such as "ArrowUp"
   */
  movePlayer(direction: string): boolean {
    let [newRow, newCol] = this.player.pos;

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

    if (this.isValidMove([newRow, newCol], direction)) {
      // logic for boxes as well

      if (this.levelPlan[newRow][newCol] === "$" || this.levelPlan[newRow][newCol] === "*") {
        console.log("moving a box...");

        switch (direction) {
          case "ArrowUp":
            break;
          case "ArrowDown":
            break;
          case "ArrowLeft":
            break;
          case "ArrowRight":
            this.levelPlan[newRow][newCol] = ".";
            this.levelPlan[newRow][newCol + 1] = "$";
            break;
        }
      }

      this.player.pos = [newRow, newCol];

      return true;
    }

    return false;
  }

  /**
   * Checks for the requested move's validity. Can't move over boxes and through walls.
   * Checks if box can be pushed
   */
  isValidMove(newPos: Position, direction: string): boolean {
    const [newRow, newCol] = newPos;

    // check for a wall
    if (this.levelPlan[newRow][newCol] === "#") {
      return false;
    }

    let nextRow = newRow;
    let nextCol = newCol;
    switch (direction) {
      case "ArrowUp":
        nextRow--;
        break;
      case "ArrowDown":
        nextRow++;
        break;
      case "ArrowLeft":
        nextCol--;
        break;
      case "ArrowRight":
        nextCol++;
        break;
    }

    // check for a box, user tries to push a box
    const newCell = this.levelPlan[newRow][newCol];
    if (newCell === "$" || newCell === "*") {
      const nextCell = this.levelPlan[nextRow][nextCol];
      // check for a box/wall behind that box
      if (nextCell === "$" || nextCell === "#" || nextCell === "*") {
        return false;
      }
    }

    return true;
  }
}

class Game {
  startLevel = 1;
  currentLevel = this.startLevel;
  levels: Level[] = [];

  constructor(levelsFile: string) {
    this.setupGame(levelsFile);
  }

  /**
   * Sets up the game with the first level.
   * @param {string} levelsFile - File name of a txt file that contains level data
   */
  async setupGame(levelsFile: string): Promise<void> {
    try {
      this.levels = await this.parseLevelsFile(levelsFile);

      const level = this.levels[this.currentLevel - 1];

      // move these calls to loadLevel() in the Game class
      level.initializePlayer();
      level.draw("game");
      level.render();

      document.body.addEventListener("keydown", (event) => {
        this.handleKeyDown(level, event);
      });

      console.log("all game set up done, current level is: ", level);
    } catch (error) {
      console.error("Error setting up game:", error);
    }
  }

  /**
   * What happens when the user presses a key?
   * If the move was a success (the levelPlan state was changed),
   * then render the grid based on that new state.
   * @param {Level} level - Level obj
   * @param {KeyboardEvent} event - Such as "ArrowUp"
   */
  handleKeyDown(level: Level, event: KeyboardEvent): void {
    const keyPress = event.code;

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(keyPress)) {
      const moveSuccessful = level.movePlayer(keyPress);

      if (moveSuccessful) {
        level.render();
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
}

new Game("microcosmos.txt");
