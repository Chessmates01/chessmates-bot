
const express = require("express");
const app = express();

// ✅ ADD HERE
app.get("/webhook/whatsapp", (req, res) => {
  res.send("Webhook is live ✅");
});

app.use(express.json());

// Temporary user storage
const users = {};

function processMessage(user, message) {
  const createResponse = (reply, nextState, newContext) => ({
    reply,
    nextState,
    newContext
  });

  const intent = {
    booking: /(book|trial|demo|class)/i.test(message),
    name: message.match(/(?:my name is|i am|this is)?\s*([a-z]{3,})/i)?.[1],
    age: message.match(/(\d{1,2})/)?.[1]
  };

  const context = user.context || {
    child_name: null,
    child_age: null,
    experience: null,
    goal: null
  };

  switch (user.state) {

    case "NEW":
      return createResponse("Hi! 😊 Can I know your child's name?", "ASK_CHILD_NAME", context);

    case "ASK_CHILD_NAME":
      if (intent.name) {
        return createResponse(
          `Nice! How old is ${intent.name}?`,
          "ASK_CHILD_AGE",
          { ...context, child_name: intent.name }
        );
      }
      return createResponse("Please share your child's name 😊", "ASK_CHILD_NAME", context);

    case "ASK_CHILD_AGE":
      if (intent.age) {
        return createResponse(
          "Has your child played chess before? (Beginner / Intermediate)",
          "ASK_EXPERIENCE",
          { ...context, child_age: intent.age }
        );
      }
      return createResponse("Please tell me your child's age 😊", "ASK_CHILD_AGE", context);

    case "ASK_EXPERIENCE":
      return createResponse(
        "What would you like to improve? (Focus / Hobby / Competitive)",
        "ASK_GOAL",
        context
      );

    case "ASK_GOAL":
      return createResponse(
        "We offer a free trial class 😊 Would you like me to book a slot?",
        "PITCH",
        context
      );

    case "PITCH":
      if (intent.booking) {
        return createResponse(
          "Available slots: 5 PM, 6 PM. Which works for you?",
          "SHOW_SLOTS",
          context
        );
      }
      return createResponse(
        "It's a free trial 😊 Shall I book a slot for you?",
        "PITCH",
        context
      );

    case "SHOW_SLOTS":
      return createResponse("Done! Your trial class is booked 🎉", "BOOKED", context);

    default:
      return createResponse(
        "Sorry, I didn't understand. Let's start again 😊 What is your child's name?",
        "ASK_CHILD_NAME",
        context
      );
  }
}

// API route
app.post("/webhook/whatsapp", (req, res) => {
  const { from, message } = req.body;

  if (!users[from]) {
    users[from] = { state: "NEW", context: {} };
  }

  const user = users[from];

  const result = processMessage(user, message);

  users[from] = {
    state: result.nextState,
    context: result.newContext
  };

  res.json({ reply: result.reply });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});