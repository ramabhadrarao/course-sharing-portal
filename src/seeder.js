// src/seeder.js
import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Course from './models/Course.js';
import Quiz from './models/Quiz.js';
import QuizAttempt from './models/QuizAttempt.js';
import logger from './utils/logger.js';

// Load env vars
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/college_course_portal');

// Sample users data
const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password',
    role: 'admin',
    profileImage: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&dpr=1'
  },
  {
    name: 'Dr. Sarah Johnson',
    email: 'faculty@example.com',
    password: 'password',
    role: 'faculty',
    profileImage: 'https://images.pexels.com/photos/3785077/pexels-photo-3785077.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&dpr=1'
  },
  {
    name: 'Prof. Michael Chen',
    email: 'michael.chen@example.com',
    password: 'password',
    role: 'faculty',
    profileImage: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&dpr=1'
  },
  {
    name: 'Dr. Emily Rodriguez',
    email: 'emily.rodriguez@example.com',
    password: 'password',
    role: 'faculty',
    profileImage: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&dpr=1'
  },
  {
    name: 'John Smith',
    email: 'student@example.com',
    password: 'password',
    role: 'student',
    profileImage: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&dpr=1'
  },
  {
    name: 'Alice Williams',
    email: 'alice.williams@example.com',
    password: 'password',
    role: 'student',
    profileImage: 'https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&dpr=1'
  },
  {
    name: 'Bob Davis',
    email: 'bob.davis@example.com',
    password: 'password',
    role: 'student',
    profileImage: 'https://images.pexels.com/photos/2182968/pexels-photo-2182968.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&dpr=1'
  },
  {
    name: 'Carol Brown',
    email: 'carol.brown@example.com',
    password: 'password',
    role: 'student',
    profileImage: 'https://images.pexels.com/photos/3763152/pexels-photo-3763152.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&dpr=1'
  }
];

// Hash passwords
const hashPasswords = async (users) => {
  const salt = await bcrypt.genSalt(10);
  return Promise.all(
    users.map(async (user) => ({
      ...user,
      password: await bcrypt.hash(user.password, salt)
    }))
  );
};

// Sample courses data (will be populated with user IDs after users are created)
const createCoursesData = (facultyUsers) => [
  {
    title: 'Introduction to Computer Science',
    description: 'A comprehensive introduction to computer science fundamentals, programming concepts, and problem-solving techniques. Perfect for beginners.',
    accessCode: 'CS101A',
    coverImage: 'https://images.pexels.com/photos/1181298/pexels-photo-1181298.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    createdBy: facultyUsers[0]._id,
    enrolledStudents: [],
    sections: [
      {
        title: 'Getting Started',
        order: 1,
        subsections: [
          {
            title: 'Welcome to Computer Science',
            content: '<h2>Welcome to Computer Science!</h2><p>Computer science is the study of computational systems, algorithms, and the design of computing systems and their applications. In this course, you will learn:</p><ul><li>Programming fundamentals</li><li>Problem-solving techniques</li><li>Data structures and algorithms</li><li>Software development practices</li></ul><p>Get ready for an exciting journey into the world of computing!</p>',
            contentType: 'text',
            order: 1
          },
          {
            title: 'Course Overview Video',
            content: 'An introductory video explaining what you will learn in this course.',
            contentType: 'video',
            videoUrl: 'https://www.youtube.com/embed/QdVFvsCWXrA',
            order: 2
          }
        ]
      },
      {
        title: 'Programming Fundamentals',
        order: 2,
        subsections: [
          {
            title: 'Variables and Data Types',
            content: '<h2>Variables and Data Types</h2><p>Variables are containers for storing data values. In programming, we use different data types to represent different kinds of information:</p><h3>Basic Data Types:</h3><ul><li><strong>Integer:</strong> Whole numbers (e.g., 1, 2, 100)</li><li><strong>Float:</strong> Decimal numbers (e.g., 3.14, 2.5)</li><li><strong>String:</strong> Text (e.g., "Hello World")</li><li><strong>Boolean:</strong> True or False values</li></ul><h3>Example in Python:</h3><pre><code>name = "Alice"  # String\nage = 25        # Integer\nheight = 5.6    # Float\nis_student = True  # Boolean</code></pre>',
            contentType: 'text',
            order: 1
          },
          {
            title: 'Control Structures',
            content: '<h2>Control Structures</h2><p>Control structures allow you to control the flow of your program execution.</p><h3>Conditional Statements:</h3><pre><code>if age >= 18:\n    print("You are an adult")\nelse:\n    print("You are a minor")</code></pre><h3>Loops:</h3><pre><code># For loop\nfor i in range(5):\n    print(i)\n\n# While loop\ncount = 0\nwhile count < 5:\n    print(count)\n    count += 1</code></pre>',
            contentType: 'text',
            order: 2
          }
        ]
      }
    ]
  },
  {
    title: 'Web Development Fundamentals',
    description: 'Learn the basics of web development including HTML, CSS, and JavaScript. Build your first interactive websites and web applications.',
    accessCode: 'WEB101',
    coverImage: 'https://images.pexels.com/photos/1181316/pexels-photo-1181316.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    createdBy: facultyUsers[1]._id,
    enrolledStudents: [],
    sections: [
      {
        title: 'HTML Basics',
        order: 1,
        subsections: [
          {
            title: 'Introduction to HTML',
            content: '<h2>What is HTML?</h2><p>HTML (HyperText Markup Language) is the standard markup language for creating web pages. It describes the structure and content of a webpage using elements and tags.</p><h3>Basic HTML Structure:</h3><pre><code>&lt;!DOCTYPE html&gt;\n&lt;html&gt;\n&lt;head&gt;\n    &lt;title&gt;My First Webpage&lt;/title&gt;\n&lt;/head&gt;\n&lt;body&gt;\n    &lt;h1&gt;Welcome to My Website&lt;/h1&gt;\n    &lt;p&gt;This is my first paragraph.&lt;/p&gt;\n&lt;/body&gt;\n&lt;/html&gt;</code></pre>',
            contentType: 'text',
            order: 1
          }
        ]
      }
    ]
  },
  {
    title: 'Data Structures and Algorithms',
    description: 'Master fundamental data structures and algorithms essential for efficient programming and problem-solving in computer science.',
    accessCode: 'DSA201',
    coverImage: 'https://images.pexels.com/photos/270348/pexels-photo-270348.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    createdBy: facultyUsers[0]._id,
    enrolledStudents: [],
    sections: [
      {
        title: 'Introduction to Data Structures',
        order: 1,
        subsections: [
          {
            title: 'What are Data Structures?',
            content: '<h2>Data Structures</h2><p>Data structures are ways of organizing and storing data so that they can be accessed and worked with efficiently.</p>',
            contentType: 'text',
            order: 1
          }
        ]
      }
    ]
  },
  {
    title: 'Database Management Systems',
    description: 'Learn database design, SQL, and database management concepts. Understand relational databases and modern NoSQL solutions.',
    accessCode: 'DB301',
    coverImage: 'https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    createdBy: facultyUsers[2]._id,
    enrolledStudents: [],
    sections: []
  },
  {
    title: 'Machine Learning Basics',
    description: 'Introduction to machine learning concepts, algorithms, and practical applications. Learn to build your first ML models.',
    accessCode: 'ML401',
    coverImage: 'https://images.pexels.com/photos/3861958/pexels-photo-3861958.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    createdBy: facultyUsers[2]._id,
    enrolledStudents: [],
    sections: []
  }
];

// Enhanced sample quizzes data
const createQuizzesData = (courses) => [
  {
    title: 'Programming Fundamentals Quiz',
    course: courses[0]._id, // Computer Science course
    questions: [
      {
        text: 'Which of the following is a primitive data type in most programming languages?',
        options: [
          { text: 'Array', isCorrect: false },
          { text: 'Integer', isCorrect: true },
          { text: 'Object', isCorrect: false },
          { text: 'Function', isCorrect: false }
        ],
        type: 'single'
      },
      {
        text: 'What does the following code output? console.log(5 + "3")',
        options: [
          { text: '8', isCorrect: false },
          { text: '53', isCorrect: true },
          { text: 'Error', isCorrect: false },
          { text: '15', isCorrect: false }
        ],
        type: 'single'
      },
      {
        text: 'Which of the following are characteristics of variables? (Select all that apply)',
        options: [
          { text: 'Store data values', isCorrect: true },
          { text: 'Have a data type', isCorrect: true },
          { text: 'Cannot be changed', isCorrect: false },
          { text: 'Must be declared before use', isCorrect: true }
        ],
        type: 'multiple'
      },
      {
        text: 'What is the correct way to declare a variable in Python?',
        options: [
          { text: 'var x = 10', isCorrect: false },
          { text: 'int x = 10', isCorrect: false },
          { text: 'x = 10', isCorrect: true },
          { text: 'declare x = 10', isCorrect: false }
        ],
        type: 'single'
      },
      {
        text: 'Which control structures are used for repetition? (Select all that apply)',
        options: [
          { text: 'if statement', isCorrect: false },
          { text: 'for loop', isCorrect: true },
          { text: 'while loop', isCorrect: true },
          { text: 'switch statement', isCorrect: false }
        ],
        type: 'multiple'
      }
    ],
    timeLimit: 15
  },
  {
    title: 'HTML Basics Quiz',
    course: courses[1]._id, // Web Development course
    questions: [
      {
        text: 'What does HTML stand for?',
        options: [
          { text: 'HyperText Markup Language', isCorrect: true },
          { text: 'High Tech Modern Language', isCorrect: false },
          { text: 'Home Tool Markup Language', isCorrect: false },
          { text: 'HyperText Modern Language', isCorrect: false }
        ],
        type: 'single'
      },
      {
        text: 'Which HTML tag is used for the largest heading?',
        options: [
          { text: '<h6>', isCorrect: false },
          { text: '<h1>', isCorrect: true },
          { text: '<heading>', isCorrect: false },
          { text: '<h0>', isCorrect: false }
        ],
        type: 'single'
      },
      {
        text: 'Which of the following are valid HTML tags? (Select all that apply)',
        options: [
          { text: '<div>', isCorrect: true },
          { text: '<span>', isCorrect: true },
          { text: '<section>', isCorrect: true },
          { text: '<random>', isCorrect: false }
        ],
        type: 'multiple'
      },
      {
        text: 'What is the correct HTML element for inserting a line break?',
        options: [
          { text: '<break>', isCorrect: false },
          { text: '<br>', isCorrect: true },
          { text: '<lb>', isCorrect: false },
          { text: '<newline>', isCorrect: false }
        ],
        type: 'single'
      }
    ],
    timeLimit: 10
  },
  {
    title: 'Web Development Advanced Quiz',
    course: courses[1]._id, // Web Development course
    questions: [
      {
        text: 'Which CSS property is used to change the text color?',
        options: [
          { text: 'font-color', isCorrect: false },
          { text: 'text-color', isCorrect: false },
          { text: 'color', isCorrect: true },
          { text: 'text-style', isCorrect: false }
        ],
        type: 'single'
      },
      {
        text: 'Which of the following are CSS layout models? (Select all that apply)',
        options: [
          { text: 'Flexbox', isCorrect: true },
          { text: 'Grid', isCorrect: true },
          { text: 'Float', isCorrect: true },
          { text: 'Table', isCorrect: false }
        ],
        type: 'multiple'
      },
      {
        text: 'What does CSS stand for?',
        options: [
          { text: 'Creative Style Sheets', isCorrect: false },
          { text: 'Computer Style Sheets', isCorrect: false },
          { text: 'Cascading Style Sheets', isCorrect: true },
          { text: 'Colorful Style Sheets', isCorrect: false }
        ],
        type: 'single'
      }
    ],
    timeLimit: 12
  },
  {
    title: 'Data Structures Fundamentals',
    course: courses[2]._id, // Data Structures course
    questions: [
      {
        text: 'What is the time complexity of accessing an element in an array by index?',
        options: [
          { text: 'O(n)', isCorrect: false },
          { text: 'O(log n)', isCorrect: false },
          { text: 'O(1)', isCorrect: true },
          { text: 'O(n²)', isCorrect: false }
        ],
        type: 'single'
      },
      {
        text: 'Which data structure follows the Last In First Out (LIFO) principle?',
        options: [
          { text: 'Queue', isCorrect: false },
          { text: 'Array', isCorrect: false },
          { text: 'Stack', isCorrect: true },
          { text: 'Linked List', isCorrect: false }
        ],
        type: 'single'
      },
      {
        text: 'Which of the following are linear data structures? (Select all that apply)',
        options: [
          { text: 'Array', isCorrect: true },
          { text: 'Linked List', isCorrect: true },
          { text: 'Tree', isCorrect: false },
          { text: 'Stack', isCorrect: true }
        ],
        type: 'multiple'
      },
      {
        text: 'What is the worst-case time complexity for searching in a binary search tree?',
        options: [
          { text: 'O(1)', isCorrect: false },
          { text: 'O(log n)', isCorrect: false },
          { text: 'O(n)', isCorrect: true },
          { text: 'O(n log n)', isCorrect: false }
        ],
        type: 'single'
      },
      {
        text: 'Which operations are typically supported by a queue? (Select all that apply)',
        options: [
          { text: 'Enqueue', isCorrect: true },
          { text: 'Dequeue', isCorrect: true },
          { text: 'Push', isCorrect: false },
          { text: 'Peek/Front', isCorrect: true }
        ],
        type: 'multiple'
      }
    ],
    timeLimit: 20
  },
  {
    title: 'Database Concepts Quiz',
    course: courses[3]._id, // Database course
    questions: [
      {
        text: 'What does ACID stand for in database transactions?',
        options: [
          { text: 'Atomicity, Consistency, Isolation, Durability', isCorrect: true },
          { text: 'Accuracy, Consistency, Integrity, Durability', isCorrect: false },
          { text: 'Atomicity, Concurrency, Isolation, Durability', isCorrect: false },
          { text: 'Accuracy, Concurrency, Integrity, Dependency', isCorrect: false }
        ],
        type: 'single'
      },
      {
        text: 'Which of the following are types of database relationships? (Select all that apply)',
        options: [
          { text: 'One-to-One', isCorrect: true },
          { text: 'One-to-Many', isCorrect: true },
          { text: 'Many-to-Many', isCorrect: true },
          { text: 'None-to-All', isCorrect: false }
        ],
        type: 'multiple'
      },
      {
        text: 'What is a primary key?',
        options: [
          { text: 'A key that can be null', isCorrect: false },
          { text: 'A unique identifier for a record', isCorrect: true },
          { text: 'A key used for encryption', isCorrect: false },
          { text: 'A foreign key reference', isCorrect: false }
        ],
        type: 'single'
      }
    ],
    timeLimit: 15
  },
  {
    title: 'Machine Learning Introduction',
    course: courses[4]._id, // ML course
    questions: [
      {
        text: 'What is supervised learning?',
        options: [
          { text: 'Learning without any data', isCorrect: false },
          { text: 'Learning with labeled training data', isCorrect: true },
          { text: 'Learning through trial and error', isCorrect: false },
          { text: 'Learning from unlabeled data', isCorrect: false }
        ],
        type: 'single'
      },
      {
        text: 'Which of the following are types of machine learning? (Select all that apply)',
        options: [
          { text: 'Supervised Learning', isCorrect: true },
          { text: 'Unsupervised Learning', isCorrect: true },
          { text: 'Reinforcement Learning', isCorrect: true },
          { text: 'Quantum Learning', isCorrect: false }
        ],
        type: 'multiple'
      },
      {
        text: 'What is overfitting in machine learning?',
        options: [
          { text: 'When a model performs well on training data but poorly on new data', isCorrect: true },
          { text: 'When a model has too few parameters', isCorrect: false },
          { text: 'When training data is insufficient', isCorrect: false },
          { text: 'When the model is too simple', isCorrect: false }
        ],
        type: 'single'
      }
    ],
    timeLimit: 18
  }
];

// Sample quiz attempts data
const createQuizAttemptsData = (quizzes, students) => [
  // Student 1 (John Smith) attempts
  {
    quiz: quizzes[0]._id, // Programming Fundamentals Quiz
    student: students[0]._id,
    answers: [
      {
        question: quizzes[0].questions[0]._id,
        selectedOptions: [quizzes[0].questions[0].options[1]._id] // Correct: Integer
      },
      {
        question: quizzes[0].questions[1]._id,
        selectedOptions: [quizzes[0].questions[1].options[1]._id] // Correct: "53"
      },
      {
        question: quizzes[0].questions[2]._id,
        selectedOptions: [
          quizzes[0].questions[2].options[0]._id, // Correct: Store data values
          quizzes[0].questions[2].options[1]._id  // Correct: Have a data type
          // Missing: Must be declared before use
        ]
      }
    ],
    score: 67, // 2 out of 3 correct (67%)
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
  },
  // Student 2 (Alice Williams) attempts
  {
    quiz: quizzes[0]._id, // Programming Fundamentals Quiz
    student: students[1]._id,
    answers: [
      {
        question: quizzes[0].questions[0]._id,
        selectedOptions: [quizzes[0].questions[0].options[1]._id] // Correct: Integer
      },
      {
        question: quizzes[0].questions[1]._id,
        selectedOptions: [quizzes[0].questions[1].options[1]._id] // Correct: "53"
      },
      {
        question: quizzes[0].questions[2]._id,
        selectedOptions: [
          quizzes[0].questions[2].options[0]._id, // Correct: Store data values
          quizzes[0].questions[2].options[1]._id, // Correct: Have a data type
          quizzes[0].questions[2].options[3]._id  // Correct: Must be declared before use
        ]
      }
    ],
    score: 100, // 3 out of 3 correct (100%)
    completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
  },
  // Student 1 attempts HTML quiz
  {
    quiz: quizzes[1]._id, // HTML Basics Quiz
    student: students[0]._id,
    answers: [
      {
        question: quizzes[1].questions[0]._id,
        selectedOptions: [quizzes[1].questions[0].options[0]._id] // Correct: HyperText Markup Language
      },
      {
        question: quizzes[1].questions[1]._id,
        selectedOptions: [quizzes[1].questions[1].options[1]._id] // Correct: <h1>
      }
    ],
    score: 100, // 2 out of 2 correct (100%)
    completedAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
  }
];

// Import data into DB
const importData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await User.deleteMany();
    await Course.deleteMany();
    await Quiz.deleteMany();
    await QuizAttempt.deleteMany();
    console.log('✅ Cleared existing data');

    // Hash passwords and create users
    const hashedUsers = await hashPasswords(users);
    const createdUsers = await User.insertMany(hashedUsers);
    console.log('✅ Users created');

    // Separate faculty and student users
    const facultyUsers = createdUsers.filter(user => user.role === 'faculty');
    const studentUsers = createdUsers.filter(user => user.role === 'student');

    // Create courses with faculty as creators and some enrolled students
    const coursesData = createCoursesData(facultyUsers);
    
    // Add some students to courses
    coursesData[0].enrolledStudents = [studentUsers[0]._id, studentUsers[1]._id, studentUsers[2]._id]; // CS course
    coursesData[1].enrolledStudents = [studentUsers[0]._id, studentUsers[3]._id]; // Web Dev course
    coursesData[2].enrolledStudents = [studentUsers[1]._id, studentUsers[2]._id]; // DSA course
    coursesData[3].enrolledStudents = [studentUsers[0]._id]; // Database course
    coursesData[4].enrolledStudents = [studentUsers[2]._id, studentUsers[3]._id]; // ML course

    const createdCourses = await Course.insertMany(coursesData);
    console.log('✅ Courses created');

    // Create quizzes
    const quizzesData = createQuizzesData(createdCourses);
    const createdQuizzes = await Quiz.insertMany(quizzesData);
    console.log('✅ Quizzes created');

    // Create quiz attempts
    const attemptsData = createQuizAttemptsData(createdQuizzes, studentUsers);
    await QuizAttempt.insertMany(attemptsData);
    console.log('✅ Quiz attempts created');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`👤 Users: ${createdUsers.length} (1 admin, ${facultyUsers.length} faculty, ${studentUsers.length} students)`);
    console.log(`📚 Courses: ${createdCourses.length}`);
    console.log(`❓ Quizzes: ${createdQuizzes.length}`);
    console.log(`📝 Quiz Attempts: ${attemptsData.length}`);
    
    console.log('\n🔐 Login Credentials:');
    console.log('Admin: admin@example.com / password');
    console.log('Faculty: faculty@example.com / password');
    console.log('Student: student@example.com / password');
    console.log('\nAll accounts use password: "password"');
    
    console.log('\n🎯 Quiz Test Data:');
    console.log('- John Smith has attempted Programming Fundamentals Quiz (67%) and HTML Basics Quiz (100%)');
    console.log('- Alice Williams has attempted Programming Fundamentals Quiz (100%)');
    console.log('- Try taking quizzes with different student accounts to test the system!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
};

// Delete data from DB
const deleteData = async () => {
  try {
    console.log('🗑️  Deleting all data...');
    await User.deleteMany();
    await Course.deleteMany();
    await Quiz.deleteMany();
    await QuizAttempt.deleteMany();
    console.log('✅ Data destroyed');
  } catch (error) {
    console.error('❌ Error deleting data:', error);
  }
};

// Check command line arguments
if (process.argv[2] === '-i') {
  importData().then(() => process.exit());
} else if (process.argv[2] === '-d') {
  deleteData().then(() => process.exit());
} else {
  console.log('🌱 Database Seeder');
  console.log('Usage:');
  console.log('  node src/seeder.js -i   Import seed data');
  console.log('  node src/seeder.js -d   Delete all data');
  process.exit();
}