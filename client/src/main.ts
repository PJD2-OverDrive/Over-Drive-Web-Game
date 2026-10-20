import Phaser from "phaser";
import { HelloWorldScene } from "./scenes/HelloWorldScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#05070d",
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [HelloWorldScene],
};

new Phaser.Game(config);
