const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);


router.post('/wardrobe', (req, res) => {
    const { item_type, color, style, occasion, season, image_url } = req.body;

    try {
        const result = db.prepare(`
            INSERT INTO wardrobe_items (user_id, item_type, color, style, occasion, season, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(req.user.userId, item_type, color, style, occasion, season, image_url);

        res.json({ message: 'Item added to wardrobe', itemId: result.lastInsertRowid });
    } catch (error) {
        console.error('Wardrobe add error:', error);
        res.status(500).json({ error: 'Failed to add item' });
    }
});

// Get all wardrobe items
router.get('/wardrobe', (req, res) => {
    try {
        const items = db.prepare(`
            SELECT * FROM wardrobe_items WHERE user_id = ? ORDER BY created_at DESC
        `).all(req.user.userId);

        res.json(items);
    } catch (error) {
        console.error('Wardrobe fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch wardrobe' });
    }
});


router.delete('/wardrobe/:id', (req, res) => {
    try {
        db.prepare(`
            DELETE FROM wardrobe_items WHERE id = ? AND user_id = ?
        `).run(req.params.id, req.user.userId);

        res.json({ message: 'Item removed from wardrobe' });
    } catch (error) {
        console.error('Wardrobe delete error:', error);
        res.status(500).json({ error: 'Failed to remove item' });
    }
});


router.post('/suggest', (req, res) => {
    const { date, occasion, weather } = req.body;

    try {

        const items = db.prepare(`
            SELECT * FROM wardrobe_items WHERE user_id = ?
        `).all(req.user.userId);

        if (items.length === 0) {


            const indianWardrobe = [

                { item_type: 'top', color: 'White', style: 'Kurta', occasion: 'casual', season: 'summer', image_url: 'https://m.media-amazon.com/images/I/61K+8C-c+GL._UY550_.jpg' },
                { item_type: 'top', color: 'Navy Blue', style: 'Nehru Jacket', occasion: 'formal', season: 'winter', image_url: 'https://m.media-amazon.com/images/I/61yX8a+9vLL._UY550_.jpg' },
                { item_type: 'top', color: 'Maroon', style: 'Sherwani', occasion: 'party', season: 'winter', image_url: 'https://m.media-amazon.com/images/I/61D9A7+T5BL._UY550_.jpg' },
                { item_type: 'top', color: 'Yellow', style: 'Printed Kurti', occasion: 'casual', season: 'summer', image_url: 'https://m.media-amazon.com/images/I/61k+M+l+7gL._UY550_.jpg' },


                { item_type: 'bottom', color: 'White', style: 'Churidar', occasion: 'formal', season: 'all', image_url: 'https://m.media-amazon.com/images/I/51w+g+l+3gL._UY550_.jpg' },
                { item_type: 'bottom', color: 'Beige', style: 'Cotton Trousers', occasion: 'casual', season: 'all', image_url: 'https://m.media-amazon.com/images/I/61+D+l+8gL._UY550_.jpg' },
                { item_type: 'bottom', color: 'Blue', style: 'Jeans', occasion: 'casual', season: 'all', image_url: 'https://m.media-amazon.com/images/I/61+D+l+8gL._UY550_.jpg' },


                { item_type: 'shoes', color: 'Brown', style: 'Kolhapuri Chappals', occasion: 'casual', season: 'summer', image_url: 'https://m.media-amazon.com/images/I/61+D+l+8gL._UY550_.jpg' },
                { item_type: 'shoes', color: 'Black', style: 'Mojaris', occasion: 'formal', season: 'all', image_url: 'https://m.media-amazon.com/images/I/61+D+l+8gL._UY550_.jpg' },


                { item_type: 'accessory', color: 'Gold', style: 'Watch', occasion: 'formal', season: 'all', image_url: 'https://m.media-amazon.com/images/I/61+D+l+8gL._UY550_.jpg' },
                { item_type: 'accessory', color: 'Red', style: 'Dupatta', occasion: 'party', season: 'all', image_url: 'https://m.media-amazon.com/images/I/61+D+l+8gL._UY550_.jpg' },
            ];

            items.push(...indianWardrobe);
            // return res.status(404).json({ error: 'No wardrobe items found. Please add items first.' });
        }


        const season = weather?.temp > 70 ? 'summer' : weather?.temp > 50 ? 'spring' : 'winter';

        const tops = items.filter(i =>
            i.item_type === 'top' &&
            (i.occasion === occasion || i.occasion === 'casual') &&
            (i.season === season || i.season === 'all')
        );

        const bottoms = items.filter(i =>
            i.item_type === 'bottom' &&
            (i.occasion === occasion || i.occasion === 'casual') &&
            (i.season === season || i.season === 'all')
        );

        const shoes = items.filter(i =>
            i.item_type === 'shoes' &&
            (i.occasion === occasion || i.occasion === 'casual')
        );

        const accessories = items.filter(i => i.item_type === 'accessory');
        const outerwear = items.filter(i =>
            i.item_type === 'outerwear' &&
            (i.season === season || i.season === 'all')
        );


        const outfit = {
            top: tops[Math.floor(Math.random() * tops.length)],
            bottom: bottoms[Math.floor(Math.random() * bottoms.length)],
            shoes: shoes[Math.floor(Math.random() * shoes.length)],
            accessory: accessories.length > 0 ? accessories[Math.floor(Math.random() * accessories.length)] : null,
            outerwear: weather?.temp < 60 && outerwear.length > 0 ? outerwear[Math.floor(Math.random() * outerwear.length)] : null,
            occasion,
            weather: weather || { temp: 70, condition: 'clear' }
        };


        db.prepare(`
            INSERT INTO outfits (user_id, date, outfit_data, is_autopilot)
            VALUES (?, ?, ?, ?)
        `).run(req.user.userId, date, JSON.stringify(outfit), req.body.is_autopilot || 0);

        res.json({ outfit, date });
    } catch (error) {
        console.error('Outfit suggestion error:', error);
        res.status(500).json({ error: 'Failed to generate outfit suggestion' });
    }
});


router.get('/:date', (req, res) => {
    try {
        const outfit = db.prepare(`
            SELECT * FROM outfits WHERE user_id = ? AND date = ?
        `).get(req.user.userId, req.params.date);

        if (outfit && outfit.outfit_data) {
            outfit.outfit_data = JSON.parse(outfit.outfit_data);
        }

        res.json(outfit || null);
    } catch (error) {
        console.error('Outfit fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch outfit' });
    }
});

module.exports = router;
