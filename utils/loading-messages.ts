export const loadingMessages = [
  // Scientific/Analysis Messages
  "Nutri-Scanning... 🔍",
  "Analyzing ingredients... 🧪",
  "Decoding the food label... 🏷️",
  "Processing product details... 📝",
  "Extracting healthy insights... 🥗",
  "Reading between the ingredients... 🔬",
  "Making sense of the nutrients... 🧮",
  "Calculating nutritional values... 🔢",

  // Fun/Quirky Messages
  "Getting smart about your snack... 🍫",
  "Doing food math (yum + yum = nutrition)... ➗",
  "Food wisdom loading... 🦉",
  "Unleashing the power of science... ⚡",

  // Technical-sounding Messages
  "Initializing nutrient analysis... 🚀",
  "Running ingredient algorithms... 💻",
  "Parsing product information... 📱",
  "Executing nutritional scan... 🔄",

  // Health-focused Messages
  "Calculating protein power... 💪",
  "Analyzing sugar levels... 🍯",
  "Evaluating dietary value... 🥗",
  "Scanning for superfoods... 🥑",

  // Fun Food-related Messages
  "Consulting the recipe books... 📚",
  "Investigating snack satisfaction... 🕊️",
  "Almost there, finalizing analysis... ✨",
  "Making healthy choices easier... 🎯",
  "Finding on OpenFoodFacts database... 🍎"
];

let randomCount = 0;

export const getRandomLoadingMessage = (): string => {
  randomCount++;
  
  if (randomCount <= 3) {
    // For first 3 calls, exclude the "Almost there" message
    const filteredMessages = loadingMessages.filter(
      msg => !msg.includes("Almost there")
    );
    const randomIndex = Math.floor(Math.random() * filteredMessages.length);
    return filteredMessages[randomIndex];
  }
  
  // After 3 calls, include all messages
  const randomIndex = Math.floor(Math.random() * loadingMessages.length);
  return loadingMessages[randomIndex];
};

// Reset counter when needed (e.g., when starting a new analysis)
export const resetLoadingMessageCounter = () => {
  randomCount = 0;
};