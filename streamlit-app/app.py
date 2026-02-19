import streamlit as st
import numpy as np
import pandas as pd

st.set_page_config(page_title="Slider → Chart", page_icon="📈", layout="centered")

st.title("Slider-controlled chart")
st.caption("Move the slider to change the frequency of a sine wave.")

freq = st.slider("Frequency", min_value=1, max_value=20, value=5, step=1)

x = np.linspace(0, 2 * np.pi, 300)
y = np.sin(freq * x)

df = pd.DataFrame({"x": x, "sin(freq·x)": y})

st.line_chart(df, x="x", y="sin(freq·x)")

with st.expander("Details"):
    st.write({"frequency": freq, "points": len(x)})
