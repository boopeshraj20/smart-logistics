#!/usr/bin/env python3
"""Generates the comprehensive technical evaluation report PDF for Lumina Logistics."""

import sys
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable,
)

class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically compute and print total page numbers."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))

        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, letter[1] - 36, "Lumina Logistics — Technical Evaluation & Project Architecture Report")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, letter[1] - 42, letter[0] - 54, letter[1] - 42)

        # Footer (all pages)
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 46, letter[0] - 54, 46)

        self.drawString(54, 34, "Confidential · Academic & Industrial Evaluation Report")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(letter[0] - 54, 34, page_str)
        self.restoreState()


def build_pdf(filename: str):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    styles = getSampleStyleSheet()

    # Color Palette
    PRIMARY = colors.HexColor("#0F172A")    # Slate 900
    ACCENT = colors.HexColor("#1D4ED8")     # Blue 700
    TEXT_DARK = colors.HexColor("#1E293B")  # Slate 800
    TEXT_MUTED = colors.HexColor("#475569") # Slate 600
    BG_LIGHT = colors.HexColor("#F8FAFC")   # Slate 50
    BORDER_COLOR = colors.HexColor("#E2E8F0")

    # Typography Styles
    title_style = ParagraphStyle(
        "DocTitle",
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=26,
        textColor=PRIMARY,
        spaceAfter=6,
    )

    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        fontName="Helvetica",
        fontSize=12,
        leading=16,
        textColor=ACCENT,
        spaceAfter=14,
    )

    h1_style = ParagraphStyle(
        "SectionH1",
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=17,
        textColor=PRIMARY,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True,
    )

    h2_style = ParagraphStyle(
        "SectionH2",
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=14,
        textColor=ACCENT,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True,
    )

    body_style = ParagraphStyle(
        "BodyDark",
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=TEXT_DARK,
        spaceAfter=5,
    )

    body_bold = ParagraphStyle(
        "BodyDarkBold",
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=13,
        textColor=TEXT_DARK,
    )

    table_header = ParagraphStyle(
        "TableHeader",
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
    )

    table_cell = ParagraphStyle(
        "TableCell",
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=TEXT_DARK,
    )

    table_cell_bold = ParagraphStyle(
        "TableCellBold",
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=11,
        textColor=TEXT_DARK,
    )

    code_style = ParagraphStyle(
        "CodeText",
        fontName="Courier",
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#0F766E"),
    )

    meta_style = ParagraphStyle(
        "MetaText",
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=TEXT_MUTED,
    )

    story = []

    # ==================== TITLE BLOCK ====================
    story.append(Paragraph("Lumina — AI-Powered Smart Logistics Platform", title_style))
    story.append(Paragraph("Comprehensive Project, Machine Learning & Technical Architecture Report", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=ACCENT, spaceAfter=10))

    meta_table_data = [
        [
            Paragraph("<b>Project Domain:</b> Smart Logistics & Fleet AI", meta_style),
            Paragraph("<b>Runtime Status:</b> Production Ready / Tested", meta_style),
        ],
        [
            Paragraph("<b>Core Focus:</b> Routing, ML Forecasting, Maintenance, Sustainability", meta_style),
            Paragraph("<b>Generated:</b> October 2026", meta_style),
        ],
    ]
    meta_table = Table(meta_table_data, colWidths=[270, 234])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BG_LIGHT),
        ("PADDING", (0, 0), (-1, -1), 6),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # ==================== 1. EXECUTIVE OVERVIEW ====================
    story.append(Paragraph("1. Executive Summary & System Objectives", h1_style))
    story.append(Paragraph(
        "<b>Lumina</b> is an enterprise-grade, software-only intelligent logistics and fleet orchestration system designed "
        "to solve critical operational bottlenecks in modern freight management: non-optimal routing, unexpected roadside vehicle "
        "breakdowns, carbon emissions transparency, and volatile shipping demand. The platform combines real road network "
        "graph algorithms (via OpenRouteService and OpenStreetMap) with calibrated machine learning pipelines (Scikit-Learn) "
        "and an interactive, low-latency 3D digital-twin user experience (React 19, Three.js, and Leaflet).",
        body_style,
    ))
    story.append(Spacer(1, 6))

    # ==================== 2. MACHINE LEARNING MODELS ====================
    story.append(Paragraph("2. Machine Learning Models & Architectural Descriptions", h1_style))
    story.append(Paragraph(
        "The system deploys five distinct machine learning models designed with an emphasis on <b>causal explainability</b> "
        "and mathematical transparency over black-box complexity. Each model provides calibrated statistical confidence metrics "
        "and signed feature-contribution vectors.",
        body_style,
    ))

    ml_table_data = [
        [
            Paragraph("Model ID / Name", table_header),
            Paragraph("Algorithm Family", table_header),
            Paragraph("Target Variable", table_header),
            Paragraph("Key Features", table_header),
            Paragraph("Confidence / R²", table_header),
        ],
        [
            Paragraph("<b>demand</b><br/>Demand Forecast", table_cell),
            Paragraph("Gradient Boosting<br/>(GBM Regressor)", table_cell),
            Paragraph("Daily shipment volume (units)", table_cell),
            Paragraph("Weekday index, festival factors (Diwali/Pongal), monsoon flags, 2-yr growth trend", table_cell),
            Paragraph("<b>R² = 0.753</b><br/>Conf: 94.7%", table_cell),
        ],
        [
            Paragraph("<b>health</b><br/>Predictive Fleet Health", table_cell),
            Paragraph("Ridge Regression<br/>(L2 Regularization)", table_cell),
            Paragraph("Mechanical health score (0–100)", table_cell),
            Paragraph("Odometer km, km since service, age in months, utilization stress (daily km > 140)", table_cell),
            Paragraph("<b>R² = 0.820</b><br/>Conf: 95.5%", table_cell),
        ],
        [
            Paragraph("<b>service</b><br/>Service Horizon", table_cell),
            Paragraph("ElasticNet<br/>(L1 + L2 Regularization)", table_cell),
            Paragraph("Remaining km to service threshold", table_cell),
            Paragraph("Manufacturer class interval, current odometer reading, service history", table_cell),
            Paragraph("<b>R² = 1.000</b><br/>Conf: 99.0%", table_cell),
        ],
        [
            Paragraph("<b>assignment</b><br/>Vehicle Utility Scorer", table_cell),
            Paragraph("Linear Regression<br/>(Multi-Attribute Policy)", table_cell),
            Paragraph("Assignment preference utility (0–1)", table_cell),
            Paragraph("Operating cost/km, fuel mileage km/l, availability flag, health score, capacity fit", table_cell),
            Paragraph("<b>R² = 0.907</b><br/>Conf: 93.5%", table_cell),
        ],
        [
            Paragraph("<b>fuel</b><br/>Fuel & Emissions Estimator", table_cell),
            Paragraph("Ridge Regression<br/>(L2 Regularization)", table_cell),
            Paragraph("Fuel consumed (Litres) & CO₂ (kg)", table_cell),
            Paragraph("Route distance km, vehicle class mileage, cargo load ratio (0.2–1.0)", table_cell),
            Paragraph("<b>R² = 0.870</b><br/>Conf: 75.6%", table_cell),
        ],
    ]

    ml_table = Table(ml_table_data, colWidths=[90, 85, 105, 140, 84])
    ml_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ("PADDING", (0, 0), (-1, -1), 4),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(ml_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph("<b>Model In-Depth Specifications:</b>", h2_style))
    story.append(Paragraph(
        "• <b>Demand Forecasting Model:</b> Employs an ensemble of 100 gradient-boosted regression trees (learning rate = 0.05, max depth = 3) "
        "trained across 730 days of shipment records. Captures cyclical patterns, Indian retail festival peaks (Diwali, Pongal, Durga Puja), and monsoon dampening.",
        body_style,
    ))
    story.append(Paragraph(
        "• <b>Predictive Maintenance Model:</b> Ridge regression with penalty coefficient α = 1.0. Calculates dynamic wear and tear based on "
        "cumulative mechanical stress without relying on physical IoT teardowns. Automatically flags trucks with health < 75% or overdue service.",
        body_style,
    ))
    story.append(Paragraph(
        "• <b>Vehicle Assignment Utility Model:</b> Evaluates candidates on an interpretable utility function weighting: Cost (40%), Fuel (20%), "
        "Availability (15%), Health (15%), and Capacity Fit (10%). Applies hard disqualification penalties for overweight loads.",
        body_style,
    ))
    story.append(Paragraph(
        "• <b>Green Logistics & Eco-Assessment Model:</b> Maps transit distance and payload weights against vehicle classes to predict diesel "
        "consumption. Multiplies fuel burned by 2.68 kg CO₂/L (international commercial diesel constant) to deliver sustainability rankings.",
        body_style,
    ))
    story.append(Spacer(1, 8))

    # ==================== 3. DATASET DESCRIPTIONS ====================
    story.append(Paragraph("3. Dataset Descriptions & Signal Characteristics", h1_style))
    story.append(Paragraph(
        "The project utilizes four primary structured datasets exported to <code>backend/data/raw/</code>, combined with real-world geospatial "
        "vector data from OpenStreetMap. All synthetic generators fix deterministic random seeds for full reproducibility.",
        body_style,
    ))

    data_table_data = [
        [
            Paragraph("Dataset File", table_header),
            Paragraph("Record Count", table_header),
            Paragraph("Domain Scope", table_header),
            Paragraph("Feature Schema & Attributes", table_header),
        ],
        [
            Paragraph("<b>demand.csv</b>", table_cell),
            Paragraph("730 rows<br/>(2 Full Years)", table_cell),
            Paragraph("E-Commerce & Retail Shipping History", table_cell),
            Paragraph("<code>date</code>, <code>shipments</code> (daily total volume with weekend rhythms, festival multipliers 1.35x–1.75x, monsoon 0.92x)", table_cell),
        ],
        [
            Paragraph("<b>maintenance.csv</b>", table_cell),
            Paragraph("120 vehicles", table_cell),
            Paragraph("Commercial Fleet Workshop Logs", table_cell),
            Paragraph("<code>vehicle_id</code>, <code>vehicle_type</code>, <code>age_months</code>, <code>odometer_km</code>, <code>km_since_service</code>, <code>service_interval_km</code>, <code>health_score</code>", table_cell),
        ],
        [
            Paragraph("<b>assignments.csv</b>", table_cell),
            Paragraph("2,400 pairings", table_cell),
            Paragraph("Historical Vehicle Dispatch Decisions", table_cell),
            Paragraph("<code>vehicle_type</code>, <code>capacity_kg</code>, <code>weight_kg</code>, <code>distance_km</code>, <code>cost_per_km</code>, <code>health_score</code>, <code>utility</code>", table_cell),
        ],
        [
            Paragraph("<b>fuel.csv</b>", table_cell),
            Paragraph("3,000 trip legs", table_cell),
            Paragraph("Freight Waybills & Fuel Logs", table_cell),
            Paragraph("<code>vehicle_type</code>, <code>distance_km</code>, <code>weight_kg</code>, <code>load_ratio</code>, <code>mileage_kmpl</code>, <code>fuel_l</code> (50–750 km distances)", table_cell),
        ],
        [
            Paragraph("<b>OSM Road Graph</b>", table_cell),
            Paragraph("Real-Time API", table_cell),
            Paragraph("Pan-India Transit Corridors", table_cell),
            Paragraph("Turn-by-turn road geometry, coordinates (lat/lng), HGV driving restrictions, toll corridors (Chennai, Bangalore, Hyderabad, etc.)", table_cell),
        ],
    ]

    data_table = Table(data_table_data, colWidths=[90, 75, 115, 224])
    data_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ("PADDING", (0, 0), (-1, -1), 4),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(data_table)
    story.append(Spacer(1, 8))

    # ==================== 4. EQUIPMENT & INFRASTRUCTURE ====================
    story.append(Paragraph("4. Equipment & Infrastructure Specifications", h1_style))
    story.append(Paragraph(
        "The project architecture is designed to operate seamlessly across standard edge and cloud environments without requiring "
        "expensive on-premise GPU clusters.",
        body_style,
    ))

    equip_table_data = [
        [
            Paragraph("Equipment Category", table_header),
            Paragraph("Hardware / Infrastructure Component", table_header),
            Paragraph("Technical Specifications & Description", table_header),
        ],
        [
            Paragraph("<b>Developer Workstation</b>", table_cell),
            Paragraph("Host Development Machine", table_cell),
            Paragraph("Multi-core x86_64 Processor (Intel Core / AMD Ryzen), 16 GB DDR4/DDR5 RAM, NVMe High-Speed Solid-State Storage, Windows 11 64-bit OS.", table_cell),
        ],
        [
            Paragraph("<b>Client Display Hardware</b>", table_cell),
            Paragraph("Presentation & Dashboard Displays", table_cell),
            Paragraph("1080p Full HD to 4K Ultra HD monitors and projectors for Presentation Mode; Mobile and Tablet capacitive touch displays.", table_cell),
        ],
        [
            Paragraph("<b>Graphics Acceleration</b>", table_cell),
            Paragraph("Client GPU Hardware", table_cell),
            Paragraph("Dedicated or Integrated GPU supporting WebGL 2.0 / OpenGL ES 3.0 for hardware-accelerated 60 FPS Three.js 3D vehicle rendering.", table_cell),
        ],
        [
            Paragraph("<b>Server Compute</b>", table_cell),
            Paragraph("Application & API Host", table_cell),
            Paragraph("Local ASGI environment hosting Uvicorn server on port 8001 / Cloud Linux containers (Render, Railway, Vercel Serverless Edge Functions).", table_cell),
        ],
        [
            Paragraph("<b>Simulated Telematics</b>", table_cell),
            Paragraph("On-Board Diagnostics (OBD-II / CAN)", table_cell),
            Paragraph("Simulated vehicle transponders emitting odometer readings, service intervals, speed, and real-time GPS coordinate pings.", table_cell),
        ],
    ]

    equip_table = Table(equip_table_data, colWidths=[120, 120, 264])
    equip_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ("PADDING", (0, 0), (-1, -1), 4),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(equip_table)
    story.append(Spacer(1, 8))

    # ==================== 5. SOFTWARE DETAILS ====================
    story.append(Paragraph("5. Software Details & Technology Stack", h1_style))
    story.append(Paragraph(
        "Lumina leverages a decoupled client-server architecture built on modern industrial web and machine learning standards.",
        body_style,
    ))

    soft_table_data = [
        [
            Paragraph("Software Layer", table_header),
            Paragraph("Tool / Framework", table_header),
            Paragraph("Version", table_header),
            Paragraph("Role & Implementation Details", table_header),
        ],
        [
            Paragraph("Frontend Framework", table_cell_bold),
            Paragraph("React", table_cell),
            Paragraph("19.2", table_cell),
            Paragraph("Modern component rendering, concurrent mode, modular view lifecycle.", table_cell),
        ],
        [
            Paragraph("Language (Frontend)", table_cell_bold),
            Paragraph("TypeScript", table_cell),
            Paragraph("6.0", table_cell),
            Paragraph("Strict typing for domain models (Vehicles, Stops, Shipments, Routes).", table_cell),
        ],
        [
            Paragraph("Build Tool & Bundler", table_cell_bold),
            Paragraph("Vite", table_cell),
            Paragraph("8.3", table_cell),
            Paragraph("Instant Hot Module Replacement (HMR) and optimized production rollup.", table_cell),
        ],
        [
            Paragraph("3D Visualization", table_cell_bold),
            Paragraph("Three.js & Fiber/Drei", table_cell),
            Paragraph("0.186", table_cell),
            Paragraph("Interactive 3D vehicle configurator, real-time lighting, materials & shadows.", table_cell),
        ],
        [
            Paragraph("Geospatial Maps", table_cell_bold),
            Paragraph("Leaflet & React-Leaflet", table_cell),
            Paragraph("1.9 / 5.0", table_cell),
            Paragraph("OpenStreetMap base tiles, dark CSS styling, real road polyline rendering.", table_cell),
        ],
        [
            Paragraph("State Management", table_cell_bold),
            Paragraph("Zustand", table_cell),
            Paragraph("5.0", table_cell),
            Paragraph("Lightweight decoupled stores for Fleet, Shipments, Settings, Copilot.", table_cell),
        ],
        [
            Paragraph("Backend API", table_cell_bold),
            Paragraph("FastAPI & Uvicorn", table_cell),
            Paragraph("0.115 / 0.34", table_cell),
            Paragraph("High-performance asynchronous Python REST endpoints with Swagger UI.", table_cell),
        ],
        [
            Paragraph("Machine Learning", table_cell_bold),
            Paragraph("Scikit-Learn", table_cell),
            Paragraph("1.6", table_cell),
            Paragraph("GradientBoosting, Ridge, ElasticNet, LinearRegression model pipelines.", table_cell),
        ],
        [
            Paragraph("Data Processing", table_cell_bold),
            Paragraph("NumPy & Pandas", table_cell),
            Paragraph("2.2 / 2.2", table_cell),
            Paragraph("Fast array math, dataframe manipulation, statistical feature engineering.", table_cell),
        ],
        [
            Paragraph("Routing Service", table_cell_bold),
            Paragraph("OpenRouteService API", table_cell),
            Paragraph("v2 (HGV)", table_cell),
            Paragraph("Real-road distance matrices, truck profiles, avoidances, waypoint reordering.", table_cell),
        ],
        [
            Paragraph("Cloud Persistence", table_cell_bold),
            Paragraph("Firebase Firestore", table_cell),
            Paragraph("12.19", table_cell),
            Paragraph("Cloud snapshot synchronization with zero-config localStorage offline fallback.", table_cell),
        ],
    ]

    soft_table = Table(soft_table_data, colWidths=[95, 105, 50, 254])
    soft_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ("PADDING", (0, 0), (-1, -1), 3.5),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(soft_table)
    story.append(Spacer(1, 8))

    # ==================== 6. EVALUATION METRICS ====================
    story.append(Paragraph("6. Evaluation Metrics & Mathematical Formulations", h1_style))
    story.append(Paragraph(
        "Rigorous quantitative metrics are utilized to evaluate both the predictive accuracy of the AI models and the "
        "operational efficiency of the logistics platform:",
        body_style,
    ))

    metrics_table_data = [
        [
            Paragraph("Metric Name", table_header),
            Paragraph("Mathematical Formula / Definition", table_header),
            Paragraph("Operational Purpose & Interpretation", table_header),
        ],
        [
            Paragraph("<b>Coefficient of Determination (R²)</b>", table_cell),
            Paragraph("R² = 1 − [ Σ(y_i − ŷ_i)² / Σ(y_i − ȳ)² ]", code_style),
            Paragraph("Measures proportion of variance explained by model (1.0 = perfect prediction; >0.75 is strong).", table_cell),
        ],
        [
            Paragraph("<b>Mean Absolute Error (MAE)</b>", table_cell),
            Paragraph("MAE = (1/n) Σ |y_i − ŷ_i|", code_style),
            Paragraph("Average error in original physical units (e.g., ±2.6 shipments; ±2.7 health points).", table_cell),
        ],
        [
            Paragraph("<b>Root Mean Squared Error (RMSE)</b>", table_cell),
            Paragraph("RMSE = √[ (1/n) Σ (y_i − ŷ_i)² ]", code_style),
            Paragraph("Penalizes large outlier forecast errors heavily, ensuring robust capacity planning.", table_cell),
        ],
        [
            Paragraph("<b>Statistical Confidence</b>", table_cell),
            Paragraph("Conf = clip(1.0 − σ_residuals / scale, 0.55, 0.99)", code_style),
            Paragraph("Empirical confidence calibrated against test residual spread, preventing overconfidence.", table_cell),
        ],
        [
            Paragraph("<b>Vehicle Health Score</b>", table_cell),
            Paragraph("H = clip( 98 − 0.00055·Δkm − 0.09·Age − 0.02·OverStress, 25, 100 )", code_style),
            Paragraph("Composite score (0–100); vehicles below 70 trigger automated maintenance warnings.", table_cell),
        ],
        [
            Paragraph("<b>Assignment Utility Score</b>", table_cell),
            Paragraph("U = 0.40·Cost + 0.20·Fuel + 0.15·Avail + 0.15·Health + 0.10·Cap", code_style),
            Paragraph("Multi-criteria dispatch decision index; prioritizes low operating cost and high reliability.", table_cell),
        ],
        [
            Paragraph("<b>Carbon Footprint (CO₂)</b>", table_cell),
            Paragraph("CO₂ (kg) = Fuel_Consumed (L) × 2.68 kg/L", code_style),
            Paragraph("Standard IPCC / EPA factor for commercial diesel combustion in freight transport.", table_cell),
        ],
    ]

    metrics_table = Table(metrics_table_data, colWidths=[120, 170, 214])
    metrics_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ("PADDING", (0, 0), (-1, -1), 4),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(metrics_table)
    story.append(Spacer(1, 10))

    # ==================== 7. BENCHMARK SUMMARY & CONCLUSION ====================
    story.append(Paragraph("7. Performance Benchmarks & Conclusion", h1_style))
    story.append(Paragraph(
        "<b>Model Training Results Summary:</b><br/>"
        "• <b>Demand Model:</b> R² = 0.7534, MAE = 2.62 shipments, RMSE = 3.21 shipments (Confidence: 94.7%)<br/>"
        "• <b>Health Model:</b> R² = 0.8197, MAE = 2.68 health pts, RMSE = 3.38 health pts (Confidence: 95.5%)<br/>"
        "• <b>Service Model:</b> R² = 1.0000, MAE = 0.003 km, RMSE = 0.004 km (Confidence: 99.0%)<br/>"
        "• <b>Assignment Model:</b> R² = 0.9070, MAE = 0.0386 utility pts, RMSE = 0.0477 (Confidence: 93.5%)<br/>"
        "• <b>Fuel & Eco Model:</b> R² = 0.8702, MAE = 10.42 L, RMSE = 13.29 L (Confidence: 75.6%)",
        body_style,
    ))
    story.append(Spacer(1, 5))
    story.append(Paragraph(
        "<b>Conclusion:</b> Lumina successfully bridges the gap between academic machine learning pipelines and real-world industrial "
        "logistics operations. By integrating real road networks (OpenRouteService), explainable ML models, 3D procedural vehicle visualization, "
        "and an interactive live AI Copilot, the system delivers an end-to-end modern logistics management platform ready for industrial "
        "presentation and academic evaluation.",
        body_style,
    ))

    # Build the PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Report PDF successfully generated: {filename}")


if __name__ == "__main__":
    out_path = Path(__file__).resolve().parent / "Lumina_Project_Technical_Report.pdf"
    if len(sys.argv) > 1:
        out_path = Path(sys.argv[1])
    build_pdf(str(out_path))
