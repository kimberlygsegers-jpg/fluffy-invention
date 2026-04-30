// Training Plan Generation Algorithm
// Based on Jack Daniels' VDOT system and periodization principles

/**
 * Calculate VDOT from race performance
 * @param {number} distance - Race distance in km
 * @param {number} timeInSeconds - Race time in seconds
 * @returns {number} VDOT score
 */
function calculateVDOT(distance, timeInSeconds) {
  // Simplified Jack Daniels VDOT formula
  // Based on oxygen cost and running economy
  const velocity = (distance * 1000) / timeInSeconds; // m/s
  const percentMax = 0.8 + (0.1892393 * Math.exp(-0.012778 * (timeInSeconds / 60)));
  const vo2 = -4.6 + (0.182258 * velocity) + (0.000104 * velocity * velocity);
  return vo2 / percentMax;
}

/**
 * Calculate training paces from VDOT
 * @param {number} vdot - VDOT score
 * @returns {object} Training paces in seconds per km
 */
function calculateTrainingPaces(vdot) {
  // Formulas based on Jack Daniels' pace tables
  // Returns paces in seconds per km
  
  const easyPace = 60 / ((0.2989558 * vdot) / 60); // seconds per km
  const tempoPace = 60 / ((0.29 * vdot + 4.5) / 60);
  const thresholdPace = 60 / ((0.31 * vdot + 2) / 60);
  const intervalPace = 60 / ((0.33 * vdot) / 60);
  const repetitionPace = 60 / ((0.35 * vdot) / 60);
  
  return {
    easy: Math.round(easyPace),
    tempo: Math.round(tempoPace),
    threshold: Math.round(thresholdPace),
    interval: Math.round(intervalPace),
    repetition: Math.round(repetitionPace)
  };
}

/**
 * Convert seconds to interval format (HH:MM:SS)
 * @param {number} seconds
 * @returns {string} Interval format
 */
function secondsToInterval(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Determine training phase based on week number
 * @param {number} week - Current week number
 * @param {object} phases - Phase breakdown
 * @returns {string} Phase name
 */
function determinePhase(week, phases) {
  if (week <= phases.base) return 'base';
  if (week <= phases.base + phases.build) return 'build';
  if (week <= phases.base + phases.build + phases.peak) return 'peak';
  return 'taper';
}

/**
 * Generate workouts for a specific week
 * @param {string} phase - Training phase
 * @param {number} weeklyMileage - Target mileage for the week in km
 * @param {object} paces - Training paces
 * @param {number} daysPerWeek - Training days per week
 * @param {number} weekNumber - Week number in plan
 * @returns {array} Array of workout objects
 */
function generateWeekWorkouts(phase, weeklyMileage, paces, daysPerWeek, weekNumber) {
  const workouts = [];
  
  // Long run (25-30% of weekly mileage)
  const longRunDistance = Math.round(weeklyMileage * 0.28 * 10) / 10;
  const longRun = {
    type: 'long_run',
    distance: longRunDistance,
    pace: secondsToInterval(paces.easy),
    description: `Long run at easy pace (${formatPace(paces.easy)}/km)`,
    warmup: 0,
    cooldown: 0
  };
  
  let usedMileage = longRunDistance;
  
  // Add quality workouts based on phase
  if (phase === 'build') {
    // Tempo run (10-15% of weekly mileage)
    const tempoDistance = Math.round(weeklyMileage * 0.12 * 10) / 10;
    workouts.push({
      type: 'tempo',
      distance: tempoDistance + 4, // including warmup/cooldown
      pace: secondsToInterval(paces.tempo),
      warmup: 2,
      cooldown: 2,
      description: `Tempo run: 2km warmup, ${tempoDistance}km at tempo pace (${formatPace(paces.tempo)}/km), 2km cooldown`
    });
    usedMileage += tempoDistance + 4;
  } else if (phase === 'peak') {
    // Interval workout
    const intervalSets = 8;
    const intervalDistance = 0.8; // 800m repeats
    const totalIntervalDistance = intervalSets * intervalDistance;
    
    workouts.push({
      type: 'intervals',
      distance: totalIntervalDistance + 4,
      pace: secondsToInterval(paces.interval),
      warmup: 2,
      cooldown: 2,
      intervals: {
        repeats: intervalSets,
        distance: intervalDistance,
        pace: secondsToInterval(paces.interval),
        recovery: 0.4 // 400m recovery jog
      },
      description: `Intervals: 2km warmup, ${intervalSets}x${intervalDistance}km at ${formatPace(paces.interval)}/km (400m recovery jog), 2km cooldown`
    });
    usedMileage += totalIntervalDistance + 4;
    
    // Tempo run on another day
    const tempoDistance = Math.round(weeklyMileage * 0.10 * 10) / 10;
    workouts.push({
      type: 'tempo',
      distance: tempoDistance + 4,
      pace: secondsToInterval(paces.tempo),
      warmup: 2,
      cooldown: 2,
      description: `Tempo run: 2km warmup, ${tempoDistance}km at tempo pace (${formatPace(paces.tempo)}/km), 2km cooldown`
    });
    usedMileage += tempoDistance + 4;
  } else if (phase === 'taper') {
    // Light tempo to maintain fitness
    const tempoDistance = Math.round(weeklyMileage * 0.08 * 10) / 10;
    workouts.push({
      type: 'tempo',
      distance: tempoDistance + 3,
      pace: secondsToInterval(paces.tempo),
      warmup: 1.5,
      cooldown: 1.5,
      description: `Light tempo: 1.5km warmup, ${tempoDistance}km at tempo pace, 1.5km cooldown`
    });
    usedMileage += tempoDistance + 3;
  }
  
  // Fill remaining days with easy runs
  const remainingMileage = weeklyMileage - usedMileage;
  const easyDays = daysPerWeek - workouts.length - 1; // -1 for long run
  
  if (easyDays > 0) {
    const easyRunDistance = Math.round((remainingMileage / easyDays) * 10) / 10;
    for (let i = 0; i < easyDays; i++) {
      workouts.push({
        type: 'easy',
        distance: easyRunDistance,
        pace: secondsToInterval(paces.easy),
        description: `Easy run at comfortable pace (${formatPace(paces.easy)}/km)`,
        warmup: 0,
        cooldown: 0
      });
    }
  }
  
  // Add long run at the end (typically Sunday/weekend)
  workouts.push(longRun);
  
  // Add rest days if needed
  const totalDays = 7;
  const restDays = totalDays - workouts.length;
  for (let i = 0; i < restDays; i++) {
    workouts.push({
      type: 'rest',
      distance: 0,
      description: 'Rest day - recovery is part of training!'
    });
  }
  
  return workouts;
}

/**
 * Format pace as MM:SS
 * @param {number} paceInSeconds - Pace in seconds per km
 * @returns {string} Formatted pace
 */
function formatPace(paceInSeconds) {
  const minutes = Math.floor(paceInSeconds / 60);
  const seconds = Math.floor(paceInSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Generate complete training plan
 * @param {object} userData - User input data
 * @returns {object} Complete training plan
 */
function generateTrainingPlan(userData) {
  const {
    currentVDOT,
    goalRaceDate,
    planStartDate,
    currentWeeklyMileage,
    trainingDaysPerWeek,
    goalRaceDistance
  } = userData;
  
  // Calculate training duration
  const start = new Date(planStartDate);
  const end = new Date(goalRaceDate);
  const weeksToRace = Math.ceil((end - start) / (7 * 24 * 60 * 60 * 1000));
  
  // Determine phase durations
  const phases = {
    base: Math.floor(weeksToRace * 0.40),    // 40% base building
    build: Math.floor(weeksToRace * 0.35),   // 35% build/threshold work
    peak: Math.floor(weeksToRace * 0.20),    // 20% peak/speed work
    taper: Math.ceil(weeksToRace * 0.05)     // 5% taper
  };
  
  // Calculate training paces
  const paces = calculateTrainingPaces(currentVDOT);
  
  // Calculate target peak mileage (30-50% increase depending on current mileage)
  const targetPeakMileage = Math.round(currentWeeklyMileage * 1.4 * 10) / 10;
  
  // Build weekly progression
  const schedule = [];
  let weeklyMileage = currentWeeklyMileage;
  
  for (let week = 1; week <= weeksToRace; week++) {
    const phase = determinePhase(week, phases);
    
    // Progressive overload with recovery weeks
    if (week % 4 === 0) {
      // Recovery week - reduce by 25%
      weeklyMileage = Math.round(weeklyMileage * 0.75 * 10) / 10;
    } else if (phase === 'taper') {
      // Taper - reduce by 30% each week
      weeklyMileage = Math.round(weeklyMileage * 0.70 * 10) / 10;
    } else if (weeklyMileage < targetPeakMileage) {
      // Increase by 8-10% per week (10% rule)
      weeklyMileage = Math.round(Math.min(weeklyMileage * 1.08, targetPeakMileage) * 10) / 10;
    }
    
    // Generate workouts for this week
    const workouts = generateWeekWorkouts(phase, weeklyMileage, paces, trainingDaysPerWeek, week);
    
    // Calculate week start date
    const weekStartDate = new Date(start);
    weekStartDate.setDate(start.getDate() + (week - 1) * 7);
    
    schedule.push({
      weekNumber: week,
      phase,
      weekStartDate: weekStartDate.toISOString().split('T')[0],
      totalMileage: weeklyMileage,
      workouts
    });
  }
  
  return {
    summary: {
      totalWeeks: weeksToRace,
      phases,
      startingMileage: currentWeeklyMileage,
      peakMileage: targetPeakMileage,
      trainingPaces: {
        easy: formatPace(paces.easy),
        tempo: formatPace(paces.tempo),
        threshold: formatPace(paces.threshold),
        interval: formatPace(paces.interval),
        repetition: formatPace(paces.repetition)
      }
    },
    schedule
  };
}

module.exports = {
  calculateVDOT,
  calculateTrainingPaces,
  generateTrainingPlan,
  secondsToInterval,
  formatPace
};
