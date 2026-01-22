const axios = require('axios');

/**
 * Provides personalized career advice and market analysis based on job data.
 */
async function provideAdvice(jobs, userRequest) {
    try {
        const jobsContent = jobs.map((j, index) => `
            JOB #${index + 1}:
            TITLE: ${j.title}
            COMPANY: ${j.company}
            LOCATION: ${j.location}
            SALARY: ${j.salary}
            URL: ${j.link}
            DESCRIPTION SNIPPET: ${j.description?.substring(0, 1000)}
        `).join('\n---\n');

        const response = await axios.post(process.env.AI_API_ENDPOINT, {
            model: 'gpt-4.1-nano',
            messages: [
                {
                    role: 'system',
                    content: `You are a Senior Career Coach and Market Analyst. 
                    Based on the provided job listings:
                    1. Summarize the key requirements (Education, Years of Experience, specific Tech Stack).
                    2. List the top 5 essential skills needed for these roles.
                    3. Provide 3-5 concrete suggestions on how the user should prepare (e.g., certifications, projects, interview focus).
                    4. Finally, list 2-3 "Recommended Jobs" from the list with their Title, Company, and URL.`
                },
                { role: 'user', content: `Target Career Path: ${userRequest}\n\nAvailable Jobs:\n${jobsContent}` }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.AI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Advisor Error:', error.message);
        return "I'm currently unable to provide deep market analysis, but based on these listings, you should focus on your technical skills for these roles.";
    }
}

module.exports = { provideAdvice };
