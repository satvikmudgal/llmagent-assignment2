import dspy
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get API key from environment variable
# Set this in your .env file or export it: export GOOGLE_API_KEY="your-key-here"
if not os.environ.get("GOOGLE_API_KEY"):
    raise ValueError("GOOGLE_API_KEY environment variable is not set. Please set it in a .env file or export it.")

# Initialize DSPy with Gemini
# Pass API key directly to LM constructor (like the working example)
api_key = os.environ.get("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY environment variable is not set. Please set it in a .env file or export it.")

# Use gemini/gemini-2.5-flash format (like the working example)
lm = dspy.LM('gemini/gemini-2.5-flash', api_key=api_key)
dspy.configure(lm=lm)

# Simple DSPy module for travel assistance
class TravelAssistant(dspy.Module):
    def __init__(self):
        # Use ChainOfThought like the working example
        self.respond = dspy.ChainOfThought('context, question -> response')

    def forward(self, question, context=""):
        # Build context string from conversation history
        context_str = context if context else "This is the start of the conversation."
        try:
            answer = self.respond(context=context_str, question=question)
            # Extract response - ChainOfThought returns an object with 'response' attribute
            if hasattr(answer, 'response'):
                return str(answer.response)
            elif hasattr(answer, 'answer'):
                return str(answer.answer)
            else:
                return str(answer)
        except Exception as e:
            return f"Error in forward: {str(e)}"

# Initialize assistant
assistant = TravelAssistant()

def get_response(user_input, conversation_history=None):
    """
    Accept user input and return response from DSPy travel assistant.
    
    Args:
        user_input: The user's message/query
        conversation_history: Optional list of previous messages for context
        
    Returns:
        str: The response from the assistant
    """
    try:
        # Build context from conversation history if provided
        if conversation_history and len(conversation_history) > 0:
            context = "\n".join([f"{msg.get('role', 'user')}: {msg.get('content', '')}" 
                                for msg in conversation_history[-10:]])  # Last 10 messages
        else:
            context = ""
        
        response = assistant(question=user_input, context=context)
        return response
    except Exception as e:
        return f"Error processing request: {str(e)}"

