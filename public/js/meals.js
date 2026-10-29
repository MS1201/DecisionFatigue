document.addEventListener('DOMContentLoaded', async () => {

    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }


    const currentDate = getTodayDate();
    document.getElementById('currentDateDisplay').textContent = formatDate(currentDate);


    const mealsContainer = document.getElementById('mealsContainer');
    const groceryListContainer = document.getElementById('groceryListContainer');
    const dietForm = document.getElementById('dietForm');
    const generateAllBtn = document.getElementById('generateAllMealsBtn');
    const refreshGroceryBtn = document.getElementById('refreshGroceryBtn');


    const user = getUser();
    if (user) {
        document.getElementById('userAvatar').textContent = user.full_name.charAt(0).toUpperCase();
    }


    await loadPreferences();
    await loadMeals();
    await loadGroceryList();


    dietForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await API.updatePreferences({
                diet_type: document.getElementById('dietType').value,
                daily_calories: document.getElementById('calories').value
            });
            alert('Preferences updated! Regenerate meals to see changes.');
        } catch (error) {
            alert('Failed to update preferences');
        }
    });

    generateAllBtn.addEventListener('click', async () => {
        if (confirm('Replace all meals for today?')) {
            await generateMeal('breakfast');
            await generateMeal('lunch');
            await generateMeal('dinner');
            await generateMeal('snack');
            await loadMeals();
            await loadGroceryList();
        }
    });

    refreshGroceryBtn.addEventListener('click', loadGroceryList);


    async function loadPreferences() {
        try {
            const { preferences } = await API.getProfile();
            if (preferences) {
                document.getElementById('dietType').value = preferences.diet_type || 'balanced';
                document.getElementById('calories').value = preferences.daily_calories || 2000;
            }
        } catch (error) {
            console.error('Failed to load preferences:', error);
        }
    }

    async function loadMeals() {
        try {
            const meals = await API.getMeals(currentDate);
            const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

            mealsContainer.innerHTML = '';

            mealTypes.forEach(type => {
                const meal = meals.find(m => m.meal_type === type);
                renderMealCard(type, meal);
            });

        } catch (error) {
            console.error('Error loading meals:', error);
            mealsContainer.innerHTML = '<div class="alert alert-error">Failed to load meals</div>';
        }
    }

    function renderMealCard(type, meal) {
        const card = document.createElement('div');
        card.className = 'meal-card fade-in';
        card.style.animationDelay = `${['breakfast', 'lunch', 'dinner', 'snack'].indexOf(type) * 0.1}s`;

        if (meal) {

            card.innerHTML = `
                <div class="meal-header">
                    <span class="meal-type">${type}</span>
                    <button class="btn btn-sm btn-outline regenerate-btn" data-type="${type}">🔄 Replace</button>
                </div>
                <div class="meal-body">
                    <div class="meal-name">${meal.meal_name}</div>
                    <div class="meal-meta">
                        <span>🔥 ${meal.calories} kcal</span>
                        <span>⏱️ ${meal.recipe?.prep_time || 15} mins</span>
                    </div>
                    <div class="ingredient-list">
                        ${meal.recipe?.ingredients ? meal.recipe.ingredients.map(ing => `<span class="ingredient-tag">${ing}</span>`).join('') : ''}
                    </div>
                </div>
            `;
        } else {

            card.innerHTML = `
                <div class="meal-header">
                    <span class="meal-type">${type}</span>
                </div>
                <div class="meal-body" style="text-align: center; color: var(--color-text-secondary);">
                    <p>No meal planned</p>
                    <button class="btn btn-primary btn-sm mt-1 generate-btn" data-type="${type}">
                        Generate Suggestion
                    </button>
                </div>
            `;
        }

        mealsContainer.appendChild(card);
    }


    mealsContainer.addEventListener('click', async (e) => {
        if (e.target.classList.contains('generate-btn') || e.target.classList.contains('regenerate-btn')) {
            const type = e.target.getAttribute('data-type');
            const btn = e.target;
            const originalText = btn.textContent;

            btn.disabled = true;
            btn.textContent = '...';

            await generateMeal(type);
            await loadMeals();
            await loadGroceryList();
        }
    });

    async function generateMeal(type) {
        try {
            const { suggestion } = await API.suggestMeal(currentDate, type);
            if (suggestion) {
                await API.saveMeal({
                    date: currentDate,
                    meal_type: type,
                    meal_name: suggestion.name,
                    recipe: suggestion,
                    calories: suggestion.calories,
                    is_autopilot: 0
                });
            }
        } catch (error) {
            console.error(`Failed to generate ${type}:`, error);
        }
    }

    async function loadGroceryList() {
        try {

            const d = new Date(currentDate);
            const day = d.getDay();
            const diff = d.getDate() - day;
            const sunday = new Date(d.setDate(diff));
            const weekStart = sunday.toISOString().split('T')[0];

            const { groceryList } = await API.generateGroceryList(weekStart);

            if (!groceryList || groceryList.length === 0) {
                groceryListContainer.innerHTML = `
                    <p style="color: var(--color-text-secondary); text-align: center; font-size: var(--font-size-sm);">
                        No ingredients needed for this week yet.
                    </p>
                `;
                return;
            }


            const grouped = {};
            groceryList.forEach(item => {
                if (!grouped[item.category]) grouped[item.category] = [];
                grouped[item.category].push(item);
            });

            groceryListContainer.innerHTML = Object.keys(grouped).map(cat => `
                <h4 style="text-transform: capitalize; margin: var(--spacing-sm) 0; font-size: var(--font-size-sm); color: var(--color-primary-light);">${cat}</h4>
                <ul class="grocery-list">
                    ${grouped[cat].map(item => `
                        <li class="grocery-item">
                            <span>${item.item}</span>
                            <span class="badge badge-secondary">${item.quantity}</span>
                        </li>
                    `).join('')}
                </ul>
            `).join('');

        } catch (error) {
            console.error('Failed to load grocery list:', error);
        }
    }
});
