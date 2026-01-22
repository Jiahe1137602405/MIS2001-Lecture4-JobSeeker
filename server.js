require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

// Modular Services
const { analyzePreferences } = require('./services/analyzer');
const { scrapeJobs } = require('./services/scraper');
const { provideAdvice } = require('./services/advisor');

const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MAIN MODULAR FLOW: Request -> Analyze -> Scrape -> Advise -> Result
app.post('/api/search', async (req, res) => {
    try {
        const { query } = req.body;
        console.log(`Processing search for: ${query}`);

        // 1. Analyze Preferences
        const filters = await analyzePreferences(query);
        console.log('Filters extracted:', filters);

        // 2. Scrape Job Data
        const jobs = await scrapeJobs(filters);
        console.log(`Found ${jobs.length} jobs.`);

        // 3. AI Career Advice
        const advice = await provideAdvice(jobs, query);

        res.json({
            filters,
            jobs,
            advice
        });
    } catch (error) {
        console.error('Core Flow Error:', error.message);
        res.status(500).json({ error: 'Failed to process your job search request.' });
    }
});

// AI Assistant Proxy (Legacy/Direct)
app.post('/api/ai/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const response = await axios.post(process.env.AI_API_ENDPOINT, {
            model: 'gpt-4.1-nano',
            messages: [
                { role: 'system', content: 'You are a career assistant for "Get Dream Jobs".' },
                { role: 'user', content: message }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.AI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        res.json({ reply: response.data.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get AI response.' });
    }
});

app.listen(port, () => {
    console.log(`"Get Dream Jobs" Server running at http://localhost:${port}`);
});
