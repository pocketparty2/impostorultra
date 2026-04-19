const WORD_PACKS = {
  "🐾 Animals": [
    { real: "Cat", impostor: "Lion" },
    { real: "Dog", impostor: "Wolf" },
    { real: "Shark", impostor: "Dolphin" }
  ],
  "🍎 Food": [
    { real: "Pizza", impostor: "Lasagna" },
    { real: "Apple", impostor: "Pear" },
    { real: "Bread", impostor: "Cake" }
  ],
  "🌍 Places": [
    { real: "Beach", impostor: "Desert" },
    { real: "City", impostor: "Town" },
    { real: "Forest", impostor: "Jungle" }
  ]
};

let enabledPacks = Object.keys(WORD_PACKS);
