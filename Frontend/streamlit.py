import os
os.environ['OPENAI_API_KEY'] = "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"
import streamlit as st
from langchain.prompts import PromptTemplate
from langchain.memory import ConversationBufferMemory
from langchain.llms import OpenAI
from langchain.chains import LLMChain

# Set the title using StreamLit
st.title('Tuition Personal Assistant')
input_text = st.text_input('Enter Your Text: ')

# Setting up the prompt templates
title_template = PromptTemplate(
    input_variables=['concept'],
    template='Give me a youtube video title about {concept}'
)

script_template = PromptTemplate(
    input_variables=['title'],
    template='''Give me an attractive youtube video script based on the title {title}.'''
)

# Initialize or retrieve the memory from session state
if 'memoryT' not in st.session_state:
    st.session_state.memoryT = ConversationBufferMemory(input_key='concept', memory_key='chat_history')

if 'memoryS' not in st.session_state:
    st.session_state.memoryS = ConversationBufferMemory(input_key='title', memory_key='chat_history')

# Importing the large language model OpenAI via langchain
model = OpenAI(temperature=0.6)

# Using the memories from session state
chainT = LLMChain(llm=model, prompt=title_template, verbose=True, output_key='title', memory=st.session_state.memoryT)
chainS = LLMChain(llm=model, prompt=script_template, verbose=True, output_key='script', memory=st.session_state.memoryS)

# Display the output if the user gives an input
if input_text:
    title = chainT.run(input_text)
    script = chainS.run(title=title)
    
    st.write(title)
    st.write(script)
