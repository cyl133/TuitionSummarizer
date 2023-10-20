import streamlit as st
import requests

# Server URL
SERVER_URL = "http://localhost:5000/answer"

# Title
st.title("Tutor Helper")

# Custom styles for the chat history display
style = """
<style>
  .chat-history {
    background-color: #D3D3D3; /* light grey */
    border-radius: 5px;
    padding: 10px;
    margin-bottom: 10px;
    overflow-y: auto;
    height: 300px; /* Adjust the height according to your preference */
    width: 100%;
    white-space: pre-line;
  }

  .chat-entry {
    margin-bottom: 10px;
    color: #000000; 
  }

  .human {
    color: #000000; /* moderate red */
    font-weight: bold;
  }

  .ai {
    color: #000000; /* soft blue */
    font-weight: bold;
  }
</style>
"""

st.markdown(style, unsafe_allow_html=True)  # Apply the custom styles

# State management for the chat history
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []

# User input
user_input = st.text_input("You: ")

# Send button to submit the question to the server
if st.button("Send"):
    if user_input:
        # Add the user's message to the chat history
        st.session_state.chat_history.append({"text": user_input, "author": "human"})

        # Prepare the request data
        data = {
            "question": user_input,
            # Convert chat history objects to strings before sending
            "chatHistory": "\n".join(f"{item['author'].capitalize()}: {item['text']}" for item in st.session_state.chat_history)
        }

        # Post the question to the server
        response = requests.post(SERVER_URL, json=data)

        if response.status_code == 200:
            # Retrieve the AI's response from the server's response
            ai_response = response.json()  # Assuming the key is 'answer'

            # Add the AI's message to the chat history
            st.session_state.chat_history.append({"text": ai_response, "author": "ai"})
        else:
            st.error("Failed to get response.")
    else:
        st.warning("Input field is empty. Please ask something.")

# Display the chat history
st.markdown("### Chat History:", unsafe_allow_html=True)
chat_container = st.empty()  # This will be used to update the chat display

# Format and display the chat history
chat_history_formatted = ""
for entry in st.session_state.chat_history:
    author_class = entry['author']
    chat_history_formatted += f"<div class='chat-entry'><span class='{author_class}'>{entry['author'].capitalize()}:</span> {entry['text']}</div>"

chat_container.markdown(f"<div class='chat-history'>{chat_history_formatted}</div>", unsafe_allow_html=True)
