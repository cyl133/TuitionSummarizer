import streamlit as st
import requests

# Server URL (modify this to your actual server URL)
SERVER_URL = "http://localhost:5000/answer"

# Title
st.title("AI Conversation")

# State management for the chat history
# This uses Streamlit's session state feature to keep the chat history
if "chat_history" not in st.session_state:
    st.session_state.chat_history = ""

# User input
user_input = st.text_input("You: ")

# Send button to submit the question to the server
if st.button("Send"):
    if user_input:
        # Update chat history with the user's message
        st.session_state.chat_history += f"Human: {user_input}\n"
        
        # Prepare the request data
        data = {
            "question": user_input,
            "chatHistory": st.session_state.chat_history  # sending accumulated chat history
        }

        # Post the question to the server
        response = requests.post(SERVER_URL, json=data)

        if response.status_code == 200:
            # Retrieve the AI's response from the server's response
            ai_response = response.json()

            # Display the AI's response
            st.write(f"AI: {ai_response}")

            # Update the chat history with the AI's response
            st.session_state.chat_history += f"AI: {ai_response}\n"
        else:
            st.error("Failed to get response.")
    else:
        st.warning("Input field is empty. Please ask something.")

# Optional: Display the chat history
st.write("Chat History:")
st.write(st.session_state.chat_history)
