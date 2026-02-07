import streamlit as st
import pandas as pd
import numpy as np
import altair as alt
from datetime import datetime, timedelta

# -----------------------------
# Page config
# -----------------------------
st.set_page_config(
    page_title="Advanced Dashboard",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded",
)

# -----------------------------
# Modern styling (CSS)
# -----------------------------
CUSTOM_CSS = """
<style>
/* App background */
.stApp {
  background: radial-gradient(1200px 600px at 10% 0%, rgba(28, 78, 216, 0.10), transparent 45%),
              radial-gradient(900px 500px at 90% 10%, rgba(16, 185, 129, 0.10), transparent 50%),
              linear-gradient(180deg, #0b1220 0%, #0b1220 100%);
  color: #e5e7eb;
}

/* Sidebar */
section[data-testid="stSidebar"] {
  background: linear-gradient(180deg, rgba(17, 24, 39, 0.96) 0%, rgba(15, 23, 42, 0.96) 100%);
  border-right: 1px solid rgba(148, 163, 184, 0.14);
}

/* Headings */
h1, h2, h3, h4 {
  letter-spacing: -0.02em;
}

/* Reduce top padding */
.block-container {
  padding-top: 1.2rem;
  padding-bottom: 2.0rem;
}

/* Metric cards */
[data-testid="stMetric"] {
  background: rgba(17, 24, 39, 0.75);
  border: 1px solid rgba(148, 163, 184, 0.14);
  padding: 14px 14px 10px 14px;
  border-radius: 14px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.25);
}

/* General card container helper */
.card {
  background: rgba(17, 24, 39, 0.65);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 10px 24px rgba(0,0,0,0.22);
}

/* Buttons */
.stButton>button {
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: linear-gradient(180deg, rgba(37, 99, 235, 0.95), rgba(29, 78, 216, 0.95));
  color: #ffffff;
  padding: 0.55rem 0.9rem;
}
.stButton>button:hover {
  border-color: rgba(96, 165, 250, 0.55);
  filter: brightness(1.05);
}

/* Input widgets */
[data-testid="stDateInput"] input,
[data-testid="stNumberInput"] input,
[data-testid="stTextInput"] input,
[data-testid="stSelectbox"] div,
[data-testid="stMultiSelect"] div {
  border-radius: 12px !important;
}

/* Dataframe */
[data-testid="stDataFrame"] {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.14);
}

/* Expander */
.streamlit-expanderHeader {
  font-weight: 600;
}

/* Links */
a { color: #93c5fd !important; }

/* Hide Streamlit footer/menu */
#MainMenu {visibility: hidden;}
footer {visibility: hidden;}
header {visibility: hidden;}
</style>
"""

st.markdown(CUSTOM_CSS, unsafe_allow_html=True)

# -----------------------------
# Helpers
# -----------------------------
@st.cache_data(show_spinner=False)
def make_data(start_date: datetime, days: int, seed: int = 7):
    rng = np.random.default_rng(seed)
    dates = pd.date_range(start=start_date, periods=days, freq="D")

    channels = ["Organic", "Paid Search", "Email", "Referral", "Social"]
    regions = ["North America", "Europe", "APAC", "LATAM"]

    rows = []
    for d in dates:
        for ch in channels:
            for r in regions:
                base = {
                    "Organic": 120,
                    "Paid Search": 160,
                    "Email": 90,
                    "Referral": 70,
                    "Social": 110,
                }[ch]
                region_mult = {
                    "North America": 1.15,
                    "Europe": 1.00,
                    "APAC": 0.92,
                    "LATAM": 0.78,
                }[r]

                season = 1.0 + 0.15 * np.sin((d.dayofyear / 365) * 2 * np.pi)
                noise = rng.normal(0, 18)

                sessions = max(0, int((base * region_mult * season) + noise))
                conv_rate = np.clip(rng.normal(0.028, 0.006), 0.004, 0.08)
                conversions = int(sessions * conv_rate)

                aov = np.clip(rng.normal(78, 18), 30, 180)
                revenue = conversions * aov

                cs_cost = np.clip(rng.normal(0.85, 0.25), 0.25, 1.8) * sessions
                ad_spend = 0.0
                if ch == "Paid Search":
                    ad_spend = np.clip(rng.normal(0.95, 0.25), 0.35, 1.9) * sessions
                elif ch == "Social":
                    ad_spend = np.clip(rng.normal(0.28, 0.10), 0.05, 0.7) * sessions

                rows.append(
                    {
                        "date": d,
                        "channel": ch,
                        "region": r,
                        "sessions": sessions,
                        "conversions": conversions,
                        "revenue": float(revenue),
                        "ad_spend": float(ad_spend),
                        "support_cost": float(cs_cost),
                    }
                )

    df = pd.DataFrame(rows)
    df["profit"] = df["revenue"] - df["ad_spend"] - df["support_cost"]
    df["cvr"] = np.where(df["sessions"] > 0, df["conversions"] / df["sessions"], 0.0)
    df["cac"] = np.where(df["conversions"] > 0, df["ad_spend"] / df["conversions"], np.nan)
    return df


def fmt_currency(x):
    return f"${x:,.0f}"


def wow_change(cur, prev):
    if prev == 0:
        return None
    return (cur - prev) / prev


# -----------------------------
# Sidebar controls
# -----------------------------
st.sidebar.markdown("## Controls")

today = datetime(2026, 2, 3)
min_date = today - timedelta(days=365)

start, end = st.sidebar.date_input(
    "Date range",
    value=(today - timedelta(days=90), today),
    min_value=min_date.date(),
    max_value=today.date(),
)

if isinstance(start, (list, tuple)):
    # Streamlit sometimes returns list based on version
    start, end = start

channels = st.sidebar.multiselect(
    "Channels",
    options=["Organic", "Paid Search", "Email", "Referral", "Social"],
    default=["Organic", "Paid Search", "Email", "Referral", "Social"],
)

regions = st.sidebar.multiselect(
    "Regions",
    options=["North America", "Europe", "APAC", "LATAM"],
    default=["North America", "Europe", "APAC", "LATAM"],
)

seed = st.sidebar.slider("Random seed", min_value=1, max_value=999, value=7)

st.sidebar.markdown("---")

view_mode = st.sidebar.radio(
    "View",
    options=["Executive", "Acquisition", "Profitability", "Table"],
    horizontal=False,
)

# -----------------------------
# Data
# -----------------------------
start_dt = datetime.combine(start, datetime.min.time())
end_dt = datetime.combine(end, datetime.min.time())
days = max(1, (end_dt - start_dt).days + 1)

raw = make_data(start_dt, days=days, seed=seed)

df = raw[(raw["channel"].isin(channels)) & (raw["region"].isin(regions))].copy()

# Aggregate daily
by_day = (
    df.groupby("date", as_index=False)
    .agg(
        sessions=("sessions", "sum"),
        conversions=("conversions", "sum"),
        revenue=("revenue", "sum"),
        ad_spend=("ad_spend", "sum"),
        support_cost=("support_cost", "sum"),
        profit=("profit", "sum"),
    )
)
by_day["cvr"] = np.where(by_day["sessions"] > 0, by_day["conversions"] / by_day["sessions"], 0.0)
by_day["cac"] = np.where(by_day["conversions"] > 0, by_day["ad_spend"] / by_day["conversions"], np.nan)

# Period metrics
cur_sessions = int(by_day["sessions"].sum())
cur_conv = int(by_day["conversions"].sum())
cur_rev = float(by_day["revenue"].sum())
cur_spend = float(by_day["ad_spend"].sum())
cur_profit = float(by_day["profit"].sum())
cur_cvr = float(cur_conv / cur_sessions) if cur_sessions else 0.0
cur_roas = float(cur_rev / cur_spend) if cur_spend else np.nan

# Prior period (same length)
prior_end = start_dt - timedelta(days=1)
prior_start = prior_end - timedelta(days=days - 1)
prior_raw = make_data(prior_start, days=days, seed=seed)
prior_df = prior_raw[(prior_raw["channel"].isin(channels)) & (prior_raw["region"].isin(regions))].copy()
prior_day = (
    prior_df.groupby("date", as_index=False)
    .agg(
        sessions=("sessions", "sum"),
        conversions=("conversions", "sum"),
        revenue=("revenue", "sum"),
        ad_spend=("ad_spend", "sum"),
        profit=("profit", "sum"),
    )
)
prior_sessions = int(prior_day["sessions"].sum())
prior_conv = int(prior_day["conversions"].sum())
prior_rev = float(prior_day["revenue"].sum())
prior_spend = float(prior_day["ad_spend"].sum())
prior_profit = float(prior_day["profit"].sum())

# -----------------------------
# Header
# -----------------------------
st.markdown(
    """
<div class="card">
  <div style="display:flex; align-items:flex-end; justify-content:space-between; gap:16px; flex-wrap:wrap;">
    <div>
      <div style="font-size:13px; color:rgba(226,232,240,0.75);">Modern Streamlit Dashboard</div>
      <div style="font-size:28px; font-weight:800;">Growth & Revenue Overview</div>
      <div style="margin-top:6px; font-size:13px; color:rgba(226,232,240,0.70);">Synthetic analytics dataset • fast filters • interactive charts</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:12px; color:rgba(226,232,240,0.65);">Selected range</div>
      <div style="font-size:14px; font-weight:700;">{start} → {end}</div>
      <div style="font-size:12px; color:rgba(226,232,240,0.65);">Compare to prior period</div>
      <div style="font-size:12px;">{pstart} → {pend}</div>
    </div>
  </div>
</div>
""".format(
        start=start.strftime("%b %d, %Y"),
        end=end.strftime("%b %d, %Y"),
        pstart=prior_start.strftime("%b %d, %Y"),
        pend=prior_end.strftime("%b %d, %Y"),
    ),
    unsafe_allow_html=True,
)

st.write("")

# -----------------------------
# KPI Row
# -----------------------------
col1, col2, col3, col4, col5 = st.columns(5)

rev_delta = wow_change(cur_rev, prior_rev)
profit_delta = wow_change(cur_profit, prior_profit)
sessions_delta = wow_change(cur_sessions, prior_sessions)
conv_delta = wow_change(cur_conv, prior_conv)
spend_delta = wow_change(cur_spend, prior_spend)

col1.metric("Revenue", fmt_currency(cur_rev), None if rev_delta is None else f"{rev_delta:+.1%}")
col2.metric("Profit", fmt_currency(cur_profit), None if profit_delta is None else f"{profit_delta:+.1%}")
col3.metric("Sessions", f"{cur_sessions:,}", None if sessions_delta is None else f"{sessions_delta:+.1%}")
col4.metric("Conversions", f"{cur_conv:,}", None if conv_delta is None else f"{conv_delta:+.1%}")
col5.metric("Ad spend", fmt_currency(cur_spend), None if spend_delta is None else f"{spend_delta:+.1%}")

st.write("")

# -----------------------------
# Charts (Altair theme)
# -----------------------------
alt.themes.enable("none")

def base_chart(df_: pd.DataFrame):
    return (
        alt.Chart(df_)
        .properties(height=260)
        .configure_view(strokeOpacity=0)
        .configure_axis(
            labelColor="#cbd5e1",
            titleColor="#cbd5e1",
            gridColor="rgba(148,163,184,0.18)",
            tickColor="rgba(148,163,184,0.25)",
        )
        .configure_legend(
            labelColor="#cbd5e1",
            titleColor="#cbd5e1",
        )
        .configure_title(color="#e5e7eb")
    )


def area_line(df_: pd.DataFrame, y: str, title: str):
    chart = base_chart(df_).mark_area(
        line={"color": "#60a5fa"},
        color=alt.Gradient(
            gradient="linear",
            stops=[
                alt.GradientStop(color="rgba(96,165,250,0.45)", offset=0),
                alt.GradientStop(color="rgba(96,165,250,0.02)", offset=1),
            ],
            x1=1,
            x2=1,
            y1=1,
            y2=0,
        ),
    ).encode(
        x=alt.X("date:T", title=None),
        y=alt.Y(f"{y}:Q", title=None),
        tooltip=[
            alt.Tooltip("date:T", title="Date"),
            alt.Tooltip(f"{y}:Q", title=title, format=",")
            if y not in ("revenue", "profit", "ad_spend")
            else alt.Tooltip(f"{y}:Q", title=title, format="$,.0f"),
        ],
    ).properties(title=title)
    return chart


def stacked_bar(df_: pd.DataFrame, metric: str, title: str):
    by = (
        df.groupby(["date", "channel"], as_index=False)
        .agg(val=(metric, "sum"))
    )
    chart = (
        base_chart(by)
        .mark_bar()
        .encode(
            x=alt.X("date:T", title=None),
            y=alt.Y("val:Q", title=None),
            color=alt.Color(
                "channel:N",
                scale=alt.Scale(
                    range=["#60a5fa", "#34d399", "#fbbf24", "#a78bfa", "#fb7185"]
                ),
                legend=alt.Legend(orient="bottom", columns=3),
            ),
            tooltip=[
                alt.Tooltip("date:T", title="Date"),
                alt.Tooltip("channel:N", title="Channel"),
                alt.Tooltip("val:Q", title=title, format="$,.0f" if metric in ("revenue", "profit", "ad_spend") else ","),
            ],
        )
        .properties(title=title)
    )
    return chart


# -----------------------------
# Views
# -----------------------------
if view_mode == "Executive":
    c1, c2 = st.columns((1.2, 1.0), gap="large")
    with c1:
        st.altair_chart(area_line(by_day, "revenue", "Revenue"), use_container_width=True)
    with c2:
        st.altair_chart(area_line(by_day, "profit", "Profit"), use_container_width=True)

    c3, c4 = st.columns((1.0, 1.0), gap="large")
    with c3:
        st.altair_chart(area_line(by_day, "sessions", "Sessions"), use_container_width=True)
    with c4:
        st.altair_chart(area_line(by_day, "cvr", "Conversion rate"), use_container_width=True)

elif view_mode == "Acquisition":
    c1, c2 = st.columns((1.2, 1.0), gap="large")
    with c1:
        st.altair_chart(stacked_bar(df, "sessions", "Sessions by channel"), use_container_width=True)
    with c2:
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.markdown("### Efficiency")
        st.write(
            "- **CVR**: {:.2%}\n- **CAC**: {}\n- **ROAS**: {}".format(
                cur_cvr,
                "—" if np.isnan(by_day["cac"].mean()) else f"${by_day['cac'].mean():,.0f}",
                "—" if np.isnan(cur_roas) else f"{cur_roas:,.2f}x",
            )
        )
        st.markdown("---")
        best = (
            df.groupby("channel", as_index=False)
            .agg(revenue=("revenue", "sum"), profit=("profit", "sum"), sessions=("sessions", "sum"))
            .sort_values("profit", ascending=False)
        )
        top = best.iloc[0]
        st.write(
            f"**Top channel by profit:** {top['channel']}\n\n"
            f"Profit: {fmt_currency(float(top['profit']))} • Revenue: {fmt_currency(float(top['revenue']))} • Sessions: {int(top['sessions']):,}"
        )
        st.markdown("</div>", unsafe_allow_html=True)

    st.altair_chart(stacked_bar(df, "revenue", "Revenue by channel"), use_container_width=True)

elif view_mode == "Profitability":
    c1, c2 = st.columns((1.15, 0.85), gap="large")
    with c1:
        st.altair_chart(stacked_bar(df, "profit", "Profit by channel"), use_container_width=True)
    with c2:
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.markdown("### Cost structure")
        total_support = float(by_day["support_cost"].sum())
        st.write(
            f"Revenue: **{fmt_currency(cur_rev)}**\n\n"
            f"Ad spend: **{fmt_currency(cur_spend)}**\n\n"
            f"Support cost: **{fmt_currency(total_support)}**\n\n"
            f"Profit: **{fmt_currency(cur_profit)}**"
        )
        st.caption("Profit = revenue − ad spend − support cost")
        st.markdown("</div>", unsafe_allow_html=True)

    # Scatter: channel efficiency
    by_ch = (
        df.groupby("channel", as_index=False)
        .agg(
            sessions=("sessions", "sum"),
            conversions=("conversions", "sum"),
            revenue=("revenue", "sum"),
            ad_spend=("ad_spend", "sum"),
            profit=("profit", "sum"),
        )
    )
    by_ch["cvr"] = np.where(by_ch["sessions"] > 0, by_ch["conversions"] / by_ch["sessions"], 0.0)
    by_ch["roas"] = np.where(by_ch["ad_spend"] > 0, by_ch["revenue"] / by_ch["ad_spend"], np.nan)

    scatter = (
        base_chart(by_ch)
        .mark_circle(size=220, opacity=0.9)
        .encode(
            x=alt.X("ad_spend:Q", title="Ad spend", axis=alt.Axis(format="$,.0f")),
            y=alt.Y("revenue:Q", title="Revenue", axis=alt.Axis(format="$,.0f")),
            color=alt.Color(
                "channel:N",
                scale=alt.Scale(range=["#60a5fa", "#34d399", "#fbbf24", "#a78bfa", "#fb7185"]),
            ),
            tooltip=[
                alt.Tooltip("channel:N", title="Channel"),
                alt.Tooltip("revenue:Q", title="Revenue", format="$,.0f"),
                alt.Tooltip("profit:Q", title="Profit", format="$,.0f"),
                alt.Tooltip("ad_spend:Q", title="Ad spend", format="$,.0f"),
                alt.Tooltip("cvr:Q", title="CVR", format=".2%"),
                alt.Tooltip("roas:Q", title="ROAS", format=".2f"),
            ],
        )
        .properties(title="Channel spend vs revenue")
    )
    st.altair_chart(scatter, use_container_width=True)

else:  # Table
    st.markdown('<div class="card">', unsafe_allow_html=True)
    st.markdown("### Data table")
    st.caption("Tip: use sidebar filters to change channels/regions and the random seed.")

    show_cols = st.multiselect(
        "Columns",
        options=[
            "date",
            "channel",
            "region",
            "sessions",
            "conversions",
            "revenue",
            "ad_spend",
            "support_cost",
            "profit",
            "cvr",
            "cac",
        ],
        default=["date", "channel", "region", "sessions", "conversions", "revenue", "profit"],
    )

    st.dataframe(
        df[show_cols].sort_values(["date", "channel", "region"], ascending=[False, True, True]),
        use_container_width=True,
        height=520,
    )
    st.markdown("</div>", unsafe_allow_html=True)

# -----------------------------
# Insights / Notes
# -----------------------------
with st.expander("Notes & quick insights"):
    st.write(
        """
- This dashboard uses a **synthetic dataset** (generated locally) so it runs anywhere.
- The comparison window is the **prior period** with the same length as the selected range.
- If you want, I can adapt it to your real CSV/SQL source and add authentication + row-level filters.
"""
    )
