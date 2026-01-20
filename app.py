from flask import Flask, render_template, request, jsonify
from datetime import datetime

app = Flask(__name__)

class CorporateBot:
    def get_response(self, user_input):
        text = user_input.lower()
        if any(word in text for word in ["price", "cost", "services"]):
            return "Our service packages are structured to maximize ROI. Would you like a PDF brochure?"
        elif any(word in text for word in ["help", "support", "technical"]):
            return "I have logged your request. A technical specialist will review your session logs shortly."
        elif "human" in text:
            return "Connecting you to the next available representative. Please remain active."
        return "I am here to assist with your business inquiries. Could you please provide more detail?"

bot = CorporateBot()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/get_response", methods=["POST"])
def get_bot_response():
    user_data = request.json.get("message")
    response = bot.get_response(user_data)
    return jsonify({"response": response})

if __name__ == "__main__":
    app.run(debug=True)
