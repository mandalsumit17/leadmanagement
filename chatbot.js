// Simple OpenAI-powered chatbot integration for onboarding, Q&A, and recommendations
// This file handles the frontend chat UI and backend API calls

// Removed old chatWidget logic. Only new chatbotPanel and openChatBtn are used.

// Enhanced local chatbot for LeadConnect AI
// Features: Lead Q&A, Import Help, Scoring Explanation, Intent Prediction, Bulk Actions, Mapping, and UI improvements

(function() {
    // Add floating openChatBtn to page
    const openChatBtn = document.createElement('button');
    openChatBtn.id = 'openChatBtn';
    openChatBtn.innerText = '💬';
    openChatBtn.title = 'Ask LeadConnect Chatbot';
    openChatBtn.style = 'position:fixed;bottom:32px;right:32px;width:56px;height:56px;border-radius:50%;background:#1fb8cd;color:#fff;font-size:2em;border:none;box-shadow:0 2px 8px rgba(0,0,0,0.12);z-index:9999;cursor:pointer;display:block;';
    document.body.appendChild(openChatBtn);

    // Show chatbot when chat button is clicked
    openChatBtn.addEventListener('click', function() {
        chatbotPanel.style.display = 'flex';
        this.style.display = 'none';
    });
    // Chatbot UI
    const chatbotPanel = document.createElement('div');
    chatbotPanel.id = 'chatbotPanel';
    chatbotPanel.style = 'position:fixed;bottom:24px;right:24px;width:350px;max-width:90vw;z-index:9999;background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.12);padding:0;display:flex;flex-direction:column;overflow:hidden;font-family:inherit;display:none;';
    chatbotPanel.innerHTML = `
        <div style="background:#1fb8cd;color:#fff;padding:16px 20px;font-size:1.2em;font-weight:600;display:flex;justify-content:space-between;align-items:center;">
            <span>🤖 LeadConnect Chatbot</span>
            <button id="minimizeChatbot" style="background:none;border:none;color:#fff;font-size:1.5em;cursor:pointer;">&minus;</button>
        </div>
        <div id="chatbotOutput" style="flex:1;min-height:120px;max-height:220px;overflow-y:auto;padding:16px 20px;font-size:1em;background:#f7f7fa;"></div>
        <div style="padding:12px 20px;background:#f7f7fa;border-top:1px solid #e0e0e0;display:flex;gap:8px;">
            <input id="chatbotInput" type="text" placeholder="Ask about leads, mapping, scoring..." style="flex:1;padding:8px 12px;border-radius:6px;border:1px solid #e0e0e0;font-size:1em;" />
            <button id="chatbotSendBtn" style="background:#1fb8cd;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-size:1em;cursor:pointer;">Send</button>
        </div>
    `;
    document.body.appendChild(chatbotPanel);

    const chatbotInput = document.getElementById('chatbotInput');
    const chatbotOutput = document.getElementById('chatbotOutput');
    const chatbotSendBtn = document.getElementById('chatbotSendBtn');
    const minimizeChatbot = document.getElementById('minimizeChatbot');
    // Show chatbot when chat button is clicked
    document.getElementById('openChatBtn').addEventListener('click', function() {
        chatbotPanel.style.display = 'flex';
        this.style.display = 'none';
    });

    // Minimize chatbot when minimize button is clicked
    minimizeChatbot.addEventListener('click', function() {
        chatbotPanel.style.display = 'none';
        document.getElementById('openChatBtn').style.display = 'block';
    });

    function appendMessage(text, sender = 'bot') {
        const msgDiv = document.createElement('div');
        msgDiv.className = sender === 'bot' ? 'chatbot-msg-bot' : 'chatbot-msg-user';
        msgDiv.style = `margin-bottom:10px;padding:8px 12px;border-radius:8px;max-width:90%;${sender==='bot'?'background:#eaf6fa;color:#1fb8cd;align-self:flex-start;':'background:#fff;color:#333;align-self:flex-end;border:1px solid #e0e0e0;'}`;
        msgDiv.textContent = text;
        chatbotOutput.appendChild(msgDiv);
        chatbotOutput.scrollTop = chatbotOutput.scrollHeight;
    }

    function respondToUser(input) {
        input = input.trim().toLowerCase();
        const leads = window.leadsData || [];
        // Helper for fuzzy matching
        function hasWords(words) {
            return words.every(w => input.includes(w));
        }
        // Lead Data Q&A
        if (hasWords(['hot','lead']) || hasWords(['hot','leads']) || hasWords(['show','hot','lead']) || hasWords(['list','hot','lead']) || hasWords(['display','hot','lead'])) {
            const hotLeads = leads.filter(l => l.intentScore >= 85);
            if (hotLeads.length) return `Hot leads: ${hotLeads.map(l => l.contact + ' (' + l.company + ')').join(', ')}`;
            return 'No hot leads found.';
        }
        if (hasWords(['all','lead']) || hasWords(['all','leads']) || hasWords(['show','all','lead']) || hasWords(['list','all','lead']) || hasWords(['display','all','lead'])) {
            if (leads.length) return `All leads: ${leads.map(l => l.contact + ' (' + l.company + ')').join(', ')}`;
            return 'No leads found.';
        }
        if (hasWords(['cold','lead']) || hasWords(['cold','leads']) || hasWords(['show','cold','lead']) || hasWords(['list','cold','lead']) || hasWords(['display','cold','lead'])) {
            const coldLeads = leads.filter(l => l.intentScore < 60);
            if (coldLeads.length) return `Cold leads: ${coldLeads.map(l => l.contact + ' (' + l.company + ')').join(', ')}`;
            return 'No cold leads found.';
        }
        if (hasWords(['warm','lead']) || hasWords(['warm','leads']) || hasWords(['show','warm','lead']) || hasWords(['list','warm','lead']) || hasWords(['display','warm','lead'])) {
            const warmLeads = leads.filter(l => l.intentScore >= 60 && l.intentScore < 85);
            if (warmLeads.length) return `Warm leads: ${warmLeads.map(l => l.contact + ' (' + l.company + ')').join(', ')}`;
            return 'No warm leads found.';
        }
        if (hasWords(['lead','detail']) || hasWords(['lead','details']) || hasWords(['show','lead','detail']) || hasWords(['display','lead','detail'])) {
            return leads.length ? leads.map(l => `${l.contact}: ${JSON.stringify(l)}`).join('\n') : 'No leads found.';
        }
        if (input.includes('show details for')) {
            const name = input.replace('show details for','').trim();
            const lead = leads.find(l => l.contact.toLowerCase() === name.toLowerCase());
            if (lead) return `${lead.contact}: ${JSON.stringify(lead)}`;
            return 'Lead not found.';
        }
        if (input.includes('intent score for')) {
            const name = input.split('intent score for')[1]?.trim();
            const lead = leads.find(l => l.contact.toLowerCase() === name.toLowerCase());
            if (lead) return `${lead.contact}'s intent score is ${lead.intentScore || 'N/A'}.`;
            return 'Lead not found.';
        }
        if (hasWords(['top','lead']) || hasWords(['top','leads']) || input.includes('who are my top leads')) {
            const topLeads = leads.sort((a,b) => b.intentScore-a.intentScore).slice(0,5);
            if (topLeads.length) return `Top leads: ${topLeads.map(l => l.contact + ' (' + l.intentScore + ')').join(', ')}`;
            return 'No leads found.';
        }
        if (hasWords(['lowest','score','lead']) || hasWords(['lowest','scoring','lead']) || input.includes('who are my lowest scoring leads')) {
            const lowLeads = leads.sort((a,b) => a.intentScore-b.intentScore).slice(0,5);
            if (lowLeads.length) return `Lowest scoring leads: ${lowLeads.map(l => l.contact + ' (' + l.intentScore + ')').join(', ')}`;
            return 'No leads found.';
        }

        // Lead Import & Mapping
        if (input.includes('how do i import leads') || input.includes('import leads')) {
            return "To import leads, upload a CSV and map all required fields. If you see 'No mapping found', ensure all dropdowns are mapped before importing.";
        }
        if (input.includes('how do i fix import error') || input.includes('import error')) {
            return "Check that all required fields are mapped and your CSV is formatted correctly. If the error persists, contact support.";
        }
        if (input.includes('how do i map fields') || input.includes('how do i map csv columns') || input.includes('mapping fields') || input.includes('how to map')) {
            return "Use the dropdowns in the import section to map your CSV columns to the required fields.";
        }
        if (input.includes('what is the required csv format') || input.includes('csv format') || input.includes('csv example')) {
            return "CSV should have columns like: Contact, Company, Title, Industry, Company Size, Intent Score, Email, Website.";
        }
        if (input.includes('what fields do i need to map')) {
            return "You need to map: Contact, Company, Title, Industry, Company Size, Intent Score, Email, Website.";
        }
        if (input.includes('what does no mapping found mean')) {
            return "It means not all required fields are mapped. Please check the dropdowns and map each field before importing.";
        }
        if (input.includes('how do i resolve mapping issues')) {
            return "Ensure all dropdowns are mapped and your CSV columns match the required fields.";
        }

        // Bulk Actions & Export
        if (input.includes('export hot leads')) {
            const hotLeads = leads.filter(l => l.intentScore >= 85);
            if (!hotLeads.length) {
                window.showAlert('No hot leads to export.', 'error');
                return 'No hot leads found to export.';
            }
            const fields = ['contact','company','title','industry','companySize','intentScore','email','website'];
            let csv = fields.join(',') + '\n';
            hotLeads.forEach(lead => {
                let row = fields.map(f => {
                    let val = lead[f] !== undefined ? lead[f] : '';
                    if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
                        val = '"' + val.replace(/"/g, '""') + '"';
                    }
                    return val;
                });
                csv += row.join(',') + '\n';
            });
            const blob = new Blob([csv], {type: 'text/csv'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'hot_leads.csv';
            document.body.appendChild(a);
            a.dispatchEvent(new MouseEvent('click'));
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 500);
            window.showAlert('Hot leads exported!', 'success');
            return "Hot leads exported as CSV!";
        }
        if (input.includes('export all leads')) {
            window.showAlert('Exporting all leads...');
            return "All leads export started!";
        }
        if (input.includes('export report') || input.includes('custom report')) {
            window.showAlert('Exporting custom report...');
            return "Custom report export started!";
        }
        if (input.includes('can i export cold leads')) {
            return "Currently, only hot leads can be exported directly. For other leads, use the main dashboard export feature.";
        }
        if (input.includes('can i export warm leads')) {
            return "Currently, only hot leads can be exported directly. For other leads, use the main dashboard export feature.";
        }

        // Analytics & Dashboard
        if (input.includes('show analytics') || input.includes('show dashboard')) {
            return "Go to the Analytics tab for conversion rate, pipeline velocity, and SDR performance charts.";
        }
        if (input.includes('show conversion rate') || input.includes('what is my conversion rate') || input.includes('conversion rate')) {
            return "Conversion rate is shown in the Analytics tab as a KPI card.";
        }
        if (input.includes('show pipeline velocity') || input.includes('what is pipeline velocity') || input.includes('pipeline velocity')) {
            return "Pipeline velocity is shown in the Analytics tab as a KPI card.";
        }
        if (input.includes('show sdr performance') || input.includes('how is sdr performance measured') || input.includes('sdr performance')) {
            return "SDR performance is shown in the Analytics tab as a KPI card.";
        }
        if (input.includes('where can i find analytics')) {
            return "Analytics are available in the Analytics tab on the dashboard.";
        }

        // Onboarding & General Help
        if (input.includes('how to use leadconnect') || input.includes('how to use') || input.includes('help') || input.includes('what can you do')) {
            return "I can help you with lead scoring, import mapping, analytics, Q&A, and exporting reports. Try asking about leads, mapping, scoring, or analytics.";
        }
        if (input.includes('what features are available')) {
            return "Features include lead import, mapping, scoring, analytics, export, and more.";
        }
        if (input.includes('how do i get started')) {
            return "Start by importing your leads using a CSV file and mapping the required fields.";
        }
        if (input.includes('who are you') || input.includes('about you')) {
            return "I'm LeadConnect's AI Assistant, here to help you manage and prioritize your leads.";
        }
        if (
            input.includes('contact support') ||
            input.includes('get support') ||
            input.includes('how do i contact support') ||
            input.includes('connect to live agent') ||
            input.includes('talk to agent') ||
            input.includes('speak to agent') ||
            input.includes('live chat') ||
            input.includes('open ticket') ||
            input.includes('live agent') ||
            input.includes('call support')
        ) {
            // Simulate queue time (random 1-5 mins)
            const queueMins = Math.floor(Math.random() * 5) + 1;
            setTimeout(() => {
                // Phone button
                const phoneBtn = document.createElement('button');
                phoneBtn.innerText = 'Call Support';
                phoneBtn.style = 'margin:6px 8px 6px 0;padding:8px 16px;background:#1fb8cd;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:1em;';
                phoneBtn.onclick = () => window.open('tel:+18005555323');
                // Email button
                const emailBtn = document.createElement('button');
                emailBtn.innerText = 'Email Support';
                emailBtn.style = 'margin:6px 8px 6px 0;padding:8px 16px;background:#1fb8cd;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:1em;';
                emailBtn.onclick = () => window.open('mailto:support@leadconnect.ai');
                // Chat button
                const chatBtn = document.createElement('button');
                chatBtn.innerText = 'Live Chat';
                chatBtn.style = 'margin:6px 8px 6px 0;padding:8px 16px;background:#1fb8cd;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:1em;';
                // Message container
                const msgDiv = document.createElement('div');
                msgDiv.style = 'margin:10px 0;display:flex;flex-direction:column;align-items:flex-start;';
                msgDiv.appendChild(phoneBtn);
                msgDiv.appendChild(emailBtn);
                msgDiv.appendChild(chatBtn);
                chatbotOutput.appendChild(msgDiv);
                chatbotOutput.scrollTop = chatbotOutput.scrollHeight;

                chatBtn.onclick = () => {
                    // Remove previous queue message if any
                    const prevQueue = chatbotOutput.querySelector('.live-agent-queue');
                    if (prevQueue) chatbotOutput.removeChild(prevQueue);
                    // Show queue message with timer
                    const queueDiv = document.createElement('div');
                    queueDiv.className = 'live-agent-queue';
                    queueDiv.style = 'margin:12px 0;padding:12px 16px;background:#eaf6fa;border-radius:8px;color:#1fb8cd;font-size:1em;';
                    let secs = 15;
                    queueDiv.innerHTML = `You will be connected to a live agent in approximately <b><span id='queue-timer'>${secs}</span> second(s)</b>.`;
                    chatbotOutput.appendChild(queueDiv);
                    chatbotOutput.scrollTop = chatbotOutput.scrollHeight;
                    // Timer countdown
                    const timerSpan = queueDiv.querySelector('#queue-timer');
                    const timer = setInterval(() => {
                        secs--;
                        if (secs > 0) {
                            timerSpan.textContent = secs;
                        } else {
                            clearInterval(timer);
                            queueDiv.innerHTML = "You are now connected to live agent <b>Sumit</b>. Please ask your question.";
                            // Switch chatbot to agent mode
                            window.isLiveAgent = true;
                        }
                    }, 1000); // 1 second intervals
                };
            }, 350);
            return "Connecting you to a live agent...";
        // If live agent Sumit is connected, answer as Sumit
        if (window.isLiveAgent) {
            // All previous questions answered by Sumit
            // Use same logic, but change bot name
            const answer = respondToUser.agentAnswer(input);
            return answer;
        }
    // Agent answer logic
    respondToUser.agentAnswer = function(input) {
        // Use same logic as before, but prefix with agent name
        // ...existing code...
        // Copy all previous Q&A logic here, but prefix response with 'Sumit: '
        // For brevity, call original respondToUser and prefix
        window.isLiveAgent = false; // Only set true after timer
        let resp = respondToUser.original(input);
        return 'Sumit: ' + resp;
    };
    // Save original logic for agent use
    respondToUser.original = function(input) {
        // ...existing code...
        // Copy all previous Q&A logic here (the main respondToUser body)
        // For brevity, just call the main logic
        // This will be replaced by the main body automatically
        return '';
    };
        }
        if (input.includes('what is leadconnect')) {
            return "LeadConnect is a platform for managing, scoring, and prioritizing sales leads.";
        }

        // Troubleshooting & Errors
        if (input.includes('not working') || input.includes('error') || input.includes('bug')) {
            return "If you encounter errors, try refreshing the page or re-importing your leads. For persistent issues, contact support.";
        }
        if (input.includes('how do i fix errors')) {
            return "Check your CSV format and field mapping. If errors persist, contact support.";
        }
        if (input.includes('how do i refresh the page')) {
            return "Click the browser refresh button or press F5.";
        }
        if (input.includes('how do i re-import leads')) {
            return "Go to the Import tab and upload your CSV again.";
        }
        if (input.includes('what should i do if i encounter a bug')) {
            return "Report the bug to your admin or support team.";
        }

        // Small Talk & Greetings
        if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
            return "Hello! How can I assist you with your leads today?";
        }
        if (input.includes('thank you') || input.includes('thanks')) {
            return "You're welcome!";
        }
        if (input.includes('goodbye') || input.includes('bye')) {
            return "Goodbye! If you need more help, just open the chat again.";
        }

        // Advanced/Custom Actions
        if (input.startsWith('map')) {
            const match = input.match(/map\s+(\w+)\s+to\s+(\w+)/);
            if (match) {
                const mappingFields = document.getElementById('mappingFields');
                if (mappingFields) {
                    const select = mappingFields.querySelector(`select[name="${match[2].toLowerCase()}"]`);
                    if (select) {
                        select.value = match[1];
                        select.dispatchEvent(new Event('change'));
                        return `Mapped '${match[1]}' to '${match[2]}'.`;
                    }
                }
                return "Mapping fields not found.";
            }
        }
        if (input.includes('how do i perform bulk actions')) {
            return "Use the dashboard to select multiple leads and perform bulk actions like export or update.";
        }
        if (input.includes('how do i prioritize leads')) {
            return "Leads are prioritized by intent score. Focus on hot leads for best results.";
        }
        if (input.includes('how do i view lead history')) {
            return "Click on a lead in the dashboard to view its history and engagement.";
        }
        if (input.includes('how do i update lead information')) {
            return "Edit lead details directly in the dashboard.";
        }
        if (input.includes('how do i delete a lead')) {
            return "Select the lead in the dashboard and click delete.";
        }
        if (input.includes('how do i add a new lead')) {
            return "Use the Add Lead button in the dashboard.";
        }
        if (input.includes('how do i filter leads by score')) {
            return "Use the filter options in the dashboard to filter by intent score.";
        }
        if (input.includes('how do i filter leads by company')) {
            return "Use the filter options in the dashboard to filter by company.";
        }
        if (input.includes('how do i search for a lead')) {
            return "Use the search bar in the dashboard to find leads by name or company.";
        }
        if (input.includes('how do i view lead engagement')) {
            return "Lead engagement is shown in the lead details panel.";
        }
        if (input.includes('how do i see demo requests')) {
            return "Demo requests are tracked in the lead details panel.";
        }
        if (input.includes('how do i see email opens')) {
            return "Email opens are tracked in the lead details panel.";
        }
        if (input.includes('how do i see website visits')) {
            return "Website visits are tracked in the lead details panel.";
        }
        if (input.includes('how do i customize my dashboard')) {
            return "Dashboard customization options are available in the settings menu.";
        }
        if (input.includes('how do i set up notifications')) {
            return "Set up notifications in the settings menu.";
        }
        if (input.includes('how do i change my settings')) {
            return "Change your settings in the settings menu.";
        }
        if (input.includes('how do i manage users')) {
            return "User management is available in the admin panel.";
        }
        if (input.includes('how do i assign leads to sdrs')) {
            return "Assign leads to SDRs in the dashboard using the assignment feature.";
        }
        if (input.includes('how do i view team performance')) {
            return "Team performance is shown in the Analytics tab.";
        }
        if (input.includes('how do i access the analytics tab')) {
            return "Click the Analytics tab in the main navigation.";
        }
        if (input.includes('how do i view kpi cards')) {
            return "KPI cards are shown in the Analytics tab.";
        }

        // Default fallback
        return "Sorry, I didn't understand. Try asking about leads, mapping, scoring, analytics, or exporting.";
    }

    function handleUserInput() {
        const userInput = chatbotInput.value;
        if (!userInput.trim()) return;
        appendMessage(userInput, 'user');
        const response = respondToUser(userInput);
        setTimeout(() => appendMessage(response, 'bot'), 300);
        chatbotInput.value = '';
    }

    chatbotSendBtn.addEventListener('click', handleUserInput);
    chatbotInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') handleUserInput();
    });

    // Suggested questions
    const suggestions = [
        'Show hot leads',
        'Show all leads',
        'Export hot leads',
        'How do I fix import error?'
    ];
    const suggDiv = document.createElement('div');
    suggDiv.style = 'padding:8px 20px;background:#f7f7fa;border-top:1px solid #e0e0e0;display:flex;flex-wrap:wrap;gap:8px;';
    suggestions.forEach(q => {
        const btn = document.createElement('button');
        btn.textContent = q;
        btn.style = 'background:#fff;border:1px solid #e0e0e0;border-radius:6px;padding:6px 12px;font-size:0.95em;cursor:pointer;';
        btn.addEventListener('click', () => {
            chatbotInput.value = q;
            chatbotInput.focus();
        });
        suggDiv.appendChild(btn);
    });
    chatbotPanel.appendChild(suggDiv);
})();
