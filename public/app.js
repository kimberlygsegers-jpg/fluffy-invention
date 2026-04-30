// Configuration
console.log('🚀 APP.JS IS LOADING...');

const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000/api' 
  : '/api';

console.log('📍 API_BASE_URL:', API_BASE_URL);

// Demo user ID (in production, this would come from authentication)
const USER_ID = 1;

// Conversation history for AI chat
let conversationHistory = [];

// Calendar state
let currentWeekOffset = 0;
let selectedDayElement = null;
const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Get workout icon and color based on type
function getWorkoutIcon(workoutType) {
  const type = workoutType.toLowerCase();
  
  // Return SVG icon markup
  if (type.includes('strength') || type.includes('upper') || type.includes('lower') || type.includes('push') || type.includes('pull') || type.includes('legs')) {
    return { 
      icon: '<svg viewBox="0 0 20 20" fill="none"><path d="M4 7H6M6 7V13M6 7L8 5M6 13H4M6 13L8 15M16 7H14M14 7V13M14 7L12 5M14 13H16M14 13L12 15M8 10H12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>', 
      color: '#DC2626', 
      label: 'Strength' 
    };
  } else if (type.includes('cardio') || type.includes('running') || type.includes('run')) {
    return { 
      icon: '<svg viewBox="0 0 20 20" fill="none"><path d="M6 4L10 8M10 8L14 4M10 8V16M4 10L8 14M16 10L12 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>', 
      color: '#2563EB', 
      label: 'Cardio' 
    };
  } else if (type.includes('cycling') || type.includes('bike')) {
    return { 
      icon: '<svg viewBox="0 0 20 20" fill="none"><circle cx="5" cy="14" r="3" stroke="currentColor" stroke-width="1.5"/><circle cx="15" cy="14" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M8 14L11 7H13L15 14M7 7H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>', 
      color: '#7C3AED', 
      label: 'Cycling' 
    };
  } else if (type.includes('swimming') || type.includes('swim')) {
    return { 
      icon: '<svg viewBox="0 0 20 20" fill="none"><path d="M2 11C2 11 3 9 5 9C7 9 8 11 10 11C12 11 13 9 15 9C17 9 18 11 18 11M2 15C2 15 3 13 5 13C7 13 8 15 10 15C12 15 13 13 15 13C17 13 18 15 18 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="13" cy="6" r="2" stroke="currentColor" stroke-width="1.5"/></svg>', 
      color: '#0891B2', 
      label: 'Swimming' 
    };
  } else if (type.includes('yoga') || type.includes('stretch')) {
    return { 
      icon: '<svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="4" r="2" stroke="currentColor" stroke-width="1.5"/><path d="M10 6V10M10 10L6 14M10 10L14 14M10 10L6 8M10 10L14 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>', 
      color: '#059669', 
      label: 'Yoga' 
    };
  } else if (type.includes('rest')) {
    return { 
      icon: '<svg viewBox="0 0 20 20" fill="none"><path d="M10 5V10H15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="10" cy="10" r="6" stroke="currentColor" stroke-width="1.5"/></svg>', 
      color: '#6B7280', 
      label: 'Rest' 
    };
  } else {
    return { 
      icon: '<svg viewBox="0 0 20 20" fill="none"><path d="M10 3L12 8H17L13 11L15 17L10 13L5 17L7 11L3 8H8L10 3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>', 
      color: '#EA580C', 
      label: 'Workout' 
    };
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  initializeTabs();
  initializeChat();
  initializeForms();
  initializeCalendar();
  initializeTrainingPlans();
  loadSmartNutrition();
  loadBodyMeasurements();
  setGreeting();
  
  // Set today's date in measurement form
  document.getElementById('measurementDate').valueAsDate = new Date();
  
  // Add test function to window for debugging
  window.testSuccessModal = () => {
    console.log('🧪 Testing success modal...');
    showSuccessModal();
  };
  
  console.log('✅ App initialized. Test modal with: window.testSuccessModal()');
});

// Tab Navigation
function initializeTabs() {
  const tabButtons = document.querySelectorAll('.nav-item');
  const tabContents = document.querySelectorAll('.view');

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
  console.log('🗓️ Initializing calendar...');
  
  const prevWeek = document.getElementById('prevWeek');
  const nextWeek = document.getElementById('nextWeek');
  
  if (prevWeek) {
    prevWeek.addEventListener('click', () => {
      currentWeekOffset--;
      loadCalendar();
    });
  }
  
  if (nextWeek) {
    nextWeek.addEventListener('click', () => {
      currentWeekOffset++;
      loadCalendar();
    });
  }
  
  // Close quick add modal (optional - may not exist)
  const closeModal = document.getElementById('closeModal');
  if (closeModal) {
    closeModal.addEventListener('click', () => {
      document.getElementById('quickAddModal').style.display = 'none';
    });
  }
  
  // Close workout details modal (optional - may not exist)
  const closeDetailsModal = document.getElementById('closeDetailsModal');
  if (closeDetailsModal) {
    closeDetailsModal.addEventListener('click', () => {
      document.getElementById('workoutDetailsModal').style.display = 'none';
    });
  }
  
  // Close workout details section (below calendar)
  const closeDetailsBtn = document.getElementById('closeDetailsBtn');
  if (closeDetailsBtn) {
    closeDetailsBtn.addEventListener('click', () => {
      document.getElementById('workoutDetailsSection').style.display = 'none';
      // Clear selected state
      if (selectedDayElement) {
        selectedDayElement.classList.remove('selected');
        selectedDayElement = null;
      }
    });
  }
  
  // Quick add form (optional - may not exist)
  const quickAddForm = document.getElementById('quickAddForm');
  if (quickAddForm) {
    quickAddForm.addEventListener('submit', handleQuickAdd);
  }
  
  // Workout type change handler (optional - may not exist)
  const quickWorkoutType = document.getElementById('quickWorkoutType');
  if (quickWorkoutType) {
    quickWorkoutType.addEventListener('change', (e) => {
      const type = e.target.value;
      renderQuickAddFields(type);
    });
  }
  
  // Completion checkbox
  const completionCheckbox = document.getElementById('completionCheckbox');
  console.log('🔧 Completion checkbox found:', completionCheckbox);
  
  if (completionCheckbox) {
    completionCheckbox.addEventListener('change', (e) => {
      console.log('✅ Checkbox clicked! Checked:', e.target.checked);
      handleCompletionToggle(e);
    });
  } else {
    console.error('❌ Completion checkbox not found!');
  }
  
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
    // Get Monday of the week (handle Sunday as day 7 instead of 0)
    const dayOfWeek = today.getDay();
    const daysFromMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(today.getDate() + (currentWeekOffset * 7) + daysFromMonday);
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    // Fetch completions for this week
    const completionsResponse = await fetch(
      `${API_BASE_URL}/workout-completions/${USER_ID}?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`
    );
    const completionsData = await completionsResponse.json();
    const completions = completionsData.completions || [];
    
    console.log('📅 Fetched completions for week:', {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      completions: completions.map(c => ({
        schedule_id: c.schedule_id,
        completion_date: c.completion_date,
        day_of_week: c.day_of_week
      }))
    });
    
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
    
    // Clear selected state when changing weeks
    selectedDayElement = null;
    
    daysOfWeek.forEach((day, index) => {
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + index);
      const dateStr = dayDate.toISOString().split('T')[0];
      
      const schedule = data.schedule.find(s => s.day_of_week === day);
      const isToday = isSameDay(dayDate, today);
      
      // Check if this workout is completed
      // Need to compare dates carefully due to timezone issues
      const completion = schedule ? completions.find(c => {
        if (c.schedule_id !== schedule.id) return false;
        
        // Extract just the date part from the completion date
        const completionDate = new Date(c.completion_date);
        const completionDateStr = completionDate.toISOString().split('T')[0];
        
        // Also try comparing with the local date string
        const localDateStr = completionDate.getFullYear() + '-' + 
          String(completionDate.getMonth() + 1).padStart(2, '0') + '-' + 
          String(completionDate.getDate()).padStart(2, '0');
        
        const matches = completionDateStr === dateStr || localDateStr === dateStr;
        
        if (matches) {
          console.log('✅ Found completion match:', {
            dateStr,
            completionDateStr,
            localDateStr,
            schedule_id: schedule.id
          });
        }
        
        return matches;
      }) : null;
      
      const dayCard = document.createElement('div');
      dayCard.className = `calendar-day ${schedule ? 'has-workout' : ''} ${completion ? 'completed' : ''} ${isToday ? 'today' : ''}`;
      
      let content = `
        <div class="day-header">${dayLabels[index]}</div>
        <div class="day-date">${dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
      `;
      
      if (schedule) {
        const workoutInfo = getWorkoutIcon(schedule.workout_type);
        content += `
          <div class="day-indicator ${completion ? 'completed' : ''}" style="border-left: 3px solid ${workoutInfo.color}">
            <span class="workout-icon" style="color: ${workoutInfo.color}">${workoutInfo.icon}</span>
            <span>${schedule.workout_type}</span>
            ${completion ? '<span class="completion-badge">✓</span>' : ''}
          </div>
        `;
      } else {
        content += '<p class="rest-day-text">Rest Day</p>';
      }
      
      dayCard.innerHTML = content;
      
      // Make entire day card clickable if there's a scheduled workout
      if (schedule) {
        dayCard.style.cursor = 'pointer';
        dayCard.addEventListener('click', () => {
          // Remove selected class from previously selected day
          if (selectedDayElement) {
            selectedDayElement.classList.remove('selected');
          }
          // Add selected class to clicked day
          dayCard.classList.add('selected');
          selectedDayElement = dayCard;
          
          openWorkoutDetails(schedule, dateStr, completion);
        });
      }
      
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
  
  const section = document.getElementById('workoutDetailsSection');
  const title = document.getElementById('selectedDayTitle');
  const content = document.getElementById('selectedDayContent');
  const checkbox = document.getElementById('completionCheckbox');
  
  // Parse exercises
  const exercises = Array.isArray(schedule.exercises) 
    ? schedule.exercises 
    : JSON.parse(schedule.exercises);
  
  // Set title
  const dateObj = new Date(date);
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const workoutInfo = getWorkoutIcon(schedule.workout_type);
  title.innerHTML = `<span class="workout-icon" style="color: ${workoutInfo.color}; display: inline-flex; width: 24px; height: 24px; vertical-align: middle; margin-right: 8px;">${workoutInfo.icon}</span> ${schedule.workout_type} - ${dayName}`;
  
  // Set checkbox state
  checkbox.checked = !!completion;
  
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
      <div class="workout-details-box completed">
        <h4>✓ Completed</h4>
        <p><strong>Completed at:</strong> ${new Date(completion.completed_at).toLocaleString()}</p>
        ${completion.notes ? `<p style="margin-top: 10px;"><strong>Your notes:</strong> ${completion.notes}</p>` : ''}
      </div>
    `;
  }
  
  content.innerHTML = html;
  section.style.display = 'block';
  
  // Scroll to details section
  section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Handle marking workout as done
// Handle completion toggle
async function handleCompletionToggle(e) {
  console.log('🎯 handleCompletionToggle called');
  console.log('Current workout data:', currentWorkoutData);
  
  if (!currentWorkoutData) {
    console.error('❌ No current workout data!');
    return;
  }
  
  const isChecked = e.target.checked;
  console.log('Checkbox is checked:', isChecked);
  
  if (isChecked) {
    // Mark as done
    try {
      console.log('Marking workout complete:', {
        user_id: USER_ID,
        schedule_id: currentWorkoutData.schedule.id,
        completion_date: currentWorkoutData.date
      });
      
      const response = await fetch(`${API_BASE_URL}/workout-completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: USER_ID,
          schedule_id: currentWorkoutData.schedule.id,
          completion_date: currentWorkoutData.date,
          notes: '',
          exercises_completed: []
        })
      });
      
      const responseData = await response.json();
      console.log('Response status:', response.status);
      console.log('Response OK:', response.ok);
      console.log('Response data:', responseData);
      
      if (response.ok) {
        console.log('✅ Response OK - showing success modal');
        // Show confetti success modal
        showSuccessModal();
        // Close the details panel
        document.getElementById('workoutDetailsSection').style.display = 'none';
        // Clear selected state
        if (selectedDayElement) {
          selectedDayElement.classList.remove('selected');
          selectedDayElement = null;
        }
        // Reload calendar to show completion
        loadCalendar();
      } else {
        console.error('❌ Response not OK:', response.status, responseData);
        throw new Error(responseData.error || 'Failed to mark workout complete');
      }
    } catch (error) {
      console.error('❌ Error marking workout complete:', error);
      showMessage('Failed to mark workout complete: ' + error.message, 'error');
      e.target.checked = false; // Revert checkbox
    }
  } else {
    // Unmark
    if (!currentWorkoutData.completion) return;
    
    if (!confirm('Are you sure you want to unmark this workout as done?')) {
      e.target.checked = true; // Revert checkbox
      return;
    }
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/workout-completions/${currentWorkoutData.completion.id}`,
        { method: 'DELETE' }
      );
      
      if (response.ok) {
        showMessage('Workout unmarked', 'success');
        // Close the details panel
        document.getElementById('workoutDetailsSection').style.display = 'none';
        // Clear selected state
        if (selectedDayElement) {
          selectedDayElement.classList.remove('selected');
          selectedDayElement = null;
        }
        // Reload calendar
        loadCalendar();
      } else {
        throw new Error('Failed to unmark workout');
      }
    } catch (error) {
      console.error('Error unmarking workout:', error);
      showMessage('Failed to unmark workout', 'error');
      e.target.checked = true; // Revert checkbox
    }
  }
}

// ===== SMART NUTRITION =====
async function loadSmartNutrition() {
  const container = document.getElementById('nutritionRecommendations');
  
  // Show loading state
  container.innerHTML = '<div class="skeleton" style="height: 150px;"></div>';
  
  try {
    const response = await fetch(`${API_BASE_URL}/nutrition-recommendations/recommendations/${USER_ID}`);
    const data = await response.json();
    
    if (!data.workoutType && !data.hasTraining) {
      container.innerHTML = `
        <div class="nutrition-workout-info" style="text-align: center; padding: 24px;">
          <div style="font-size: 32px; margin-bottom: 12px;">🧘</div>
          <h3 style="margin-bottom: 8px; font-size: 16px; font-weight: 600;">Rest Day</h3>
          <p style="margin: 0; color: var(--gray-600); font-size: 14px;">No training scheduled today. Focus on recovery and maintenance nutrition.</p>
        </div>
      `;
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
  console.log('📊 Loading body measurements...');
  const chartsDiv = document.getElementById('progressCharts');
  
  // Show loading state
  chartsDiv.innerHTML = '<div class="skeleton" style="height: 200px; margin-bottom: 16px;"></div>';
  
  try {
    const response = await fetch(`${API_BASE_URL}/measurements/progress/${USER_ID}`);
    const data = await response.json();
    
    console.log('📈 Measurements data received:', {
      count: data.data?.length || 0,
      rawResponse: data
    });
    
    if (!data.data || data.data.length === 0) {
      chartsDiv.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📊</div>
          <div class="empty-state-title">No measurements yet</div>
          <div class="empty-state-text">Start tracking your progress by logging your first measurement above. You'll see charts here once you have data.</div>
        </div>
      `;
      return;
    }
    
    renderProgressCharts(data);
    console.log('✅ Charts rendered successfully!');
  } catch (error) {
    console.error('Error loading measurements:', error);
    chartsDiv.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Failed to load data</div>
        <div class="empty-state-text">There was an error loading your progress data. Please try again.</div>
      </div>
    `;
  }
}

function renderProgressCharts(data) {
  console.log('🎨 Rendering progress charts with data:', data);
  console.log('📊 Number of measurements:', data.data?.length);
  console.log('📈 Measurements array:', data.data);
  
  const chartsDiv = document.getElementById('progressCharts');
  
  if (!chartsDiv) {
    console.error('❌ progressCharts div not found!');
    return;
  }
  
  // Use the correct property names from backend response
  const measurements_data = data.data; // Array of measurements
  const changes = data.changes; // Summary changes
  
  // Get latest measurement (last in array since ordered ASC)
  const latest = measurements_data[measurements_data.length - 1];
  
  console.log('📋 Latest measurement:', latest);
  console.log('📋 Changes:', changes);
  
  let summaryHTML = '<div class="progress-summary">';
  
  if (latest.weight !== null) {
    summaryHTML += `
      <div class="progress-summary-item">
        <div class="progress-summary-value">${latest.weight} kg</div>
        ${changes && changes.weight ? `<div class="progress-summary-change ${changes.weight < 0 ? 'positive' : 'negative'}">${parseFloat(changes.weight) > 0 ? '+' : ''}${changes.weight} kg</div>` : ''}
        <div class="progress-summary-label">Current Weight</div>
      </div>
    `;
  }
  
  if (latest.body_fat_percentage !== null) {
    summaryHTML += `
      <div class="progress-summary-item">
        <div class="progress-summary-value">${latest.body_fat_percentage}%</div>
        ${changes && changes.bodyFat ? `<div class="progress-summary-change ${changes.bodyFat < 0 ? 'positive' : 'negative'}">${parseFloat(changes.bodyFat) > 0 ? '+' : ''}${changes.bodyFat}%</div>` : ''}
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
    const values = measurements_data.map(m => m[measurement]).filter(v => v !== null);
    
    if (values.length > 0) {
      const max = Math.max(...values);
      const min = Math.min(...values);
      const range = max - min || 1;
      
      chartsHTML += `
        <div class="progress-chart-item">
          <h4>${labels[idx]}</h4>
          ${measurements_data.map((m, i) => {
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
  console.log('✅ Charts HTML set! Length:', chartsHTML.length, 'characters');
  console.log('📊 Number of chart items rendered:', measurements.filter((m, idx) => {
    const values = measurements_data.map(m => m[measurements[idx]]).filter(v => v !== null);
    return values.length > 0;
  }).length);
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
      
      // Reset the form
      e.target.reset();
      
      // Set date back to today
      document.getElementById('measurementDate').value = new Date().toISOString().split('T')[0];
      
      // Reload the progress charts to show the new measurement
      console.log('📊 Reloading progress charts after save...');
      await loadBodyMeasurements();
      console.log('✅ Progress charts reloaded!');
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
  messageDiv.className = `chat-message chat-message-${sender}`;
  
  const isAI = sender === 'bot' || sender === 'ai';
  
  messageDiv.innerHTML = `
    <div class="chat-avatar">
      ${isAI ? `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" fill="#3B82F6"/>
          <path d="M7 9C7.55228 9 8 8.55228 8 8C8 7.44772 7.55228 7 7 7C6.44772 7 6 7.44772 6 8C6 8.55228 6.44772 9 7 9Z" fill="white"/>
          <path d="M13 9C13.5523 9 14 8.55228 14 8C14 7.44772 13.5523 7 13 7C12.4477 7 12 7.44772 12 8C12 8.55228 12.4477 9 13 9Z" fill="white"/>
          <path d="M7 12C7 12 8 14 10 14C12 14 13 12 13 12" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      ` : `
        <div class="user-avatar">
          <span>K</span>
        </div>
      `}
    </div>
    <div class="chat-content">
      <div class="chat-author">${isAI ? 'AI Coach' : 'You'}</div>
      <div class="chat-text">${message}</div>
    </div>
  `;
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ===== FORM HANDLERS =====
function initializeForms() {
  // Nutrition form
  const nutritionForm = document.getElementById('nutritionForm');
  if (nutritionForm) {
    nutritionForm.addEventListener('submit', async (e) => {
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
  }

  // Schedule form (optional - may not exist in current version)
  const scheduleForm = document.getElementById('scheduleForm');
  if (scheduleForm) {
    scheduleForm.addEventListener('submit', async (e) => {
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
  }

  // Progress tracking (optional - may not exist in current version)
  const loadProgressBtn = document.getElementById('loadProgressBtn');
  if (loadProgressBtn) {
    loadProgressBtn.addEventListener('click', async () => {
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
  messageDiv.className = `result-message ${type}`;
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    min-width: 300px;
    max-width: 500px;
    z-index: 10000;
    box-shadow: var(--shadow-lg);
  `;
  document.body.appendChild(messageDiv);
  
  setTimeout(() => {
    messageDiv.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => messageDiv.remove(), 300);
  }, 3000);
}

// Confetti Success Modal
function showSuccessModal() {
  console.log('🎉 showSuccessModal called');
  const modal = document.getElementById('successModal');
  const confettiContainer = document.getElementById('confettiContainer');
  
  console.log('Modal element:', modal);
  console.log('Confetti container:', confettiContainer);
  
  if (!modal) {
    console.error('❌ Success modal not found!');
    return;
  }
  
  // Show modal
  modal.classList.add('active');
  console.log('✅ Modal shown');
  
  // Create confetti
  createConfetti(confettiContainer);
  
  // Close modal button
  const closeBtn = document.getElementById('closeSuccessModal');
  closeBtn.onclick = () => {
    modal.classList.remove('active');
    confettiContainer.innerHTML = ''; // Clear confetti
  };
  
  // Auto-close after 5 seconds
  setTimeout(() => {
    if (modal.classList.contains('active')) {
      modal.classList.remove('active');
      confettiContainer.innerHTML = '';
    }
  }, 5000);
}

function createConfetti(container) {
  const colors = ['#FF6900', '#00D563', '#FFFFFF', '#FF8533'];
  const confettiCount = 150;
  
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    
    // Random position
    confetti.style.left = Math.random() * 100 + '%';
    
    // Random delay
    confetti.style.animationDelay = Math.random() * 0.5 + 's';
    
    // Random duration (2-4 seconds)
    confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
    
    // Random color
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    
    // Random size
    const size = Math.random() * 8 + 6;
    confetti.style.width = size + 'px';
    confetti.style.height = size + 'px';
    
    // Random rotation speed
    const rotations = Math.random() * 4 + 2;
    confetti.style.setProperty('--rotations', rotations);
    
    container.appendChild(confetti);
  }
  
  // Clear confetti after animation
  setTimeout(() => {
    container.innerHTML = '';
  }, 4000);
}

// ===== TRAINING PLANS =====
let currentPlan = null;
let currentPlanWeek = 1;

async function initializeTrainingPlans() {
  console.log('🏃 Initializing training plans...');
  
  // Check if user has an active plan
  await loadCurrentPlan();
  
  // Set up form handler
  const planForm = document.getElementById('trainingPlanForm');
  if (planForm) {
    planForm.addEventListener('submit', handleCreatePlan);
  }
  
  // Set up week navigation
  const prevWeekBtn = document.getElementById('prevPlanWeek');
  const nextWeekBtn = document.getElementById('nextPlanWeek');
  
  if (prevWeekBtn) {
    prevWeekBtn.addEventListener('click', () => {
      if (currentPlanWeek > 1) {
        currentPlanWeek--;
        displayWeekSchedule(currentPlan, currentPlanWeek);
      }
    });
  }
  
  if (nextWeekBtn) {
    nextWeekBtn.addEventListener('click', () => {
      const totalWeeks = currentPlan?.weeks?.length || 12;
      if (currentPlanWeek < totalWeeks) {
        currentPlanWeek++;
        displayWeekSchedule(currentPlan, currentPlanWeek);
      }
    });
  }
  
  // Set up delete button
  const deleteBtn = document.getElementById('deletePlanBtn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', handleDeletePlan);
  }
  
  // Set minimum race date to tomorrow
  const raceDateInput = document.getElementById('raceDate');
  if (raceDateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    raceDateInput.min = tomorrow.toISOString().split('T')[0];
  }
}

async function loadCurrentPlan() {
  try {
    const response = await fetch(`${API_BASE_URL}/training-plans/${USER_ID}`);
    const data = await response.json();
    
    console.log('📋 Loaded plans:', data);
    
    if (data.plans && data.plans.length > 0) {
      currentPlan = data.plans[0]; // Get the most recent plan
      showPlanDisplay();
      displayPlanSummary(currentPlan);
      displayWeekSchedule(currentPlan, currentPlanWeek);
    } else {
      showPlanForm();
    }
  } catch (error) {
    console.error('Error loading plan:', error);
    showPlanForm();
  }
}

function showPlanDisplay() {
  document.getElementById('currentPlanDisplay').style.display = 'block';
  document.getElementById('createPlanForm').style.display = 'none';
}

function showPlanForm() {
  document.getElementById('currentPlanDisplay').style.display = 'none';
  document.getElementById('createPlanForm').style.display = 'block';
}

function displayPlanSummary(plan) {
  const summaryDiv = document.getElementById('planSummary');
  const titleEl = document.getElementById('planTitle');
  
  const raceDate = new Date(plan.goal_race_date);
  const raceDateStr = raceDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  
  titleEl.textContent = `${plan.goal_race_distance}K Training Plan`;
  
  const goalTime = plan.goal_time ? formatTime(plan.goal_time) : 'Not set';
  const predictedTime = plan.predicted_time ? formatTime(plan.predicted_time) : 'Calculating...';
  
  summaryDiv.innerHTML = `
    <div class="plan-stat-grid">
      <div class="plan-stat">
        <div class="plan-stat-label">Race Date</div>
        <div class="plan-stat-value">${raceDateStr}</div>
      </div>
      <div class="plan-stat">
        <div class="plan-stat-label">Distance</div>
        <div class="plan-stat-value">${plan.goal_race_distance}<span class="plan-stat-unit">km</span></div>
      </div>
      <div class="plan-stat">
        <div class="plan-stat-label">Goal Time</div>
        <div class="plan-stat-value">${goalTime}</div>
      </div>
      <div class="plan-stat">
        <div class="plan-stat-label">Predicted Time</div>
        <div class="plan-stat-value">${predictedTime}</div>
      </div>
      <div class="plan-stat">
        <div class="plan-stat-label">Training Days</div>
        <div class="plan-stat-value">${plan.training_days_per_week}<span class="plan-stat-unit">per week</span></div>
      </div>
      <div class="plan-stat">
        <div class="plan-stat-label">Current VDOT</div>
        <div class="plan-stat-value">${plan.current_vdot ? plan.current_vdot.toFixed(1) : 'N/A'}</div>
      </div>
    </div>
  `;
}

function displayWeekSchedule(plan, weekNumber) {
  const scheduleDiv = document.getElementById('weekSchedule');
  const weekNumberEl = document.getElementById('currentWeekNumber');
  
  if (!plan || !plan.schedule || plan.schedule.length === 0) {
    scheduleDiv.innerHTML = '<p>No schedule data available</p>';
    return;
  }
  
  // Get workouts for this week
  const weekWorkouts = plan.schedule.filter(w => w.week_number === weekNumber);
  
  weekNumberEl.textContent = `Week ${weekNumber} of ${plan.plan_duration_weeks}`;
  
  if (weekWorkouts.length === 0) {
    scheduleDiv.innerHTML = '<p>No workouts scheduled for this week</p>';
    return;
  }
  
  scheduleDiv.innerHTML = weekWorkouts.map(workout => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[workout.day_of_week];
    
    return `
      <div class="workout-card">
        <div class="workout-card-header">
          <div class="workout-day">${dayName}</div>
          <span class="workout-type ${workout.workout_type}">${workout.workout_type.replace('_', ' ')}</span>
        </div>
        <div class="workout-details">
          ${workout.distance ? `
            <div class="workout-detail-row">
              <span class="workout-detail-label">Distance:</span>
              <span class="workout-detail-value">${workout.distance.toFixed(1)} km</span>
            </div>
          ` : ''}
          ${workout.target_pace ? `
            <div class="workout-detail-row">
              <span class="workout-detail-label">Target Pace:</span>
              <span class="workout-detail-value">${formatPace(workout.target_pace)}/km</span>
            </div>
          ` : ''}
          ${workout.intervals_json ? renderIntervals(workout.intervals_json) : ''}
        </div>
        ${workout.description ? `
          <div class="workout-description">${workout.description}</div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function renderIntervals(intervalsJson) {
  try {
    const intervals = typeof intervalsJson === 'string' ? JSON.parse(intervalsJson) : intervalsJson;
    return `
      <div class="workout-detail-row">
        <span class="workout-detail-label">Intervals:</span>
        <span class="workout-detail-value">${intervals.repeats}x ${intervals.distance}km @ ${formatPace(intervals.pace)}/km</span>
      </div>
      <div class="workout-detail-row">
        <span class="workout-detail-label">Recovery:</span>
        <span class="workout-detail-value">${intervals.recovery}km easy</span>
      </div>
    `;
  } catch (e) {
    return '';
  }
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

function formatPace(secondsPerKm) {
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.floor(secondsPerKm % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

async function handleCreatePlan(e) {
  e.preventDefault();
  
  const resultDiv = document.getElementById('planFormResult');
  resultDiv.textContent = 'Generating your training plan...';
  resultDiv.className = 'form-result';
  
  // Collect form data
  const raceDistance = parseFloat(document.getElementById('raceDistance').value);
  const raceDate = document.getElementById('raceDate').value;
  const currentMileage = parseFloat(document.getElementById('currentMileage').value);
  const trainingDays = parseInt(document.getElementById('trainingDays').value);
  const experienceLevel = document.getElementById('experienceLevel').value;
  
  // Optional goal time
  const goalHours = parseInt(document.getElementById('goalHours').value) || 0;
  const goalMinutes = parseInt(document.getElementById('goalMinutes').value) || 0;
  const goalSeconds = parseInt(document.getElementById('goalSeconds').value) || 0;
  const goalTime = (goalHours * 3600) + (goalMinutes * 60) + goalSeconds || null;
  
  // Optional recent race data
  const recentDistance = parseFloat(document.getElementById('recentDistance').value) || null;
  const recentHours = parseInt(document.getElementById('recentHours').value) || 0;
  const recentMinutes = parseInt(document.getElementById('recentMinutes').value) || 0;
  const recentSeconds = parseInt(document.getElementById('recentSeconds').value) || 0;
  const recentTime = recentDistance ? (recentHours * 3600) + (recentMinutes * 60) + recentSeconds : null;
  
  const planData = {
    user_id: USER_ID,
    goal_race_distance: raceDistance,
    goal_race_date: raceDate,
    goal_time: goalTime,
    current_weekly_mileage: currentMileage,
    training_days_per_week: trainingDays,
    experience_level: experienceLevel,
    recent_race_distance: recentDistance,
    recent_race_time: recentTime
  };
  
  console.log('📤 Submitting plan data:', planData);
  
  try {
    const response = await fetch(`${API_BASE_URL}/training-plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(planData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      resultDiv.textContent = '✅ Training plan generated successfully!';
      resultDiv.className = 'form-result success';
      
      console.log('✅ Plan created:', data);
      
      // Reload the plan
      setTimeout(() => {
        loadCurrentPlan();
      }, 1000);
    } else {
      throw new Error(data.error || 'Failed to create plan');
    }
  } catch (error) {
    console.error('Error creating plan:', error);
    resultDiv.textContent = `❌ Error: ${error.message}`;
    resultDiv.className = 'form-result error';
  }
}

async function handleDeletePlan() {
  if (!confirm('Are you sure you want to delete this training plan?')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/training-plans/${currentPlan.id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      currentPlan = null;
      currentPlanWeek = 1;
      showPlanForm();
      showMessage('Training plan deleted successfully', 'success');
    } else {
      throw new Error('Failed to delete plan');
    }
  } catch (error) {
    console.error('Error deleting plan:', error);
    showMessage('Failed to delete plan', 'error');
  }
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
            ${meal.items && meal.items.length > 0 ? meal.items.map(item => `<p>• ${item.food_item}</p>`).join('') : '<p>No items</p>'}
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
      summaryDiv.innerHTML = `
        <div class="empty-state" style="padding: 40px 24px;">
          <div class="empty-state-icon">🍽️</div>
          <div class="empty-state-title">No meals logged today</div>
          <div class="empty-state-text">Start tracking your nutrition by logging your first meal above.</div>
        </div>
      `;
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
