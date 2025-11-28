# Ontario Long-Term Care Home Statistics Viewer

A modern web application to view and analyze performance metrics for Long-Term Care (LTC) homes across Ontario, Canada.

## 🏥 Features

- **Comprehensive Statistics**: View key performance indicators including:
  - Wait times for admission
  - Antipsychotic medication use
  - Falls incidents
  - Physical restraints usage
  - Pressure ulcers (bed sores)
  - Pain management
  - Depression rates

- **Advanced Search & Filtering**: 
  - Search by home name, city, or region
  - Filter by LHIN regions
  - Real-time results

- **Beautiful UI/UX**: 
  - Modern, responsive design
  - Color-coded metrics with benchmarks
  - Interactive cards with expandable details
  - Mobile-friendly interface

- **Data Visualization**: 
  - Provincial overview statistics
  - Individual home performance cards
  - Visual indicators for metrics above/below benchmarks

## 📊 Data Source

This application references data from [Health Quality Ontario (HQO)](https://www.hqontario.ca/System-Performance/Long-Term-Care-Home-Performance).

**✅ Real Data Integrated**: The application now uses **real-time data** scraped from the HQO website using Puppeteer. Data is automatically refreshed every 24 hours. See [DATA_SOURCE.md](DATA_SOURCE.md) for detailed information about the data integration.

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Bach
```

2. Install dependencies:
```bash
npm install
```

### Running the Application

Start both the frontend and backend servers:

```bash
npm run dev
```

This will start:
- Frontend (Vite + React): `http://localhost:5173`
- Backend (Express API): `http://localhost:3001`

The application will automatically open in your default browser.

### Running Separately

**Frontend only:**
```bash
npm run dev:client
```

**Backend only:**
```bash
npm run dev:server
```

### Building for Production

```bash
npm run build
```

The production-ready files will be in the `dist` directory.

## 🏗️ Tech Stack

### Frontend
- **React 18**: Modern UI library
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client for API requests

### Backend
- **Express.js**: Web application framework
- **Cheerio**: Web scraping library (for future implementation)
- **CORS**: Cross-origin resource sharing
- **Axios**: HTTP client for external requests

## 📁 Project Structure

```
Bach/
├── src/                      # Frontend source code
│   ├── components/           # React components
│   │   ├── Header.jsx
│   │   ├── SearchBar.jsx
│   │   ├── FilterPanel.jsx
│   │   ├── StatsOverview.jsx
│   │   ├── LTCHomeCard.jsx
│   │   └── LoadingSpinner.jsx
│   ├── App.jsx              # Main application component
│   ├── main.jsx             # Application entry point
│   └── index.css            # Global styles
├── server/                   # Backend source code
│   └── index.js             # Express server and API endpoints
├── public/                   # Static assets
├── index.html               # HTML template
├── package.json             # Dependencies and scripts
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
└── README.md                # This file
```

## 🔌 API Endpoints

### GET `/api/ltc-homes`
Returns a list of all LTC homes with their statistics.

**Response:**
```json
[
  {
    "name": "Sample LTC Home",
    "city": "Toronto",
    "region": "Toronto Central",
    "postalCode": "M5G 2C4",
    "waitTime": 145,
    "antipsychoticUse": 17.5,
    "falls": 8.2,
    "restraints": 2.1,
    "pressureUlcers": 0.8,
    "pain": 12.3,
    "depression": 11.5,
    "website": "https://example.com"
  }
]
```

### GET `/api/ltc-homes/:name`
Returns details for a specific LTC home by name.

### GET `/api/regions`
Returns a list of all available LHIN regions.

### GET `/api/health`
Health check endpoint.

## 📈 Metrics & Benchmarks

The application displays the following metrics with provincial benchmarks:

| Metric | Benchmark | Description |
|--------|-----------|-------------|
| Antipsychotic Use | ≤19% | Residents without psychosis given antipsychotics |
| Falls | ≤9% | Residents who fell in past 30 days |
| Physical Restraints | ≤3% | Residents physically restrained daily |
| Pressure Ulcers | ≤1% | New or worsened bed sores |
| Pain | N/A | Residents with moderate/severe pain |
| Depression | ≤13% | Residents with worsening depression symptoms |

## 🎨 Design Features

- **Gradient Background**: Modern purple gradient design
- **Card-Based Layout**: Clean, organized presentation of data
- **Color-Coded Metrics**: 
  - 🟢 Green: Meeting or below benchmark
  - 🟡 Yellow: Moderately above benchmark
  - 🔴 Red: Significantly above benchmark
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Smooth Animations**: Hover effects and transitions
- **Accessible**: Semantic HTML and ARIA labels

## 🔮 Future Enhancements

- [x] ✅ Real-time data fetching from HQO website
- [x] ✅ Automated data caching and refresh (24 hours)
- [x] ✅ Provincial and regional data scraping
- [ ] Individual home data scraping (available but disabled for performance)
- [ ] Data export functionality (CSV, PDF)
- [ ] Historical data trends and charts
- [ ] Comparison tool for multiple homes
- [ ] Advanced filtering by specific metrics
- [ ] User accounts and favorites
- [ ] Email alerts for data updates
- [ ] Interactive maps showing home locations
- [ ] Detailed analytics dashboard

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## ⚖️ Legal Notice

This application is for educational and informational purposes only. Always verify information with official sources. The sample data used is for demonstration purposes and does not represent actual LTC home statistics.

When implementing real data fetching:
- Respect the website's `robots.txt` file
- Follow rate limiting guidelines
- Comply with all terms of service
- Consider reaching out to HQO for official API access

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 📞 Support

For issues, questions, or suggestions, please open an issue in the GitHub repository.

---

**Built with ❤️ for better transparency in Ontario's Long-Term Care system**

