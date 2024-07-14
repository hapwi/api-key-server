const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");
const app = express();
require("dotenv").config(); // Load environment variables from .env

app.use(cors()); // Enable CORS for all routes

app.get("/api-keys", (req, res) => {
  const apiKey = process.env.API_KEY;
  const leaderboardSheetId = process.env.LEADERBOARD_SHEET_ID;
  const entriesSheetId = process.env.ENTRIES_SHEET_ID;
  const playersSheetId = process.env.PLAYERS_SHEET_ID;
  const formSheetId = process.env.FORM_SHEET_ID;

  res.json({
    apiKey,
    leaderboardSheetId,
    entriesSheetId,
    playersSheetId,
    formSheetId,
  });
});

app.get("/leaderboard-data", async (req, res) => {
  try {
    const sheets = google.sheets({ version: "v4", auth: process.env.API_KEY });
    const entriesSheetId = process.env.ENTRIES_SHEET_ID;
    const leaderboardSheetId = process.env.LEADERBOARD_SHEET_ID;

    const [
      entriesData,
      picksScoresData,
      leaderboardTotalScores,
      changeTrackerData,
    ] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: entriesSheetId,
        range: "Sheet1!A1:K",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: entriesSheetId,
        range: "PicksScores!A2:B1000",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: leaderboardSheetId,
        range: "CurrentLeaderboard!A1:Z",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: leaderboardSheetId,
        range: "ChangeTracker!A1:D1000",
      }),
    ]);

    const scoresMap = new Map(picksScoresData.data.values);
    const totalScoresMap = new Map(
      leaderboardTotalScores.data.values.slice(1).map((row) => [row[0], row[1]])
    );

    const changeMap = new Map(
      changeTrackerData.data.values.slice(1).map((row) => {
        const changeValue = row[3];
        if (typeof changeValue === "string" && changeValue.startsWith("+")) {
          return [row[0], parseInt(changeValue.substring(1))];
        } else {
          return [row[0], parseInt(changeValue) || 0];
        }
      })
    );

    const [, ...rows] = entriesData.data.values;

    const formattedData = rows.map((row, index) => {
      const golfers = row
        .slice(1, 7)
        .map((name) => ({
          name,
          score: scoresMap.get(name) || "-",
        }))
        .sort((a, b) => parseInt(a.score) - parseInt(b.score));

      const playerName = row[0];
      const totalScore = totalScoresMap.get(playerName) || "-";
      const change = changeMap.get(playerName) || 0;

      return {
        id: index + 1,
        user: playerName,
        totalScore,
        change,
        tiebreaker: row[7],
        golfers,
      };
    });

    const sortedData = formattedData.sort(
      (a, b) => parseInt(a.totalScore) - parseInt(b.totalScore)
    );

    // Assign positions with handling ties
    let currentPosition = 1;
    let previousTotalScore = null;
    let tieCount = 0;

    sortedData.forEach((entry, index) => {
      if (entry.totalScore !== previousTotalScore) {
        currentPosition = index + 1;
        entry.position = `T${currentPosition}`;
        tieCount = 0;
      } else {
        tieCount++;
        entry.position = `T${currentPosition}`;
      }
      previousTotalScore = entry.totalScore;
    });

    res.json(sortedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/players", async (req, res) => {
  try {
    const sheets = google.sheets({ version: "v4", auth: process.env.API_KEY });
    const playersSheetId = process.env.PLAYERS_SHEET_ID;
    const range = "Sheet1!A1:C200"; // Adjust the range as needed

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: playersSheetId,
      range: range,
    });

    const rows = response.data.values;
    if (rows.length) {
      const players = rows
        .slice(1)
        .filter((row) => row[0] && row[1] && row[2])
        .map(([name, score, imageUrl]) => ({
          name,
          score: score === "#VALUE!" || score === "0" ? "E" : score,
          imageUrl,
        }));

      res.json(players);
    } else {
      res.status(404).json({ error: "No data found." });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
