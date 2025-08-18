# GCSE Maths Tutor - Personalized Study App

A comprehensive, interactive study application designed specifically for UK GCSE Mathematics students. This app provides personalized learning experiences with progress tracking, interactive exam papers, and detailed marking schemes.

## 🎯 Features

### 📚 Comprehensive Syllabus Coverage
- **Complete GCSE Maths Syllabus**: Covers all topics from Foundation to Higher tier
- **Structured Learning Paths**: Organized by topics and subtopics with clear learning objectives
- **Difficulty Levels**: Foundation and Higher tier content with appropriate progression

### 📊 Progress Tracking
- **Personalized Dashboard**: Visual overview of learning progress and achievements
- **Topic Mastery Levels**: Track progress from "not-started" to "mastered"
- **Study Time Analytics**: Monitor time spent on different topics and subtopics
- **Performance Metrics**: Detailed analytics on exam performance and improvement areas

### 📝 Interactive Exam Papers
- **Past Exam Papers**: Authentic GCSE-style questions with realistic difficulty
- **Timed Assessments**: Realistic exam conditions with countdown timers
- **Question Navigation**: Easy navigation between questions with progress indicators
- **Flagging System**: Mark questions for review during exams

### ✅ Detailed Marking Schemes
- **Instant Feedback**: Immediate scoring and feedback after exam completion
- **Step-by-step Explanations**: Detailed working and explanations for each question
- **Answer Comparison**: Side-by-side comparison of your answers with correct solutions
- **Learning Insights**: Identify areas for improvement and focus

### 🎨 Modern User Interface
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Beautiful Animations**: Smooth transitions and engaging user experience
- **Intuitive Navigation**: Easy-to-use interface with clear visual hierarchy
- **Accessibility**: Designed with accessibility best practices

## 🚀 Getting Started

### Prerequisites
- Node.js 18.0 or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tutor
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to view the application.

### Building for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
tutor/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Dashboard page
│   └── exam/[id]/         # Exam taking interface
├── components/            # Reusable React components
│   ├── ProgressCard.tsx   # Progress metrics display
│   ├── TopicCard.tsx      # Topic information cards
│   ├── ExamCard.tsx       # Exam result cards
│   ├── RecentActivity.tsx # Activity feed
│   └── StudySessionCard.tsx # Study session display
├── data/                  # Application data
│   ├── syllabus.ts        # GCSE Maths syllabus structure
│   ├── examPapers.ts      # Exam papers and questions
│   └── userProgress.ts    # User progress tracking
├── public/                # Static assets
└── package.json           # Dependencies and scripts
```

## 🎓 How to Use

### 1. Dashboard Overview
- View your overall progress and target grade
- See recent study sessions and exam attempts
- Access quick actions for learning and practice

### 2. Topic Learning
- Browse topics by difficulty level (Foundation/Higher)
- Track completion percentage for each topic
- Monitor mastery levels for subtopics
- View estimated study time for each topic

### 3. Taking Exams
- Select from available exam papers
- Navigate through questions with the question navigator
- Flag questions for review
- Submit when finished to see detailed results

### 4. Reviewing Results
- View your score and percentage
- Compare your answers with correct solutions
- Read detailed explanations and working
- Identify areas for improvement

## 🛠️ Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Charts**: Recharts (for future analytics)

## 📈 Future Enhancements

- **User Authentication**: Individual user accounts and progress
- **Advanced Analytics**: Detailed performance insights and recommendations
- **Practice Questions**: Topic-specific practice with adaptive difficulty
- **Study Plans**: Personalized study schedules and reminders
- **Social Features**: Study groups and peer learning
- **Mobile App**: Native mobile application
- **Offline Support**: Study without internet connection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed description
3. Contact the development team

## 🙏 Acknowledgments

- UK GCSE Mathematics curriculum and exam boards
- Educational content creators and teachers
- Open source community for amazing tools and libraries

---

**Happy Studying! 📚✨**
