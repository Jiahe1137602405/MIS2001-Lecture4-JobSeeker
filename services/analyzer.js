const axios = require('axios');

/**
 * Analyzes user input to extract structured search filters.
 */
async function analyzePreferences(userMessage) {
    try {
        const response = await axios.post(process.env.AI_API_ENDPOINT, {
            model: 'gpt-4.1-nano',
            messages: [
                {
                    role: 'system',
                    content: `You are a Job Search Keyword Expert. Analyze the user's job preferences and extract search-friendly parameters for JobsDB.
                    Return ONLY a JSON object with: 
                    - keyword: (Optimized job title/keywords)
                    - location: (Specific HK district or area)
                    - industry: (Job classification)
                    - salaryRange: (Formatted as "min-max" or just "min" if applicable)`
                },
                { role: 'user', content: userMessage }
            ],
            response_format: { type: "json_object" }
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.AI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const result = JSON.parse(response.data.choices[0].message.content);
        console.log('AI Analysis Result:', result);
        return result;
    } catch (error) {
        console.error('Analyzer Error:', error.message);
        // Fallback to basic extraction
        return { keyword: userMessage, location: 'Hong Kong' };
    }
}

module.exports = { analyzePreferences };
