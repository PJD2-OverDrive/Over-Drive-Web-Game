import Phaser from "phaser";

export class HelloWorldScene extends Phaser.Scene {
  private hello!: Phaser.GameObjects.Text;

  constructor() {
    super("hello-world");
  }

  create(): void {
    this.hello = this.add
      .text(0, 0, "Hello World", {
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "48px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.layout();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    });
  }

  private layout(): void {
    this.hello.setPosition(this.scale.width / 2, this.scale.height / 2);
  }
}
