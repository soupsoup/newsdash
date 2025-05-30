# News Aggregation Dashboard

A dynamic news aggregation and sharing platform that leverages multi-source data integration and intelligent content distribution mechanisms, with advanced real-time content synchronization.

## Features

### 🔄 Multi-Source Data Integration
- **Nitter Integration**: Scrapes real-time content from Twitter/X via Nitter instances
- **Discord Integration**: Fetches messages from Discord channels for news content
- **WordPress Integration**: Connects to WordPress sites for content distribution

### 📊 Smart Dashboard
- Real-time news feed with live updates
- Source management and configuration
- Integration status monitoring
- Content distribution tracking

### 🚀 Content Distribution
- Share news items to Discord channels
- Publish to WordPress sites
- Cross-platform content syndication
- Automated content formatting

### 🛠 Technical Features
- TypeScript-based full-stack application
- React frontend with modern UI components
- Express.js backend with RESTful APIs
- In-memory storage for fast development
- Real-time data synchronization
- Robust error handling and fallback mechanisms

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** components
- **TanStack Query** for data fetching
- **Wouter** for routing

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **Drizzle ORM** for database operations
- **Zod** for validation
- **Cheerio** for web scraping

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Configuration

### Environment Variables
Create a `.env` file in the root directory with the following variables:

```env
# Discord Integration (optional)
DISCORD_BOT_TOKEN=your_discord_bot_token

# WordPress Integration (optional)
WORDPRESS_API_URL=your_wordpress_site_url
WORDPRESS_USERNAME=your_username
WORDPRESS_PASSWORD=your_app_password
```

### Adding Integrations

1. **Discord Integration**:
   - Create a Discord bot in the Discord Developer Portal
   - Add the bot token to your environment variables
   - Configure channel IDs in the integrations panel

2. **Nitter Integration**:
   - No additional setup required
   - Configure usernames to scrape in the data sources panel

3. **WordPress Integration**:
   - Generate an application password in your WordPress admin
   - Add your site URL and credentials to environment variables

## Project Structure

```
├── client/              # Frontend React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Application pages
│   │   ├── contexts/    # React contexts
│   │   └── lib/         # Utility functions
├── server/              # Backend Express application
│   ├── services/        # External service integrations
│   ├── utils/           # Utility functions
│   └── routes.ts        # API routes
├── shared/              # Shared types and schemas
└── README.md
```

## API Endpoints

### News Items
- `GET /api/news` - Fetch all news items
- `POST /api/news` - Create a new news item
- `PUT /api/news/:id` - Update a news item
- `DELETE /api/news/:id` - Delete a news item

### Integrations
- `GET /api/integrations` - Fetch all integrations
- `POST /api/integrations` - Create a new integration
- `PUT /api/integrations/:id` - Update an integration
- `DELETE /api/integrations/:id` - Delete an integration

### Actions
- `POST /api/share/discord` - Share content to Discord
- `POST /api/share/wordpress` - Publish content to WordPress
- `POST /api/sync/nitter` - Manually sync Nitter content

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Code Style
The project uses TypeScript with strict type checking and follows modern React patterns with hooks and functional components.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m "Add feature"`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Troubleshooting

### Common Issues

**Nitter instances not responding**:
- The application automatically tries multiple Nitter instances
- If all instances fail, check if Nitter services are operational

**Discord integration not working**:
- Verify your bot token is correct
- Ensure the bot has proper permissions in your Discord server

**WordPress publishing fails**:
- Check your application password is valid
- Verify the WordPress site URL is correct and accessible

## Support

For issues and questions, please open an issue in the GitHub repository.