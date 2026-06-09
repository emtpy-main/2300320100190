const axios = require("axios");
const { log } = require("../logging middleware/logger");

const API_BASE = "http://4.224.186.213/evaluation-service";

let cachedToken = null;

async function getAuthToken() {
    if (cachedToken) return cachedToken;
    try {
        const response = await axios.post(`${API_BASE}/auth`, {
            email: "pratik.23b0101197@abes.ac.in",
            name: "pratik singh",
            rollNo: "2300320100190",
            accessCode: "cXuqht",
            clientID: "67358dce-a428-408a-8c76-649b1b57239b",
            clientSecret: "hvueCmdHMEdrSHhm"
        });

        let token = null;
        if (response.data) {
            if (typeof response.data === "string") {
                token = response.data;
            } else {
                token = response.data.token || response.data.access_token || response.data.access_token;
            }
        }
        if (!token) {
            throw new Error("No token received in auth response");
        }
        cachedToken = token;
        console.log("Authentication successful, token obtained.");
        try {
            await log("backend", "info", "auth", "Auth token generated successfully");
        } catch (logErr) {
            // Silence logger errors to prevent recursion
        }
        return cachedToken;
    } catch (error) {
        console.error("Authentication failed:", error.response ? error.response.data : error.message);
        try {
            await log("backend", "error", "auth", `Auth failed: ${error.message}`);
        } catch (logErr) {
            // Silence logger errors
        }
        throw error;
    }
}

async function getData(endpoint) {
    const token = await getAuthToken();
    try {
        await log("backend", "info", "service", `Querying endpoint: ${endpoint}`);
    } catch (logErr) {}
    const { data } = await axios.get(`${API_BASE}/${endpoint}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return data;
}

async function runScheduler() {
    let depots = [];
    let vehicles = [];
    try {
        await log("backend", "info", "service", "Fetching depots data from evaluation service");
        const response = await getData("depots");
        depots = response.depots || [];
        // console.log("Depot data retrieved successfully.", depots);
        await log("backend", "info", "service", `Depot data retrieved successfully. Count: ${depots.length}`);
    } catch (error) {
        //  console.error("Error fetching depot data:", error.message);
        await log("backend", "error", "service", `Error fetching depot data: ${error.message}`);
    }
    try {
        await log("backend", "info", "service", "Fetching vehicles data from evaluation service");
        const response = await getData("vehicles");
        vehicles = response.vehicles || [];
        //  console.log("Vehicle data retrieved successfully.", vehicles);
        await log("backend", "info", "service", `Vehicle data retrieved successfully. Count: ${vehicles.length}`);
    } catch (error) {
        //  console.error("Error fetching vehicle data:", error.message);
        await log("backend", "error", "service", `Error fetching vehicle data: ${error.message}`);
    }


    const capacity = depots.reduce(
        (sum, depot) => sum + Number(depot.MechanicHours || 0),
        0
    );

    const n = vehicles.length;
    const dp = Array(n + 1)
        .fill()
        .map(() => Array(capacity + 1).fill(0));

    for (let i = 1; i <= n; i++) {
        const hours = Number(vehicles[i - 1].Duration);
        const impact = Number(vehicles[i - 1].Impact);

        for (let w = 0; w <= capacity; w++) {
            if (hours <= w) {
                dp[i][w] = Math.max(
                    dp[i - 1][w],
                    impact + dp[i - 1][w - hours]
                );
            } else {
                dp[i][w] = dp[i - 1][w];
            }
        }
    }

    let w = capacity;
    const selectedTasks = [];

    for (let i = n; i > 0; i--) {
        if (dp[i][w] !== dp[i - 1][w]) {
            selectedTasks.push(vehicles[i - 1].TaskID);
            w -= Number(vehicles[i - 1].Duration);
        }
    }

    selectedTasks.reverse();

    const totalHoursUsed = vehicles.reduce((sum, vehicle) => {
        return selectedTasks.includes(vehicle.TaskID)
            ? sum + Number(vehicle.Duration)
            : sum;
    }, 0);

    const result = {
        TotalImpactScore: dp[n][capacity],
        TotalHoursUsed: totalHoursUsed,
        SelectedTaskIDs: selectedTasks,
    };

    await log("backend", "info", "service", `Scheduler run completed. Total Impact Score: ${result.TotalImpactScore}, Total Hours Used: ${result.TotalHoursUsed}, Selected Tasks Count: ${selectedTasks.length}`);

    return result;
}

module.exports = { runScheduler };