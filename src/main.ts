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
  " ": "bg-gray-900",
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

class Floor {
  position: Position;

  constructor(position: Position) {
    this.position = position;
  }
}

class Level {
  player!: Player;
  boxes: Box[] = [];
  goals: Goal[] = [];
  floors: Floor[] = [];
  levelNum: number;
  levelPlan: string[][];
  completed = false;

  constructor(levelPlan: string[][], levelNum: number) {
    this.levelPlan = levelPlan;
    this.levelNum = levelNum;
    this.initializeElements();
  }

  /**
   * Iterates over the level plan and finds all 'moving' parts such as boxes, goals and the player.
   */
  initializeElements(): void {
    // console.log("initializing actors");
    for (let row = 0; row < this.levelPlan.length; row++) {
      for (let col = 0; col < this.levelPlan[row].length; col++) {
        const currItem = this.levelPlan[row][col];

        switch (currItem) {
          case "@": // player
            this.player = new Player([row, col]);
            this.floors.push(new Floor([row, col])); // player stands on a floor
            break;
          case "+": // player on goal
            this.player = new Player([row, col]);
            this.goals.push(new Goal([row, col]));
            break;
          case "$": // box
            this.boxes.push(new Box([row, col], false));
            break;
          case "*": // box on goal
            this.boxes.push(new Box([row, col], true));
            // this.goals.push(new Goal([row, col]));
            break;
          case ".": // goal
            this.goals.push(new Goal([row, col]));
            break;
          case " ": // floor
            this.floors.push(new Floor([row, col]));
            break;
        }
      }
    }
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
      const lvl = this.levels[this.currentLevel - 1];
      // loadLevel() --> createLevel()
      this.createLevel(lvl, "game");
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

      const moveSuccessful = this.movePlayer(keyPress, level);

      if (moveSuccessful) {
        this.render(level); // pass in also the direction?
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
   * Renders moving parts such as the player and boxes.
   * @param {Level} l - Current level object
   */
  render(l: Level): void {
    /**
     * Re-writes the cell styles
     * @param {Position} newPos - [row, col] of the cell (HTML element) we want to update.
     * Every grid cell (HTML element) has a id of "cell-<row>-<col>" attached to it.
     * @param {string} charKey - Which' element styles we want to give the cell.
     */
    const updateCell = (newPos: Position, charKey: string) => {
      // grab the cell we want to update
      const cell = document.getElementById(`cell-${newPos[0]}-${newPos[1]}`);

      if (cell) {
        cell.className = `${defaultGridStyles} ${charMap[charKey]}`;
      }
    };

    if (!l.player) {
      return;
    }

    // ⚠️ only render boxes/goals if there's interaction with them

    l.goals.forEach((goal) => updateCell(goal.position, "."));
    l.boxes.forEach((box) => (box.onGoal ? updateCell(box.position, "*") : updateCell(box.position, "$")));
    l.floors.forEach((floor) => updateCell(floor.position, " "));
    updateCell(l.player.pos, "@"); // set new pos
  }

  /**
   * Handles movement logic such as collision detection and updating position state.
   * @param {string} direction - keyboard event code such as "ArrowUp"
   * @param {Level} l - Current level object
   */
  movePlayer(direction: string, l: Level): boolean {
    // console.log("moving...");

    if (!l.player) {
      return false;
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

    if (this.isValidMove(l, [newRow, newCol], direction)) {
      l.player.pos = [newRow, newCol];
      // logic for boxes as well

      return true;
    }

    return false;
  }

  /**
   * Checks for the requested move's validity. Can't move over boxes and through walls.
   * Checks if box can be pushed
   */
  isValidMove(l: Level, newPos: Position, direction: string): boolean {
    const [row, col] = newPos;

    // use the original level plan to detect a wall
    if (l.levelPlan[row][col] === "#") {
      return false;
    }

    for (const box of l.boxes) {
      const [boxRow, boxCol] = box.position;

      // check if there's a box where the player wants to move
      if (row === boxRow && col === boxCol) {
        let nextRow = boxRow;
        let nextCol = boxCol;

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

        // check for a wall
        if (l.levelPlan[nextRow][nextCol] === "#") {
          return false;
        }

        // check for another box
        const isAnotherBox = l.boxes.some((otherBox) => {
          const [otherBoxRow, otherBoxCol] = otherBox.position;

          return nextRow === otherBoxRow && nextCol === otherBoxCol;
        });

        if (isAnotherBox) {
          return false;
        }

        return true;
      }
    }

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

        rowElem.appendChild(gridItem);
      }

      board.appendChild(rowElem);
    }

    gameContainer.appendChild(board);

    console.log("initial level created: ", l);
  }
}

new Game("microcosmos.txt");
