export class ImagePrompt {
  constructor(id) {
    this.id = id;
    this.irisColor = this.getRandomIrisColor();
    this.colors = this.getRandomColors();
    this.vibe = "retrofuturistic, stylized digital glitch";
  }

  static palette = ["cyan", "magenta", "yellow", "black", "green", "pink", "red", "orange", "teal", "purple", "white"];

  text() {
    return `An image of an eyeball designed in a halftone pattern. The eyeball should be circular with dots varying in size and color to create a gradient effect, and centered for use as a PFP. The iris should be ${this.irisColor}, transitioning to ${this.renderColors} towards the outer edge. The design should have a stylized, modern look, similar to graphic arts, creating a sense of depth and slight movement with minimal colors and simple shapes. Vibe: ${this.vibe}. ${this.id}`;
  }

  get renderColors() {
    return this.colors.join("/");
  }

  getRandomIrisColor() {
    if (Math.random() < 0.9) {
      return "blue";
    } else {
      const randomIndex = Math.floor(Math.random() * this.constructor.palette.length);
      return this.constructor.palette[randomIndex];
    }
  }

  getRandomColors() {
    const shuffled = [...this.constructor.palette].sort(() => 0.5 - Math.random());
    const numColors = Math.floor(Math.random() * 5) + 2;
    return shuffled.slice(0, numColors);
  }
}