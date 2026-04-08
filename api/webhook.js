export default async function handler(req, res) {

  // ✅ Health check (Gupshup validation)
  if (req.method === "GET") {
    return res.status(200).send("Webhook is live ✅");
  }

  if (req.method === "POST") {
    try {
      console.log("Incoming:", JSON.stringify(req.body));

      // ✅ Extract data safely from Gupshup payload
      const body = req.body || {};

      const from =
        body?.payload?.sender?.phone ||
        body?.sender?.phone ||
        "unknown";

      const message =
        body?.payload?.payload?.text ||
        body?.payload?.text ||
        "";

      // ✅ Memory (temporary)
      global.users = global.users || {};
      const users = global.users;

      if (!users[from]) {
        users[from] = {
          state: "NEW",
          context: {}
        };
      }

      const user = users[from];

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

      const context = user.context || {};

      let result;

      switch (user.state) {
        case "NEW":
          result = createResponse(
            "Hi! 😊 Can I know your child's name?",
            "ASK_CHILD_NAME",
            context
          );
          break;

        case "ASK_CHILD_NAME":
          if (intent.name) {
            result = createResponse(
              `Nice! How old is ${intent.name}?`,
              "ASK_CHILD_AGE",
              { ...context, child_name: intent.name }
            );
          } else {
            result = createResponse(
              "Please share your child's name 😊",
              "ASK_CHILD_NAME",
              context
            );
          }
          break;

        case "ASK_CHILD_AGE":
          if (intent.age) {
            result = createResponse(
              "Has your child played chess before? (Beginner / Intermediate)",
              "ASK_EXPERIENCE",
              { ...context, child_age: intent.age }
            );
          } else {
            result = createResponse(
              "Please tell me your child's age 😊",
              "ASK_CHILD_AGE",
              context
            );
          }
          break;

        case "ASK_EXPERIENCE":
          result = createResponse(
            "What would you like to improve? (Focus / Hobby / Competitive)",
            "ASK_GOAL",
            context
          );
          break;

        case "ASK_GOAL":
          result = createResponse(
            "We offer a free trial class 😊 Would you like me to book a slot?",
            "PITCH",
            context
          );
          break;

        case "PITCH":
          if (intent.booking) {
            result = createResponse(
              "Available slots: 5 PM, 6 PM. Which works for you?",
              "SHOW_SLOTS",
              context
            );
          } else {
            result = createResponse(
              "It's a free trial 😊 Shall I book a slot for you?",
              "PITCH",
              context
            );
          }
          break;

        case "SHOW_SLOTS":
          result = createResponse(
            "Done! Your trial class is booked 🎉",
            "BOOKED",
            context
          );
          break;

        default:
          result = createResponse(
            "Let's start again 😊 What is your child's name?",
            "ASK_CHILD_NAME",
            context
          );
      }

      users[from] = {
        state: result.nextState,
        context: result.newContext
      };

      // ✅ CRITICAL: Gupshup expects THIS format
      return res.status(200).json({
        type: "text",
        text: result.reply
      });

    } catch (err) {
      console.error("ERROR:", err);
      return res.status(200).send("Error handled");
    }
  }

  return res.status(405).send("Method Not Allowed");
}