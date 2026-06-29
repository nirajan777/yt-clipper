process.on("uncaughtException", (err) => {
  console.error("CRASH:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("REJECTION:", err);
});

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/api/clip', async (req, res) => {
    const { videoUrl, startTime, duration } = req.body;
    if (!videoUrl || !startTime || !duration) {
        return res.status(400).json({ error: 'Missing parameters' });
    }

    const outputFilename = `clip-${Date.now()}.mp4`;
    const outputPath = path.join(__dirname, 'public', outputFilename);

    console.log(`\n=== New Clip Request ===`);
    console.log(`URL: ${videoUrl}`);
    console.log(`Fetching stream links from YouTube...`);

    // Explicitly forces yt-dlp to use Node as its JS engine execution layer
const ytdlpCmd = `/usr/local/bin/yt-dlp --add-header "User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" --add-header "Accept-Language:en-US,en;q=0.9" --js-runtime node -g -f "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]" "${videoUrl}"`;







    exec(ytdlpCmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`[yt-dlp Error]: ${stderr}`);
            return res.status(500).json({ error: 'Failed to fetch YouTube streams.' });
        }

        const streamUrls = stdout.trim().split('\n');
        const videoStream = streamUrls[0];
        const audioStream = streamUrls[1] || videoStream;

        console.log(`Streams retrieved successfully. Trimming video with FFmpeg...`);

       const ffmpegCmd = `ffmpeg -ss ${startTime} -i "${videoStream}" -ss ${startTime} -i "${audioStream}" -t ${duration} -map 0:v:0 -map 1:a:0 -c:v libx264 -preset ultrafast -c:a aac -y "${outputPath}"`;


        exec(ffmpegCmd, (ffError, ffStdout, ffStderr) => {
            if (ffError) {
                console.error(`[FFmpeg Error]: ${ffStderr}`);
                return res.status(500).json({ error: 'Failed to trim video.' });
            }
            
            console.log(`🎉 Success! Clip saved to public/${outputFilename}`);
            res.json({ downloadUrl: `/${outputFilename}` });
        });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


