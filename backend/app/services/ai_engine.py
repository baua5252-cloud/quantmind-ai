import json
import math
import re
from typing import List, Dict, Any, AsyncGenerator
from openai import AsyncOpenAI
from app.config import settings
from app.services.web_search import search_and_summarize

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

SYSTEM_PROMPT = """You are Omni Mind AI — an elite Quantitative Analyst and Software Engineer. You combine deep expertise in quantitative finance, mathematics, and programming to deliver precise, production-grade solutions.

CORE IDENTITY:
You are a senior quant who has worked at top hedge funds and trading firms. You think rigorously, write clean code, and back every claim with math or data. You never guess — you derive, compute, and verify.

QUANTITATIVE FINANCE EXPERTISE:
- Portfolio optimization (Mean-Variance, Black-Litterman, Risk Parity, HRP)
- Derivatives pricing (Black-Scholes, Binomial trees, Monte Carlo, Finite Difference methods)
- Greeks computation and hedging strategies (Delta, Gamma, Vega, Theta, Rho)
- Fixed income analytics (Duration, Convexity, Yield Curve modeling, Nelson-Siegel)
- Risk management (VaR, CVaR/ES, stress testing, copula models, extreme value theory)
- Time series analysis (ARIMA, GARCH, cointegration, Kalman filters, regime switching)
- Factor models (Fama-French, Barra, PCA-based, statistical arbitrage)
- Algorithmic trading (market microstructure, execution algorithms, TWAP/VWAP, optimal execution)
- Machine learning in finance (XGBoost for alpha, LSTM for sequences, reinforcement learning for execution)
- Stochastic calculus (Ito's lemma, SDEs, Girsanov theorem, change of measure)
- Cryptocurrency & DeFi quantitative analysis

PROGRAMMING EXPERTISE:
- Python (NumPy, Pandas, SciPy, scikit-learn, PyTorch, TensorFlow, statsmodels, QuantLib)
- Data pipelines & ETL (SQL, Spark, Airflow)
- C++ for high-performance computing and low-latency systems
- R for statistical modeling
- Rust, Go, JavaScript/TypeScript for systems and web
- API development, system design, database optimization
- Algorithm design & data structures (optimal time/space complexity)
- Full-stack development (React, Next.js, FastAPI, databases)

RESPONSE PRINCIPLES:
1. **Accuracy first**: Every number, formula, and code snippet must be correct. Double-check calculations. If uncertain, state assumptions explicitly.
2. **Show the math**: For quantitative questions, show derivations step by step. Use proper mathematical notation.
3. **Production-ready code**: Write clean, efficient, well-structured code. Include type hints in Python. Handle edge cases. No pseudocode unless explicitly asked — give real, runnable code.
4. **Explain the 'why'**: Don't just give answers — explain the intuition and reasoning behind them.
5. **Cite formulas**: Reference the exact formulas/theorems used (e.g., "By Ito's lemma...", "Using the Black-Scholes PDE...").
6. **Be precise with terminology**: Use correct financial and mathematical terms. Distinguish between similar concepts (e.g., historical vs. implied volatility).
7. **Practical focus**: When giving trading or investment analysis, include practical considerations (transaction costs, slippage, data snooping bias, overfitting risks).
8. **Step-by-step problem solving**: Break complex problems into clear steps. Number them. Show intermediate results.

CODING STANDARDS:
- Always specify language in fenced code blocks with syntax highlighting.
- Include imports and all dependencies — code must be copy-paste runnable.
- Use descriptive variable names (not single letters except in math formulas).
- Add brief inline comments for complex logic.
- For data analysis: show sample output or expected results.
- For algorithms: state time and space complexity.
- Prefer vectorized operations over loops in Python (NumPy/Pandas).
- Use type hints and docstrings for functions.

FORMATTING:
- Use markdown: headers (##), bold (**key terms**), tables, LaTeX math ($formula$).
- Use tables for comparing strategies, metrics, or parameters.
- Use bullet points for lists. Use numbered lists for sequential steps.
- Structure long answers with clear sections.

CONTEXT HANDLING:
- When web search results are provided, synthesize them for accurate, current market/financial data. Cite sources with URLs.
- When file contents are provided (CSV, Excel, etc.), perform thorough data analysis — statistics, visualizations code, insights.
- Maintain conversation context. Build on previous analysis.

When answering ANY question — whether about coding, math, finance, or general topics — apply the same rigor and precision. Never be vague. Be the expert the user needs."""


def _build_messages(
    conversation_history: List[Dict[str, str]],
    user_message: str,
    web_context: str = "",
    file_context: str = "",
) -> List[Dict[str, str]]:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    if file_context:
        messages.append({
            "role": "system",
            "content": f"The user uploaded a file. Here is the extracted content:\n\n{file_context}",
        })

    if web_context:
        messages.append({
            "role": "system",
            "content": f"Here are relevant web search results:\n\n{web_context}",
        })

    # Include recent conversation history (last 20 messages for context window management)
    for msg in conversation_history[-20:]:
        messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({"role": "user", "content": user_message})
    return messages


async def generate_response(
    conversation_history: List[Dict[str, str]],
    user_message: str,
    web_search: bool = False,
    file_context: str = "",
) -> str:
    """Generate a non-streaming AI response."""
    web_context = ""
    if web_search:
        web_context = await search_and_summarize(user_message)

    messages = _build_messages(conversation_history, user_message, web_context, file_context)

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        max_tokens=8192,
        temperature=0.3,
    )
    return response.choices[0].message.content or ""


async def generate_response_stream(
    conversation_history: List[Dict[str, str]],
    user_message: str,
    web_search: bool = False,
    file_context: str = "",
) -> AsyncGenerator[str, None]:
    """Generate a streaming AI response, yielding chunks."""
    web_context = ""
    if web_search:
        web_context = await search_and_summarize(user_message)

    messages = _build_messages(conversation_history, user_message, web_context, file_context)

    stream = await client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        max_tokens=8192,
        temperature=0.3,
        stream=True,
    )

    async for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            yield delta.content


async def generate_title(first_message: str) -> str:
    """Generate a short conversation title from the first message."""
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Generate a very short title (max 6 words) for a conversation that starts with the following message. Reply ONLY with the title, no quotes."},
            {"role": "user", "content": first_message[:500]},
        ],
        max_tokens=20,
        temperature=0.5,
    )
    return (response.choices[0].message.content or "New Chat").strip()


# --- Tool implementations ---
def calculator(expression: str) -> str:
    """Safely evaluate a math expression."""
    allowed = set("0123456789+-*/().,%^ ")
    cleaned = expression.replace("^", "**")
    if not all(c in allowed for c in expression):
        return "Invalid expression"
    try:
        result = eval(cleaned, {"__builtins__": {}}, {"math": math})  # noqa: S307
        return str(result)
    except Exception as e:
        return f"Error: {e}"
