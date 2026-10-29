document.addEventListener('DOMContentLoaded', async () => {

    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }

    const currentDate = getTodayDate();
    document.getElementById('currentDateDisplay').textContent = formatDate(currentDate);


    const wardrobeGrid = document.getElementById('wardrobeGrid');
    const outfitContainer = document.getElementById('outfitContainer');
    const addItemForm = document.getElementById('addItemForm');
    const generateBtn = document.getElementById('generateOutfitBtn');


    const user = getUser();
    if (user) {
        document.getElementById('userAvatar').textContent = user.full_name.charAt(0).toUpperCase();
    }


    await loadWardrobe();
    await loadTodayOutfit();


    addItemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(addItemForm);
        const itemData = Object.fromEntries(formData.entries());

        try {
            await API.addWardrobeItem(itemData);
            document.getElementById('addItemModal').style.display = 'none';
            addItemForm.reset();
            await loadWardrobe();
        } catch (error) {
            alert('Failed to add item: ' + error.message);
        }
    });

    generateBtn.addEventListener('click', async () => {
        const occasion = document.getElementById('occasionSelect').value;
        const weather = { temp: 72, condition: 'clear' };

        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';

        try {
            const { outfit } = await API.suggestOutfit(currentDate, occasion, weather);
            renderOutfit(outfit);
        } catch (error) {
            alert('Failed to generate outfit: ' + error.message);
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = '✨ Suggest Outfit';
        }
    });


    async function loadWardrobe() {
        try {
            const items = await API.getWardrobe();
            wardrobeGrid.innerHTML = '';

            if (items.length === 0) {
                wardrobeGrid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: var(--spacing-xl); color: var(--color-text-muted);">
                        <p>Your closet is empty.</p>
                        <p>Add items to get AI suggestions!</p>
                    </div>
                `;
                return;
            }

            items.forEach(item => {
                const el = document.createElement('div');
                el.className = 'wardrobe-item fade-in';

                const imageDisplay = item.image_url ?
                    `<img src="${item.image_url}" alt="${item.item_type}" style="width: 100%; height: 100%; object-fit: cover;">` :
                    getItemIcon(item.item_type);

                el.innerHTML = `
                    <div class="item-image" style="background: white;">
                        ${imageDisplay}
                    </div>
                    <button class="item-delete" onclick="deleteItem(${item.id})">×</button>
                    <div class="item-details">
                        <div style="font-weight: 600; font-size: 0.9rem;">${item.style || item.color}</div>
                        <div class="item-type">${item.color} ${item.item_type}</div>
                        <div style="font-size: 0.7rem; color: var(--color-primary); margin-top: 4px;">For: ${item.occasion}</div>
                    </div>
                `;
                wardrobeGrid.appendChild(el);
            });
        } catch (error) {
            console.error('Failed to load wardrobe:', error);
        }
    }

    async function loadTodayOutfit() {
        try {
            const outfit = await API.getOutfit(currentDate);
            if (outfit && outfit.outfit_data) {
                renderOutfit(outfit.outfit_data);
            }
        } catch (error) {
            console.error('Failed to load outfit:', error);
        }
    }

    function renderOutfit(outfit) {
        if (!outfit) return;

        outfitContainer.innerHTML = `
            <div class="outfit-display">
                ${renderPiece(outfit.top, 'top', 'var(--color-primary)')}
                ${renderPiece(outfit.bottom, 'bottom', 'var(--color-secondary)')}
                ${renderPiece(outfit.shoes, 'shoes', 'var(--color-accent)')}
                ${outfit.outerwear ? renderPiece(outfit.outerwear, 'outerwear', 'var(--color-info)') : ''}
                ${outfit.accessory ? renderPiece(outfit.accessory, 'accessory', '#9C27B0') : ''}
            </div>
            <div class="text-center mt-2">
                <span class="badge badge-primary">${outfit.occasion || 'Casual'}</span>
                <span class="badge badge-secondary">${outfit.weather?.condition || 'Clear'}</span>
            </div>
        `;
    }

    function renderPiece(item, type, borderColor) {
        if (!item) return `
            <div class="outfit-piece">
                <div class="piece-placeholder" style="border: 2px dashed ${borderColor}; opacity: 0.5;">
                    ${getItemIcon(type)}
                </div>
                <div>No ${type}</div>
            </div>`;

        const imageHtml = item.image_url ?
            `<img src="${item.image_url}" alt="${item.item_type}" style="width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius-md);">` :
            getItemIcon(type);

        return `
            <div class="outfit-piece fade-in">
                <div class="piece-placeholder" style="border: 2px solid ${borderColor}; padding: 0; overflow: hidden; background: white;">
                    ${imageHtml}
                </div>
                <div style="font-weight: 500; font-size: 0.9rem;">${item.color} ${item.style || ''}</div>
            </div>
        `;
    }

    function getItemIcon(type) {
        const icons = {
            top: '👕',
            bottom: '👖',
            shoes: '👞',
            accessory: '🧢',
            outerwear: '🧥'
        };
        return icons[type] || '👔';
    }

    window.deleteItem = async (id) => {
        if (confirm('Remove this item from your closet?')) {
            try {
                await API.deleteWardrobeItem(id);
                await loadWardrobe();
            } catch (error) {
                alert('Failed to delete item');
            }
        }
    };
});
