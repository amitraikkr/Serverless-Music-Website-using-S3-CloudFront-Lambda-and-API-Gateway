// Base URL of your API Gateway (replace this with your actual API endpoint)
const apiBaseUrl = 'https://zd5vnw8y95.execute-api.us-east-2.amazonaws.com/prod/songs';

// Array to store selected songs
let selectedSongs = [];
let selectedSongLabels = []; // Array to store labels for selected songs
let currentPlayingButton = null;  // Track the currently playing button to toggle play/stop
let currentPlayingLabel = null;   // Track the currently playing label to add/remove music icon

// Function to fetch songs from backend and display them
async function fetchSongs(language) {
    try {
        const response = await fetch(`${apiBaseUrl}?language=${language}`);  // Fetch songs via API
        const songs = await response.json(); // Parse the JSON response
        const songListElement = document.getElementById(`${language}Songs`);

        // Clear any existing content in the list
        songListElement.innerHTML = '';

        // Dynamically create list items with checkboxes and fancy play buttons for each song
        songs.forEach(song => {
            const li = document.createElement('li');
            
            const label = document.createElement('label');
            label.textContent = song.name;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = song.url;
            checkbox.onclick = () => toggleSongSelection(checkbox.value, label);  // Include label

            const playButton = document.createElement('button');
            playButton.textContent = '▶'; // Fancy play button symbol
            playButton.classList.add('play-button');  // Add a class for custom styling
            playButton.onclick = () => togglePlayStop(playButton, label, song.url);

            li.appendChild(checkbox);
            li.appendChild(label);
            li.appendChild(playButton);

            songListElement.appendChild(li);
        });
    } catch (error) {
        console.error('Error fetching songs:', error);
    }
}

// Function to toggle song selection (include label for icons)
function toggleSongSelection(url, label) {
    if (selectedSongs.includes(url)) {
        selectedSongs = selectedSongs.filter(song => song !== url);
        selectedSongLabels = selectedSongLabels.filter(item => item.url !== url); // Remove label
    } else {
        selectedSongs.push(url);
        selectedSongLabels.push({ url, label }); // Store label for selected song
    }
}

// Function to play selected songs automatically
function playSelected() {
    if (selectedSongs.length === 0) return;

    let index = 0;
    const audioPlayer = document.getElementById('audioPlayer');

    function playNext() {
        if (index < selectedSongs.length) {
            const currentSong = selectedSongs[index];
            const currentLabel = selectedSongLabels.find(item => item.url === currentSong).label;

            // Remove the icon from the previously playing song
            if (currentPlayingLabel) {
                currentPlayingLabel.textContent = currentPlayingLabel.textContent.replace(' 🎵🎵', '');
            }

            // Play the current song and update the label with the icon
            audioPlayer.src = currentSong;
            audioPlayer.play();
            currentLabel.textContent += ' 🎵🎵';  // Add music icon to current label
            currentPlayingLabel = currentLabel;  // Track current label

            index++;
            audioPlayer.onended = playNext;
        }
    }

    playNext();
}

// Function to toggle between playing and stopping a song
function togglePlayStop(button, label, url) {
    const audioPlayer = document.getElementById('audioPlayer');

    // If the same button is clicked and it's already playing, stop the song
    if (currentPlayingButton === button && !audioPlayer.paused) {
        audioPlayer.pause();
        button.textContent = '▶';  // Change button back to Play
        if (currentPlayingLabel) {
            currentPlayingLabel.textContent = currentPlayingLabel.textContent.replace(' 🎵🎵', '');  // Remove icon
        }
        currentPlayingButton = null;  // Reset the current playing button
        currentPlayingLabel = null;   // Reset the current playing label
    } else {
        // If a new song is selected, play it
        if (currentPlayingButton && currentPlayingButton !== button) {
            currentPlayingButton.textContent = '▶';  // Reset the previous button
        }
        if (currentPlayingLabel && currentPlayingLabel !== label) {
            currentPlayingLabel.textContent = currentPlayingLabel.textContent.replace(' 🎵🎵', '');  // Remove icon from previous
        }
        
        audioPlayer.src = url;
        audioPlayer.play();
        button.textContent = '■';  // Change button to Stop
        label.textContent += ' 🎵🎵'; // Add music bar icon to the label
        currentPlayingButton = button;  // Track the button of the currently playing song
        currentPlayingLabel = label;    // Track the label of the currently playing song
    }
}

// Fetch songs for each language when the page loads
fetchSongs('english');
fetchSongs('hindi');