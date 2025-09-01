class NameRandomiser {
    constructor() {
        console.log('=== NameRandomiser constructor called ===');
        console.log('Constructor call stack:', new Error().stack.split('\n').slice(1, 4).join('\n'));
        this.names = [];
        this.ranges = [];
        this.availableNumbers = []; // Pool of available numbers for raffle
        this.isSpinning = false;
        this.selectedName = '';
        this.selectedNumber = '';
        this.spinInterval = null;
        this.speedInterval = null;
        this.audio = null;
        this.currentMode = 'quiz'; // 'quiz' or 'raffle'
        this.isAdminLoggedIn = false;
        this.adminPassword = 'tequiz2025'; // Change this to your desired password
        this.isController = false; // True if this device controls the game
        this.firebaseConnected = false;
        this.syncData = null;
        this.initialLoad = true; // Flag to prevent auto-spin on first load
        this.audioPlaying = false; // Flag to prevent multiple audio plays
        
        this.initializeElements();
        this.bindEvents();
        this.loadPredefinedNames();
        this.initializeAudio();
        this.initializeRaffleAudio();
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
        
        // Ensure spin button is hidden and disabled initially in raffle mode
        if (this.spinBtn && this.currentMode === 'raffle') {
            this.spinBtn.style.display = 'none';
            this.spinBtn.disabled = true;
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
        this.resultDisplay = document.getElementById('resultDisplay');
        this.wheel = document.getElementById('wheel');
        this.currentName = document.getElementById('currentName');
        this.winnerName = document.getElementById('winnerName');
        this.mainTitle = document.getElementById('mainTitle');
        this.mainSubtitle = document.getElementById('mainSubtitle');
        this.resultTitle = document.getElementById('resultTitle');
        this.modeToggle = document.getElementById('modeToggle');
        this.modeToggleCheckbox = document.getElementById('modeToggleCheckbox');
        this.quizSection = document.getElementById('quizSection');
        this.raffleSection = document.getElementById('raffleSection');
        
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
        this.spinBtn.addEventListener('click', () => {
            console.log('=== Quiz spin button clicked ===');
            console.log('Current mode:', this.currentMode);
            console.log('Button disabled:', this.spinBtn.disabled);
            console.log('Button display:', this.spinBtn.style.display);
            
            // Prevent action if button is disabled
            if (this.spinBtn.disabled) {
                console.log('Quiz spin button is disabled, ignoring click');
                return;
            }
            
            // Call the appropriate method based on current mode
            if (this.currentMode === 'raffle') {
                console.log('Quiz button clicked in raffle mode - calling startRaffleSpin');
                this.startRaffleSpin();
            } else {
                console.log('Quiz button clicked in quiz mode - calling startSpin');
                this.startSpin();
            }
        });
        
        // Raffle events
        this.addRangeBtn.addEventListener('click', () => this.addRange());
        this.clearRangesBtn.addEventListener('click', () => this.clearAllRanges());
        this.spinRaffleBtn.addEventListener('click', () => {
            console.log('=== Raffle spin button clicked ===');
            console.log('Current mode:', this.currentMode);
            console.log('Button disabled:', this.spinRaffleBtn.disabled);
            console.log('Button display:', this.spinRaffleBtn.style.display);
            this.startRaffleSpin();
        });
        
        // Mode toggle
        this.modeToggleCheckbox.addEventListener('change', () => this.toggleMode());
        
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
        // Safety check - prevent quiz spin in raffle mode
        if (this.currentMode === 'raffle') {
            console.log('Quiz spin attempted in raffle mode - redirecting to raffle spin');
            this.startRaffleSpin();
            return;
        }
        
        console.log('startSpin called in quiz mode');
        
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
        //this.playCountdownAudio();
        
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
        
        // Stop any playing audio based on current mode
        if (this.currentMode === 'raffle') {
            this.stopRaffleCountdownAudio();
        } else {
            this.stopCountdownAudio();
        }
        
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
        
        // Start new spin based on current mode
        setTimeout(() => {
            if (this.currentMode === 'raffle') {
                this.startRaffleSpin();
            } else {
                this.startSpin();
            }
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
        console.log('=== initializeAudio called ===');
        // Initialize the countdown audio with cache-busting timestamp
        const timestamp = Date.now();
        const audioUrl = `countdown-cut.mp3?t=${timestamp}`;
        this.audio = new Audio(audioUrl);
        console.log('Created new quiz audio object:', this.audio);
        console.log('Quiz audio source:', this.audio.src);
        console.log('Cache-busting URL:', audioUrl);
        
        this.audio.preload = 'auto';
        this.audio.volume = 0.7; // Set volume to 70%
        
        // Handle audio loading errors gracefully
        this.audio.addEventListener('error', (e) => {
            console.log('❌ Quiz audio file not found or failed to load:', e);
            this.showMessage('Audio file not found - spinning will continue without sound', 'info');
        });
        
        this.audio.addEventListener('ended', () => {
            console.log('🏁 Quiz audio ended naturally');
            this.audioPlaying = false;
        });
        
        // Add event listeners to track quiz audio state
        this.audio.addEventListener('play', () => {
            console.log('🎵 Quiz countdown audio started playing');
        });
        
        this.audio.addEventListener('playing', () => {
            console.log('🎵 Quiz countdown audio is now playing');
        });
        
        this.audio.addEventListener('pause', () => {
            console.log('⏸️ Quiz countdown audio paused');
        });
        
        console.log('Quiz audio initialization complete');
    }

    initializeRaffleAudio() {
        console.log('=== initializeRaffleAudio called ===');
        // Initialize the raffle audio with cache-busting timestamp
        const timestamp = Date.now();
        const audioUrl = `raffledraw.mp3?t=${timestamp}`;
        this.raffleAudio = new Audio(audioUrl);
        console.log('Created new raffle audio object:', this.raffleAudio);
        console.log('Audio source:', this.raffleAudio.src);
        console.log('Audio file path:', this.raffleAudio.src);
        console.log('Cache-busting URL:', audioUrl);
        
        this.raffleAudio.preload = 'auto';
        this.raffleAudio.volume = 0.7; // Set volume to 70%
        
        // Add event listeners to track raffle audio state
        this.raffleAudio.addEventListener('loadstart', () => {
            console.log('🔄 Raffle audio load started');
        });
        
        this.raffleAudio.addEventListener('canplay', () => {
            console.log('✅ Raffle audio can play');
        });
        
        this.raffleAudio.addEventListener('loadmetadata', () => {
            console.log('📊 Raffle audio metadata loaded - Duration:', this.raffleAudio.duration);
        });
        
        this.raffleAudio.addEventListener('play', () => {
            console.log('🎵 Raffle audio started playing');
        });
        
        this.raffleAudio.addEventListener('playing', () => {
            console.log('🎵 Raffle audio is now playing');
        });
        
        this.raffleAudio.addEventListener('pause', () => {
            console.log('⏸️ Raffle audio paused');
        });
        
        this.raffleAudio.addEventListener('ended', () => {
            console.log('🏁 Raffle audio ended naturally');
            this.audioPlaying = false;
        });
        
        this.raffleAudio.addEventListener('error', (e) => {
            console.log('❌ Raffle audio file not found or failed to load:', e);
            console.log('Error details:', e.target.error);
            this.showMessage('Raffle audio file not found - spinning will continue without sound', 'info');
        });
        
        console.log('Raffle audio initialization complete');
    }
    

    
    playCountdownAudio() {
        /* console.log('=== playCountdownAudio called ===');
        console.log('Called from:', new Error().stack.split('\n')[2].trim());
        console.log('audioPlaying flag:', this.audioPlaying);
        console.log('quiz audio exists:', !!this.audio);
        console.log('currentMode:', this.currentMode);
        console.log('isSpinning:', this.isSpinning);
        
        // CRITICAL FIX: Mute the raffle audio to prevent it from playing simultaneously
        if (this.raffleAudio) {
            console.log('🔇 Muting raffle audio to prevent interference');
            this.raffleAudio.volume = 0;
            this.raffleAudio.muted = true;
        }
        
        if (this.audio && !this.audioPlaying) {
            console.log('Setting audioPlaying = true and starting quiz countdown playback');
            this.audioPlaying = true;
            
            try {
                console.log('Resetting quiz audio to beginning and starting playback...');
                this.audio.currentTime = 0; // Reset to beginning
                this.audio.play().then(() => {
                    console.log('✅ Quiz countdown audio play() promise resolved successfully');
                }).catch(error => {
                    console.log('❌ Quiz countdown audio playback failed:', error);
                    this.audioPlaying = false;
                    // Continue without audio if playback fails
                });
            } catch (error) {
                console.log('❌ Quiz countdown audio error:', error);
                this.audioPlaying = false;
            }
        } else if (this.audioPlaying) {
            console.log('🚫 Quiz countdown audio already playing, ignoring call');
        } else if (!this.audio) {
            console.log('❌ No quiz audio object available');
        } */
    }

    playRaffleCountdownAudio() {
        /* console.log('=== playRaffleCountdownAudio called ===');
        console.log('Called from:', new Error().stack.split('\n')[2].trim());
        console.log('audioPlaying flag:', this.audioPlaying);
        console.log('raffleAudio exists:', !!this.raffleAudio);
        
        // CRITICAL FIX: Stop ALL audio before starting raffle audio
        console.log('🛑 CRITICAL: Stopping ALL audio before starting raffle audio');
        this.stopAllAudio();
        
        // DEBUG: Show exactly what audio files we have
        console.log('🔍 DEBUG: Current audio sources:');
        console.log('Quiz audio src:', this.audio ? this.audio.src : 'null');
        console.log('Raffle audio src:', this.raffleAudio ? this.raffleAudio.src : 'null');
        
        // DEBUG: Check if quiz audio is somehow still playing
        if (this.audio) {
            console.log('🔍 Quiz audio state:', {
                paused: this.audio.paused,
                currentTime: this.audio.currentTime,
                volume: this.audio.volume,
                muted: this.audio.muted,
                readyState: this.audio.readyState
            });
        }
        
        if (this.raffleAudio && !this.audioPlaying) {
            console.log('Setting audioPlaying = true and starting playback');
            this.audioPlaying = true;
            
            try {
                console.log('Resetting audio to beginning and starting playback...');
                this.raffleAudio.currentTime = 0; // Reset to beginning
                this.raffleAudio.play().then(() => {
                    console.log('✅ Raffle audio play() promise resolved successfully');
                    // DEBUG: Verify what's actually playing
                    console.log('🔍 After play() - Raffle audio state:', {
                        src: this.raffleAudio.src,
                        paused: this.raffleAudio.paused,
                        currentTime: this.raffleAudio.currentTime,
                        volume: this.raffleAudio.volume
                    });
                }).catch(error => {
                    console.log('❌ Raffle audio playback failed:', error);
                    this.audioPlaying = false;
                    // Continue without audio if playback fails
                });
            } catch (error) {
                console.log('❌ Raffle audio error:', error);
                this.audioPlaying = false;
            }
        } else if (this.audioPlaying) {
            console.log('🚫 Raffle audio already playing, ignoring call');
        } else if (!this.raffleAudio) {
            console.log('❌ No raffle audio object available');
        }*/
    }
    
    stopCountdownAudio() {
        console.log('=== stopCountdownAudio called ===');
        console.log('Called from:', new Error().stack.split('\n')[2].trim());
        console.log('Current time:', Date.now());
        console.log('isSpinning:', this.isSpinning);
        console.log('currentMode:', this.currentMode);
        
        if (this.audio) {
            try {
                console.log('🛑 Pausing quiz audio');
                this.audio.pause();
                this.audio.currentTime = 0;
                this.audioPlaying = false;
                console.log('✅ Quiz audio paused successfully');
            } catch (error) {
                console.log('❌ Quiz audio stop error:', error);
                this.audioPlaying = false;
            }
        }
        
        // Restore raffle audio volume when quiz audio stops
        if (this.raffleAudio) {
            console.log('🔊 Restoring raffle audio volume');
            this.raffleAudio.volume = 0.7;
            this.raffleAudio.muted = false;
        }
    }

    stopRaffleCountdownAudio() {
        console.log('=== stopRaffleCountdownAudio called ===');
        console.log('Called from:', new Error().stack.split('\n')[2].trim());
        console.log('Current time:', Date.now());
        console.log('isSpinning:', this.isSpinning);
        console.log('currentMode:', this.currentMode);
        
        if (this.raffleAudio) {
            try {
                console.log('🛑 Pausing raffle audio');
                this.raffleAudio.pause();
                this.raffleAudio.currentTime = 0;
                this.audioPlaying = false;
                console.log('✅ Raffle audio paused successfully');
            } catch (error) {
                console.log('❌ Raffle audio stop error:', error);
                this.audioPlaying = false;
            }
        }
        
        // Restore quiz audio volume when raffle audio stops
        if (this.audio) {
            console.log('🔊 Restoring quiz audio volume');
            this.audio.volume = 0.7;
            this.audio.muted = false;
        }
    }
    
    // Mode switching
    toggleMode() {
        console.log('toggleMode called, checkbox checked:', this.modeToggleCheckbox.checked);
        this.currentMode = this.modeToggleCheckbox.checked ? 'raffle' : 'quiz';
        
        // CRITICAL FIX: Stop any playing countdown audio when switching to raffle mode
        if (this.currentMode === 'raffle') {
            console.log('🛑 Switching to raffle mode - stopping ALL audio');
            this.stopAllAudio();
            
            // CRITICAL FIX: Keep quiz audio as countdown-cut.mp3 but ensure it's completely stopped
            console.log('🔄 Keeping quiz audio as countdown-cut.mp3 but ensuring it\'s stopped');
            if (this.audio) {
                // Force reload the original countdown audio to ensure it's fresh
                const timestamp = Date.now();
                this.audio.src = `countdown-cut.mp3?t=${timestamp}`;
                this.audio.load(); // Force reload the original audio file
                this.audio.pause(); // Ensure it's paused
                this.audio.currentTime = 0; // Reset to beginning
                this.audio.volume = 0; // Mute it completely
                this.audio.muted = true; // Ensure it's muted
                console.log('✅ Quiz audio kept as countdown-cut.mp3 but completely stopped and muted');
            }
        } else {
            // CRITICAL FIX: Stop all audio when switching back to quiz mode
            console.log('🔄 Switching back to quiz mode - stopping all audio');
            this.stopAllAudio();
            
            // CRITICAL FIX: Restore the quiz audio source to countdown-cut.mp3 when switching back to quiz mode
            console.log('🔄 Restoring quiz audio source to countdown-cut.mp3');
            if (this.audio) {
                const timestamp = Date.now();
                this.audio.src = `countdown-cut.mp3?t=${timestamp}`;
                this.audio.load(); // Force reload the original audio file
                this.audio.volume = 0.7; // Restore volume
                this.audio.muted = false; // Unmute
                console.log('✅ Quiz audio source restored to countdown-cut.mp3 with normal volume');
            }
        }
        
        this.updateModeDisplay();
        
        // Sync mode change to all devices immediately (only for user-initiated changes)
        this.syncGameState();
    }
    
    updateModeDisplay() {
        if (this.currentMode === 'raffle') {
            if (this.quizSection) this.quizSection.style.display = 'none';
            // Only show raffle section if admin is logged in
            if (this.raffleSection) this.raffleSection.style.display = this.isAdminLoggedIn ? 'block' : 'none';
            if (this.mainTitle) this.mainTitle.textContent = 'Raffle Ticket Draw';
            if (this.mainSubtitle) this.mainSubtitle.textContent = 'Enter number ranges and draw a winning ticket!';
            if (this.resultTitle) this.resultTitle.textContent = '🎫 The winning ticket is:';
            if (this.wheel) this.wheel.classList.add('raffle-mode');
            // Completely disable and hide the quiz spin button in raffle mode
            if (this.spinBtn) {
                this.spinBtn.style.display = 'none';
                this.spinBtn.disabled = true;
            }
        } else {
            // Only show quiz section if admin is logged in
            if (this.quizSection) this.quizSection.style.display = this.isAdminLoggedIn ? 'block' : 'none';
            if (this.raffleSection) this.raffleSection.style.display = 'none';
            if (this.mainTitle) this.mainTitle.textContent = 'Quiz Name Randomiser';
            if (this.mainSubtitle) this.mainSubtitle.textContent = 'Enter names and let the wheel decide!';
            if (this.resultTitle) this.resultTitle.textContent = '🎉 The winner is:';
            if (this.wheel) this.wheel.classList.remove('raffle-mode');
            // Enable and show the quiz spin button in quiz mode
            if (this.spinBtn) {
                this.spinBtn.style.display = 'inline-block';
                this.spinBtn.disabled = false;
            }
        }
        
        // Hide result section when switching modes
        if (this.wheelSection) this.wheelSection.style.display = 'none';
        if (this.winnerSection) {
            this.winnerSection.style.display = 'block';
            this.winnerSection.style.animation = 'none';
        }
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
        console.log('startRaffleSpin called - Controller:', this.isController);
        
        if (this.availableNumbers.length === 0) {
            this.showMessage('No tickets left to draw!', 'error');
            return;
        }
        
        if (this.isSpinning) {
            console.log('Already spinning, ignoring');
            return;
        }
        
        if (!this.isController) {
            this.showMessage('Only the controller can start spins!', 'error');
            return;
        }
        
        // CRITICAL FIX: Stop ALL audio before starting raffle spin
        console.log('🛑 CRITICAL: Stopping ALL audio before starting raffle spin');
        this.stopAllAudio();
        
        this.isSpinning = true;
        this.selectedNumber = this.availableNumbers[Math.floor(Math.random() * this.availableNumbers.length)];
        this.updateRaffleSpinButton();
        
        // Sync to Firebase
        this.syncGameState();
        
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
        
        // Check for any other audio elements on the page
        console.log('=== Checking for other audio elements ===');
        const allAudioElements = document.querySelectorAll('audio');
        console.log('Total audio elements on page:', allAudioElements.length);
        allAudioElements.forEach((audio, index) => {
            console.log(`Audio ${index}:`, {
                src: audio.src,
                paused: audio.paused,
                currentTime: audio.currentTime,
                volume: audio.volume
            });
        });
        
        // Check if quiz audio is somehow playing
        console.log('=== Checking quiz audio state ===');
        if (this.audio) {
            console.log('Quiz audio state:', {
                src: this.audio.src,
                paused: this.audio.paused,
                currentTime: this.audio.currentTime,
                volume: this.audio.volume,
                readyState: this.audio.readyState,
                networkState: this.audio.networkState
            });
        }
        
        // Check for any other NameRandomiser instances
        console.log('=== Checking for multiple instances ===');
        if (window.nameRandomiser && window.nameRandomiser !== this) {
            console.log('⚠️ WARNING: Another NameRandomiser instance found!');
            console.log('Other instance:', window.nameRandomiser);
            console.log('Current instance:', this);
            console.log('Other instance audio state:', {
                audio: window.nameRandomiser.audio,
                audioPlaying: window.nameRandomiser.audioPlaying,
                currentMode: window.nameRandomiser.currentMode
            });
        }
        
        // Check for any other JavaScript files or scripts
        console.log('=== Checking for other scripts ===');
        const allScripts = document.querySelectorAll('script');
        console.log('Total scripts on page:', allScripts.length);
        allScripts.forEach((script, index) => {
            console.log(`Script ${index}:`, {
                src: script.src,
                type: script.type,
                textContent: script.textContent ? script.textContent.substring(0, 100) + '...' : 'No content'
            });
        });
        
        // Check for any inline event handlers or onclick attributes
        console.log('=== Checking for inline audio handlers ===');
        const elementsWithOnClick = document.querySelectorAll('[onclick*="audio"], [onclick*="play"], [onclick*="countdown"]');
        console.log('Elements with audio-related onclick:', elementsWithOnClick.length);
        elementsWithOnClick.forEach((el, index) => {
            console.log(`Element ${index}:`, {
                tagName: el.tagName,
                onclick: el.onclick,
                className: el.className
            });
        });
        
        // Play raffle countdown audio
        console.log('=== About to call playRaffleCountdownAudio ===');
        console.log('Current raffleAudio object:', this.raffleAudio);
        console.log('Current audioPlaying flag:', this.audioPlaying);
        console.log('Audio object ID:', this.raffleAudio ? this.raffleAudio.src : 'null');
        
        // CRITICAL CHECK: Verify the actual file being loaded
        console.log('=== CRITICAL AUDIO FILE CHECK ===');
        console.log('Quiz audio file path:', this.audio ? this.audio.src : 'null');
        console.log('Raffle audio file path:', this.raffleAudio ? this.raffleAudio.src : 'null');
        
        // Check if the files are actually different
        if (this.audio && this.raffleAudio) {
            const quizPath = this.audio.src.split('/').pop();
            const rafflePath = this.raffleAudio.src.split('/').pop();
            console.log('Quiz audio filename:', quizPath);
            console.log('Raffle audio filename:', rafflePath);
            console.log('Files are different:', quizPath !== rafflePath);
        }
        
        // CRITICAL CHECK: Verify the actual audio file content
        console.log('=== VERIFYING AUDIO FILE CONTENT ===');
        if (this.raffleAudio) {
            console.log('Raffle audio duration:', this.raffleAudio.duration);
            console.log('Raffle audio readyState:', this.raffleAudio.readyState);
            console.log('Raffle audio networkState:', this.raffleAudio.networkState);
        }
        
        // Check if there are any other audio sources in the browser
        console.log('=== CHECKING BROWSER AUDIO SOURCES ===');
        console.log('All audio contexts:', window.AudioContext || window.webkitAudioContext);
        console.log('All audio elements in document:', document.querySelectorAll('audio, video').length);
        
        // CRITICAL CHECK: Verify if the raffle audio file is actually the correct file
        console.log('=== VERIFYING RAFFLE AUDIO FILE ===');
        if (this.raffleAudio) {
            // Force reload the audio file to ensure we're not getting cached version
            console.log('Forcing raffle audio reload...');
            this.raffleAudio.load();
            
            // Check if the file is actually different from countdown-cut.mp3
            const raffleSrc = this.raffleAudio.src;
            const quizSrc = this.audio ? this.audio.src : '';
            console.log('Raffle audio src after reload:', raffleSrc);
            console.log('Quiz audio src:', quizSrc);
            console.log('Sources are different:', raffleSrc !== quizSrc);
        }
        
        // CRITICAL CHECK: Look for any other audio sources that might be playing
        console.log('=== SEARCHING FOR OTHER AUDIO SOURCES ===');
        
        // Check if there are any other audio objects in memory
        console.log('All global variables containing "audio":', Object.keys(window).filter(key => key.toLowerCase().includes('audio')));
        
        // Check if there are any other audio files being loaded
        console.log('All script tags with audio content:', Array.from(document.querySelectorAll('script')).filter(script => 
            script.textContent && script.textContent.includes('countdown-cut.mp3')
        ).length);
        
        // Check if there are any other audio elements that might be hidden
        console.log('All elements with audio-related attributes:', document.querySelectorAll('[src*="mp3"], [src*="wav"], [src*="audio"]').length);
        
        // CRITICAL CHECK: Verify if the browser is somehow playing the wrong file
        console.log('=== BROWSER AUDIO VERIFICATION ===');
        
        // Check if there are any other audio contexts or sources
        if (window.AudioContext || window.webkitAudioContext) {
            console.log('AudioContext available:', !!window.AudioContext);
            console.log('WebkitAudioContext available:', !!window.webkitAudioContext);
        }
        
        // Check if there are any other audio files in the page source
        console.log('Page source contains countdown-cut.mp3:', document.documentElement.outerHTML.includes('countdown-cut.mp3'));
        console.log('Page source contains raffledraw.mp3:', document.documentElement.outerHTML.includes('raffledraw.mp3'));
        
        // CRITICAL TIMING CHECK: Verify if there's a race condition
        console.log('=== TIMING RACE CONDITION CHECK ===');
        console.log('Current time:', Date.now());
        console.log('Quiz audio paused state:', this.audio ? this.audio.paused : 'N/A');
        console.log('Quiz audio currentTime:', this.audio ? this.audio.currentTime : 'N/A');
        console.log('Quiz audio volume before muting:', this.audio ? this.audio.volume : 'N/A');
        console.log('Quiz audio muted state before muting:', this.audio ? this.audio.muted : 'N/A');
        
        // CRITICAL CHECK: Look for any hidden audio triggers
        console.log('=== HIDDEN AUDIO TRIGGER CHECK ===');
        
        // Check if there are any other event listeners that might trigger audio
        console.log('All elements with event listeners:', document.querySelectorAll('*').length);
        
        // Check if there are any other audio-related methods being called
        console.log('All methods containing "audio" in NameRandomiser:', Object.getOwnPropertyNames(Object.getPrototypeOf(this)).filter(name => name.toLowerCase().includes('audio')));
        
        // Check if there are any other audio-related properties
        console.log('All properties containing "audio" in NameRandomiser:', Object.keys(this).filter(key => key.toLowerCase().includes('audio')));
        
        // CRITICAL CHECK: Look for ANY hidden audio elements in the DOM
        console.log('=== SEARCHING FOR HIDDEN AUDIO ELEMENTS ===');
        
        // Check for audio elements that might be hidden or not visible
        const hiddenAudioElements = document.querySelectorAll('audio');
        console.log('Total hidden audio elements found:', hiddenAudioElements.length);
        hiddenAudioElements.forEach((audio, index) => {
            console.log(`Hidden Audio ${index}:`, {
                src: audio.src,
                paused: audio.paused,
                currentTime: audio.currentTime,
                volume: audio.volume,
                style: {
                    display: audio.style.display,
                    visibility: audio.style.visibility,
                    opacity: audio.style.opacity,
                    position: audio.style.position,
                    left: audio.style.left,
                    top: audio.style.top
                },
                computedStyle: {
                    display: window.getComputedStyle(audio).display,
                    visibility: window.getComputedStyle(audio).visibility,
                    opacity: window.getComputedStyle(audio).opacity
                }
            });
        });
        
        this.playRaffleCountdownAudio();
        
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
            const totalRotations = 7;
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
                    item.number === this.selectedNumber.number && item.description === this.selectedNumber.description
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
        
        // Stop raffle countdown audio
        this.stopRaffleCountdownAudio();
        
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
        // Show toggle and wheel section for admin
        if (this.modeToggle) this.modeToggle.style.display = 'block';
        if (this.wheelSection) this.wheelSection.style.display = 'block';
        
        // Show ONLY the appropriate section based on current mode
        if (this.currentMode === 'raffle') {
            if (this.quizSection) this.quizSection.style.display = 'none';
            if (this.raffleSection) this.raffleSection.style.display = 'block';
            // Completely disable and hide the quiz spin button in raffle mode
            if (this.spinBtn) {
                this.spinBtn.style.display = 'none';
                this.spinBtn.disabled = true;
            }
        } else {
            if (this.quizSection) this.quizSection.style.display = 'block';
            if (this.raffleSection) this.raffleSection.style.display = 'none';
            // Enable and show the quiz spin button in quiz mode
            if (this.spinBtn) {
                this.spinBtn.style.display = 'inline-block';
                this.spinBtn.disabled = false;
            }
        }
        
        // Hide winner section initially
        if (this.winnerSection) this.winnerSection.style.display = 'none';
        
        // Remove view-only mode class
        document.body.classList.remove('view-only-mode');
    }
    
    hideInputSections() {
        // Hide input sections for viewers
        if (this.quizSection) this.quizSection.style.display = 'none';
        if (this.raffleSection) this.raffleSection.style.display = 'none';
        if (this.modeToggle) this.modeToggle.style.display = 'none';
        
        // Show the wheel section
        if (this.wheelSection) this.wheelSection.style.display = 'block';
        
        // Hide winner section initially
        if (this.winnerSection) this.winnerSection.style.display = 'none';
        
        // Add view-only mode class
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
        // AND we're not the controller (to prevent double audio)
        console.log('=== Checking sync conditions ===');
        console.log('data.isSpinning:', data.isSpinning);
        console.log('this.isSpinning:', this.isSpinning);
        console.log('data.selectedName:', !!data.selectedName);
        console.log('data.selectedNumber:', !!data.selectedNumber);
        console.log('!this.isController:', !this.isController);
        console.log('Condition result:', data.isSpinning && !this.isSpinning && (data.selectedName || data.selectedNumber) && !this.isController);
        
        if (data.isSpinning && !this.isSpinning && (data.selectedName || data.selectedNumber) && !this.isController) {
            console.log('✅ Starting sync spin for viewer');
            this.startSyncSpin(data);
        } else if (!data.isSpinning && this.isSpinning && !this.isController) {
            console.log('✅ Stopping sync spin for viewer');
            this.stopSyncSpin(data);
        } else {
            console.log('❌ No sync action taken');
        }
        
        // Sync mode
        if (data.currentMode !== this.currentMode) {
            console.log('Mode change detected:', { 
                from: this.currentMode, 
                to: data.currentMode, 
                isController: this.isController 
            });
            this.currentMode = data.currentMode;
            this.modeToggleCheckbox.checked = data.currentMode === 'raffle';
            // Update mode display for all devices (no sync to avoid loops)
            if (this.isController) {
                console.log('Controller updating mode UI');
                this.updateModeDisplay();
            } else {
                // For viewers, just update the UI without showing input sections
                console.log('Viewer updating mode UI');
                this.updateModeUI();
            }
        }
    }
    
    startSyncSpin(data) {
        console.log('=== startSyncSpin called ===');
        console.log('Controller:', this.isController);
        console.log('Mode:', data.currentMode);
        console.log('Called from:', new Error().stack.split('\n')[2].trim());
        console.log('Current isSpinning:', this.isSpinning);
        console.log('Data isSpinning:', data.isSpinning);
        
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
        
        // Play appropriate audio based on mode
        if (data.currentMode === 'quiz') {
            console.log('=== Playing quiz countdown audio in sync ===');
            console.log('About to call playCountdownAudio from startSyncSpin');            
            //this.playCountdownAudio();
        } else {
            console.log('=== Playing raffle countdown audio in sync ===');
            console.log('About to call playRaffleCountdownAudio from startSyncSpin');
            //this.playRaffleCountdownAudio();
        }
        
        this.updateButtonStates();
    }
    
    stopSyncSpin(data) {
        this.isSpinning = false;
        
        // Stop appropriate audio based on mode
        if (data.currentMode === 'quiz') {
            this.stopCountdownAudio();
        } else {
            this.stopRaffleCountdownAudio();
        }
        
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
        

    }
    
    updateModeUI() {
        // Update UI for viewers without showing input sections
        if (this.currentMode === 'raffle') {
            this.mainTitle.textContent = 'Raffle Ticket Draw';
            this.mainSubtitle.textContent = 'Enter number ranges and draw a winning ticket!';
            this.resultTitle.textContent = '🎫 The winning ticket is:';
            this.wheel.classList.add('raffle-mode');
            // Completely disable and hide the quiz spin button in raffle mode
            if (this.spinBtn) {
                this.spinBtn.style.display = 'none';
                this.spinBtn.disabled = true;
            }
        } else {
            this.mainTitle.textContent = 'Quiz Name Randomiser';
            this.mainSubtitle.textContent = 'Enter names and let the wheel decide!';
            this.resultTitle.textContent = '🎉 The winner is:';
            this.wheel.classList.remove('raffle-mode');
            // Enable and show the quiz spin button in quiz mode
            if (this.spinBtn) {
                this.spinBtn.style.display = 'inline-block';
                this.spinBtn.disabled = false;
            }
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
    
    // Add method to completely stop all audio on the page
    stopAllAudio() {
        console.log('=== stopAllAudio called ===');
        
        // Stop quiz audio
        if (this.audio) {
            console.log('🛑 Stopping quiz audio:', this.audio.src);
            this.audio.pause();
            this.audio.currentTime = 0;
            this.audio.volume = 0;
            this.audio.muted = true;
        }
        
        // Stop raffle audio
        if (this.raffleAudio) {
            console.log('🛑 Stopping raffle audio:', this.raffleAudio.src);
            this.raffleAudio.pause();
            this.raffleAudio.currentTime = 0;
            this.raffleAudio.volume = 0;
            this.raffleAudio.muted = true;
        }
        
        // Stop any other audio elements on the page
        const allAudioElements = document.querySelectorAll('audio');
        console.log(`🔍 Found ${allAudioElements.length} audio elements on page`);
        allAudioElements.forEach((audio, index) => {
            console.log(`🔍 Audio ${index}:`, {
                src: audio.src,
                paused: audio.paused,
                currentTime: audio.currentTime,
                volume: audio.volume,
                muted: audio.muted
            });
            if (!audio.paused) {
                console.log(`🛑 Stopping audio element ${index}:`, audio.src);
                audio.pause();
                audio.currentTime = 0;
                audio.volume = 0;
                audio.muted = true;
            }
        });
        
        // CRITICAL CHECK: Look for any other audio sources
        console.log('🔍 CRITICAL: Checking for other audio sources...');
        
        // Check if there are any other audio objects in memory
        const globalAudioVars = Object.keys(window).filter(key => 
            key.toLowerCase().includes('audio') && 
            window[key] && 
            typeof window[key] === 'object' &&
            window[key] !== this.audio &&
            window[key] !== this.raffleAudio
        );
        console.log('🔍 Global audio variables:', globalAudioVars);
        
        // Check if there are any other audio contexts
        if (window.AudioContext || window.webkitAudioContext) {
            console.log('🔍 AudioContext available:', !!window.AudioContext);
        }
        
        // Check if there are any other audio files in the page source
        const pageSource = document.documentElement.outerHTML;
        const countdownInSource = pageSource.includes('countdown-cut.mp3');
        const raffleInSource = pageSource.includes('raffledraw.mp3');
        console.log('🔍 countdown-cut.mp3 in page source:', countdownInSource);
        console.log('🔍 raffledraw.mp3 in page source:', raffleInSource);
        
        // AGGRESSIVE SEARCH: Look for ANY audio-related content in the entire page
        console.log('🔍 AGGRESSIVE SEARCH: Looking for ANY audio content...');
        
        // Search for any text containing "countdown" or "mp3" in the entire document
        const allText = document.body.innerText + document.head.innerHTML;
        const countdownInText = allText.includes('countdown');
        const mp3InText = allText.includes('mp3');
        console.log('🔍 "countdown" found in page text:', countdownInText);
        console.log('🔍 "mp3" found in page text:', mp3InText);
        
        // Search for any elements with audio-related attributes or content
        const allElements = document.querySelectorAll('*');
        let audioElementsFound = 0;
        let audioContentFound = 0;
        
        allElements.forEach((el, index) => {
            // Check element attributes
            const hasAudioAttr = el.hasAttribute('src') || el.hasAttribute('data-audio') || el.hasAttribute('onclick');
            if (hasAudioAttr) {
                const src = el.getAttribute('src');
                const onclick = el.getAttribute('onclick');
                if (src && (src.includes('mp3') || src.includes('countdown'))) {
                    audioElementsFound++;
                    console.log(`🔍 Audio element ${audioElementsFound}:`, {
                        tagName: el.tagName,
                        src: src,
                        onclick: onclick,
                        className: el.className,
                        id: el.id
                    });
                }
            }
            
            // Check element content
            if (el.textContent && (el.textContent.includes('countdown') || el.textContent.includes('mp3'))) {
                audioContentFound++;
                if (audioContentFound <= 5) { // Limit output
                    console.log(`🔍 Audio content ${audioContentFound}:`, {
                        tagName: el.tagName,
                        text: el.textContent.substring(0, 100),
                        className: el.className,
                        id: el.id
                    });
                }
            }
        });
        
        console.log(`🔍 Total elements with audio attributes: ${audioElementsFound}`);
        console.log(`🔍 Total elements with audio content: ${audioContentFound}`);
        
        // Check for any hidden iframes or embedded content
        const iframes = document.querySelectorAll('iframe');
        console.log(`🔍 Found ${iframes.length} iframes`);
        iframes.forEach((iframe, index) => {
            console.log(`🔍 Iframe ${index}:`, {
                src: iframe.src,
                id: iframe.id,
                className: iframe.className
            });
        });
        
        // Check for any embedded objects
        const objects = document.querySelectorAll('object, embed');
        console.log(`🔍 Found ${objects.length} embedded objects`);
        objects.forEach((obj, index) => {
            console.log(`🔍 Object ${index}:`, {
                tagName: obj.tagName,
                src: obj.src,
                data: obj.data,
                id: obj.id
            });
        });
        
        // Check for any browser extensions or external scripts
        console.log('🔍 Checking for external scripts and extensions...');
        
        // Check all script tags
        const allScripts = document.querySelectorAll('script');
        allScripts.forEach((script, index) => {
            if (script.src && script.src.includes('countdown')) {
                console.log(`🔍 Script with countdown:`, {
                    index: index,
                    src: script.src,
                    type: script.type
                });
            }
        });
        
        // Check for any Web Audio API usage
        if (window.AudioContext || window.webkitAudioContext) {
            console.log('🔍 Web Audio API available - checking for active contexts...');
            try {
                // This might reveal if something else is using audio
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('🔍 AudioContext state:', audioContext.state);
                if (audioContext.state === 'running') {
                    console.log('🔍 WARNING: AudioContext is running!');
                }
                audioContext.close();
            } catch (e) {
                console.log('🔍 AudioContext check failed:', e);
            }
        }
        
        // Check for any global audio functions that might have been overridden
        const originalAudio = window.Audio;
        if (originalAudio !== window.Audio) {
            console.log('🔍 WARNING: Audio constructor has been overridden!');
        }
        
        // Check for any audio-related global functions
        const audioFunctions = Object.getOwnPropertyNames(window).filter(name => 
            name.toLowerCase().includes('audio') || 
            name.toLowerCase().includes('play') ||
            name.toLowerCase().includes('sound')
        );
        console.log('🔍 Global audio-related functions:', audioFunctions);
        
        // FINAL CHECK: Look for any dynamically created audio elements
        console.log('🔍 FINAL CHECK: Looking for dynamic audio elements...');
        
        // Check if there are any audio elements that might be hidden in the DOM
        const dynamicAudioElements = document.querySelectorAll('audio, video');
        console.log(`🔍 Total audio/video elements found: ${dynamicAudioElements.length}`);
        
        // Check for any elements that might be playing audio
        const playingElements = Array.from(dynamicAudioElements).filter(el => !el.paused);
        if (playingElements.length > 0) {
            console.log('🔍 WARNING: Found playing audio/video elements!');
            playingElements.forEach((el, index) => {
                console.log(`🔍 Playing element ${index}:`, {
                    tagName: el.tagName,
                    src: el.src,
                    currentTime: el.currentTime,
                    duration: el.duration,
                    volume: el.volume,
                    muted: el.muted,
                    id: el.id,
                    className: el.className
                });
            });
        }
        
        // Check for any elements with audio-related event listeners
        const audioEventElements = [];
        dynamicAudioElements.forEach(el => {
            const listeners = getEventListeners ? getEventListeners(el) : 'getEventListeners not available';
            if (listeners && Object.keys(listeners).length > 0) {
                audioEventElements.push({
                    element: el,
                    listeners: listeners
                });
            }
        });
        
        if (audioEventElements.length > 0) {
            console.log('🔍 Elements with audio event listeners:', audioEventElements);
        }
        
        // CRITICAL CHECK: Look for any browser extensions or system audio
        console.log('🔍 CRITICAL: Checking for browser extensions and system audio...');
        
        // Check if there are any browser extensions that might be playing audio
        if (window.chrome && window.chrome.runtime) {
            console.log('🔍 Chrome extensions detected');
        }
        
        // Check if there are any service workers that might be playing audio
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                console.log(`🔍 Found ${registrations.length} service workers`);
                registrations.forEach((sw, index) => {
                    console.log(`🔍 Service Worker ${index}:`, {
                        active: !!sw.active,
                        installing: !!sw.installing,
                        waiting: !!sw.waiting,
                        scope: sw.scope
                    });
                });
            });
        }
        
        // Check if there are any Web Audio API nodes that might be playing
        if (window.AudioContext || window.webkitAudioContext) {
            console.log('🔍 Checking for active Web Audio nodes...');
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                if (audioContext.state === 'running') {
                    console.log('🔍 WARNING: AudioContext is running - this might be the source!');
                    console.log('🔍 AudioContext sample rate:', audioContext.sampleRate);
                    console.log('🔍 AudioContext current time:', audioContext.currentTime);
                }
                audioContext.close();
            } catch (e) {
                console.log('🔍 AudioContext check failed:', e);
            }
        }
        
        // Check if there are any other audio-related global objects
        const audioGlobals = Object.keys(window).filter(key => 
            key.toLowerCase().includes('audio') || 
            key.toLowerCase().includes('media') ||
            key.toLowerCase().includes('sound')
        );
        console.log('🔍 Audio-related global objects:', audioGlobals);
        
        // Check if there are any hidden audio elements in the DOM that might be created dynamically
        console.log('🔍 CRITICAL: Checking for dynamically created audio elements...');
        
        // Look for any elements that might have been created after page load
        const allElementsCheck = document.querySelectorAll('*');
        let hiddenAudioElementsFound = 0;
        
        allElementsCheck.forEach((el, index) => {
            if (el.tagName === 'AUDIO' || el.tagName === 'VIDEO') {
                hiddenAudioElementsFound++;
                console.log(`🔍 Hidden audio/video element ${hiddenAudioElementsFound}:`, {
                    tagName: el.tagName,
                    src: el.src,
                    currentSrc: el.currentSrc,
                    paused: el.paused,
                    currentTime: el.currentTime,
                    volume: el.volume,
                    muted: el.muted,
                    style: {
                        display: el.style.display,
                        visibility: el.style.visibility,
                        opacity: el.style.opacity,
                        position: el.style.position,
                        left: el.style.left,
                        top: el.style.top,
                        width: el.style.width,
                        height: el.style.height
                    },
                    computedStyle: {
                        display: window.getComputedStyle(el).display,
                        visibility: window.getComputedStyle(el).visibility,
                        opacity: window.getComputedStyle(el).opacity
                    }
                });
            }
        });
        
        console.log(`🔍 Total hidden audio/video elements found: ${hiddenAudioElementsFound}`);
        
        // Reset audio playing flag
        this.audioPlaying = false;
        
        console.log('✅ All audio stopped');
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
    console.log('=== DOMContentLoaded event fired ===');
    console.log('Creating NameRandomiser instance...');
    
    // Check if there's already an instance
    if (window.nameRandomiser) {
        console.log('⚠️ WARNING: Multiple NameRandomiser instances detected!');
        console.log('Existing instance:', window.nameRandomiser);
        console.log('New instance being created...');
    }
    
    nameRandomiser = new NameRandomiser();
    window.nameRandomiser = nameRandomiser; // Store globally for debugging
    console.log('NameRandomiser instance created:', nameRandomiser);
    console.log('Global instance stored:', window.nameRandomiser);
});