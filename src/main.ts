import "./style.css";
// import { setupGame } from "./game";
// document.getElementById("game")!.innerHTML = `<div class="h-full"></div>`;

const charMap: { [key: string]: string } = {
  "#": "bg-gray-400", // wall
  "@": "bg-blue-200 rounded-full", // player
  "+": "bg-blue-200 rounded-full", // player on goal
  $: "bg-yellow-900", // box
  "*": "bg-yellow-300", // box on goal
  ".": "bg-green-600", // goal
  " ": "bg-stone-300", // floor
};

class Level {
  levelNum: number;
  levelPlan: string[][];

  constructor(levelPlan: string, levelNum: number) {
    this.levelPlan = levelPlan.split("\n").map((row) => [...row]);
    this.levelNum = levelNum;
  }
}

class Game {
  currentLevel: number = 1;
  moves: number = 0;
  playerPos: any;
  levels: Level[] = [];

  constructor(levelsFile: string) {
    this.setupGame(levelsFile);
  }

  async setupGame(levelsFile: string): Promise<void> {
    try {
      this.levels = await this.parseLevelsFile(levelsFile);
      this.loadLevel(this.levels[1])

    } catch (error) {
      console.error("Error setting up game:", error);
    }
  }

  async parseLevelsFile(levelsFile: string): Promise<Level[]> {
    try {
      const response = await fetch(levelsFile);
      const levelsStr = await response.text();
      const levelsSections = levelsStr.trim().split(/\n\s*\n/);

      return levelsSections.map((section) => {
        const lines = section.split("\n");
        const levelNum = parseInt(lines[0].replace("Level", "").trim());
        const levelPlanLines = lines.slice(1).filter((line) => /^[ #]/.test(line));
        const levelPlan = levelPlanLines.join("\n");

        return new Level(levelPlan, levelNum);
      });
    } catch (error) {
      console.error("Error parsing levels:", error);

      return [];
    }
  }

  loadLevel(l: Level) {
    const level = l.levelPlan;

    const gameContainer = document.getElementById("game")!;
    const board = document.createElement("div");
    board.className = "grid justify-center";

    for (let row = 0; row < level.length; row++) {
      const rowElem = document.createElement("div");
      rowElem.className = "flex";

      for (let col = 0; col < level[row].length; col++) {
        const currItem = level[row][col];
        const gridItem = document.createElement("div");
        gridItem.className = `${charMap[currItem]} h-5 w-5 xs:h-7 xs:w-7 sm:w-9 sm:h-9 md:w-11 md:h-11 lg:w-14 lg:h-14  flex justify-center items-center`;

        const char = document.createElement("span");
        char.textContent = currItem;
        gridItem.appendChild(char);

        rowElem.appendChild(gridItem);
      }

      board.appendChild(rowElem);
    }

    gameContainer.appendChild(board);
  }
}


const game1 = new Game("levels.txt")


document.getElementById("reset-btn")!.addEventListener("click", () => console.log("reset..."));

// setupCounter(document.querySelector<HTMLButtonElement>("#counter")!);
// <button id="counter" type="button"></button>

let vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty("--vh", `${vh}`);
