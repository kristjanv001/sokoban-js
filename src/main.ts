import "./style.css";
// import { setupGame } from "./game";
// import { setupCounter } from "./counter.ts";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div >

  </div>
`;

// setupCounter(document.querySelector<HTMLButtonElement>("#counter")!);
// setupGame(document.querySelector<HTMLButtonElement>("#counter")!);
// <button id="counter" type="button"></button>



let vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty('--vh', `${vh}`);
