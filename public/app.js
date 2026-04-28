// Configuration
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api' 
  : '/api';

// Demo user ID (in production, this would come from authentication)
const USER_ID = 1;

// Conversation history for AI chat
let conversationHistory = [];

// Calendar state
let currentWeekOffset = 0;
const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  initializeTabs();
  initializeChat();
  initializeForms();
  initializeCalendar();
  loadSmartNutrition();
  loadBodyMeasurements();
  setGreeting();
  
  // Set today's date in measurement form
  document.getElementById('measurementDate').valueAsDate = new Date();
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
      if (targetTab === 'calendar') {
        loadCalendar();
      } else if (targetTab === 'nutrition') {
        loadSmartNutrition();
        loadTodaysSummary();
      } else if (targetTab === 'progress') {
        loadBodyMeasurements();
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

// ===== CALENDAR VIEW =====
function initializeCalendar() {
  document.getElementById('prevWeek').addEventListener('click', () => {
    currentWeekOffset--;
    loadCalendar();
  });
  
  document.getElementById('nextWeek').addEventListener('click', () => {
    currentWeekOffset++;
    loadCalendar();
  });
  
  // Close quick add modal
  document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('quickAddModal').style.display = 'none';
  });
  
  // Close workout details modal
  document.getElementById('closeDetailsModal').addEventListener('click', () => {
    document.getElementById('workoutDetailsModal').style.display = 'none';
  });
  
  // Quick add form
  document.getElementById('quickAddForm').addEventListener('submit', handleQuickAdd);
  
  // Workout type change handler
  document.getElementById('quickWorkoutType').addEventListener('change', (e) => {
    const type = e.target.value;
    renderQuickAddFields(type);
  });
  
  // Mark done button
  document.getElementById('markDoneBtn').addEventListener('click', handleMarkDone);
  
  // Unmark button
  document.getElementById('unmarkDoneBtn').addEventListener('click', handleUnmarkDone);
  
  loadCalendar();
}

async function loadCalendar() {
  const calendarGrid = document.getElementById('calendarGrid');
  const weekTitle = document.getElementById('weekTitle');
  
  try {
    // Fetch schedule
    const response = await fetch(`${API_BASE_URL}/schedule/${USER_ID}`);
    const data = await response.json();
    
    // Calculate week dates
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + (currentWeekOffset * 7) - today.getDay() + 1);
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    // Fetch completions for this week
    const completionsResponse = await fetch(
      `${API_BASE_URL}/workout-completions/${USER_ID}?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`
    );
    const completionsData = await completionsResponse.json();
    const completions = completionsData.completions || [];
    
    // Update title
    if (currentWeekOffset === 0) {
      weekTitle.textContent = 'This Week';
    } else if (currentWeekOffset === -1) {
      weekTitle.textContent = 'Last Week';
    } else if (currentWeekOffset === 1) {
      weekTitle.textContent = 'Next Week';
    } else {
      const weekStart = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      weekTitle.textContent = `Week of ${weekStart}`;
    }
    
    // Build calendar grid
    calendarGrid.innerHTML = '';
    
    daysOfWeek.forEach((day, index) => {
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + index);
      const dateStr = dayDate.toISOString().split('T')[0];
      
      const schedule = data.schedule.find(s => s.day_of_week === day);
      const isToday = isSameDay(dayDate, today);
      
      // Check if this workout is completed
      const completion = schedule ? completions.find(c => 
        c.schedule_id === schedule.id && 
        c.completion_date.split('T')[0] === dateStr
      ) : null;
      
      const dayCard = document.createElement('div');
      dayCard.className = `calendar-day ${schedule ? 'has-workout' : ''} ${completion ? 'completed' : ''} ${isToday ? 'today' : ''}`;
      
      dayCard.innerHTML = `
        <div class="day-header">${dayLabels[index]}</div>
        <div class="day-date">${dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
        ${schedule ? `
          <div class="day-workout">
            <strong>${schedule.workout_type}</strong>
            ${completion ? '<div style="color: #4CAF50; font-size: 0.85rem; margin-top: 5px;">✓ Completed</div>' : '<div style="color: #888; font-size: 0.85rem; margin-top: 5px;">Click to view</div>'}
          </div>
        ` : '<p style="color: #999; font-size: 0.85rem;">Rest day</p>'}
        <button class="add-workout-btn add-extra-btn" data-date="${dayDate.toISOString()}" data-day="${day}">+ Log Extra</button>
      `;
      
      // Make entire day card clickable if there's a scheduled workout
      if (schedule) {
        dayCard.style.cursor = 'pointer';
        dayCard.addEventListener('click', (e) => {
          // Don't trigger if clicking the "Add Extra" button
          if (!e.target.classList.contains('add-extra-btn') && !e.target.closest('.add-extra-btn')) {
            openWorkoutDetails(schedule, dateStr, completion);
          }
        });
      }
      
      // Add click handler for Add Extra button
      const addBtn = dayCard.querySelector('.add-extra-btn');
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openQuickAddModal(dayDate, day);
      });
      
      calendarGrid.appendChild(dayCard);
    });
    
  } catch (error) {
    console.error('Error loading calendar:', error);
    calendarGrid.innerHTML = '<p>Failed to load calendar</p>';
  }
}

function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

function openQuickAddModal(date, day) {
  document.getElementById('quickAddDate').value = date.toISOString();
  document.getElementById('modalTitle').textContent = `Add Workout - ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`;
  document.getElementById('quickWorkoutType').value = '';
  document.getElementById('quickAddFields').innerHTML = '';
  document.getElementById('quickAddModal').style.display = 'block';
}

function renderQuickAddFields(type) {
  const fieldsDiv = document.getElementById('quickAddFields');
  
  if (type === 'strength') {
    fieldsDiv.innerHTML = `
      <div class="form-group">
        <label>Exercise:</label>
        <input type="text" id="qExercise" placeholder="e.g., Bench Press" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Weight (kg):</label>
          <input type="number" id="qWeight" step="0.5" min="0" required>
        </div>
        <div class="form-group">
          <label>Reps:</label>
          <input type="number" id="qReps" min="1" required>
        </div>
        <div class="form-group">
          <label>Sets:</label>
          <input type="number" id="qSets" min="1" required>
        </div>
      </div>
      <div class="form-group">
        <label>Notes:</label>
        <textarea id="qNotes" rows="2"></textarea>
      </div>
    `;
  } else if (type === 'cardio') {
    fieldsDiv.innerHTML = `
      <div class="form-group">
        <label>Activity:</label>
        <select id="qActivity" required>
          <option value="running">Running</option>
          <option value="cycling">Cycling</option>
          <option value="swimming">Swimming</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Duration (min):</label>
          <input type="number" id="qDuration" min="1" required>
        </div>
        <div class="form-group">
          <label>Distance (km):</label>
          <input type="number" id="qDistance" step="0.1" min="0">
        </div>
      </div>
      <div class="form-group">
        <label>Notes:</label>
        <textarea id="qNotes" rows="2"></textarea>
      </div>
    `;
  }
}

async function handleQuickAdd(e) {
  e.preventDefault();
  
  const type = document.getElementById('quickWorkoutType').value;
  const dateStr = document.getElementById('quickAddDate').value;
  
  try {
    let response;
    
    if (type === 'strength') {
      const data = {
        user_id: USER_ID,
        exercise_name: document.getElementById('qExercise').value,
        weight: parseFloat(document.getElementById('qWeight').value),
        reps: parseInt(document.getElementById('qReps').value),
        sets: parseInt(document.getElementById('qSets').value),
        notes: document.getElementById('qNotes').value,
        workout_date: new Date(dateStr).toISOString().split('T')[0]
      };
      response = await fetch(`${API_BASE_URL}/workouts/strength`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } else if (type === 'cardio') {
      const data = {
        user_id: USER_ID,
        activity_type: document.getElementById('qActivity').value,
        duration_minutes: parseInt(document.getElementById('qDuration').value),
        distance_km: parseFloat(document.getElementById('qDistance').value) || null,
        notes: document.getElementById('qNotes').value,
        activity_date: new Date(dateStr).toISOString().split('T')[0]
      };
      response = await fetch(`${API_BASE_URL}/workouts/cardio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }
    
    if (response.ok) {
      document.getElementById('quickAddModal').style.display = 'none';
      showMessage('Workout logged successfully!', 'success');
      loadCalendar();
    } else {
      throw new Error('Failed to log workout');
    }
  } catch (error) {
    console.error('Error logging workout:', error);
    showMessage('Failed to log workout', 'error');
  }
}

// Open workout details modal
let currentWorkoutData = null;

function openWorkoutDetails(schedule, date, completion) {
  currentWorkoutData = { schedule, date, completion };
  
  const modal = document.getElementById('workoutDetailsModal');
  const title = document.getElementById('workoutDetailsTitle');
  const content = document.getElementById('workoutDetailsInfo');
  const notesField = document.getElementById('completionNotes');
  const exercisesField = document.getElementById('exercisesCompleted');
  const markBtn = document.getElementById('markDoneBtn');
  const unmarkBtn = document.getElementById('unmarkDoneBtn');
  
  // Parse exercises
  const exercises = Array.isArray(schedule.exercises) 
    ? schedule.exercises 
    : JSON.parse(schedule.exercises);
  
  // Set title
  const dateObj = new Date(date);
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  title.textContent = `${schedule.workout_type} - ${dayName}`;
  
  // Build content
  let html = `
    <div class="workout-details-box">
      <h4>Scheduled Exercises</h4>
      <ul>
        ${exercises.map(ex => `<li>${ex}</li>`).join('')}
      </ul>
      ${schedule.notes ? `<p style="margin-top: 15px;"><strong>Notes:</strong> ${schedule.notes}</p>` : ''}
    </div>
  `;
  
  if (completion) {
    html += `
      <div class="workout-details-box" style="background: #e8f5e9;">
        <h4 style="color: #4CAF50;">✓ Completed</h4>
        <p><strong>Completed at:</strong> ${new Date(completion.completed_at).toLocaleString()}</p>
        ${completion.notes ? `<p style="margin-top: 10px;"><strong>Your notes:</strong> ${completion.notes}</p>` : ''}
        ${completion.exercises_completed ? `
          <div style="margin-top: 10px;">
            <strong>Exercises completed:</strong>
            <ul style="margin-top: 5px;">
              ${JSON.parse(completion.exercises_completed).map(ex => `<li>${ex}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
    
    // Pre-fill form with existing completion data
    notesField.value = completion.notes || '';
    exercisesField.value = completion.exercises_completed 
      ? JSON.parse(completion.exercises_completed).join('\n')
      : '';
    
    markBtn.textContent = '✓ Update Completion';
    markBtn.style.display = 'inline-block';
    unmarkBtn.style.display = 'inline-block';
  } else {
    // Clear form for new completion
    notesField.value = '';
    exercisesField.value = exercises.join('\n');
    
    markBtn.textContent = '✓ Mark as Done';
    markBtn.style.display = 'inline-block';
    unmarkBtn.style.display = 'none';
  }
  
  content.innerHTML = html;
  modal.style.display = 'block';
}

// Handle marking workout as done
async function handleMarkDone() {
  if (!currentWorkoutData) return;
  
  const notes = document.getElementById('completionNotes').value;
  const exercisesText = document.getElementById('exercisesCompleted').value;
  const exercises = exercisesText.split('\n').filter(ex => ex.trim());
  
  try {
    const response = await fetch(`${API_BASE_URL}/workout-completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: USER_ID,
        schedule_id: currentWorkoutData.schedule.id,
        completion_date: currentWorkoutData.date,
        notes: notes,
        exercises_completed: exercises
      })
    });
    
    if (response.ok) {
      document.getElementById('workoutDetailsModal').style.display = 'none';
      showMessage('Workout marked as complete! 🎉', 'success');
      loadCalendar();
    } else {
      throw new Error('Failed to mark workout complete');
    }
  } catch (error) {
    console.error('Error marking workout complete:', error);
    showMessage('Failed to mark workout complete', 'error');
  }
}

// Handle unmarking workout
async function handleUnmarkDone() {
  if (!currentWorkoutData || !currentWorkoutData.completion) return;
  
  if (!confirm('Are you sure you want to unmark this workout as done?')) {
    return;
  }
  
  try {
    const response = await fetch(
      `${API_BASE_URL}/workout-completions/${currentWorkoutData.completion.id}`,
      { method: 'DELETE' }
    );
    
    if (response.ok) {
      document.getElementById('workoutDetailsModal').style.display = 'none';
      showMessage('Workout unmarked', 'success');
      loadCalendar();
    } else {
      throw new Error('Failed to unmark workout');
    }
  } catch (error) {
    console.error('Error unmarking workout:', error);
    showMessage('Failed to unmark workout', 'error');
  }
}

// ===== SMART NUTRITION =====
async function loadSmartNutrition() {
  const container = document.getElementById('nutritionRecommendations');
  
  try {
    const response = await fetch(`${API_BASE_URL}/nutrition-recommendations/recommendations/${USER_ID}`);
    const data = await response.json();
    
    if (!data.workoutType && !data.hasTraining) {
      container.innerHTML = '<p>No training scheduled for today - it\'s a rest day! Focus on recovery nutrition.</p>';
      return;
    }
    
    // Calculate total macros from meals
    let totalCals = 0, totalProtein = 0, totalCarbs = 0, totalFats = 0;
    if (data.meals) {
      data.meals.forEach(meal => {
        totalCals += meal.calories || 0;
        totalProtein += meal.protein || 0;
        totalCarbs += meal.carbs || 0;
        totalFats += meal.fats || 0;
      });
    }
    
    container.innerHTML = `
      <div class="nutrition-workout-info">
        <h3>🎯 Today's Focus: ${data.workoutType || 'Rest Day'}</h3>
        ${data.hasTraining ? '<p>Optimal nutrition for your workout today</p>' : '<p>Recovery nutrition for rest day</p>'}
      </div>
      
      ${data.calories ? `
      <div class="nutrition-targets">
        <div class="nutrition-target">
          <div class="nutrition-target-value">${data.calories.min}-${data.calories.max}</div>
          <div class="nutrition-target-label">Calories</div>
        </div>
        <div class="nutrition-target">
          <div class="nutrition-target-value">${data.protein.min}-${data.protein.max}g</div>
          <div class="nutrition-target-label">Protein/kg</div>
        </div>
        <div class="nutrition-target">
          <div class="nutrition-target-value">${data.carbs.min}-${data.carbs.max}g</div>
          <div class="nutrition-target-label">Carbs/kg</div>
        </div>
        <div class="nutrition-target">
          <div class="nutrition-target-value">${data.fats.min}-${data.fats.max}g</div>
          <div class="nutrition-target-label">Fats/kg</div>
        </div>
      </div>
      ` : ''}
      
      ${data.timing ? `
        <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <strong>⏰ Meal Timing Recommendations:</strong><br/>
          <div style="margin-top: 10px;">
            <div><strong>Pre-workout:</strong> ${data.timing.preworkout}</div>
            <div style="margin-top: 5px;"><strong>Post-workout:</strong> ${data.timing.postworkout}</div>
          </div>
        </div>
      ` : ''}
      
      ${data.meals && data.meals.length > 0 ? `
      <div class="meal-plan">
        <h4>📋 Suggested Meals</h4>
        ${data.meals.map(meal => `
          <div class="meal-item">
            <h4>${meal.meal}</h4>
            <p>${meal.suggestion}</p>
            <div class="meal-macros">
              <span>🔥 ${meal.calories} cal</span>
              <span>🥩 ${meal.protein}g protein</span>
              <span>🍞 ${meal.carbs}g carbs</span>
              <span>🥑 ${meal.fats}g fats</span>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 15px; text-align: center;">
        <strong>Daily Totals:</strong> ${totalCals} calories | 
        ${totalProtein}g protein | ${totalCarbs}g carbs | ${totalFats}g fats
      </div>
      ` : ''}
    `;
  } catch (error) {
    console.error('Error loading nutrition recommendations:', error);
    container.innerHTML = '<p>Failed to load recommendations</p>';
  }
}

// ===== BODY MEASUREMENTS & PROGRESS =====
async function loadBodyMeasurements() {
  try {
    const response = await fetch(`${API_BASE_URL}/measurements/progress/${USER_ID}`);
    const data = await response.json();
    
    if (!data.measurements || data.measurements.length === 0) {
      document.getElementById('progressCharts').innerHTML = '<p>No measurements recorded yet. Log your first measurement above!</p>';
      return;
    }
    
    renderProgressCharts(data);
  } catch (error) {
    console.error('Error loading measurements:', error);
    document.getElementById('progressCharts').innerHTML = '<p>Failed to load progress data</p>';
  }
}

function renderProgressCharts(data) {
  const chartsDiv = document.getElementById('progressCharts');
  
  // Summary cards
  const latest = data.measurements[0];
  const summary = data.summary;
  
  let summaryHTML = '<div class="progress-summary">';
  
  if (latest.weight !== null) {
    summaryHTML += `
      <div class="progress-summary-item">
        <div class="progress-summary-value">${latest.weight} kg</div>
        ${summary.weightChange ? `<div class="progress-summary-change ${summary.weightChange < 0 ? 'positive' : 'negative'}">${summary.weightChange > 0 ? '+' : ''}${summary.weightChange.toFixed(1)} kg</div>` : ''}
        <div class="progress-summary-label">Current Weight</div>
      </div>
    `;
  }
  
  if (latest.body_fat_percentage !== null) {
    summaryHTML += `
      <div class="progress-summary-item">
        <div class="progress-summary-value">${latest.body_fat_percentage}%</div>
        ${summary.bodyFatChange ? `<div class="progress-summary-change ${summary.bodyFatChange < 0 ? 'positive' : 'negative'}">${summary.bodyFatChange > 0 ? '+' : ''}${summary.bodyFatChange.toFixed(1)}%</div>` : ''}
        <div class="progress-summary-label">Body Fat</div>
      </div>
    `;
  }
  
  summaryHTML += '</div>';
  
  // Build charts for each measurement
  const measurements = ['weight', 'body_fat_percentage', 'chest', 'waist', 'hips', 'biceps', 'thighs', 'calves'];
  const labels = ['Weight (kg)', 'Body Fat (%)', 'Chest (cm)', 'Waist (cm)', 'Hips (cm)', 'Biceps (cm)', 'Thighs (cm)', 'Calves (cm)'];
  
  let chartsHTML = summaryHTML;
  
  measurements.forEach((measurement, idx) => {
    const values = data.measurements.map(m => m[measurement]).filter(v => v !== null);
    
    if (values.length > 0) {
      const max = Math.max(...values);
      const min = Math.min(...values);
      const range = max - min || 1;
      
      chartsHTML += `
        <div class="progress-chart-item">
          <h4>${labels[idx]}</h4>
          ${data.measurements.slice().reverse().map((m, i) => {
            if (m[measurement] === null) return '';
            const percentage = ((m[measurement] - min) / range) * 100;
            const date = new Date(m.measurement_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return `
              <div class="chart-bar">
                <div class="chart-bar-label">${date}</div>
                <div class="chart-bar-visual">
                  <div class="chart-bar-fill" style="width: ${percentage}%">${m[measurement]}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
  });
  
  chartsDiv.innerHTML = chartsHTML;
}

// Measurement form handler
document.getElementById('measurementForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const data = {
    user_id: USER_ID,
    measurement_date: document.getElementById('measurementDate').value,
    weight: parseFloat(document.getElementById('bodyWeight').value) || null,
    body_fat_percentage: parseFloat(document.getElementById('bodyFat').value) || null,
    chest: parseFloat(document.getElementById('chest').value) || null,
    waist: parseFloat(document.getElementById('waist').value) || null,
    hips: parseFloat(document.getElementById('hips').value) || null,
    biceps: parseFloat(document.getElementById('biceps').value) || null,
    thighs: parseFloat(document.getElementById('thighs').value) || null,
    calves: parseFloat(document.getElementById('calves').value) || null,
    notes: document.getElementById('measurementNotes').value
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/measurements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      showResultMessage('measurementResult', 'Measurements saved successfully! 📊', 'success');
      loadBodyMeasurements();
    } else {
      throw new Error('Failed to save measurements');
    }
  } catch (error) {
    console.error('Error saving measurements:', error);
    showResultMessage('measurementResult', 'Failed to save measurements', 'error');
  }
});

// Refresh charts button
document.getElementById('refreshCharts').addEventListener('click', loadBodyMeasurements);

// ===== CHAT FUNCTIONALITY =====
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
  addMessageToChat(message, 'user');
  chatInput.value = '';

  // Add to conversation history
  conversationHistory.push({
    role: 'user',
    content: message
  });

  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        conversationHistory
      })
    });

    const data = await response.json();

    if (data.reply) {
      addMessageToChat(data.reply, 'bot');
      conversationHistory.push({
        role: 'assistant',
        content: data.reply
      });
    } else if (data.error) {
      addMessageToChat(data.error, 'bot');
    }
  } catch (error) {
    console.error('Error sending message:', error);
    addMessageToChat('Sorry, I encountered an error. Please try again.', 'bot');
  }
}

function addMessageToChat(message, sender) {
  const chatMessages = document.getElementById('chatMessages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender === 'user' ? 'user-message' : 'bot-message'}`;
  
  if (sender === 'bot') {
    messageDiv.innerHTML = `<strong>AI Coach:</strong> ${message}`;
  } else {
    messageDiv.innerHTML = `<strong>You:</strong> ${message}`;
  }
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ===== FORM HANDLERS =====
function initializeForms() {
  // Cardio form
  document.getElementById('cardioForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      user_id: USER_ID,
      activity_type: document.getElementById('activityType').value,
      duration_minutes: parseInt(document.getElementById('duration').value),
      distance_km: parseFloat(document.getElementById('distance').value) || null,
      calories_burned: parseInt(document.getElementById('calories').value) || null,
      notes: document.getElementById('cardioNotes').value
    };

    try {
      const response = await fetch(`${API_BASE_URL}/workouts/cardio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        showResultMessage('cardioResult', '✅ Cardio activity logged!', 'success');
        e.target.reset();
      } else {
        throw new Error(result.error || 'Failed to log activity');
      }
    } catch (error) {
      console.error('Error logging cardio:', error);
      showResultMessage('cardioResult', '❌ Failed to log activity', 'error');
    }
  });

  // Nutrition form
  document.getElementById('nutritionForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      user_id: USER_ID,
      meal_type: document.getElementById('mealType').value,
      food_item: document.getElementById('foodItem').value,
      calories: parseInt(document.getElementById('nutritionCalories').value) || null,
      protein_g: parseFloat(document.getElementById('protein').value) || null,
      carbs_g: parseFloat(document.getElementById('carbs').value) || null,
      fats_g: parseFloat(document.getElementById('fats').value) || null,
      notes: document.getElementById('nutritionNotes').value
    };

    try {
      const response = await fetch(`${API_BASE_URL}/nutrition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        showResultMessage('nutritionResult', '✅ Meal logged!', 'success');
        e.target.reset();
        loadTodaysSummary();
      } else {
        throw new Error(result.error || 'Failed to log meal');
      }
    } catch (error) {
      console.error('Error logging nutrition:', error);
      showResultMessage('nutritionResult', '❌ Failed to log meal', 'error');
    }
  });

  // Schedule form
  document.getElementById('scheduleForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const exercisesText = document.getElementById('scheduleExercises').value;
    const exercises = exercisesText.split('\n').filter(ex => ex.trim());

    const data = {
      user_id: USER_ID,
      day_of_week: document.getElementById('dayOfWeek').value,
      workout_type: document.getElementById('workoutType').value,
      exercises: exercises,
      notes: document.getElementById('scheduleNotes').value
    };

    try {
      const response = await fetch(`${API_BASE_URL}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        showResultMessage('scheduleResult', '✅ Schedule saved!', 'success');
        e.target.reset();
        loadWeeklySchedule();
        loadCalendar();
      } else {
        throw new Error(result.error || 'Failed to save schedule');
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      showResultMessage('scheduleResult', '❌ Failed to save schedule', 'error');
    }
  });

  // Progress tracking
  document.getElementById('loadProgressBtn').addEventListener('click', async () => {
    const exercise = document.getElementById('progressExercise').value.trim();
    
    if (!exercise) {
      showResultMessage('progressChart', '⚠️ Please enter an exercise name', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/workouts/progress/${USER_ID}/${encodeURIComponent(exercise)}`);
      const data = await response.json();

      if (data.progress && data.progress.length > 0) {
        displayProgressChart(data.progress, exercise);
      } else {
        document.getElementById('progressChart').innerHTML = '<p>No data found for this exercise</p>';
      }
    } catch (error) {
      console.error('Error loading progress:', error);
      showResultMessage('progressChart', '❌ Failed to load progress', 'error');
    }
  });
}

// Helper function to display result messages
function showResultMessage(elementId, message, type) {
  const element = document.getElementById(elementId);
  element.textContent = message;
  element.className = `result-message ${type}`;
  element.style.display = 'block';

  setTimeout(() => {
    element.style.display = 'none';
  }, 5000);
}

function showMessage(message, type) {
  const messageDiv = document.createElement('div');
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${type === 'success' ? '#4CAF50' : '#f44336'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  document.body.appendChild(messageDiv);
  
  setTimeout(() => {
    messageDiv.remove();
  }, 3000);
}

// Load today's nutrition summary
async function loadTodaysSummary() {
  try {
    const response = await fetch(`${API_BASE_URL}/nutrition/daily/${USER_ID}`);
    const data = await response.json();

    const summaryDiv = document.getElementById('summaryContent');

    if (data.meals && data.meals.length > 0) {
      let html = '';
      
      data.meals.forEach(meal => {
        html += `
          <div class="meal-summary">
            <h4>${meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}</h4>
            ${meal.items.map(item => `<p>• ${item.food_item}</p>`).join('')}
            <p class="meal-totals">
              Calories: ${meal.total_calories || 0} | 
              Protein: ${meal.total_protein || 0}g | 
              Carbs: ${meal.total_carbs || 0}g | 
              Fats: ${meal.total_fats || 0}g
            </p>
          </div>
        `;
      });

      html += `
        <div class="daily-totals">
          <h4>📊 Daily Totals</h4>
          <p>Calories: ${data.totals.total_calories || 0}</p>
          <p>Protein: ${data.totals.total_protein || 0}g</p>
          <p>Carbs: ${data.totals.total_carbs || 0}g</p>
          <p>Fats: ${data.totals.total_fats || 0}g</p>
        </div>
      `;

      summaryDiv.innerHTML = html;
    } else {
      summaryDiv.innerHTML = '<p>No meals logged yet today.</p>';
    }
  } catch (error) {
    console.error('Error loading today\'s summary:', error);
  }
}

// Load weekly schedule
async function loadWeeklySchedule() {
  try {
    const response = await fetch(`${API_BASE_URL}/schedule/${USER_ID}`);
    const data = await response.json();

    const scheduleList = document.getElementById('scheduleList');

    if (data.schedule && data.schedule.length > 0) {
      let html = '';
      
      data.schedule.forEach(item => {
        // Exercises are already an array from the API
        const exercises = Array.isArray(item.exercises) 
          ? item.exercises 
          : JSON.parse(item.exercises);
        
        const dayName = item.day_of_week.charAt(0).toUpperCase() + item.day_of_week.slice(1);
        
        html += `
          <div class="schedule-item">
            <h4>${dayName}</h4>
            <p><strong>${item.workout_type}</strong></p>
            ${exercises && exercises.length > 0 ? `
              <ul>
                ${exercises.map(ex => `<li>${ex}</li>`).join('')}
              </ul>
            ` : ''}
            ${item.notes ? `<p class="schedule-notes">${item.notes}</p>` : ''}
          </div>
        `;
      });

      scheduleList.innerHTML = html;
    } else {
      scheduleList.innerHTML = '<p>No schedule set yet. Add your weekly training plan!</p>';
    }
  } catch (error) {
    console.error('Error loading weekly schedule:', error);
    document.getElementById('scheduleList').innerHTML = '<p>Failed to load schedule</p>';
  }
}

// Display progress chart for exercises
function displayProgressChart(progress, exercise) {
  const chartDiv = document.getElementById('progressChart');
  
  let html = `<h3>Progress for ${exercise}</h3>`;
  
  progress.forEach(workout => {
    const date = new Date(workout.workout_date).toLocaleDateString();
    const volume = workout.volume;
    const maxVolume = Math.max(...progress.map(w => w.volume));
    const percentage = (volume / maxVolume) * 100;
    
    html += `
      <div class="progress-bar-container">
        <div class="progress-bar-label">${date}</div>
        <div class="progress-bar-wrapper">
          <div class="progress-bar-fill" style="width: ${percentage}%">
            ${workout.weight}kg × ${workout.reps} × ${workout.sets} = ${volume}
          </div>
        </div>
      </div>
    `;
  });
  
  chartDiv.innerHTML = html;
}
