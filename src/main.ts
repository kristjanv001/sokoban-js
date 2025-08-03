import "./style.css";
import autoAnimate from "@formkit/auto-animate";

type Position = [number, number];

const defaultGridStyles = "h-8 w-8 xs:h-12 xs:w-12 sm:w-14 sm:h-14 md:w-18 md:h-18 flex justify-center items-center";
const charMap: { [key: string]: string } = {
  // WALL
  // "#": "bg-gray-600 border-8 border-gray-700 rounded-md scale-[0.98]",
  "#": "bg-[url('/textures/wall2.png')] bg-cover bg-no-repeat grayscale opacity-25 rounded-md ",
  // PLAYER
  "@": "bg-blue-700 rounded-full scale-75",
  // PLAYER ON GOAL
  "+": "bg-blue-600 rounded-full scale-75",
  // BOX
  // $: "bg-yellow-800 rounded-md scale-[0.85] border-8 border-yellow-900",
  $: "bg-[url('/textures/box.png')] bg-cover bg-no-repeat opacity-70 rounded-lg scale-[0.85]",
  // BOX ON GOAL
  // "*": "bg-yellow-700 rounded-md scale-[0.85] border-8 border-yellow-600",
  "*": "bg-[url('/textures/box.png')] bg-cover bg-no-repeat rounded-lg scale-[0.85] opacity-70  bg-blend-luminosity bg-yellow-500",
  // GOAL
  // ".": "bg-yellow-600 scale-[0.3] rounded-md",
  ".": "bg-[url('/textures/goal.png')] bg-cover bg-no-repeat opacity-50 rounded-md scale-[0.5] ",
  // FLOOR
  " ": "bg-neutral-800 ",
  // " ": "bg-[url('../public/textures/floor.png')] bg-cover bg-no-repeat opacity-100",
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
  initlLevelPlan: string[][];

  constructor(levelPlan: string[][], levelNum: number) {
    this.levelPlan = levelPlan;
    this.initlLevelPlan = levelPlan.map((row) => [...row]);
    this.levelNum = levelNum;
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
        const newClass = `${defaultGridStyles} ${charMap[charKey]}`;

        if (cell.className !== newClass) {
          cell.className = `${defaultGridStyles} ${charMap[charKey]}`;
        }
      }
    };

    for (let row = this.player.pos[0] - 1; row <= this.player.pos[0] + 1; row++) {
      for (let col = this.player.pos[1] - 1; col <= this.player.pos[1] + 1; col++) {
        const currItem = this.levelPlan[row][col];

        if (currItem !== "#") {
          const gridItem = document.getElementById(`cell-${row}-${col}`)!;
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
    const prevBoard = document.getElementById("board");
    if (prevBoard) {
      prevBoard.remove();
    }

    const gameContainer = document.getElementById(id);

    if (!gameContainer) {
      console.error(`element with an id of '${id}' not found.`);

      return;
    }

    autoAnimate(gameContainer);

    const board = document.createElement("div");
    board.id = "board";

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

    const sym = this.levelPlan[newRow][newCol];
    if (this.isValidMove([newRow, newCol], direction)) {
      if (sym === "$" || sym === "*") {
        this.moveBox(newRow, newCol, direction);
      }

      this.player.pos = [newRow, newCol];

      return true;
    }

    return false;
  }

  private moveBox(row: number, col: number, direction: string): void {
    let nextRow = row;
    let nextCol = col;
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

    const origCellVal = this.levelPlan[row][col] === "*" ? "." : " ";
    const nextCellVal = this.levelPlan[nextRow][nextCol] === "." ? "*" : "$";

    this.levelPlan[nextRow][nextCol] = nextCellVal;
    this.levelPlan[row][col] = origCellVal;
  }

  /**
   * Checks for the requested move's validity. Can't move over boxes and through walls.
   * Checks if box can be pushed
   */
  private isValidMove(newPos: Position, direction: string): boolean {
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

  // TODO
  undoMove() {}

  /**
   * Checks if the level has been completed or not.
   * Level is completed when there are no regular ($) boxes left.
   */
  isCompleted(): boolean {
    return !this.levelPlan.some((row) => row.includes("$"));
  }
}

class Game {
  currentLevelIndex = 0;
  levels: Level[] = [];

  constructor(levelsFile: string) {
    this.setupGame(levelsFile);
  }

  getLevelByNum(levelNum: number): Level | Error {
    if (levelNum > 0 && levelNum < this.levels.length) {
      return this.levels[levelNum - 1];
    }
    return new Error(`Requested level ${levelNum} does not exists`);
  }

  getCurrentLevel(): Level {
    return this.levels[this.currentLevelIndex];
  }

  getCurrentLevelNum() {
    return this.currentLevelIndex + 1;
  }

  incrementLevelNum() {
    if (this.currentLevelIndex < this.levels.length) {
      this.currentLevelIndex += 1;
    }
  }

  /**
   * Sets up the game with the first level.
   * @param {string} levelsFile - File name of a txt file that contains level data
   */
  private async setupGame(levelsFile: string): Promise<void> {
    try {
      this.levels = await this.parseLevelsFile(levelsFile);
      this.loadLevel(this.getCurrentLevel());
      this.renderLevelsListDisplay();
      this.renderKeyboardHintsDisplay();
      this.renderRestartBtn();
      // this.renderUndoBtn();
      this.renderArrowButtons();

      document.addEventListener("keydown", (event) => {
        this.handleKeyDown(event);
      });
    } catch (error) {
      console.error("Error setting up game:", error);
    }
  }

  /**
   * What happens when the user presses a key?
   * If the move was a success (the levelPlan state was changed),
   * then render the grid based on that new state.
   * @param {KeyboardEvent} event - Such as "ArrowUp"
   */
  handleKeyDown(event: KeyboardEvent): void {
    const level = this.getCurrentLevel();

    if (this.isRestartKey(event)) {
      this.restartLevel();
      return;
    }

    if (this.isUndoKey(event)) {
      level.undoMove()
      return;
    }

    if (!this.isMovementKey(event.code)) {
      return;
    }

    const moveSuccessful = level.movePlayer(event.code);

    if (!moveSuccessful) {
      return;
    }

    level.render();

    if (level.isCompleted()) {
      this.processLevelCompletion();
    }
  }

  restartLevel() {
    const currentLevel = this.getCurrentLevel();
    currentLevel.levelPlan = currentLevel.initlLevelPlan.map((row) => [...row]);
    this.loadLevel(this.getCurrentLevel());
  }

  processLevelCompletion() {
    if (this.isGameCompleted()) {
      this.completeGame();
      return;
    } else {
      this.prepareNextLevel();
    }
  }

  prepareNextLevel() {
    this.incrementLevelNum();
    const nextLevel = this.getCurrentLevel();
    this.completeLevel([() => this.loadLevel(nextLevel)]);
  }

  private isMovementKey(keyPress: string): boolean {
    return ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(keyPress);
  }

  private isRestartKey(event: KeyboardEvent): boolean {
    return event.code === "KeyR" && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
  }

  private isUndoKey(event: KeyboardEvent): boolean {
    return event.code === "KeyU";
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

  loadLevel(level: Level) {
    level.initializePlayer();
    level.draw("game");
    level.render();
  }

  isGameCompleted() {
    if (this.currentLevelIndex === this.levels.length - 1) {
      return true;
    }
    return false;
  }

  completeGame() {
    setTimeout(() => {
      this.renderCompletionDisplay();
      this.updateLevelNumDisplay(this.getCurrentLevelNum());
      this.cleanUpDisplay();
      // cbs.forEach((cb) => cb());
    }, 400);
  }

  completeLevel(cbs: (() => void)[]) {
    setTimeout(() => {
      // window.alert(`Level ${this.getCurrentLevelNum() - 1} complete! 🎉`);
      this.updateLevelNumDisplay(this.getCurrentLevelNum() - 1);
      cbs.forEach((cb) => cb());
    }, 400);
  }

  renderCompletionDisplay() {
    const board = document.getElementById("board");
    board?.remove();

    const endMsg = document.createElement("h2");
    endMsg.textContent = "Congratulations, you completed the entire game ✨";
    endMsg.className = "text-3xl text-neutral-400 px-8";
    document.getElementById("game")?.appendChild(endMsg);
  }

  renderLevelsListDisplay() {
    const createAndAppendLevelNumContainer = (levelNum: number) => {
      const levelNumContainer = document.createElement("div");
      levelNumContainer.className =
        "flex h-5 w-5 md:h-7 md:w-7 lg:h-10 lg:w-10 items-center justify-center rounded-full border-2 border-neutral-500";

      if (levelNum !== this.levels.length) {
        levelNumContainer.classList.add("mr-2", "sm:mr-4");
      }

      levelNumContainer.id = `level-${levelNum}`;

      const levelNumElem = document.createElement("span");
      levelNumElem.className = "text-neutral-500";
      levelNumElem.textContent = levelNum.toString();

      levelNumContainer.appendChild(levelNumElem);

      levelsListContainer!.appendChild(levelNumContainer);
    };

    const levelsListContainer = document.getElementById("levelsList");
    autoAnimate(levelsListContainer!);

    this.levels.forEach((level, index) => {
      setTimeout(() => {
        createAndAppendLevelNumContainer(level.levelNum);
      }, index * 250);
    });
  }

  renderKeyboardHintsDisplay() {
    const container = document.getElementById("keyHints")!;
    const restartHint = document.createElement("span");
    restartHint.textContent = "Press 'R' to restart level";

    container.appendChild(restartHint);
  }

  renderRestartBtn() {
    const container = document.getElementById("game")!;
    const button = document.createElement("button");
    button.id = "restartBtn";
    button.className =
      "w-24 absolute right-4 top-4 rounded-xl bg-neutral-700 px-3 py-1 text-xs text-neutral-400 lg:hidden";
    button.textContent = "restart level";
    button.addEventListener("click", () => this.restartLevel());

    container.appendChild(button);
  }

  renderUndoBtn() {
    const container = document.getElementById("game")!;
    const button = document.createElement("button");
    button.id = "undoBtn";
    button.className =
      "w-24 absolute right-4 top-12 rounded-xl bg-neutral-700 px-3 py-1 text-xs text-neutral-400 lg:hidden";
    button.textContent = "undo move";

    // button.addEventListener("click", () => console.log("undoing..."));

    container.appendChild(button);
  }

  renderArrowButtons() {
    const btnsHTML = `
      <button id="upBtn" class="col-start-2 row-start-1 rounded-md bg-neutral-700 px-3 py-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="h-6 w-6"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75 12 3m0 0 3.75 3.75M12 3v18" />
        </svg>
      </button>
      <button id="leftBtn" class="col-start-1 row-start-2 rounded-md bg-neutral-700 px-3 py-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="h-6 w-6"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 15.75 3 12m0 0 3.75-3.75M3 12h18" />
        </svg>
      </button>
      <button id="downBtn" class="col-start-2 row-start-2 rounded-md bg-neutral-700 px-3 py-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="h-6 w-6"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25 12 21m0 0-3.75-3.75M12 21V3" />
        </svg>
      </button>
      <button id="rightBtn" class="col-start-3 row-start-2 rounded-md bg-neutral-700 px-3 py-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="h-6 w-6"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
        </svg>
      </button>`;

    const container = document.getElementById("arrowBtnContainer")!;
    container.innerHTML = btnsHTML;

    document.getElementById("upBtn")!.addEventListener("click", () => this.simulateKeyPress("ArrowUp"));
    document.getElementById("downBtn")!.addEventListener("click", () => this.simulateKeyPress("ArrowDown"));
    document.getElementById("leftBtn")!.addEventListener("click", () => this.simulateKeyPress("ArrowLeft"));
    document.getElementById("rightBtn")!.addEventListener("click", () => this.simulateKeyPress("ArrowRight"));
  }

  updateLevelNumDisplay(levelNum: number) {
    const levelNumContainer = document.getElementById(`level-${levelNum}`)!;
    levelNumContainer.classList.remove("border-neutral-500");
    levelNumContainer.classList.add("border-emerald-600", "bg-emerald-600");

    levelNumContainer.firstElementChild!.classList.remove("text-neutral-500");
    levelNumContainer.firstElementChild!.classList.add("text-black");
  }

  cleanUpDisplay() {
    document.querySelectorAll("#keyHints, #restartBtn, #undoBtn #arrowBtnContainer").forEach((elem) => {
      elem.classList.add("invisible");
    });
  }

  simulateKeyPress(keyCode: string) {
    console.log(keyCode);
    const event = new KeyboardEvent("keydown", { code: keyCode });
    document.dispatchEvent(event);
  }
}

new Game("prod.txt");
