import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check for database URL
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL environment variable not set');
        return res.status(500).json({ error: 'Database not configured' });
    }

    try {
        const sql = neon(process.env.DATABASE_URL);

        const {
            type,
            message,
            email,
            browser,
            os,
            screenSize,
            windowSize,
            currentSettings,
            timestamp
        } = req.body;

        // Validate required fields
        if (!type || !message) {
            return res.status(400).json({ error: 'Type and message are required' });
        }

        // Insert feedback into database
        await sql`
            INSERT INTO feedback (
                type,
                message,
                email,
                browser,
                os,
                screen_size,
                window_size,
                current_settings,
                submitted_at
            ) VALUES (
                ${type},
                ${message},
                ${email || null},
                ${browser || null},
                ${os || null},
                ${screenSize || null},
                ${windowSize || null},
                ${currentSettings || null},
                ${timestamp ? new Date(timestamp) : new Date()}
            )
        `;

        return res.status(200).json({ success: true, message: 'Feedback submitted successfully' });
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Failed to save feedback' });
    }
}
