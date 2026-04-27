# API Documentation

## Base URL
- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

## Authentication
Current version uses a demo user ID. In production, add authentication headers.

---

## Chat Endpoints

### Send Chat Message
Send a message to the AI fitness coach.

**Endpoint:** `POST /api/chat`

**Request Body:**
```json
{
  "message": "What should I eat before a workout?",
  "userId": 1,
  "conversationHistory": [
    {
      "role": "user",
      "content": "Previous message"
    },
    {
      "role": "assistant",
      "content": "Previous response"
    }
  ]
}
```

**Response:**
```json
{
  "response": "Before a workout, focus on easily digestible carbohydrates...",
  "timestamp": "2026-04-27T10:30:00.000Z"
}
```

---

## Workout Endpoints

### Log Strength Training
Log a strength training workout with automatic progressive overload tracking.

**Endpoint:** `POST /api/workouts/strength`

**Request Body:**
```json
{
  "userId": 1,
  "exercise": "Bench Press",
  "weight": 80,
  "reps": 8,
  "sets": 3,
  "notes": "Felt strong today",
  "workoutDate": "2026-04-27T10:30:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "workout": {
    "id": 123,
    "user_id": 1,
    "exercise": "Bench Press",
    "weight": 80,
    "reps": 8,
    "sets": 3,
    "notes": "Felt strong today",
    "workout_date": "2026-04-27T10:30:00.000Z"
  },
  "progressiveOverload": {
    "achieved": true,
    "volumeIncrease": "5.26",
    "message": "Progressive overload achieved!"
  }
}
```

### Log Cardio Activity
Log a cardio workout (cycling, swimming, running).

**Endpoint:** `POST /api/workouts/cardio`

**Request Body:**
```json
{
  "userId": 1,
  "activityType": "running",
  "duration": 45,
  "distance": 8.5,
  "calories": 450,
  "notes": "Morning run in the park",
  "workoutDate": "2026-04-27T07:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "workout": {
    "id": 456,
    "user_id": 1,
    "activity_type": "running",
    "duration": 45,
    "distance": 8.5,
    "calories": 450,
    "notes": "Morning run in the park",
    "workout_date": "2026-04-27T07:00:00.000Z"
  }
}
```

### Get Workout History
Retrieve workout history for a user.

**Endpoint:** `GET /api/workouts/history/:userId`

**Query Parameters:**
- `type` (optional): Filter by workout type (`strength` or `cardio`)
- `limit` (optional): Number of records to return (default: 50)

**Example:** `GET /api/workouts/history/1?type=strength&limit=20`

**Response:**
```json
{
  "workouts": [
    {
      "id": 123,
      "exercise": "Bench Press",
      "weight": 80,
      "reps": 8,
      "sets": 3,
      "workout_date": "2026-04-27T10:30:00.000Z"
    }
  ]
}
```

### Get Progressive Overload Stats
Get progress statistics for a specific exercise.

**Endpoint:** `GET /api/workouts/progress/:userId/:exercise`

**Example:** `GET /api/workouts/progress/1/Bench%20Press`

**Response:**
```json
{
  "exercise": "Bench Press",
  "history": [
    {
      "workout_date": "2026-04-20T10:30:00.000Z",
      "weight": 75,
      "reps": 8,
      "sets": 3,
      "volume": 1800
    },
    {
      "workout_date": "2026-04-27T10:30:00.000Z",
      "weight": 80,
      "reps": 8,
      "sets": 3,
      "volume": 1920
    }
  ]
}
```

---

## Nutrition Endpoints

### Log Nutrition Entry
Log a meal or snack with macronutrient information.

**Endpoint:** `POST /api/nutrition`

**Request Body:**
```json
{
  "userId": 1,
  "mealType": "breakfast",
  "foodItem": "Oatmeal with berries and protein powder",
  "calories": 450,
  "protein": 30,
  "carbs": 55,
  "fats": 12,
  "notes": "Pre-workout meal",
  "mealDate": "2026-04-27T08:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "nutrition": {
    "id": 789,
    "user_id": 1,
    "meal_type": "breakfast",
    "food_item": "Oatmeal with berries and protein powder",
    "calories": 450,
    "protein": 30,
    "carbs": 55,
    "fats": 12,
    "notes": "Pre-workout meal",
    "meal_date": "2026-04-27T08:00:00.000Z"
  }
}
```

### Get Daily Nutrition Summary
Get aggregated nutrition data for a specific day.

**Endpoint:** `GET /api/nutrition/daily/:userId`

**Query Parameters:**
- `date` (optional): Date in ISO format (default: today)

**Example:** `GET /api/nutrition/daily/1?date=2026-04-27`

**Response:**
```json
{
  "date": "2026-04-27",
  "meals": [
    {
      "meal_type": "breakfast",
      "total_calories": "450",
      "total_protein": "30.0",
      "total_carbs": "55.0",
      "total_fats": "12.0",
      "meal_count": "1"
    },
    {
      "meal_type": "lunch",
      "total_calories": "650",
      "total_protein": "45.0",
      "total_carbs": "60.0",
      "total_fats": "25.0",
      "meal_count": "1"
    }
  ],
  "dailyTotals": {
    "calories": 1100,
    "protein": 75,
    "carbs": 115,
    "fats": 37
  }
}
```

### Get Nutrition History
Retrieve nutrition log history.

**Endpoint:** `GET /api/nutrition/history/:userId`

**Query Parameters:**
- `limit` (optional): Number of records to return (default: 100)

**Example:** `GET /api/nutrition/history/1?limit=50`

**Response:**
```json
{
  "nutritionLogs": [
    {
      "id": 789,
      "meal_type": "breakfast",
      "food_item": "Oatmeal with berries",
      "calories": 450,
      "protein": 30,
      "meal_date": "2026-04-27T08:00:00.000Z"
    }
  ]
}
```

---

## Schedule Endpoints

### Create/Update Training Schedule
Create or update a training schedule for a specific day.

**Endpoint:** `POST /api/schedule`

**Request Body:**
```json
{
  "userId": 1,
  "dayOfWeek": "monday",
  "workoutType": "Upper Body Strength",
  "exercises": [
    "Bench Press",
    "Shoulder Press",
    "Pull-ups",
    "Tricep Dips"
  ],
  "notes": "Focus on progressive overload"
}
```

**Response:**
```json
{
  "success": true,
  "schedule": {
    "id": 10,
    "user_id": 1,
    "day_of_week": "monday",
    "workout_type": "Upper Body Strength",
    "exercises": "[\"Bench Press\",\"Shoulder Press\",\"Pull-ups\",\"Tricep Dips\"]",
    "notes": "Focus on progressive overload"
  }
}
```

### Get Weekly Training Schedule
Retrieve the complete weekly training schedule.

**Endpoint:** `GET /api/schedule/:userId`

**Example:** `GET /api/schedule/1`

**Response:**
```json
{
  "schedule": [
    {
      "id": 10,
      "day_of_week": "monday",
      "workout_type": "Upper Body Strength",
      "exercises": "[\"Bench Press\",\"Shoulder Press\"]",
      "notes": "Focus on form"
    },
    {
      "id": 11,
      "day_of_week": "wednesday",
      "workout_type": "Lower Body",
      "exercises": "[\"Squats\",\"Deadlifts\"]",
      "notes": null
    }
  ]
}
```

### Get Today's Training Schedule
Get the training schedule for the current day.

**Endpoint:** `GET /api/schedule/:userId/today`

**Example:** `GET /api/schedule/1/today`

**Response:**
```json
{
  "day": "monday",
  "schedule": {
    "id": 10,
    "workout_type": "Upper Body Strength",
    "exercises": "[\"Bench Press\",\"Shoulder Press\"]",
    "notes": "Focus on form"
  }
}
```

### Delete Training Schedule
Delete a training schedule for a specific day.

**Endpoint:** `DELETE /api/schedule/:userId/:dayOfWeek`

**Example:** `DELETE /api/schedule/1/monday`

**Response:**
```json
{
  "success": true,
  "message": "Schedule deleted successfully"
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message description",
  "details": "Additional error details (optional)"
}
```

### Common HTTP Status Codes
- `200` - Success
- `400` - Bad Request (missing required fields)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

Consider implementing rate limiting in production to prevent abuse:
- Chat endpoint: 20 requests per minute per user
- Other endpoints: 100 requests per minute per user

## Notes

- All timestamps are in ISO 8601 format
- User ID authentication should be implemented for production
- The `exercises` field in schedules is stored as JSONB in the database
- Progressive overload is calculated as: weight × reps × sets (total volume)
