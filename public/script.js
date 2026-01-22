document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('dream-job-form');
    const jobsContainer = document.getElementById('jobs-container');
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');

    // AI Chat elements
    const aiToggle = document.getElementById('ai-toggle');
    const aiChatWindow = document.getElementById('ai-chat-window');
    const closeChat = document.getElementById('close-chat');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendChat = document.getElementById('send-chat');

    // Toggle AI Chat
    aiToggle.addEventListener('click', () => aiChatWindow.classList.toggle('hidden'));
    closeChat.addEventListener('click', () => aiChatWindow.classList.add('hidden'));

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const preferences = document.getElementById('preferences').value;
        const salary = document.getElementById('salary').value;
        const location = document.getElementById('location').value;
        const industry = document.getElementById('industry').value;

        // Reset UI
        jobsContainer.innerHTML = '';
        statusIndicator.classList.remove('hidden');
        statusText.innerText = 'Analyzing your dream job preferences...';

        try {
            // Step 1: Integrated Backend Call (Analyzer -> Scraper -> Advisor)
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `${preferences} in ${location} with ${salary} salary ${industry ? 'in ' + industry : ''}`
                })
            });

            const data = await response.json();

            if (data.error) throw new Error(data.error);

            // Step 2: Display AI Career Insights
            statusText.innerText = 'Finalizing career strategy...';

            const adviceBanner = document.createElement('div');
            adviceBanner.className = 'ai-advice-banner';
            adviceBanner.innerHTML = `<h3>✨ AI Career Insights</h3><p>${data.advice}</p>`;
            jobsContainer.appendChild(adviceBanner);

            // Step 3: Render Job Results
            statusIndicator.classList.add('hidden');

            if (data.jobs && data.jobs.length > 0) {
                data.jobs.forEach(job => {
                    const card = createJobCard(job);
                    jobsContainer.appendChild(card);
                });
            } else {
                jobsContainer.innerHTML += '<p class="loading" style="text-align: center; grid-column: 1/-1; padding: 2rem; color: var(--text-muted);">No direct matches found, but check out the AI advice above!</p>';
            }

        } catch (error) {
            console.error('Search error:', error);
            statusIndicator.classList.add('hidden');
            jobsContainer.innerHTML = `<div class="ai-advice-banner" style="background: rgba(239, 68, 68, 0.1); border-color: #ef4444;">
                <h3>System Notice</h3>
                <p>We encountered an issue connecting to the job services. Providing fallback career guidance instead: Focus on networking and optimizing your LinkedIn profile for roles in Hong Kong.</p>
            </div>`;
        }
    });

    function createJobCard(job) {
        const div = document.createElement('div');
        div.className = 'job-card';
        div.innerHTML = `
            <div class="job-header">
                <div class="company-logo">${job.company ? job.company[0] : 'J'}</div>
                <span class="job-type">High Match</span>
            </div>
            <div class="job-body">
                <h3 class="job-title">${job.title}</h3>
                <p class="company-name">${job.company}</p>
            </div>
            <div class="job-footer">
                <div class="job-info">
                    <span>📍 ${job.location || 'Hong Kong'}</span> | 
                    <span>💰 ${job.salary || 'Market Rate'}</span>
                </div>
                <a href="${job.link}" target="_blank" class="job-link">View Details →</a>
            </div>
        `;
        return div;
    }

    // AI Chat Functionality
    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        appendMessage('user', message);
        chatInput.value = '';

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
            const data = await response.json();
            appendMessage('ai', data.reply);
        } catch (error) {
            appendMessage('ai', 'Sorry, I am having trouble connecting right now.');
        }
    }

    sendChat.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    function appendMessage(role, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${role}`;
        msgDiv.style.marginBottom = '1rem';
        msgDiv.style.padding = '0.8rem';
        msgDiv.style.borderRadius = '12px';
        msgDiv.style.maxWidth = '90%';

        if (role === 'user') {
            msgDiv.style.background = 'rgba(99, 102, 241, 0.2)';
            msgDiv.style.alignSelf = 'flex-end';
            msgDiv.style.marginLeft = 'auto';
        } else {
            msgDiv.style.background = 'rgba(255, 255, 255, 0.05)';
            msgDiv.style.alignSelf = 'flex-start';
        }

        msgDiv.innerText = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});
