import streamlit as st
import requests

# Server URL
SERVER_URL = "http://localhost:5000/answer"

# Title
st.title("Tuition Pal")
st.write("\n")  # Add a space after the title for better spacing

# Custom styles for the chat history display
style = """
<style>
  .chat-history {
    background-color: #f7f7f7;  /* softer grey */
    border: 1px solid #e0e0e0;  /* border for distinction */
    border-radius: 5px;
    padding: 23px;
    margin-bottom: 20px;  /* More space for clearer distinction */
    overflow-y: auto;
    height: 300px;
    width: 100%;
    white-space: pre-line;
  }

  .chat-entry {
    margin-bottom: 15px;  /* Increased spacing for better readability */
    color: #000000;
  }

  .human {
    color: #D32F2F;  /* moderate red */
    font-weight: bold;
  }

  .ai {
    color: #1976D2;  /* soft blue */
    font-weight: bold;
  }
</style>
"""

st.markdown(style, unsafe_allow_html=True)  # Apply the custom styles

# State management for the chat history
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []

# User input with placeholder for improved feedback
user_input = st.text_input("You: ", placeholder="Ask a question... 🤔")

# Send button with capitalized naming
if st.button("SEND 🚀"):
    if user_input:
        st.session_state.chat_history.append({"text": user_input, "author": "human"})

        data = {
            "question": user_input,
            "chatHistory": "\n".join(f"{item['author'].capitalize()}: {item['text']}" for item in st.session_state.chat_history)
        }

        response = requests.post(SERVER_URL, json=data)

        if response.status_code == 200:
            ai_response = response.json()["result"]  # Assuming the key is 'answer'
            st.session_state.chat_history.append({"text": ai_response, "author": "ai"})
        else:
            st.error("Failed to get response. 😞")
    else:
        st.warning("Please type in your question first. 😉")

# Display the chat history with an emoji for a fun touch
st.markdown("### Chat History: 💬", unsafe_allow_html=True)
chat_container = st.empty()

chat_history_formatted = ""
for entry in st.session_state.chat_history:
    author_class = entry['author']
    chat_history_formatted += f"<div class='chat-entry'><span class='{author_class}'>{entry['author'].capitalize()}:</span> {entry['text']}</div>"

chat_container.markdown(f"<div class='chat-history'>{chat_history_formatted}</div>", unsafe_allow_html=True)
