import Phaser from "phaser";

class HelloWorldScene extends Phaser.Scene {
  create(): void {
    this.add
      .text(400, 300, "Hello World", {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "48px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#05070d",
  parent: "game",
  scene: HelloWorldScene,
});
