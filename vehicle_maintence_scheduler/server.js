const express = require("express");
const { runScheduler } = require("./index");
const { loggingMiddleware, log } = require("../logging middleware/logger");

const app = express();

app.use(express.json());
app.use(loggingMiddleware);

app.get("/", async (req, res) => {
  try {
    await req.log("backend", "info", "route", "Root API endpoint accessed");
  } catch (err) {
    console.error("Failed to log root access:", err.message);
  }
  res.json({ message: "Vehicle Maintenance Scheduler API Running" });
});

app.post("/schedule", async (req, res) => {
  try {
    await req.log("backend", "info", "route", "POST /schedule request received");
    const result = await runScheduler();
    await req.log("backend", "info", "route", "POST /schedule completed successfully");
    res.json(result);
  } catch (err) {
    try {
      await req.log("backend", "error", "route", `POST /schedule failed: ${err.message}`);
    } catch (logErr) {
      //   console.error("Failed to log scheduler error:", logErr.message);
    }
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, async () => {
  console.log("Server running on port 3000");
  try {
    await log("backend", "info", "service", "Server started on port 3000");
  } catch (err) {
    console.error("Failed to log server start:", err.message);
  }
});