// DOM REFERENCES
const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const buttonArea = document.getElementById("button-area");


// STATE
let userName = "";
let step = "askName";
let awaitingRestartConfirmation = false;
let quizIndex = 0;
let quizScore = 0;
let inQuizMode = false;

//For Quiz
const learningProgress = {
  history: false,
  parts: false,
  play: false,
  culture: false
};


// TOPIC LABELS FOR CHATBOT
const TOPIC_LABELS = {
  history: "History",
  parts: "Parts of Saung",
  play: "How to play",
  culture: "Culture",
  sound: "Sound",
  quiz: "Quiz"
};


// TYPING Speed
function typeMessage(text, sender, speed = 22) {
  return new Promise(resolve => {
    const row = document.createElement("div");
    row.className = `message-row ${sender}`;

    // Bot avatar
    if (sender === "bot") {
      const avatar = document.createElement("img");
      avatar.src = "bot-avatar.jpeg";
      avatar.className = "chat-avatar";
      row.appendChild(avatar);
    }

    // Message bubble
    const msg = document.createElement("div");
    msg.className = sender;
    msg.textContent = "";

    row.appendChild(msg);
    chatBox.appendChild(row);

    let i = 0;
    const interval = setInterval(() => {
      msg.textContent += text[i];
      i++;
      chatBox.scrollTop = chatBox.scrollHeight;

      if (i >= text.length) {
        clearInterval(interval);
        resolve();
      }
    }, speed);
  });
}



// USER MESSAGE
function addUserMessage(text) {
  const row = document.createElement("div");
  row.className = "message-row user";

  // User message bubble
  const msg = document.createElement("div");
  msg.className = "user";
  msg.textContent = text;

  // User avatar
  const avatar = document.createElement("img");
  avatar.src = "user-avatar.jpg";
  avatar.className = "chat-avatar";

  row.appendChild(msg);
  row.appendChild(avatar);

  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;
}

//TO show quiz
function allTopicsCompleted() {
  return Object.values(learningProgress).every(value => value === true);
}




// INITIAL GREETING
(async () => {
  await typeMessage("Mingalabar! How may I address you?", "bot");})();

// ===============================
// SEND MESSAGE
function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  addUserMessage(text);
  userInput.value = "";
  const lowerText = text.toLowerCase();

  // Waiting for restart confirmation
  if (awaitingRestartConfirmation) {
    if (lowerText === "yes") confirmRestart(true);
    else if (lowerText === "no") confirmRestart(false);
    else typeMessage("Please type Yes or No, or click a button.", "bot");
    return;
  }

  // Normal flow
  if (step === "askName") {
    userName = text;
    step = "chat";
    handleIntro();
  } else if (step === "chat") {
    // Check if input matches any topic
    const topicKey = Object.keys(TOPIC_LABELS).find(
      key => TOPIC_LABELS[key].toLowerCase() === lowerText
    );
    if (topicKey) {
      handleTopic(topicKey);
    } 
    else if (lowerText === "restart") {
      restartChatPrompt();
    } 
    else {
      typeMessage(
        `Sorry, I didn't understand that. Please type one of the topics or "Type/Press Restart".`,
        "bot"
      );
      showContextButtons(Object.keys(TOPIC_LABELS));
    }
  }
}


// ENTER KEY SUPPORT
userInput.addEventListener("keypress", e => {
  if (e.key === "Enter") sendMessage();
});

// ===============================
// INTRO FLOW
// ===============================
async function handleIntro() {
  await typeMessage(`Nice to meet you, ${userName}🤞`, "bot");
  await typeMessage(
    "I am here to inform you about Saung, a beautiful traditional harp instrument from Myanmar.",
    "bot"
  );
  await typeMessage("What would you like to learn first?", "bot");
  showContextButtons(["history", "parts", "play", "culture", "sound"]);
}


// CONTEXT BUTTONS
function showContextButtons(topics) {
  buttonArea.innerHTML = "";

  topics.forEach(topic => {
    const btn = document.createElement("button");
    btn.textContent = TOPIC_LABELS[topic];
    btn.onclick = () => handleTopic(topic);
    buttonArea.appendChild(btn);
  });

  // Show quiz ONLY if all learning topics completed
  if (allTopicsCompleted()) {
    const quizBtn = document.createElement("button");
    quizBtn.textContent = "🧠 Quiz";
    quizBtn.onclick = () => handleTopic("quiz");
    quizBtn.style.backgroundColor = "#00ff08ff";
    buttonArea.appendChild(quizBtn);
  }

  // Restart button (always visible)
  const restartBtn = document.createElement("button");
  restartBtn.textContent = "🔄 Restart";
  restartBtn.onclick = restartChatPrompt;
  restartBtn.style.backgroundColor = "#fa0000ff";
  restartBtn.style.color = "white";
  buttonArea.appendChild(restartBtn);
}



function createBotImage(src, width = "200px") {
  const row = document.createElement("div");
  row.className = "message-row bot";

  const avatar = document.createElement("img");
  avatar.src = "bot-avatar.jpeg";
  avatar.className = "chat-avatar";
  row.appendChild(avatar);

  const img = document.createElement("img");
  img.src = src;
  img.style.width = width;
  img.style.borderRadius = "12px";
  img.style.marginTop = "5px";
  img.style.cursor = "pointer";
  img.onclick = () => window.open(src, "_blank");

  row.appendChild(img);
  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function startQuiz() {
  inQuizMode = true;
  quizIndex = 0;
  quizScore = 0;

  buttonArea.innerHTML = "";

  await typeMessage(
    `Alright ${userName}! Let's test your knowledge about the Saung instrument`,
    "bot"
  );

  showQuizQuestion();
}

//Quiz Questions
async function showQuizQuestion() {
  buttonArea.innerHTML = "";

  const q = quizQuestions[quizIndex];

  await typeMessage(
    `Question ${quizIndex + 1}: ${q.question}`,
    "bot"
  );

  q.options.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.onclick = () => handleQuizAnswer(index);
    buttonArea.appendChild(btn);
  });
}
//Right or Wrong Answer
async function handleQuizAnswer(selectedIndex) {
  const q = quizQuestions[quizIndex];
  buttonArea.innerHTML = "";

  if (selectedIndex === q.answer) {
    quizScore++;
    await typeMessage("✅ Correct! Well done!", "bot");
  } else {
    await typeMessage("❌ That's not correct.", "bot");
    await typeMessage(
      `The correct answer is: "${q.options[q.answer]}"`,
      "bot"
    );
  }

  quizIndex++;

  if (quizIndex < quizQuestions.length) {
    await typeMessage("Let's move to the next question…", "bot");
    showQuizQuestion();
  } else {
    endQuiz();
  }
}

async function endQuiz() {
  inQuizMode = false;

  await typeMessage(
    `Quiz completed ${userName}! 🎉`,
    "bot"
  );

  await typeMessage(
    `Your score: ${quizScore} out of ${quizQuestions.length}`,
    "bot"
  );

  await typeMessage(
    "Would you like to explore another topic or restart?",
    "bot"
  );

  showContextButtons(["history", "parts", "play", "culture", "sound", "quiz"]);
}




// ===============================
// HANDLE TOPICS (SEQUENTIAL)
// ===============================
async function handleTopic(topic) {
  buttonArea.innerHTML = "";

  if (topic === "history") {
    learningProgress.history = true;
    await typeMessage(
      `${userName}, the Saung has been part of Myanmar's culture for over 1,300 years.`,
      "bot"
    );
    await typeMessage(
      `Historically, it was prominent in royal courts, played by kings and ministers, and used for courtly music.`,
      "bot"
    );
    createBotImage("saunghistory.jpg", "200px");

    await typeMessage(
      `While once exclusive to courts, it's now appreciated by the public but remains a treasured instrument often performed in smaller, intimate settings, requiring significant practice.`,
      "bot"
    );

    await typeMessage(`Would you like to explore another topic, ${userName}?`, "bot");
    showContextButtons(["parts", "play", "culture", "sound"]);
  }

  if (topic === "parts") {

    learningProgress.parts = true;
    (async () => {
      await typeMessage(
        "Below harp example image has a boat-shaped resonator with scenes from the Ramayana in gold against a black field.",
        "bot"
      );
      await typeMessage(
      "13 silk strings are fitted to gold-painted stringholder which runs the length of the gold-lacquered deerskin belly, the strings are secured to the neck with red-twisted cotton cords which used for tuning.",
      "bot"
      );
      // Display Saung image using helper
      createBotImage("saungpic.jpg", "200px");
      createBotImage("saungpic2.jpg", "200px");
  
      // Continue with next messages
      await typeMessage(
        "Each part is carefully crafted to create its gentle sound.",
        "bot"
      );
  
      await typeMessage(`What else would you like to learn ${userName}?`, "bot");
      showContextButtons(["play", "culture", "sound","history"]);
    })();
  }
  
  

  if (topic === "play") {
    learningProgress.play = true;
    await typeMessage(
      "Saung evolved from early forms of the 13 strings version to 16 strings version due to popularized within musicians in 19th century.",
      "bot"
    );
    await typeMessage(
      "The instrument is played by gently plucking the strings with the right fingers while the left hand dampen notes for staccato effects.",
      "bot"
    );
    await typeMessage(
      "The harp rests on the lap while a player sit cross-legged, allowing expressive and graceful movements.",
      "bot"
    );
    createBotImage("saungplay.jpg", "200px");

    await typeMessage(`If you would like to hear the sample sound ${userName}, press/type Sound!`, "bot");
    showContextButtons(["sound", "culture", "history","parts"]);
  }


  if (topic === "culture") {
    learningProgress.culture = true;
    await typeMessage(
      "Saung is more than an instrument — it represents Myanmar's music cultural soul due to it being national instrument.",
      "bot"
    );
    await typeMessage(
      "This instrument symbolizes artistic heritage, spiritual devotion, and continuity which often features in traditional dance, religious ceremonies like Thin Gyan(New Year).",
      "bot"
    );
    await typeMessage(
      "In the late years of the twentieth century, younger Burmese individuals demonstrated a reduced interest in understanding the cultural importance or appreciating the musical qualities of this instrument.",
      "bot"
    );
    await typeMessage(
      "Which leads to losing cultural significance piece of art of our country 😢",
      "bot"
    );
    await typeMessage(`Would you like to explore something else?, ${userName}`, "bot");
    showContextButtons(["history", "parts", "sound", "play"]);
  }

  if (topic === "sound") {
    await typeMessage(`${userName}, here is a traditional Saung sound 🎵`, "bot");

    const audio = document.createElement("audio");
    audio.src = "saung1.mp3";
    audio.controls = true;
    audio.autoplay = true;
    audio.style.marginTop = "10px";

    chatBox.appendChild(audio);
    chatBox.scrollTop = chatBox.scrollHeight;

    await typeMessage(
      "Many people tends to feel calm and peaceful listening to this melodious and enchanting sound.",
      "bot"
    );
    await typeMessage(`Do you not agree, ${userName}?`, "bot");
    showContextButtons(["sound","history", "culture", "parts", "play"]);
  }
if (allTopicsCompleted()) {
  await typeMessage(
    "Amazing! You've completed all topics. The quiz is now unlocked!",
    "bot"
  );
}
if (topic === "quiz") {
  startQuiz();
}

}

// ===============================
// RESTART CHAT
// ===============================
function confirmRestart(choice) {
  if (choice) {
    chatBox.innerHTML = "";
    buttonArea.innerHTML = "";
    userInput.value = "";
    userName = "";
    step = "askName";
    awaitingRestartConfirmation = false;

    learningProgress.history = false;
    learningProgress.parts = false;
    learningProgress.play = false;
    learningProgress.culture = false;

    quizIndex = 0;
    quizScore = 0;
    inQuizMode = false;

    typeMessage("You just restarted the chat successfully!", "bot");
    typeMessage("Mingalabar! What is your name?", "bot");
  } else {
    typeMessage("Restart cancelled. Let's continue learning!", "bot");
    awaitingRestartConfirmation = false;
    showContextButtons(Object.keys(TOPIC_LABELS));
  }
}


function restartChatPrompt() {
  if (!awaitingRestartConfirmation) {
    typeMessage(
      "Are you sure you want to restart the conversation? Type Yes or No, or click a button.",
      "bot"
    );

    buttonArea.innerHTML = "";

    const yesBtn = document.createElement("button");
    yesBtn.innerText = "Yes";
    yesBtn.onclick = () => confirmRestart(true);

    const noBtn = document.createElement("button");
    noBtn.innerText = "No";
    noBtn.onclick = () => confirmRestart(false);

    buttonArea.appendChild(yesBtn);
    buttonArea.appendChild(noBtn);

    awaitingRestartConfirmation = true;
  }
}

//Quiz TIME
const quizQuestions = [
  {
    question: "How long has the Saung been part of Myanmar's culture?",
    options: [
      "Over 300 years",
      "Over 1,300 years",
      "Over 3,000 years"
    ],
    answer: 1
  },
  {
    question: "Where was the Saung historically played?",
    options: [
      "Only in villages",
      "In royal courts",
      "Only in temples"
    ],
    answer: 1
  },
  {
    question: "What does the Saung represent in Myanmar culture?",
    options: [
      "Entertainment only",
      "Myanmar’s national musical soul",
      "Foreign influence"
    ],
    answer: 1
  },
  {
    question: "How is the Saung mainly played?",
    options: [
      "Struck with sticks",
      "Blown like a flute",
      "Plucked with fingers"
    ],
    answer: 2
  },
  {
    question: "What hand is used to dampen notes for staccato effects?",
    options: [
      "Right hand",
      "Left hand",
      "Both hands"
    ],
    answer: 1
  }
];
