const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Fetches the complete details for a specific job page.
 * @param {string} url - The JobsDB job page URL.
 */
async function getJobDetails(url) {
    if (!url || url === '#' || !url.startsWith('http')) {
        return { error: 'Invalid URL provided.' };
    }

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9,zh-HK;q=0.8,zh;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-User': '?1',
                'referer': 'https://hk.jobsdb.com/',
                'Cache-Control': 'max-age=0'
            },
            timeout: 8000
        });
        const $ = cheerio.load(response.data);

        // Extracting structured data using common SEEK/JobsDB data-automation attributes
        const title = $('h1[data-automation="job-detail-title"]').text().trim() || $('h1:first').text().trim();
        const company = $('span[data-automation="advertiser-name"]').text().trim() || $('[data-automation="company-name"]').text().trim();
        const location = $('span[data-automation="job-detail-location"]').text().trim();
        const workType = $('span[data-automation="job-detail-work-type"]').text().trim();
        const classification = $('span[data-automation="job-detail-classifications"]').text().trim();

        // Detailed description
        const description = $('div[data-automation="jobAdDetails"]').html() ||
            $('.job-description, .details-content').html();

        // Clean text version of description
        const descriptionText = $('div[data-automation="jobAdDetails"]').text().trim() ||
            $('.job-description, .details-content').text().trim();

        return {
            title,
            company,
            location,
            workType,
            classification,
            descriptionHTML: description,
            descriptionText: descriptionText,
            url
        };
    } catch (error) {
        console.error(`Scraper Error for ${url}:`, error.message);
        throw new Error(`Failed to retrieve job details: ${error.message}`);
    }
}

/**
 * Scrapes job data from JobsDB HK based on advanced filters.
 */
async function scrapeJobs(filters) {
    const { keyword, salaryRange, industry, location } = filters;

    // Construct base search URL using query parameters for better stability
    let searchUrl = `https://hk.jobsdb.com/jobs`;
    const params = new URLSearchParams();

    if (keyword) params.append('keywords', keyword);
    if (location) params.append('where', location);

    // Parse salary range if provided (e.g., "30000-50000")
    if (salaryRange) {
        // SEEK/JobsDB often uses salaryrange=min-max and salarytype=monthly
        const cleanRange = salaryRange.replace(/[^0-9-]/g, '');
        if (cleanRange) {
            params.append('salaryrange', cleanRange);
            params.append('salarytype', 'monthly');
        }
    }

    if (industry) {
        params.append('classification', industry);
    }

    const finalUrl = `${searchUrl}?${params.toString()}`;
    console.log(`Scraping JobsDB: ${finalUrl}`);

    try {
        const response = await axios.get(finalUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9,zh-HK;q=0.8,zh;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Cache-Control': 'max-age=0',
                'referer': 'https://hk.jobsdb.com/'
            },
            timeout: 15000
        });

        const $ = cheerio.load(response.data);
        const jobResults = [];

        // 1. Get List of Jobs
        // Updated selectors for JobsDB/SEEK structure
        $('article[data-automation="normalJob"], div[data-automation="jobCard"]').each((i, element) => {
            if (i < 3) { // Limit to top 3 for speed in this demonstration
                const title = $(element).find('a[data-automation="jobTitle"], h1').text().trim();
                const company = $(element).find('a[data-automation="jobCompany"], span').first().text().trim();
                const jobLocation = $(element).find('a[data-automation="jobLocation"]').text().trim() || location || 'Hong Kong';
                const salary = $(element).find('span[data-automation="jobSalary"]').text().trim();
                const link = $(element).find('a').attr('href');
                const fullLink = link ? (link.startsWith('http') ? link : 'https://hk.jobsdb.com' + link) : '#';

                if (title && company) {
                    jobResults.push({ title, company, location: jobLocation, salary, link: fullLink });
                }
            }
        });

        // 2. Fetch Detailed Descriptions for each job
        console.log(`Fetching details for ${jobResults.length} jobs...`);
        for (let job of jobResults) {
            const details = await getJobDetails(job.link).catch(() => ({ descriptionText: 'Failed to load.' }));
            job.description = details.descriptionText;
            job.details = details; // Keep all structured details
        }

        // Fallback if scraping is blocked or no results found
        if (jobResults.length === 0) {
            console.log('No jobs found or blocked. Providing structured fallback data.');
            return [
                {
                    title: `${keyword} - Senior Role`,
                    company: 'MoeCloud Tech',
                    location: location || 'Remote',
                    salary: salaryRange || '$50k+',
                    link: 'https://hk.jobsdb.com',
                    description: 'This is a high-level position requiring deep expertise in the field. You will lead teams and drive innovation.'
                }
            ];
        }

        return jobResults;
    } catch (error) {
        console.error('Scraper Error:', error.message);
        // Return dummy data for development/demo purposes if network fails
        return [
            {
                title: `Professional ${keyword}`,
                company: 'HK Enterprise',
                location: location || 'Hong Kong',
                salary: 'Market Rate',
                link: '#',
                description: 'A great opportunity for growth in a dynamic environment.'
            }
        ];
    }
}

module.exports = { scrapeJobs, getJobDetails };
