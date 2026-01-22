const { scrapeJobs, getJobDetails } = require('./services/scraper');
require('dotenv').config();

async function runTest() {
    console.log('--- Testing Search Scraper ---');
    const filters = {
        keyword: 'Software Engineer',
        location: 'Central',
        salaryRange: '30000-60000'
    };

    try {
        const results = await scrapeJobs(filters);
        console.log(`Found ${results.length} jobs.`);
        console.log('Sample Job:', JSON.stringify(results[0], null, 2));

        if (results.length > 0 && results[0].link !== '#') {
            console.log('\n--- Testing Detail Scraper ---');
            const details = await getJobDetails(results[0].link);
            console.log('Successfully retrieved detailed job info:');
            console.log(`Title: ${details.title}`);
            console.log(`Company: ${details.company}`);
            console.log(`Description Snippet: ${details.descriptionText.substring(0, 200)}...`);
        }
    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

runTest();
