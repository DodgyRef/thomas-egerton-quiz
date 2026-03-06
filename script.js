class NameRandomiser {
    constructor() {
        this.names = [];
        this.ranges = [];
        this.availableNumbers = []; // Pool of available numbers for raffle
        this.isSpinning = false;
        this.selectedName = '';
        this.selectedNumber = '';
        this.spinInterval = null;
        this.speedInterval = null;
        this.audio = null;
        this.currentMode = 'quiz'; // 'quiz', 'questions', or 'raffle'
        this.isAdminLoggedIn = false;
        this.adminPassword = 'REPLACED_ADMIN_PASSWORD'; // Change this to your desired password
        this.isController = false; // True if this device controls the game
        this.firebaseConnected = false;
        this.syncData = null;
        this.initialLoad = true; // Flag to prevent auto-spin on first load
        this.questionsData = null; // { rounds: [{ id, title, questions }] }
        this.revealedRounds = []; // Round IDs visible to teams (synced via Firebase)
        this.selectedQuestionTab = null; // Currently selected round ID in tabbed view
        
        this.initializeElements();
        this.bindEvents();
        this.loadPredefinedNames();
        this.loadQuestions();
        this.initializeAudio();
        this.updateButtonStates();
        this.initializeFirebase();
        
        // Set initial view state (view-only by default)
        this.hideInputSections();
        
        // Add click listener to winner section for admin dismissal
        this.setupWinnerClickHandler();
        
        // Hide winner section initially
        if (this.winnerSection) {
            this.winnerSection.style.display = 'none';
        }
        
        // Ensure toggle is hidden initially
        if (this.modeToggle) {
            this.modeToggle.style.display = 'none';
        }
    }
    
    initializeElements() {
        // Quiz elements
        this.nameInput = document.getElementById('nameInput');
        this.addBtn = document.getElementById('addBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.spinBtn = document.getElementById('spinBtn');
        this.namesList = document.getElementById('namesList');
        
        // Raffle elements
        this.rangeStart = document.getElementById('rangeStart');
        this.rangeEnd = document.getElementById('rangeEnd');
        this.rangeDescription = document.getElementById('rangeDescription');
        this.addRangeBtn = document.getElementById('addRangeBtn');
        this.clearRangesBtn = document.getElementById('clearRangesBtn');
        this.spinRaffleBtn = document.getElementById('spinRaffleBtn');
        this.rangesList = document.getElementById('rangesList');
        
        // Common elements
        this.spinAgainBtn = document.getElementById('spinAgainBtn'); // May be null if removed
        this.wheelSection = document.getElementById('wheelSection');
        this.winnerSection = document.getElementById('winnerSection');
        this.wheel = document.getElementById('wheel');
        this.currentName = document.getElementById('currentName');
        this.winnerName = document.getElementById('winnerName');
        this.mainTitle = document.getElementById('mainTitle');
        this.mainSubtitle = document.getElementById('mainSubtitle');
        this.resultTitle = document.getElementById('resultTitle');
        this.modeToggle = document.getElementById('modeToggle');
        this.modeButtons = document.querySelectorAll('.mode-btn');
        this.quizSection = document.getElementById('quizSection');
        this.raffleSection = document.getElementById('raffleSection');
        this.questionsSection = document.getElementById('questionsSection');
        this.questionsAdminSection = document.getElementById('questionsAdminSection');
        this.questionsTabs = document.getElementById('questionsTabs');
        this.questionsContent = document.getElementById('questionsContent');
        this.questionsPlaceholder = document.getElementById('questionsPlaceholder');
        this.revealRoundsList = document.getElementById('revealRoundsList');
        this.questionsFileInput = document.getElementById('questionsFileInput');
        
        // Login elements
        this.adminPasswordInput = document.getElementById('adminPassword');
        this.loginBtn = document.getElementById('loginBtn');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.loginStatus = document.getElementById('loginStatus');
        this.syncStatus = document.getElementById('syncStatus');
        this.logoContainer = document.querySelector('.logo-container');
        this.loginSection = document.getElementById('loginSection');
        
        // Debug logs
        console.log('Logo container found:', !!this.logoContainer);
        console.log('Login section found:', !!this.loginSection);
    }
    
    bindEvents() {
        // Quiz events
        this.addBtn.addEventListener('click', () => this.addName());
        this.nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addName();
            }
        });
        this.clearBtn.addEventListener('click', () => this.clearAll());
        this.spinBtn.addEventListener('click', () => this.startSpin());
        
        // Raffle events
        this.addRangeBtn.addEventListener('click', () => this.addRange());
        this.clearRangesBtn.addEventListener('click', () => this.clearAllRanges());
        this.spinRaffleBtn.addEventListener('click', () => this.startRaffleSpin());
        
        // Mode selector (3-way buttons)
        if (this.modeToggle) {
            this.modeToggle.addEventListener('click', (e) => {
                const btn = e.target.closest('.mode-btn');
                if (btn && btn.dataset.mode) {
                    this.setMode(btn.dataset.mode);
                    this.syncGameState();
                }
            });
        }
        
        // Login events
        this.loginBtn.addEventListener('click', () => this.handleLogin());
        this.logoutBtn.addEventListener('click', () => this.handleLogout());
        this.adminPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleLogin();
            }
        });
        
        // Common events
        if (this.spinAgainBtn) {
            this.spinAgainBtn.addEventListener('click', () => this.resetAndSpin());
        }
        
        // Prevent form submission on Enter in inputs
        this.nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
        });
        
        this.rangeStart.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addRange();
            }
        });
        
        this.rangeEnd.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addRange();
            }
        });
        
        this.rangeDescription.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addRange();
            }
        });
        
        // Logo click to show/hide login section
        if (this.logoContainer) {
            console.log('Logo container found, adding click listener'); // Debug log
            this.logoContainer.addEventListener('click', () => this.toggleLoginSection());
        } else {
            console.log('Logo container not found!'); // Debug log
        }
        
        if (this.questionsFileInput) {
            this.questionsFileInput.addEventListener('change', (e) => this.handleQuestionsFileSelected(e));
        }
    }
    
    addName() {
        const name = this.nameInput.value.trim();
        
        if (!name) {
            this.showMessage('Please enter a name!', 'error');
            return;
        }
        
        if (this.names.includes(name)) {
            this.showMessage('This name is already in the list!', 'error');
            return;
        }
        
        if (this.names.length >= 50) {
            this.showMessage('Maximum 50 names allowed!', 'error');
            return;
        }
        
        this.names.push(name);
        this.nameInput.value = '';
        this.updateNamesList();
        this.updateSpinButton();
        this.showMessage(`Added "${name}" to the list!`, 'success');
    }
    
    removeName(nameToRemove) {
        this.names = this.names.filter(name => name !== nameToRemove);
        this.updateNamesList();
        this.updateSpinButton();
        this.showMessage(`Removed "${nameToRemove}" from the list!`, 'info');
    }
    
    clearAll() {
        if (this.names.length === 0) {
            this.showMessage('The list is already empty!', 'info');
            return;
        }
        
        if (confirm('Are you sure you want to clear all names?')) {
            this.names = [];
            this.updateNamesList();
            this.updateSpinButton();
            this.showMessage('All names cleared!', 'info');
        }
    }
    
    updateNamesList() {
        if (this.names.length === 0) {
            this.namesList.innerHTML = '<p class="empty-message">No names added yet. Add some names to get started!</p>';
            return;
        }
        
        this.namesList.innerHTML = this.names.map(name => 
            `<span class="name-tag">
                ${this.escapeHtml(name)}
                <button class="remove-btn" onclick="nameRandomiser.removeName('${this.escapeHtml(name)}')" title="Remove">×</button>
            </span>`
        ).join('');
    }
    
    updateSpinButton() {
        this.spinBtn.disabled = this.names.length < 2 || this.isSpinning || !this.isAdminLoggedIn;
    }
    
    startSpin() {
        if (this.names.length < 2) {
            this.showMessage('Please add at least 2 names to spin!', 'error');
            return;
        }
        
        if (this.isSpinning) {
            return;
        }
        
        this.isSpinning = true;
        this.selectedName = this.names[Math.floor(Math.random() * this.names.length)];
        this.updateSpinButton();
        
        // Show wheel section and hide winner section initially
        this.wheelSection.style.display = 'block';
        if (this.winnerSection) {
            this.winnerSection.style.display = 'none';
            this.winnerSection.style.animation = 'none';
        }
        if (this.resultDisplay) {
            this.resultDisplay.style.display = 'none';
            this.resultDisplay.style.animation = 'none';
        }
        this.wheelSection.scrollIntoView({ behavior: 'smooth' });
        
        // Start the spinning animation
        this.animateSpin();
        
        // Play countdown audio
        this.playCountdownAudio();
        
        this.showMessage('Spinning... Good luck!', 'info');
    }
    
    animateSpin() {
        let totalTime = 0;
        const targetTime = 15000; // 15 seconds
        const updateInterval = 50; // Update every 50ms for smooth animation
        
        // Add spinning class to wheel
        this.wheel.classList.add('spinning');
        
        // Start the synchronized name cycling
        this.spinInterval = setInterval(() => {
            totalTime += updateInterval;
            
            if (totalTime >= targetTime) {
                this.stopSpin();
                return;
            }
            
            // Calculate progress (0 to 1)
            const progress = totalTime / targetTime;
            
            // Use the same cubic ease-out as the CSS animation
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            // Calculate rotation speed - starts fast, slows down
            // The wheel rotates 3600 degrees (10 full rotations) over 15 seconds
            const totalRotations = 10;
            const rotationSpeed = totalRotations * easeOut;
            
            // Calculate how many names to cycle through based on wheel rotation
            // Each full rotation should cycle through all names
            const namesPerRotation = this.names.length;
            const totalNamesToShow = rotationSpeed * namesPerRotation;
            
            // For the final rotation, ensure we continue scrolling smoothly
            // and land on the selected name at the very end
            let currentIndex;
            if (progress > 0.90) {
                // In the final 10% of the animation, slow down significantly
                // and ensure we land on the selected name
                const finalProgress = (progress - 0.90) / 0.1; // 0 to 1 in final 10%
                const selectedIndex = this.names.indexOf(this.selectedName);
                
                // Calculate how many names to show in the final rotation
                const finalNamesToShow = totalNamesToShow + (finalProgress * namesPerRotation);
                currentIndex = Math.floor(finalNamesToShow) % this.names.length;
                
                // In the very last moments, ensure we're showing the selected name
                if (finalProgress > 0.99) {
                    currentIndex = selectedIndex;
                }
            } else {
                // Normal cycling for the first 90% of the animation
                currentIndex = Math.floor(totalNamesToShow) % this.names.length;
            }
            
            this.currentName.textContent = this.names[currentIndex];
            
        }, updateInterval);
    }
    
    stopSpin() {
        clearInterval(this.spinInterval);
        
        // Stop countdown audio
        this.stopCountdownAudio();
        
        // Remove spinning class
        this.wheel.classList.remove('spinning');
        
        // Show the selected name
        this.currentName.textContent = this.selectedName;
        this.winnerName.textContent = this.selectedName;
        
        // Show result immediately after spin stops
        this.isSpinning = false;
        this.updateSpinButton();
        
        // Show winner section instantly
        if (this.winnerSection) {
            this.winnerSection.style.display = 'block';
            this.winnerSection.style.animation = 'none';
            console.log('Winner section shown');
        }
        
        if (this.resultDisplay) {
            this.resultDisplay.style.display = 'block';
            this.resultDisplay.style.animation = 'none';
            console.log('Result display shown, winner name:', this.winnerName.textContent);
        }
        this.wheelSection.style.display = 'none';
        this.showMessage(`🎉 "${this.selectedName}" is the winner!`, 'success');
    }
    
    resetAndSpin() {
        // Only run if the button exists
        if (!this.spinAgainBtn) return;
        
        // Stop any playing audio
        this.stopCountdownAudio();
        
        // Hide result section
        this.wheelSection.style.display = 'none';
        if (this.winnerSection) {
            this.winnerSection.style.display = 'block';
            this.winnerSection.style.animation = 'none';
        }
        
        // Reset wheel
        this.wheel.classList.remove('spinning');
        this.currentName.textContent = 'Ready to spin!';
        this.winnerName.textContent = '';
        
        // Start new spin
        setTimeout(() => {
            this.startSpin();
        }, 100);
    }
    
    showMessage(message, type = 'info') {
        // Create a temporary message element
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#17a2b8'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            font-weight: 500;
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(messageEl);
        
        // Remove message after 3 seconds
        setTimeout(() => {
            messageEl.style.animation = 'slideOutRight 0.3s ease-out forwards';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    loadQuestions() {
        const url = new URL('questions.json', window.location.href).href;
        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error('Questions file not found');
                return res.json();
            })
            .then(data => {
                if (data && Array.isArray(data.rounds)) {
                    this.questionsData = data;
                    if (this.currentMode === 'questions') this.updateQuestionsUI();
                }
            })
            .catch(() => {
                // Expected when opening from file:// - use "Load from file" instead
            });
    }
    
    loadQuestionsFromFile() {
        if (this.questionsFileInput) this.questionsFileInput.click();
    }
    
    handleQuestionsFileSelected(e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                if (data && Array.isArray(data.rounds)) {
                    this.questionsData = data;
                    if (this.currentMode === 'questions') this.updateQuestionsUI();
                    this.showMessage(`Loaded ${data.rounds.length} round(s) from ${file.name}`, 'success');
                } else {
                    this.showMessage('Invalid format: need a "rounds" array.', 'error');
                }
            } catch (err) {
                this.showMessage('Could not parse JSON file.', 'error');
            }
            e.target.value = '';
        };
        reader.readAsText(file);
    }
    
    updateQuestionsUI() {
        this.renderRevealButtons();
        this.renderQuestionsTabsAndContent();
    }
    
    renderRevealButtons() {
        if (!this.revealRoundsList) return;
        if (!this.questionsData || !this.questionsData.rounds || this.questionsData.rounds.length === 0) {
            this.revealRoundsList.innerHTML = `
                <p class="empty-message">No questions loaded. Use a web server to load questions.json automatically, or load from file:</p>
                <button type="button" class="btn btn-primary" id="loadQuestionsFileBtn">Load questions from file</button>`;
            const btn = document.getElementById('loadQuestionsFileBtn');
            if (btn) btn.addEventListener('click', () => this.loadQuestionsFromFile());
            return;
        }
        this.revealRoundsList.innerHTML = this.questionsData.rounds.map(round => {
            const isRevealed = this.revealedRounds.includes(round.id);
            return `<div class="reveal-round-row" data-round-id="${round.id}">
                <span class="reveal-round-title">${this.escapeHtml(round.title)}</span>
                ${isRevealed
                    ? `<button type="button" class="btn btn-secondary btn-hide-round" data-round-id="${round.id}">Hide</button>`
                    : `<button type="button" class="btn btn-primary btn-reveal-round" data-round-id="${round.id}">Reveal</button>`
                }
            </div>`;
        }).join('');
        this.revealRoundsList.querySelectorAll('.btn-reveal-round').forEach(btn => {
            btn.addEventListener('click', () => this.revealRound(parseInt(btn.dataset.roundId, 10)));
        });
        this.revealRoundsList.querySelectorAll('.btn-hide-round').forEach(btn => {
            btn.addEventListener('click', () => this.hideRound(parseInt(btn.dataset.roundId, 10)));
        });
    }
    
    revealRound(roundId) {
        if (!this.isController || !window.firebaseSet || !window.firebaseRef) return;
        if (this.revealedRounds.includes(roundId)) return;
        const next = [...this.revealedRounds, roundId].sort((a, b) => a - b);
        this.revealedRounds = next;
        const database = window.firebaseDatabase;
        const ref = window.firebaseRef;
        const set = window.firebaseSet;
        set(ref(database, 'questionsState'), { revealedRounds: next, timestamp: Date.now() });
        this.updateQuestionsUI();
        this.showMessage(`Revealed ${this.getRoundTitle(roundId)}`, 'success');
    }
    
    hideRound(roundId) {
        if (!this.isController || !window.firebaseSet || !window.firebaseRef) return;
        this.revealedRounds = this.revealedRounds.filter(id => id !== roundId);
        const database = window.firebaseDatabase;
        const ref = window.firebaseRef;
        const set = window.firebaseSet;
        set(ref(database, 'questionsState'), { revealedRounds: this.revealedRounds, timestamp: Date.now() });
        this.updateQuestionsUI();
        this.showMessage(`Hidden ${this.getRoundTitle(roundId)}`, 'info');
    }
    
    getRoundTitle(roundId) {
        const round = this.questionsData && this.questionsData.rounds && this.questionsData.rounds.find(r => r.id === roundId);
        return round ? round.title : `Round ${roundId}`;
    }
    
    renderQuestionsTabsAndContent() {
        if (!this.questionsTabs || !this.questionsContent) return;
        const revealedIds = Array.isArray(this.revealedRounds) ? this.revealedRounds : [];
        const revealed = (this.questionsData && this.questionsData.rounds)
            ? this.questionsData.rounds.filter(r => revealedIds.includes(r.id))
            : [];
        if (revealed.length === 0) {
            this.selectedQuestionTab = null;
            this.questionsTabs.innerHTML = '';
            this.questionsContent.innerHTML = '<p class="empty-message" id="questionsPlaceholder">Questions will appear here after each round.</p>';
            return;
        }
        this.questionsPlaceholder = document.getElementById('questionsPlaceholder');
        this.questionsTabs.innerHTML = revealed.map((round, idx) =>
            `<button type="button" class="questions-tab ${idx === 0 ? 'active' : ''}" data-round-id="${round.id}">${this.escapeHtml(round.title)}</button>`
        ).join('');
        const firstId = revealed[0].id;
        if (!this.selectedQuestionTab || !revealed.find(r => r.id === this.selectedQuestionTab)) {
            this.selectedQuestionTab = firstId;
        }
        this.questionsTabs.querySelectorAll('.questions-tab').forEach((tab, idx) => {
            tab.addEventListener('click', () => {
                this.selectedQuestionTab = parseInt(tab.dataset.roundId, 10);
                this.questionsTabs.querySelectorAll('.questions-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderQuestionList(this.selectedQuestionTab);
            });
        });
        this.renderQuestionList(this.selectedQuestionTab);
    }
    
    renderQuestionList(roundId) {
        if (!this.questionsContent) return;
        const round = this.questionsData && this.questionsData.rounds && this.questionsData.rounds.find(r => r.id === roundId);
        if (!round || !round.questions || round.questions.length === 0) {
            this.questionsContent.innerHTML = '<p class="empty-message">No questions in this round.</p>';
            return;
        }
        this.questionsContent.innerHTML = `
            <ol class="questions-list">
                ${round.questions.map(q => `<li class="question-item">${this.escapeHtml(q.text)}</li>`).join('')}
            </ol>`;
    }
    
    loadPredefinedNames() {
        // Predefined names from NAMES.TXT
        const predefinedNames = [
            'Drinking Team',
			'Return Of The Four',
			'The Monday Club',
			'Tequila Mockingbird',
			'Les Quizerable',
			'Alan Partridge',
			'FourPlay',
			'Cilit Bang',
			'The 99% Club',
			'Its A Family Affair',
			'The Magnificent Seven',
			'Bad To The Bone',
			'At The Bar',
			'Ladies That Lunch',
			'Barney',
			'64s',
			'The Team Who Shall Not Be Named',
			'Team For 2'
        ];
        
        // Load the predefined names
        this.names = [...predefinedNames];
        this.updateNamesList();
        this.updateSpinButton();
        
        // Show a message that names have been loaded
        this.showMessage(`Loaded ${predefinedNames.length} quiz team names!`, 'success');
    }
    
    initializeAudio() {
        // Initialize the countdown audio
        this.audio = new Audio('countdown-cut.mp3');
        this.audio.preload = 'auto';
        this.audio.volume = 0.7; // Set volume to 70%
        
        // Handle audio loading errors gracefully
        this.audio.addEventListener('error', (e) => {
            console.log('Audio file not found or failed to load:', e);
            this.showMessage('Audio file not found - spinning will continue without sound', 'info');
        });
    }
    
    // Break down a number into its component parts for audio playback
    getNumberComponents(number) {
        const components = [];
        
        // Handle numbers up to 9999
        if (number >= 1000) {
            const thousands = Math.floor(number / 1000) * 1000;
            components.push(thousands);
            number = number % 1000;
        }
        
        if (number >= 100) {
            const hundreds = Math.floor(number / 100) * 100;
            components.push(hundreds);
            number = number % 100;
        }
        
        // For numbers 0-99, use the individual file if it exists
        if (number >= 0 && number <= 99) {
            components.push(number);
        }
        
        return components;
    }
    
    // Play audio files for each component of a number
    async playNumberAudio(number) {
        const components = this.getNumberComponents(number);
        console.log(`Playing audio for number ${number}, components:`, components);
        
        for (let i = 0; i < components.length; i++) {
            const component = components[i];
            const audioFile = `AudioNumbers/${component}.wav`;
            
            try {
                const audio = new Audio(audioFile);
                audio.volume = 0.8;
                
                // Wait for the audio to finish playing
                await new Promise((resolve, reject) => {
                    audio.addEventListener('ended', resolve);
                    audio.addEventListener('error', (e) => {
                        console.log(`Audio file ${audioFile} not found or failed to load:`, e);
                        resolve(); // Continue even if one file fails
                    });
                    
                    audio.play().catch(error => {
                        console.log(`Audio playback failed for ${audioFile}:`, error);
                        resolve(); // Continue even if playback fails
                    });
                });
                
                // Small pause between audio files
                if (i < components.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
                
            } catch (error) {
                console.log(`Error playing audio for ${audioFile}:`, error);
                // Continue with next component even if one fails
            }
        }
    }
    
    playCountdownAudio() {
        if (this.audio) {
            try {
                this.audio.currentTime = 0; // Reset to beginning
                this.audio.play().catch(error => {
                    console.log('Audio playback failed:', error);
                    // Continue without audio if playback fails
                });
            } catch (error) {
                console.log('Audio error:', error);
            }
        }
    }
    
    stopCountdownAudio() {
        if (this.audio) {
            try {
                this.audio.pause();
                this.audio.currentTime = 0;
            } catch (error) {
                console.log('Audio stop error:', error);
            }
        }
    }
    
    // Mode switching
    setMode(mode) {
        if (!['quiz', 'questions', 'raffle'].includes(mode)) return;
        this.currentMode = mode;
        this.updateModeButtons();
        this.updateModeDisplay();
    }
    
    updateModeButtons() {
        if (!this.modeButtons) return;
        this.modeButtons.forEach(btn => {
            if (btn.dataset.mode === this.currentMode) {
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');
            } else {
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
            }
        });
    }
    
    updateModeDisplay() {
        if (this.quizSection) this.quizSection.style.display = 'none';
        if (this.raffleSection) this.raffleSection.style.display = 'none';
        if (this.questionsSection) this.questionsSection.style.display = 'none';
        
        if (this.currentMode === 'raffle') {
            if (this.raffleSection) this.raffleSection.style.display = this.isAdminLoggedIn ? 'block' : 'none';
            if (this.mainTitle) this.mainTitle.textContent = 'Raffle Ticket Draw';
            if (this.mainSubtitle) this.mainSubtitle.textContent = 'Enter number ranges and draw a winning ticket!';
            if (this.resultTitle) this.resultTitle.textContent = '🎫 The winning ticket is:';
            if (this.wheel) this.wheel.classList.add('raffle-mode');
        } else if (this.currentMode === 'questions') {
            if (this.questionsSection) this.questionsSection.style.display = 'block';
            if (this.questionsAdminSection) this.questionsAdminSection.style.display = this.isAdminLoggedIn ? 'block' : 'none';
            if (this.mainTitle) this.mainTitle.textContent = 'Quiz Questions';
            if (this.mainSubtitle) this.mainSubtitle.textContent = 'View questions by round.';
            if (this.resultTitle) this.resultTitle.textContent = '🎉 The winner is:';
            if (this.wheel) this.wheel.classList.remove('raffle-mode');
            this.updateQuestionsUI();
        } else {
            if (this.quizSection) this.quizSection.style.display = this.isAdminLoggedIn ? 'block' : 'none';
            if (this.mainTitle) this.mainTitle.textContent = 'Quiz Name Randomiser';
            if (this.mainSubtitle) this.mainSubtitle.textContent = 'Enter names and let the wheel decide!';
            if (this.resultTitle) this.resultTitle.textContent = '🎉 The winner is:';
            if (this.wheel) this.wheel.classList.remove('raffle-mode');
        }
        
        if (this.wheelSection) this.wheelSection.style.display = 'none';
        // Hide winner section when switching modes; it only shows after Spin/Draw completes
        if (this.winnerSection) {
            this.winnerSection.style.display = 'none';
            this.winnerSection.style.animation = 'none';
        }
        if (this.resultDisplay) this.resultDisplay.style.display = 'none';
    }
    
    // Raffle functionality
    addRange() {
        const start = parseInt(this.rangeStart.value);
        const end = parseInt(this.rangeEnd.value);
        const description = this.rangeDescription.value.trim();
        
        if (!start || !end) {
            this.showMessage('Please enter both start and end numbers!', 'error');
            return;
        }
        
        if (!description) {
            this.showMessage('Please enter a description for the range!', 'error');
            return;
        }
        
        if (start >= end) {
            this.showMessage('Start number must be less than end number!', 'error');
            return;
        }
        
        if (end - start > 1000) {
            this.showMessage('Range too large! Maximum 1000 numbers per range.', 'error');
            return;
        }
        
        // Check for overlapping ranges with the same description
        for (let range of this.ranges) {
            if (range.description === description && 
                ((start >= range.start && start <= range.end) || 
                 (end >= range.start && end <= range.end) ||
                 (start <= range.start && end >= range.end))) {
                this.showMessage(`This range overlaps with an existing ${description} range! Use a different description for overlapping numbers.`, 'error');
                return;
            }
        }
        
        const range = { start, end, description };
        this.ranges.push(range);
        
        // Add all numbers from this range to the available pool
        for (let i = start; i <= end; i++) {
            this.availableNumbers.push({ number: i, description: description, range: range });
        }
        
        this.rangeStart.value = '';
        this.rangeEnd.value = '';
        this.rangeDescription.value = '';
        
        this.updateRangesList();
        this.updateRaffleSpinButton();
        
        // Check if this range overlaps with existing ranges of different descriptions
        const overlappingRanges = this.ranges.filter(range => 
            range.description !== description && 
            ((start >= range.start && start <= range.end) || 
             (end >= range.start && end <= range.end) ||
             (start <= range.start && end >= range.end))
        );
        
        if (overlappingRanges.length > 0) {
            this.showMessage(`Added ${description} range ${start}-${end}! (${end - start + 1} tickets) - Overlaps with ${overlappingRanges.length} other description range(s)`, 'success');
        } else {
            this.showMessage(`Added ${description} range ${start}-${end}! (${end - start + 1} tickets)`, 'success');
        }
    }
    
    removeRange(rangeToRemove) {
        this.ranges = this.ranges.filter(range => 
            !(range.start === rangeToRemove.start && range.end === rangeToRemove.end && range.description === rangeToRemove.description)
        );
        
        // Remove all numbers from this specific range (with description) from the available pool
        this.availableNumbers = this.availableNumbers.filter(num => 
            !(num.range.start === rangeToRemove.start && num.range.end === rangeToRemove.end && num.range.description === rangeToRemove.description)
        );
        
        this.updateRangesList();
        this.updateRaffleSpinButton();
        this.showMessage(`Removed ${rangeToRemove.description} range ${rangeToRemove.start}-${rangeToRemove.end}!`, 'info');
    }
    
    clearAllRanges() {
        if (this.ranges.length === 0) {
            this.showMessage('No ranges to clear!', 'info');
            return;
        }
        
        if (confirm('Are you sure you want to clear all ranges?')) {
            this.ranges = [];
            this.availableNumbers = []; // Clear the available numbers pool
            this.updateRangesList();
            this.updateRaffleSpinButton();
            this.showMessage('All ranges cleared!', 'info');
        }
    }
    
    updateRangesList() {
        if (this.ranges.length === 0) {
            this.rangesList.innerHTML = '<p class="empty-message">No ranges added yet. Add some number ranges to get started!</p>';
            return;
        }
        
        this.rangesList.innerHTML = this.ranges.map(range => 
            `<span class="range-tag" style="background: linear-gradient(135deg, #6b46c1 0%, #8b5cf6 100%);">
                ${range.start}-${range.end} (${range.description})
                <button class="remove-btn" onclick="nameRandomiser.removeRange(${JSON.stringify(range).replace(/"/g, '&quot;')})" title="Remove">×</button>
            </span>`
        ).join('');
    }
    
    updateRaffleSpinButton() {
        this.spinRaffleBtn.disabled = this.availableNumbers.length === 0 || this.isSpinning || !this.isAdminLoggedIn;
        
        // Update button text to show remaining tickets
        if (this.availableNumbers.length > 0) {
            this.spinRaffleBtn.textContent = `🎫 Draw Ticket! (${this.availableNumbers.length} left)`;
        } else {
            this.spinRaffleBtn.textContent = '🎫 Draw Ticket!';
        }
    }
    
    startRaffleSpin() {
        if (this.availableNumbers.length === 0) {
            this.showMessage('No tickets left to draw!', 'error');
            return;
        }
        
        if (this.isSpinning) {
            return;
        }
        
        this.isSpinning = true;
        this.selectedNumber = this.availableNumbers[Math.floor(Math.random() * this.availableNumbers.length)];
        this.updateRaffleSpinButton();
        
        // Show wheel section and hide winner section initially
        this.wheelSection.style.display = 'block';
        if (this.winnerSection) {
            this.winnerSection.style.display = 'none';
            this.winnerSection.style.animation = 'none';
        }
        if (this.resultDisplay) {
            this.resultDisplay.style.display = 'none';
            this.resultDisplay.style.animation = 'none';
        }
        this.wheelSection.scrollIntoView({ behavior: 'smooth' });
        
        // Start the spinning animation
        this.animateRaffleSpin(this.availableNumbers);
        
        // Play countdown audio
        this.playCountdownAudio();
        
        this.showMessage('Drawing ticket... Good luck!', 'info');
    }
    
    animateRaffleSpin(allNumbers) {
        let totalTime = 0;
        const targetTime = 7000; // 5 seconds
        const updateInterval = 50; // Update every 50ms for smooth animation
        
        // Add spinning class to wheel
        this.wheel.classList.add('spinning');
        
        // Start the synchronized number cycling
        this.spinInterval = setInterval(() => {
            totalTime += updateInterval;
            
            if (totalTime >= targetTime) {
                this.stopRaffleSpin();
                return;
            }
            
            // Calculate progress (0 to 1)
            const progress = totalTime / targetTime;
            
            // Use the same cubic ease-out as the CSS animation
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            // Calculate rotation speed - starts fast, slows down
            const totalRotations = 10;
            const rotationSpeed = totalRotations * easeOut;
            
            // Calculate how many numbers to cycle through based on wheel rotation
            const numbersPerRotation = allNumbers.length;
            const totalNumbersToShow = rotationSpeed * numbersPerRotation;
            
            // For the final rotation, ensure we continue scrolling smoothly
            let currentIndex;
            if (progress > 0.90) {
                // In the final 10% of the animation, slow down significantly
                const finalProgress = (progress - 0.90) / 0.1; // 0 to 1 in final 10%
                const selectedIndex = allNumbers.findIndex(item => 
                    item.number === this.selectedNumber.number && item.color === this.selectedNumber.color
                );
                
                // Calculate how many numbers to show in the final rotation
                const finalNumbersToShow = totalNumbersToShow + (finalProgress * numbersPerRotation);
                currentIndex = Math.floor(finalNumbersToShow) % allNumbers.length;
                
                // In the very last moments, ensure we're showing the selected number
                if (finalProgress > 0.99) {
                    currentIndex = selectedIndex;
                }
            } else {
                // Normal cycling for the first 90% of the animation
                currentIndex = Math.floor(totalNumbersToShow) % allNumbers.length;
            }
            
            const currentNumber = allNumbers[currentIndex];
            this.currentName.textContent = `${currentNumber.number} ${currentNumber.description}`;
            this.currentName.style.color = 'white';
            
        }, updateInterval);
    }
    
    stopRaffleSpin() {
        clearInterval(this.spinInterval);
        
        // Stop countdown audio
        this.stopCountdownAudio();
        
        // Remove spinning class
        this.wheel.classList.remove('spinning');
        
        // Show the selected number
        this.currentName.textContent = `${this.selectedNumber.number} ${this.selectedNumber.description}`;
        this.currentName.style.color = 'white';
        this.winnerName.textContent = `${this.selectedNumber.number} ${this.selectedNumber.description}`;
        this.winnerName.style.color = 'white';
        
        // Remove the drawn number from the available pool
        this.availableNumbers = this.availableNumbers.filter(num => 
            !(num.number === this.selectedNumber.number && num.description === this.selectedNumber.description)
        );
        
        // Show result immediately after spin stops
        this.isSpinning = false;
        this.updateRaffleSpinButton();
        
        // Show winner section instantly
        if (this.winnerSection) {
            this.winnerSection.style.display = 'block';
            this.winnerSection.style.animation = 'none';
        }
        
        if (this.resultDisplay) {
            this.resultDisplay.style.display = 'block';
            this.resultDisplay.style.animation = 'none';
        }
        const remainingCount = this.availableNumbers.length;
        this.showMessage(`🎫 Ticket ${this.selectedNumber.number} is the winner! (${remainingCount} tickets remaining)`, 'success');
        this.wheelSection.style.display = 'none';
        // Play the number audio
        this.playNumberAudio(this.selectedNumber.number);
    }
    
    // Login system
    handleLogin() {
        const enteredPassword = this.adminPasswordInput.value.trim();
        
        if (enteredPassword === this.adminPassword) {
            this.isAdminLoggedIn = true;
            this.updateLoginUI();
            this.updateButtonStates();
            this.claimController();
            this.showMessage('Admin access granted! You are now the controller.', 'success');
        } else {
            this.showMessage('Invalid password!', 'error');
            this.adminPasswordInput.value = '';
        }
    }
    
    handleLogout() {
        this.isAdminLoggedIn = false;
        this.releaseController();
        this.updateLoginUI();
        this.updateButtonStates();
        this.adminPasswordInput.value = '';
        this.showMessage('Logged out - View only mode', 'info');
    }
    
    updateLoginUI() {
        if (this.isAdminLoggedIn) {
            this.loginBtn.style.display = 'none';
            this.logoutBtn.style.display = 'inline-block';
            this.adminPasswordInput.style.display = 'none';
            this.loginStatus.innerHTML = '<span class="status-text admin">Admin Mode - Full Access</span>';
            this.showInputSections();
        } else {
            this.loginBtn.style.display = 'inline-block';
            this.logoutBtn.style.display = 'none';
            this.adminPasswordInput.style.display = 'inline-block';
            this.loginStatus.innerHTML = '<span class="status-text view-only">View Only Mode</span>';
            this.hideInputSections();
        }
    }
    
    showInputSections() {
        if (this.modeToggle) this.modeToggle.style.display = 'block';
        if (this.wheelSection) this.wheelSection.style.display = 'block';
        
        if (this.currentMode === 'raffle') {
            if (this.quizSection) this.quizSection.style.display = 'none';
            if (this.raffleSection) this.raffleSection.style.display = 'block';
            if (this.questionsSection) this.questionsSection.style.display = 'none';
        } else if (this.currentMode === 'questions') {
            if (this.quizSection) this.quizSection.style.display = 'none';
            if (this.raffleSection) this.raffleSection.style.display = 'none';
            if (this.questionsSection) this.questionsSection.style.display = 'block';
            if (this.questionsAdminSection) this.questionsAdminSection.style.display = 'block';
            this.updateQuestionsUI();
        } else {
            if (this.quizSection) this.quizSection.style.display = 'block';
            if (this.raffleSection) this.raffleSection.style.display = 'none';
            if (this.questionsSection) this.questionsSection.style.display = 'none';
        }
        
        if (this.winnerSection) this.winnerSection.style.display = 'none';
        document.body.classList.remove('view-only-mode');
    }
    
    hideInputSections() {
        if (this.quizSection) this.quizSection.style.display = 'none';
        if (this.raffleSection) this.raffleSection.style.display = 'none';
        if (this.questionsAdminSection) this.questionsAdminSection.style.display = 'none';
        if (this.modeToggle) this.modeToggle.style.display = 'none';
        
        if (this.wheelSection) this.wheelSection.style.display = 'block';
        if (this.winnerSection) this.winnerSection.style.display = 'none';
        
        document.body.classList.add('view-only-mode');
    }
    
    updateButtonStates() {
        this.updateSpinButton();
        this.updateRaffleSpinButton();
    }
    
    // Firebase integration
    initializeFirebase() {
        // Wait for Firebase to be available
        const checkFirebase = () => {
            if (window.firebaseDatabase && window.firebaseRef && window.firebaseOnValue && window.firebaseSet) {
                this.setupFirebaseListeners();
            } else {
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    }
    
    setupFirebaseListeners() {
        try {
            const database = window.firebaseDatabase;
            const ref = window.firebaseRef;
            const onValue = window.firebaseOnValue;
            const set = window.firebaseSet;
            
            // Clear any existing spinning state on page load
            this.clearSpinningState();
            
            // Listen for game state changes
            const gameStateRef = ref(database, 'gameState');
            onValue(gameStateRef, (snapshot) => {
                const data = snapshot.val();
                console.log('Firebase listener triggered:', data);
                if (data) {
                    this.syncData = data;
                    this.handleSyncUpdate(data);
                }
            });
            
            // Listen for controller status
            const controllerRef = ref(database, 'controller');
            onValue(controllerRef, (snapshot) => {
                const controllerData = snapshot.val();
                if (controllerData) {
                    this.updateControllerStatus(controllerData);
                }
            });
            
            // Listen for questions state (revealed rounds)
            const questionsStateRef = ref(database, 'questionsState');
            onValue(questionsStateRef, (snapshot) => {
                const data = snapshot.val();
                this.revealedRounds = (data && Array.isArray(data.revealedRounds)) ? data.revealedRounds : [];
                if (this.currentMode === 'questions') this.updateQuestionsUI();
            });
            
            this.firebaseConnected = true;
            this.updateSyncStatus('connected', '🟢 Connected');
            
        } catch (error) {
            console.log('Firebase connection failed:', error);
            this.updateSyncStatus('disconnected', '🔴 Disconnected');
        }
    }
    
    clearSpinningState() {
        // Clear any existing spinning state in Firebase to prevent auto-spin on page load
        if (window.firebaseSet && window.firebaseRef) {
            const database = window.firebaseDatabase;
            const ref = window.firebaseRef;
            const set = window.firebaseSet;
            
            const clearState = {
                isSpinning: false,
                currentMode: this.currentMode,
                selectedName: null,
                selectedNumber: null,
                availableNumbers: [],
                timestamp: Date.now()
            };
            
            console.log('Clearing spinning state on page load');
            set(ref(database, 'gameState'), clearState);
        }
    }
    
    handleSyncUpdate(data) {
        console.log('Sync update received:', { 
            isSpinning: data.isSpinning, 
            currentMode: data.currentMode, 
            initialLoad: this.initialLoad,
            isController: this.isController,
            hasSelectedName: !!data.selectedName,
            hasSelectedNumber: !!data.selectedNumber
        });
        
        // Mark that initial load is complete on first update
        if (this.initialLoad) {
            console.log('Initial load complete, now ready to sync');
            this.initialLoad = false;
            
            // If there's old spinning data on initial load, ignore it
            if (data.isSpinning) {
                console.log('Ignoring old spinning data on initial load');
                return;
            }
        }
        
        // Only start spinning if there's actual spin data and we're not already spinning
        if (data.isSpinning && !this.isSpinning && (data.selectedName || data.selectedNumber)) {
            console.log('Starting sync spin for viewer');
            this.startSyncSpin(data);
        } else if (!data.isSpinning && this.isSpinning) {
            console.log('Stopping sync spin for viewer');
            this.stopSyncSpin(data);
        }
        
        // Sync mode
        if (data.currentMode !== undefined && data.currentMode !== this.currentMode) {
            console.log('Mode change detected:', { 
                from: this.currentMode, 
                to: data.currentMode, 
                isController: this.isController 
            });
            this.currentMode = data.currentMode;
            this.updateModeButtons();
            if (this.isController) {
                console.log('Controller updating mode UI');
                this.updateModeDisplay();
            } else {
                console.log('Viewer updating mode UI');
                this.updateModeUI();
            }
        }
    }
    
    startSyncSpin(data) {
        this.isSpinning = true;
        this.selectedName = data.selectedName;
        this.selectedNumber = data.selectedNumber;
        
        // Show wheel and hide winner section
        this.wheelSection.style.display = 'block';
        if (this.winnerSection) {
            this.winnerSection.style.display = 'none';
            this.winnerSection.style.animation = 'none';
        }
        if (this.resultDisplay) {
            this.resultDisplay.style.display = 'none';
            this.resultDisplay.style.animation = 'none';
        }
        
        // Start animation based on mode
        if (data.currentMode === 'quiz') {
            this.animateSpin();
        } else {
            this.animateRaffleSpin(data.availableNumbers || []);
        }
        
        // Play countdown audio
        this.playCountdownAudio();
        
        this.updateButtonStates();
    }
    
    stopSyncSpin(data) {
        this.isSpinning = false;
        
        // Stop countdown audio
        this.stopCountdownAudio();
        
        // Remove spinning class
        this.wheel.classList.remove('spinning');
        
        // Show the selected result
        if (data.currentMode === 'quiz') {
            this.currentName.textContent = data.selectedName;
            this.winnerName.textContent = data.selectedName;
        } else {
            this.currentName.textContent = `${data.selectedNumber.number} ${data.selectedNumber.description}`;
            this.currentName.style.color = 'white';
            this.winnerName.textContent = `${data.selectedNumber.number} ${data.selectedNumber.description}`;
            this.winnerName.style.color = 'white';
        }
        
        // Show result immediately after spin stops
        // Show winner section instantly
        if (this.winnerSection) {
            this.winnerSection.style.display = 'block';
            this.winnerSection.style.animation = 'none';
        }
        
        if (this.resultDisplay) {
            this.resultDisplay.style.display = 'block';
            this.resultDisplay.style.animation = 'none';
        }
        
        this.updateButtonStates();
        
        // Play number audio for raffle
        if (data.currentMode === 'raffle' && data.selectedNumber) {
            this.playNumberAudio(data.selectedNumber.number);
        }
    }
    
    updateModeUI() {
        // Update UI for viewers without showing input sections
        this.updateModeButtons();
        if (this.winnerSection) this.winnerSection.style.display = 'none';
        if (this.currentMode === 'raffle') {
            if (this.mainTitle) this.mainTitle.textContent = 'Raffle Ticket Draw';
            if (this.mainSubtitle) this.mainSubtitle.textContent = 'Enter number ranges and draw a winning ticket!';
            if (this.resultTitle) this.resultTitle.textContent = '🎫 The winning ticket is:';
            if (this.wheel) this.wheel.classList.add('raffle-mode');
        } else if (this.currentMode === 'questions') {
            if (this.mainTitle) this.mainTitle.textContent = 'Quiz Questions';
            if (this.mainSubtitle) this.mainSubtitle.textContent = 'View questions by round.';
            if (this.resultTitle) this.resultTitle.textContent = '🎉 The winner is:';
            if (this.wheel) this.wheel.classList.remove('raffle-mode');
            if (this.questionsSection) this.questionsSection.style.display = 'block';
            if (this.questionsAdminSection) this.questionsAdminSection.style.display = 'none';
            this.updateQuestionsUI();
        } else {
            if (this.mainTitle) this.mainTitle.textContent = 'Quiz Name Randomiser';
            if (this.mainSubtitle) this.mainSubtitle.textContent = 'Enter names and let the wheel decide!';
            if (this.resultTitle) this.resultTitle.textContent = '🎉 The winner is:';
            if (this.wheel) this.wheel.classList.remove('raffle-mode');
        }
    }
    
    updateControllerStatus(controllerData) {
        // Check if this device should be the controller
        if (this.isAdminLoggedIn && !controllerData.currentController) {
            this.claimController();
        } else if (!this.isAdminLoggedIn && this.isController) {
            this.releaseController();
        }
    }
    
    claimController() {
        if (window.firebaseSet && window.firebaseRef) {
            const database = window.firebaseDatabase;
            const ref = window.firebaseRef;
            const set = window.firebaseSet;
            
            this.isController = true;
            set(ref(database, 'controller'), {
                currentController: true,
                timestamp: Date.now()
            });
        }
    }
    
    releaseController() {
        if (window.firebaseSet && window.firebaseRef) {
            const database = window.firebaseDatabase;
            const ref = window.firebaseRef;
            const set = window.firebaseSet;
            
            this.isController = false;
            set(ref(database, 'controller'), {
                currentController: false,
                timestamp: Date.now()
            });
        }
    }
    
    updateSyncStatus(status, text) {
        if (this.syncStatus) {
            this.syncStatus.innerHTML = `<span class="sync-text ${status}">${text}</span>`;
        }
    }
    
    // Override spin methods to sync with Firebase
    startSpin() {
        if (this.names.length < 2) {
            this.showMessage('Please add at least 2 names to spin!', 'error');
            return;
        }
        
        if (this.isSpinning) {
            return;
        }
        
        if (!this.isController) {
            this.showMessage('Only the controller can start spins!', 'error');
            return;
        }
        
        this.isSpinning = true;
        this.selectedName = this.names[Math.floor(Math.random() * this.names.length)];
        this.updateButtonStates();
        
        // Sync to Firebase
        this.syncGameState();
        
        // Show wheel and hide winner section
        this.wheelSection.style.display = 'block';
        if (this.winnerSection) {
            this.winnerSection.style.display = 'none';
            this.winnerSection.style.animation = 'none';
        }
        if (this.resultDisplay) {
            this.resultDisplay.style.display = 'none';
            this.resultDisplay.style.animation = 'none';
        }
        this.wheelSection.scrollIntoView({ behavior: 'smooth' });
        
        // Start the spinning animation
        this.animateSpin();
        
        // Play countdown audio
        this.playCountdownAudio();
        
        this.showMessage('Spinning... Good luck!', 'info');
    }
    
    startRaffleSpin() {
        if (this.availableNumbers.length === 0) {
            this.showMessage('No tickets left to draw!', 'error');
            return;
        }
        
        if (this.isSpinning) {
            return;
        }
        
        if (!this.isController) {
            this.showMessage('Only the controller can start spins!', 'error');
            return;
        }
        
        this.isSpinning = true;
        this.selectedNumber = this.availableNumbers[Math.floor(Math.random() * this.availableNumbers.length)];
        this.updateRaffleSpinButton();
        
        // Sync to Firebase
        this.syncGameState();
        
        // Show wheel and hide winner section
        this.wheelSection.style.display = 'block';
        if (this.winnerSection) {
            this.winnerSection.style.display = 'none';
            this.winnerSection.style.animation = 'none';
        }
        if (this.resultDisplay) {
            this.resultDisplay.style.display = 'none';
            this.resultDisplay.style.animation = 'none';
        }
        this.wheelSection.scrollIntoView({ behavior: 'smooth' });
        
        // Start the spinning animation
        this.animateRaffleSpin(this.availableNumbers);
        
        // Play countdown audio
        this.playCountdownAudio();
        
        this.showMessage('Drawing ticket... Good luck!', 'info');
    }
    
    syncGameState() {
        if (window.firebaseSet && window.firebaseRef && this.isController) {
            const database = window.firebaseDatabase;
            const ref = window.firebaseRef;
            const set = window.firebaseSet;
            
            const gameState = {
                isSpinning: this.isSpinning,
                currentMode: this.currentMode,
                selectedName: this.selectedName,
                selectedNumber: this.selectedNumber,
                availableNumbers: this.availableNumbers,
                timestamp: Date.now()
            };
            
            set(ref(database, 'gameState'), gameState);
        }
    }
    
    toggleLoginSection() {
        console.log('Logo clicked!'); // Debug log
        if (this.loginSection) {
            const isVisible = this.loginSection.style.display !== 'none';
            console.log('Login section currently visible:', isVisible); // Debug log
            this.loginSection.style.display = isVisible ? 'none' : 'block';
            console.log('Login section display set to:', this.loginSection.style.display); // Debug log
        } else {
            console.log('Login section not found!'); // Debug log
        }
    }
    
    setupWinnerClickHandler() {
        if (this.winnerSection) {
            this.winnerSection.addEventListener('click', () => {
                // Only allow dismissal if admin is logged in
                if (this.isAdminLoggedIn) {
                    this.winnerSection.style.display = 'none';
                }
            });
        }
    }
}

// Add CSS animations for messages
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);

// Initialize the application
let nameRandomiser;
document.addEventListener('DOMContentLoaded', () => {
    nameRandomiser = new NameRandomiser();
});
