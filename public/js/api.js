
const API_BASE_URL = '/api';


function getAuthToken() {
    return localStorage.getItem('token');
}


function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}


function isAuthenticated() {
    return !!getAuthToken();
}


function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}


async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();

    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    });


    if (response.status === 401 || response.status === 403) {
        logout();
        throw new Error('Unauthorized');
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'API request failed');
    }

    return data;
}


const API = {

    login: (credentials) => apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
    }),

    register: (userData) => apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
    }),

    getProfile: () => apiRequest('/auth/profile'),

    updatePreferences: (preferences) => apiRequest('/auth/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences),
    }),


    generateSchedule: (date, customPreferences) => apiRequest('/schedules/generate', {
        method: 'POST',
        body: JSON.stringify({ date, customPreferences }),
    }),

    getSchedule: (date) => apiRequest(`/schedules/${date}`),

    updateSchedule: (date, schedule_data) => apiRequest(`/schedules/${date}`, {
        method: 'PUT',
        body: JSON.stringify({ schedule_data }),
    }),


    suggestMeal: (date, meal_type) => apiRequest('/meals/suggest', {
        method: 'POST',
        body: JSON.stringify({ date, meal_type }),
    }),

    saveMeal: (mealData) => apiRequest('/meals/save', {
        method: 'POST',
        body: JSON.stringify(mealData),
    }),

    getMeals: (date) => apiRequest(`/meals/${date}`),

    generateGroceryList: (week_start_date) => apiRequest('/meals/grocery-list', {
        method: 'POST',
        body: JSON.stringify({ week_start_date }),
    }),


    addWardrobeItem: (itemData) => apiRequest('/outfits/wardrobe', {
        method: 'POST',
        body: JSON.stringify(itemData),
    }),

    getWardrobe: () => apiRequest('/outfits/wardrobe'),

    deleteWardrobeItem: (id) => apiRequest(`/outfits/wardrobe/${id}`, {
        method: 'DELETE',
    }),

    suggestOutfit: (date, occasion, weather, is_autopilot) => apiRequest('/outfits/suggest', {
        method: 'POST',
        body: JSON.stringify({ date, occasion, weather, is_autopilot }),
    }),

    getOutfit: (date) => apiRequest(`/outfits/${date}`),


    createTask: (taskData) => apiRequest('/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData),
    }),

    getTasks: (status) => apiRequest(`/tasks${status ? `?status=${status}` : ''}`),

    getTopPriorities: () => apiRequest('/tasks/top-priorities'),

    updateTask: (id, taskData) => apiRequest(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(taskData),
    }),

    deleteTask: (id) => apiRequest(`/tasks/${id}`, {
        method: 'DELETE',
    }),


    logMood: (moodData) => apiRequest('/mood', {
        method: 'POST',
        body: JSON.stringify(moodData),
    }),

    getMoodLogs: (start_date, end_date) =>
        apiRequest(`/mood?start_date=${start_date}&end_date=${end_date}`),

    getMoodAnalytics: (days) => apiRequest(`/mood/analytics?days=${days || 7}`),


    getAnalytics: (days) => apiRequest(`/analytics?days=${days || 30}`),

    updateStats: (date) => apiRequest('/analytics/update-stats', {
        method: 'POST',
        body: JSON.stringify({ date }),
    }),
};


function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}


if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API, getAuthToken, getUser, isAuthenticated, logout, getTodayDate, formatDate };
}
