// Configuration
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api' 
  : '/api';

// Demo user ID (in production, this would come from authentication)
const USER_ID = 1;

// Conversation history for AI chat
let conversationHistory = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  initializeTabs();
  initializeChat();
  initializeForms();
  loadTodaysSummary();
  loadWeeklySchedule();
  setGreeting();
});

// Tab Navigation
function initializeTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.dataset.tab;

      // Remove active class from all tabs and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // Add active class to clicked tab and corresponding content
      button.classList.add('active');
      document.getElementById(targetTab).classList.add('active');

      // Load data when switching to specific tabs
      if (targetTab === 'nutrition') {
        loadTodaysSummary();
      } else if (targetTab === 'schedule') {
        loadWeeklySchedule();
      }
    });
  });
}

// Set greeting based on time of day
function setGreeting() {
  const hour = new Date().getHours();
  let greeting = 'Good morning';
  
  if (hour >= 12 && hour < 17) {
    greeting = 'Good afternoon';
  } else if (hour >= 17) {
    greeting = 'Good evening';
  }
  
  document.getElementById('greeting').textContent = `${greeting}!`;
}

// Today's Schedule Button
document.getElementById('todayScheduleBtn').addEventListener('click', async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/schedule/${USER_ID}/today`);
    const data = await response.json();

    if (data.schedule) {
      // Exercises are already an array from the API
      const exercises = Array.isArray(data.schedule.exercises) 
        ? data.schedule.exercises 
        : JSON.parse(data.schedule.exercises);
      
      const dayName = data.day.charAt(0).toUpperCase() + data.day.slice(1);
      alert(`Today's Workout (${dayName}):\n\n${data.schedule.workout_type}\n\nExercises:\n${exercises.join('\n')}\n\nNotes: ${data.schedule.notes || 'None'}`);
    } else {
      alert(data.message || 'No workout scheduled for today. Time to rest!');
    }
  } catch (error) {
    console.error('Error fetching today\'s schedule:', error);
    alert('Failed to load today\'s schedule');
  }
});

// Chat Functionality
function initializeChat() {
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');

  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
}

async function sendMessage() {
  const chatInput = document.getElementById('chatInput');
  const message = chatInput.value.trim();

  if (!message) return;

  // Add user message to chat
  appendMessage(message, 'user');
  chatInput.value = '';

  // Show loading message
  const loadingDiv = appendMessage('Thinking...', 'loading');

  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        userId: USER_ID,
        conversationHistory
      }),
    });

    const data = await response.json();

    // Remove loading message
    loadingDiv.remove();

    if (data.response) {
      // Add AI response to chat
      appendMessage(data.response, 'bot');

      // Update conversation history (only if not an error response)
      if (!data.isError) {
        conversationHistory.push(
          { role: 'user', content: message },
          { role: 'assistant', content: data.response }
        );

        // Keep only last 10 messages in history
        if (conversationHistory.length > 10) {
          conversationHistory = conversationHistory.slice(-10);
        }
      }
    } else if (data.error) {
      appendMessage(`⚠️ ${data.error}\n\n${data.suggestion || 'Please try again later.'}`, 'bot');
    } else {
      appendMessage('Sorry, I couldn\'t process that request.', 'bot');
    }
  } catch (error) {
    loadingDiv.remove();
    appendMessage('Sorry, there was an error connecting to the server.', 'bot');
    console.error('Chat error:', error);
  }
}

function appendMessage(text, type) {
  const chatMessages = document.getElementById('chatMessages');
  const messageDiv = document.createElement('div');
  
  messageDiv.className = `message ${type}-message`;
  
  if (type === 'bot') {
    messageDiv.innerHTML = `<strong>AI Coach:</strong> ${text}`;
  } else if (type === 'user') {
    messageDiv.innerHTML = `<strong>You:</strong> ${text}`;
  } else {
    messageDiv.textContent = text;
  }

  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  return messageDiv;
}

// Initialize Forms
function initializeForms() {
  // Strength Training Form
  document.getElementById('strengthForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
      userId: USER_ID,
      exercise: document.getElementById('exerciseName').value,
      weight: parseFloat(document.getElementById('weight').value),
      reps: parseInt(document.getElementById('reps').value),
      sets: parseInt(document.getElementById('sets').value),
      notes: document.getElementById('strengthNotes').value
    };

    try {
      const response = await fetch(`${API_BASE_URL}/workouts/strength`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        let message = 'Strength workout logged successfully!';
        if (data.progressiveOverload?.achieved) {
          message += ` 🎉 ${data.progressiveOverload.message} Volume increased by ${data.progressiveOverload.volumeIncrease}%`;
        }
        showResult('strengthResult', message, 'success');
        e.target.reset();
      } else {
        showResult('strengthResult', 'Failed to log workout', 'error');
      }
    } catch (error) {
      showResult('strengthResult', 'Error logging workout', 'error');
      console.error(error);
    }
  });

  // Cardio Form
  document.getElementById('cardioForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
      userId: USER_ID,
      activityType: document.getElementById('activityType').value,
      duration: parseInt(document.getElementById('duration').value),
      distance: parseFloat(document.getElementById('distance').value) || null,
      calories: parseInt(document.getElementById('calories').value) || null,
      notes: document.getElementById('cardioNotes').value
    };

    try {
      const response = await fetch(`${API_BASE_URL}/workouts/cardio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        showResult('cardioResult', 'Cardio activity logged successfully!', 'success');
        e.target.reset();
      } else {
        showResult('cardioResult', 'Failed to log activity', 'error');
      }
    } catch (error) {
      showResult('cardioResult', 'Error logging activity', 'error');
      console.error(error);
    }
  });

  // Nutrition Form
  document.getElementById('nutritionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
      userId: USER_ID,
      mealType: document.getElementById('mealType').value,
      foodItem: document.getElementById('foodItem').value,
      calories: parseInt(document.getElementById('nutritionCalories').value) || null,
      protein: parseFloat(document.getElementById('protein').value) || null,
      carbs: parseFloat(document.getElementById('carbs').value) || null,
      fats: parseFloat(document.getElementById('fats').value) || null,
      notes: document.getElementById('nutritionNotes').value
    };

    try {
      const response = await fetch(`${API_BASE_URL}/nutrition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        showResult('nutritionResult', 'Meal logged successfully!', 'success');
        e.target.reset();
        loadTodaysSummary();
      } else {
        showResult('nutritionResult', 'Failed to log meal', 'error');
      }
    } catch (error) {
      showResult('nutritionResult', 'Error logging meal', 'error');
      console.error(error);
    }
  });

  // Schedule Form
  document.getElementById('scheduleForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const exercisesText = document.getElementById('scheduleExercises').value;
    const exercises = exercisesText.split('\n').filter(ex => ex.trim());

    const formData = {
      userId: USER_ID,
      dayOfWeek: document.getElementById('dayOfWeek').value,
      workoutType: document.getElementById('workoutType').value,
      exercises: exercises,
      notes: document.getElementById('scheduleNotes').value
    };

    try {
      const response = await fetch(`${API_BASE_URL}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        showResult('scheduleResult', 'Schedule saved successfully!', 'success');
        e.target.reset();
        loadWeeklySchedule();
      } else {
        showResult('scheduleResult', 'Failed to save schedule', 'error');
      }
    } catch (error) {
      showResult('scheduleResult', 'Error saving schedule', 'error');
      console.error(error);
    }
  });

  // Progress Tracking
  document.getElementById('loadProgressBtn').addEventListener('click', async () => {
    const exercise = document.getElementById('progressExercise').value.trim();
    
    if (!exercise) {
      alert('Please enter an exercise name');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/workouts/progress/${USER_ID}/${encodeURIComponent(exercise)}`);
      const data = await response.json();

      const progressChart = document.getElementById('progressChart');
      
      if (data.history.length === 0) {
        progressChart.innerHTML = '<p>No workout history found for this exercise.</p>';
        return;
      }

      progressChart.innerHTML = `<h3>Progress for ${data.exercise}</h3>`;
      
      data.history.forEach((workout, index) => {
        const date = new Date(workout.workout_date).toLocaleDateString();
        const volume = workout.volume;
        
        let improvement = '';
        let itemClass = '';
        
        if (index > 0) {
          const prevVolume = data.history[index - 1].volume;
          const change = ((volume - prevVolume) / prevVolume * 100).toFixed(1);
          
          if (change > 0) {
            improvement = `<span style="color: var(--primary-color);">↑ ${change}%</span>`;
            itemClass = 'improved';
          } else if (change < 0) {
            improvement = `<span style="color: var(--danger-color);">↓ ${Math.abs(change)}%</span>`;
            itemClass = 'declined';
          }
        }

        const itemDiv = document.createElement('div');
        itemDiv.className = `progress-item ${itemClass}`;
        itemDiv.innerHTML = `
          <div>
            <strong>${date}</strong><br>
            ${workout.weight}kg × ${workout.reps} reps × ${workout.sets} sets
          </div>
          <div style="text-align: right;">
            <strong>Volume: ${volume}</strong><br>
            ${improvement}
          </div>
        `;
        
        progressChart.appendChild(itemDiv);
      });
    } catch (error) {
      console.error('Error loading progress:', error);
      alert('Failed to load progress data');
    }
  });
}

// Show result message
function showResult(elementId, message, type) {
  const resultDiv = document.getElementById(elementId);
  resultDiv.textContent = message;
  resultDiv.className = `result-message ${type}`;
  
  setTimeout(() => {
    resultDiv.className = 'result-message';
  }, 5000);
}

// Load today's nutrition summary
async function loadTodaysSummary() {
  try {
    const response = await fetch(`${API_BASE_URL}/nutrition/daily/${USER_ID}`);
    const data = await response.json();

    const summaryContent = document.getElementById('summaryContent');
    
    if (data.meals.length === 0) {
      summaryContent.innerHTML = '<p>No meals logged yet today.</p>';
      return;
    }

    let html = '';
    
    data.meals.forEach(meal => {
      html += `
        <div class="summary-item">
          <strong>${meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}</strong>
          <span>${meal.total_calories || 0} cal | ${meal.total_protein || 0}g protein</span>
        </div>
      `;
    });

    html += `
      <div class="summary-total">
        <div class="summary-item">
          <strong>Total Calories</strong>
          <strong>${data.dailyTotals.calories?.toFixed(0) || 0}</strong>
        </div>
        <div class="summary-item">
          <strong>Total Protein</strong>
          <strong>${data.dailyTotals.protein?.toFixed(1) || 0}g</strong>
        </div>
        <div class="summary-item">
          <strong>Total Carbs</strong>
          <strong>${data.dailyTotals.carbs?.toFixed(1) || 0}g</strong>
        </div>
        <div class="summary-item">
          <strong>Total Fats</strong>
          <strong>${data.dailyTotals.fats?.toFixed(1) || 0}g</strong>
        </div>
      </div>
    `;

    summaryContent.innerHTML = html;
  } catch (error) {
    console.error('Error loading nutrition summary:', error);
  }
}

// Load weekly schedule
async function loadWeeklySchedule() {
  try {
    const response = await fetch(`${API_BASE_URL}/schedule/${USER_ID}`);
    const data = await response.json();

    const scheduleList = document.getElementById('scheduleList');
    
    if (data.schedule.length === 0) {
      scheduleList.innerHTML = '<p>No weekly schedule set. Create one above!</p>';
      return;
    }

    scheduleList.innerHTML = '';
    
    data.schedule.forEach(day => {
      const dayDiv = document.createElement('div');
      dayDiv.className = 'schedule-day';
      
      // Exercises are already parsed by the API, no need to JSON.parse
      const exercises = Array.isArray(day.exercises) ? day.exercises : JSON.parse(day.exercises);
      
      dayDiv.innerHTML = `
        <h4>${day.day_of_week.charAt(0).toUpperCase() + day.day_of_week.slice(1)}</h4>
        <p><strong>${day.workout_type}</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          ${exercises.map(ex => `<li>${ex}</li>`).join('')}
        </ul>
        ${day.notes ? `<p><em>${day.notes}</em></p>` : ''}
      `;
      
      scheduleList.appendChild(dayDiv);
    });
  } catch (error) {
    console.error('Error loading weekly schedule:', error);
  }
}
