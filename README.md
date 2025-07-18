# 🌱 Sprout - Cofounder Matching Platform

A sophisticated cofounder-matching platform designed for young solo founders seeking meaningful, long-term partnerships. Sprout uses advanced compatibility algorithms to match technical and non-technical founders based on deep personality, work style, and goal alignment.

## 🧠 About Sprout

Sprout is built around **Option 2**: matching one technical founder with one non-technical founder to create balanced, execution-focused teams. Rather than trying to build complete teams with every role filled, we focus on creating strong core partnerships that can execute and grow together.

### Core Philosophy
- **Quality over quantity** - Strict matching criteria ensure high compatibility
- **Execution focus** - Technical + Non-technical pairs can build and scale
- **Long-term thinking** - Personality and motivation alignment for sustainable partnerships
- **Flexible growth** - Core pairs can hire additional roles as needed

## ⚙️ How Matching Works

Sprout uses a 5-stage matching pipeline to ensure only highly compatible matches are returned:

### Step 1: Data Preparation
- Fetch user profiles from database
- Normalize data formats (availability, communication styles, etc.)
- Convert onboarding form responses to matching algorithm format

### Step 2: Hard Disqualification
Users are immediately disqualified if they fail any of these criteria:

- **Availability**: Must match exactly (e.g., both "Full-time" or both "20-40 hrs/week")
- **Location**: Must be in the same location AND not "Other"
- **Role Complementarity**: Must have exactly 1 technical + 1 non-technical founder
- **Age Gap**: Must be ≤ 4 years difference

### Step 3: Category Scoring
Each potential match is scored across 6 compatibility categories:

- **Personality** (0-20): Big Five traits with weighted distance scoring
- **Availability** (0-15): Base score for exact match + flexibility/chronotype bonuses
- **Communication** (0-10): Style compatibility matrix
- **Motivation** (0-20): Shared values + conflict penalties
- **Roles** (0-15): Technical + Non-technical complementarity
- **Conflict Style** (0-10): Resolution approach compatibility

### Step 4: Category Cutoffs
Any match with < 6 points in any category is disqualified, ensuring no weak areas in critical compatibility factors.

### Step 5: Final Filtering
Only matches with a total score ≥ 95 are returned to users.

## 🧑‍🤝‍🧑 Role Matching (Option 2)

Sprout enforces **Option 2** role matching to create balanced execution teams:

### Technical Roles
- Technical, Engineer, Developer

### Non-Technical Roles  
- Marketing, Sales, Growth, Visionary, Marketer

### Neutral/Support Roles
- Designer, Product Manager, Generalist, Operator, Media & Brand

*Media & Brand covers both tactical media creators (video, social, design) and strategic brand builders (voice, story, identity).*

### Multi-Role Support
Users can have multiple roles and will be matched based on their primary role category:

**Examples:**
- `['Technical', 'Designer']` + `['Visionary']` = ✅ Valid (Technical + Non-Technical)
- `['Technical']` + `['Technical']` = ❌ Invalid (Both Technical)
- `['Designer', 'Generalist']` + `['Visionary']` = ❌ Invalid (No Technical role)

## 📊 Scoring System

### Category Maximums
| Category | Max Score | Description |
|----------|-----------|-------------|
| Personality | 20 | Big Five trait alignment |
| Availability | 15 | Schedule + flexibility compatibility |
| Communication | 10 | Style preference alignment |
| Motivation | 20 | Values and goals alignment |
| Roles | 15 | Technical + Non-technical complementarity |
| Conflict Style | 10 | Resolution approach compatibility |

### Penalties
- **Communication Mismatch**: -3 points (async vs daily check-ins)
- **Motivation Conflict**: -5 points (freedom vs collaboration values)

### Thresholds
- **Minimum Total Score**: 95 points
- **Minimum Per Category**: 6 points
- **Match Inclusion Threshold**: 80 points (for `findMatchesForUser()`)

## 🚫 Disqualifiers

### Hard Disqualifiers (Early Exit)
```javascript
// Availability mismatch
if (userA.availability !== userB.availability) {
  return { disqualified: true, reason: "Availability mismatch" }
}

// Location mismatch or "Other"
if (userA.location !== userB.location || userA.location === 'Other') {
  return { disqualified: true, reason: "Location mismatch" }
}

// Age gap > 4 years
if (Math.abs(userA.age - userB.age) > 4) {
  return { disqualified: true, reason: "Age difference too large" }
}

// Role mismatch (both technical or both non-technical)
if ((both technical) || (both non-technical)) {
  return { disqualified: true, reason: "Roles not complementary" }
}
```

### Category Cutoffs
```javascript
// Any category < 6 points
if (categoryScore < 6) {
  return { disqualified: true, reason: `Category '${cat}' score too low: ${score}` }
}
```

### Final Threshold
```javascript
// Total score < 95
if (totalScore < 95) {
  return { disqualified: true, reason: `Score below strict threshold: ${score}` }
}
```

## 🧾 Returned Match Object

### `calculateMatchScore()` Return Format
```typescript
{
  score: number,           // Total score (0-100+)
  disqualified: boolean,   // Whether match was disqualified
  reasons: string[],       // Array of disqualification reasons
  categoryScores: {        // Breakdown by category
    personality: number,   // 0-20
    availability: number,  // 0-15
    communication: number, // 0-10
    motivation: number,    // 0-20
    roles: number,         // 0-15
    conflictStyle: number  // 0-10
  }
}
```

### Frontend Match Object
```typescript
{
  id: string,
  name: string,
  email: string,
  avatar: string,
  matchScore: number,
  categoryScores: object,
  quality: string,         // "Excellent Match", "Strong Match", etc.
  profile: {               // User profile data
    roles: string[],
    motivations: string[],
    industries: string[],
    availability: string,
    communication: string,
    // ... other profile fields
  }
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Stripe account (for payments)

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd sprouts-startup-main

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your Supabase and Stripe keys

# Start development server
npm run dev
```

### Database Setup
Run the SQL schemas in your Supabase database:
- `profiles_schema.sql` - User profiles table
- `connections_schema.sql` - Connection management table

## 🔧 Development

### Key Files
- `src/utils/matching.js` - Core matching algorithm
- `src/library/matching.js` - Database integration
- `src/components/OnboardingFlow.jsx` - User data collection
- `src/components/Dashboard.jsx` - Match display and connection flow

### Testing the Algorithm
```javascript
import { testMatchingAlgorithm } from './src/utils/matching.js'
testMatchingAlgorithm() // Runs comprehensive test scenarios
```

## 📈 Match Quality Levels

- **🌟 Excellent Match** (90+): Perfect compatibility across all categories
- **✅ Strong Match** (80-89): High compatibility with minor differences
- **👍 Good Match** (70-79): Good overall fit with some areas for growth
- **⚠️ Fair Match** (60-69): Basic compatibility, may require more work
- **❌ Poor Match** (<60): Significant compatibility issues

## 🧑‍💻 Returning Users & Profile Updates

- If a returning user logs in and their profile contains deprecated roles or is missing required fields, they are automatically redirected to the onboarding form.
- The onboarding form is pre-filled with their existing data.
- A visible **"Update Profile"** button is shown on the final step (instead of "Let's Sprout!").
- The user must update and submit their profile before accessing the dashboard or matches.
- After a successful update, the user is routed to the dashboard and their changes are saved.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the matching algorithm thoroughly
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

---

**Built with ❤️ for founders who want to build something meaningful together.**
