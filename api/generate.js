const { GoogleGenerativeAI } = require('@google/generative-ai');

// ❗️ВАЖНО: Здесь будет храниться твой API ключ
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Пожелания к меню не указаны' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const result = await model.generateContent({
            contents: [{
                parts: [{ text: `Сгенерируй меню для корпоративного питания на основе следующих пожеланий: ${prompt}. Не используй Markdown! Предоставь результат в формате:
Название меню: [название]
Описание: [краткое описание]
Завтрак: [блюда через запятую]
Обед: [блюда через запятую]
Ужин: [блюда через запятую]` }]
            }]
        });

        const response = await result.response;
        const generatedText = response.text();

        // Парсинг ответа Gemini
        const lines = generatedText.split('\n').filter(line => line.trim() !== '');
        let menuData = {
            title: '',
            description: '',
            menuItems: []
        };

        lines.forEach(line => {
            if (line.startsWith('Название')) {
                menuData.title = line.replace('Название меню:', '').trim();
            } else if (line.startsWith('Описание')) {
                menuData.description = line.replace('Описание:', '').trim();
            } else if (line.includes(':')) {
                const [category, items] = line.split(':');
                menuData.menuItems.push({
                    category: category.trim(),
                    items: items.split(',').map(item => item.trim())
                });
            }
        });

        res.status(200).json(menuData);
    } catch (error) {
        console.error("Ошибка при генерации меню:", error.message);
        res.status(500).json({ error: "Не удалось сгенерировать меню." });
    }
}
