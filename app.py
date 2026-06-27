from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)

# ==========================================
# CONFIG — YOUR NGROK BACKEND URL
# ==========================================

GENERATE_API = "https://nonenforced-rationally-alfred.ngrok-free.dev/api/generate"
RECOMMEND_API = "https://nonenforced-rationally-alfred.ngrok-free.dev/api/recommend"

# ==========================================
# PAGE ROUTES
# ==========================================

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/generate")
def generate_page():
    return render_template("generate.html")

@app.route("/architecture")
def architecture():
    return render_template("architecture.html")

@app.route("/about")
def about():
    return render_template("about.html")

# ==========================================
# API PROXY ROUTES (IMPORTANT)
# ==========================================

@app.route("/api/generate", methods=["POST"])
def proxy_generate():
    data = request.get_json()

    try:
        response = requests.post(GENERATE_API, json=data, timeout=300)
        return jsonify(response.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/recommend", methods=["POST"])
def proxy_recommend():
    data = request.get_json()

    try:
        response = requests.post(RECOMMEND_API, json=data, timeout=60)
        return jsonify(response.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================
# RUN
# ==========================================

if __name__ == "__main__":
    app.run(debug=True)