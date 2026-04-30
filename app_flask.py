from flask import Flask, request, jsonify, render_template
import os
from werkzeug.utils import secure_filename
from engine import SalesStrategixEngine
from dotenv import load_dotenv, set_key

load_dotenv()

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'data'
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB limit
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize engine globally
engine = SalesStrategixEngine()
analytics = {"Pricing": 0, "Objections": 0, "Competitors": 0, "Negotiation": 0, "General": 0}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    if not data or 'message' not in data:
        return jsonify({'error': 'No message provided'}), 400
    
    user_message = data['message']
    mode = data.get('mode', 'chat')
    persona = data.get('persona', 'default')
    
    try:
        # Simple analytics tracking
        msg_lower = user_message.lower()
        if "price" in msg_lower or "cost" in msg_lower: analytics["Pricing"] += 1
        elif "object" in msg_lower or "but" in msg_lower: analytics["Objections"] += 1
        elif "compete" in msg_lower or "vs" in msg_lower: analytics["Competitors"] += 1
        elif "negotiat" in msg_lower: analytics["Negotiation"] += 1
        else: analytics["General"] += 1

        response = engine.query(user_message, mode=mode, persona=persona)
        if isinstance(response, str):
            # Either an error or un-sourced answer
            return jsonify({
                'answer': response,
                'sources': []
            })
        else:
            return jsonify({
                'answer': response['answer'],
                'sources': response['sources']
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload', methods=['POST'])
def upload_files():
    if 'files' not in request.files:
        return jsonify({'error': 'No files uploaded'}), 400
        
    files = request.files.getlist('files')
    saved_files = []
    
    for file in files:
        if file.filename:
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            saved_files.append(filename)
            
    return jsonify({
        'message': f'Successfully uploaded {len(saved_files)} files.',
        'files': saved_files
    })

@app.route('/api/reindex', methods=['POST'])
def reindex():
    try:
        status = engine.ingest_documents()
        return jsonify({'message': status})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/set_key', methods=['POST'])
def set_api_key():
    data = request.json
    api_key = data.get('api_key')
    
    if not api_key:
        return jsonify({'error': 'API key missing'}), 400
        
    os.environ["GROQ_API_KEY"] = api_key
    try:
        # Persist to .env file
        set_key(".env", "GROQ_API_KEY", api_key)
        engine.initialize_llm(api_key)
        return jsonify({'message': 'Groq API Key set and saved to .env successfully!'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({
        'has_api_key': bool(os.getenv("GROQ_API_KEY")),
        'analytics': analytics
    })

if __name__ == '__main__':
    import socket
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)
    
    print("\n" + "═"*50)
    print(" 🚀 SalesStrategix AI - Flask Server Starting...")
    print(f" 🔗 Local Link:   http://127.0.0.1:5000")
    print(f" 🔗 Network Link: http://{local_ip}:5000")
    print("═"*50 + "\n")
    
    app.run(debug=True, port=5000)
