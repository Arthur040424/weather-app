import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/test", (req, res) => {
    res.json({ message: "Backend is running..." });
});

app.get("/api/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json(result.rows[0]);
    } catch (err) {
        console.error("DB ERROR:", err.message);
        res.status(500).json({ error: "Database Connection Failed" });
    }
});

import axios from "axios";

app.get("/api/weather", async (req, res) => {
    const city = req.query.city;

    if (!city) {
        return res.status(400).json({ error: "City is required" });
    }

    try {
        const apikey = process.env.WEATHER_API_KEY;
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apikey}`;

        const response = await axios.get(url);
        const data = response.data;

        const weather = {
            city: data.name,
            temperature: data.main.temp,
            description: data.weather[0].description,
            humidity: data.main.humidity,
            wind_speed: data.wind.speed,
            icon: data.weather[0].icon
        };

        await pool.query(
            "INSERT INTO searches (city, weather_data) VALUES ($1, $2)",
            [city, data]
        );

        res.json(weather);
    }   catch (err) {
        console.error("Weather API ERROR:", err.message);
        res.status(500).json({ error: "Failed to catch weather" });
    }
});

app.get("/api/history", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT city, weather_data, timestamp FROM searches ORDER BY timestamp DESC LIMIT 10"
        ); 

        res.json(result.rows);
    } catch (err) {
        console.error("History ERROR:", err.message);
        res.status(500).json({ error: "Failed to fetch history" });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on por ${PORT}`);
});