// ==================== Weather Animation ====================
const weatherTypes = ['sunny', 'rainy', 'cloudy', 'snowy'];
let raindrops = [];
let snowflakes = [];
let rainCtx, snowCtx;

const initWeather = () => {
    // Initialize canvases
    rainCtx = elements.rainCanvas.getContext('2d');
    snowCtx = elements.snowCanvas.getContext('2d');

    resizeWeatherCanvases();
    window.addEventListener('resize', resizeWeatherCanvases);

    // Start weather cycle
    changeWeather();
    setInterval(changeWeather, 15000);

    // Start animations
    requestAnimationFrame(animateRain);
    requestAnimationFrame(animateSnow);
};

const resizeWeatherCanvases = () => {
    elements.rainCanvas.width = window.innerWidth;
    elements.rainCanvas.height = window.innerHeight;
    elements.snowCanvas.width = window.innerWidth;
    elements.snowCanvas.height = window.innerHeight;
};

const changeWeather = () => {
    const randomWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
    elements.weatherBg.className = `weather-bg ${randomWeather}`;
    Storage.save('currentWeather', randomWeather);
};

const animateRain = () => {
    rainCtx.clearRect(0, 0, elements.rainCanvas.width, elements.rainCanvas.height);

    // Add new drops
    if (Math.random() < 0.3) {
        raindrops.push({
            x: Math.random() * elements.rainCanvas.width,
            y: -10,
            speed: 8 + Math.random() * 8,
            length: 15 + Math.random() * 15
        });
    }

    // Update and draw drops
    raindrops = raindrops.filter(drop => drop.y < elements.rainCanvas.height);

    raindrops.forEach(drop => {
        rainCtx.beginPath();
        rainCtx.strokeStyle = 'rgba(174, 194, 224, 0.5)';
        rainCtx.lineWidth = 1;
        rainCtx.moveTo(drop.x, drop.y);
        rainCtx.lineTo(drop.x - 2, drop.y + drop.length);
        rainCtx.stroke();
        drop.y += drop.speed;
    });

    requestAnimationFrame(animateRain);
};

const animateSnow = () => {
    snowCtx.clearRect(0, 0, elements.snowCanvas.width, elements.snowCanvas.height);

    // Add new snowflakes
    if (Math.random() < 0.1) {
        snowflakes.push({
            x: Math.random() * elements.snowCanvas.width,
            y: -10,
            speed: 1 + Math.random() * 2,
            size: 2 + Math.random() * 4,
            wobble: Math.random() * Math.PI * 2
        });
    }

    // Update and draw snowflakes
    snowflakes = snowflakes.filter(flake => flake.y < elements.snowCanvas.height);

    snowflakes.forEach(flake => {
        snowCtx.beginPath();
        snowCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        snowCtx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
        snowCtx.fill();

        flake.y += flake.speed;
        flake.wobble += 0.05;
        flake.x += Math.sin(flake.wobble) * 0.5;
    });

    requestAnimationFrame(animateSnow);
};
