from flask import Flask, request, jsonify
from flask_cors import CORS
from dspy_module import get_response

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        message = data.get('message', '')
        conversation_history = data.get('history', [])  # Optional conversation history
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Get response from dspy module with context
        response = get_response(message, conversation_history)
        
        return jsonify({
            'response': response
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)

