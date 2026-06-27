/* =====================================
   API CONFIG
===================================== */

const GENERATE_API = "https://nonenforced-rationally-alfred.ngrok-free.dev/api/generate";
const RECOMMEND_API = "https://nonenforced-rationally-alfred.ngrok-free.dev/api/recommend";


/* =====================================
   STYLE MAPPING
===================================== */

const styleMap = {

"Avatar":
"(3D avatar portrait:1.3), stylized character, soft lighting",

"Photorealistic":
"(photorealistic DSLR photo:1.4), ultra realistic, cinematic lighting",

"AI Art":
"(digital art masterpiece:1.3), artstation trending, hyper detailed",

"Anime":
"(anime illustration style:1.4), vibrant anime colors, studio anime",

"Cyberpunk":
"(cyberpunk futuristic city:1.4), neon lights, blade runner style",

"Fantasy Art":
"(epic fantasy concept art:1.4), dramatic lighting, matte painting",

"Watercolor":
"(watercolor painting:1.5), watercolor paper texture, soft brush strokes",

"Oil Painting":
"(classical oil painting:1.5), (thick oil brush strokes:1.4), canvas texture",

"Sketch":
"(pencil sketch drawing:1.5), graphite shading",

"3D Render":
"(3D render:1.4), octane render, global illumination",

"Pixar Style":
"(pixar animation style:1.5), 3D cartoon rendering",

"Studio Ghibli":
"(studio ghibli anime style:1.5), soft colors, hand painted background",

"Minimalist":
"(minimalist illustration:1.4), clean shapes, simple design",

"Concept Art":
"(concept art illustration:1.4), game concept art, dramatic lighting",

"Surrealism":
"(surrealism painting:1.5), salvador dali style, dreamlike scene"

};


/* =====================================
   PAGE NAVIGATION
===================================== */

function goGenerate() {
    window.location.href = "/generate";
}

function goHome() {
    window.location.href = "/";
}

/* =====================================
   HISTORY FUNCTIONS (NEW)
===================================== */
let historyData = [];
function saveToHistory(image, prompt) {

    historyData.unshift({
        image: image,   // FULL IMAGE
        prompt: prompt,
        time: new Date().toLocaleString()
    });

    // keep only last 3
    historyData = historyData.slice(0, 3);

    loadHistory();
}

function loadHistory() {

    const container = document.getElementById("historyList");
    if (!container) return;

    container.innerHTML = "";

    historyData.forEach((item) => {

        const div = document.createElement("div");
        div.className = "history-item";

        div.innerHTML = `
            <img src="data:image/png;base64,${item.image}" />
            <div class="history-info">
                <div class="history-prompt">${item.prompt}</div>
                <div class="history-time">${item.time}</div>
            </div>
            <button class="reuse-btn">Reuse</button>
        `;

        // Click → show full image
        div.querySelector("img").onclick = () => {
            const output = document.getElementById("output");

            output.src = "data:image/png;base64," + item.image;
            output.style.display = "block";

            document.getElementById("placeholder").style.display = "none";
        };

        // Reuse prompt
        div.querySelector(".reuse-btn").onclick = () => {
            document.getElementById("prompt").value = item.prompt;
        };

        container.appendChild(div);
    });
}
/* =====================================
   GENERATE IMAGE FUNCTION
===================================== */

async function generateImage() {

    const promptInput = document.getElementById("prompt");
    const outputImage = document.getElementById("output");
    const generateBtn = document.getElementById("generateBtn");

    if (!promptInput) return;

    let prompt = promptInput.value.trim();

    if (!prompt) {
        alert("Please enter a prompt.");
        return;
    }

    /* ============================
       READ SELECTED OPTIONS
    ============================ */

    const activeOptions = document.querySelectorAll(".option.active");

    let modifiers = [];

    activeOptions.forEach(btn => {

        const text = btn.innerText.trim();

        if (text === "Default") return;

        if (styleMap[text]) {
            modifiers.push(styleMap[text]);
        } else {
            modifiers.push(text);
        }

    });

    /* Add modifiers */

    if (modifiers.length > 0) {
        prompt = prompt + ", " + modifiers.join(", ");
    }

    /* Quality boosters */

    prompt += ", masterpiece, highly detailed, artstation quality, sharp focus, 8k";


    try {
        console.log("🚀 Calling API:", GENERATE_API);
        showLoader(true);

        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.innerText = "Generating...";
        }

        if (outputImage) outputImage.src = "";

        const response = await fetch(GENERATE_API, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                prompt: prompt
            })

        });
        console.log("Response status:", response.status);

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        
        console.log("Response data:", data);

        if (data.image) {

            outputImage.src = "data:image/png;base64," + data.image;

            outputImage.style.display = "block";

            const placeholder = document.getElementById("placeholder");

            if (placeholder) placeholder.style.display = "none";

            // ✅ ADD THESE 2 LINES
            saveToHistory(data.image, prompt);
            loadHistory();
        } else {

            alert(data.error || "Image generation failed");

        }

    } catch (error) {

        console.error("Generate error:", error);

        alert("Backend connection error. Check Flask server.");

    } finally {

        showLoader(false);

        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.innerText = "âœ¨ Generate";
        }

    }
    
}


/* =====================================
   PROMPT RECOMMENDATION SYSTEM
===================================== */

function debounce(func, delay) {

    let timeout;

    return function (...args) {

        clearTimeout(timeout);

        timeout = setTimeout(() => {

            func.apply(this, args);

        }, delay);

    };

}


async function getRecommendations(prompt) {

    const dropdown = document.getElementById("recommendations");

    if (!prompt || prompt.length < 3) {

        if (dropdown) dropdown.innerHTML = "";

        return;

    }

    try {

        const response = await fetch(RECOMMEND_API, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                prompt: prompt
            })

        });

        if (!response.ok) return;

        const data = await response.json();

        if (!dropdown) return;

        dropdown.innerHTML = "";

        if (data.recommendations?.length > 0) {

            data.recommendations.forEach(item => {

                const option = document.createElement("div");

                option.className = "suggestion-item";

                option.textContent = item;

                option.addEventListener("click", () => {

                    document.getElementById("prompt").value = item;

                    dropdown.innerHTML = "";

                });

                dropdown.appendChild(option);

            });

        }

    } catch (error) {

        console.error("Recommendation error:", error);

    }

}

const debouncedRecommendations = debounce(getRecommendations, 400);


/* =====================================
   INPUT LISTENERS
===================================== */

document.addEventListener("DOMContentLoaded", () => {

    const promptInput = document.getElementById("prompt");

    if (promptInput) {

        promptInput.addEventListener("input", (e) => {

            debouncedRecommendations(e.target.value);

        });

        promptInput.addEventListener("keydown", (e) => {

            if (e.key === "Enter" && !e.shiftKey) {

                e.preventDefault();

                generateImage();

            }
        });

    }
    loadHistory();  
});


/* =====================================
   LOADER CONTROL
===================================== */

function showLoader(show) {

    const loader = document.getElementById("loader");

    if (!loader) return;

    loader.style.display = show ? "flex" : "none";

}


/* =====================================
   CLOSE DROPDOWN WHEN CLICK OUTSIDE
===================================== */

document.addEventListener("click", (event) => {

    const dropdown = document.getElementById("recommendations");

    const promptInput = document.getElementById("prompt");

    if (!dropdown || !promptInput) return;

    if (!promptInput.contains(event.target) &&
        !dropdown.contains(event.target)) {

        dropdown.innerHTML = "";

    }

});


/* =====================================
   OPTION BUTTON TOGGLE
===================================== */

document.addEventListener("DOMContentLoaded", () => {

    const optionGroups = document.querySelectorAll(".options");

    optionGroups.forEach(group => {

        group.querySelectorAll(".option").forEach(btn => {

            btn.addEventListener("click", () => {

                group.querySelectorAll(".option")
                    .forEach(b => b.classList.remove("active"));

                btn.classList.add("active");

            });

        });

    });

});


/* =====================================
   CLEAR FUNCTION
===================================== */

function clearAll() {

    const prompt = document.getElementById("prompt");

    if (prompt) prompt.value = "";

    document.querySelectorAll(".option")
        .forEach(btn => btn.classList.remove("active"));

    document.querySelectorAll(".options")
        .forEach(group => {

            const first = group.querySelector(".option");

            if (first) first.classList.add("active");

        });

    const img = document.getElementById("output");

    if (img) {

        img.src = "";

        img.style.display = "none";

    }

    const placeholder = document.getElementById("placeholder");

    if (placeholder)

        placeholder.style.display = "block";

}