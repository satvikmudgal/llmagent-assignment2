from flask import Flask, request, jsonify
from flask_cors import CORS
from agent import agent

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "OPTIONS"], "allow_headers": ["Content-Type"]}})


@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        message = data.get('message', '')
        session_id = data.get('session_id', 'default')

        if not message:
            return jsonify({'error': 'Message is required'}), 400

        result = agent.run(message=message, session_id=session_id)
        return jsonify(result), 200

    except Exception as e:
        return jsonify({
            'message': f'Error processing request: {str(e)}',
            'flights': [],
            'hotels': [],
            'activities': [],
        }), 500


@app.route('/api/reset', methods=['POST'])
def reset():
    """Reset conversation state for a session."""
    data = request.get_json() or {}
    session_id = data.get('session_id', 'default')
    agent.reset(session_id)
    return jsonify({'status': 'ok'}), 200


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200


if __name__ == '__main__':
    app.run(debug=True, port=5001)
